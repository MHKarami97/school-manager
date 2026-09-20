import type { Student, GroupingRuleConfig } from '@/types'
import { createAllGroupingRules, type IGroupingRule, type WorkingGroup, type GroupingContext } from './grouping-rules'

export interface GroupSetup {
  id: string
  gender: 'male' | 'female'
  capacity: number
  teacherStrengthScore: number
}

export interface GroupingRunResult {
  groups: WorkingGroup[]
  totalCost: number
}

const LOCAL_SEARCH_MAX_ITERATIONS = 400

/**
 * موتور گروه‌بندی: از قوانین (Strategy) به‌عنوان تابع هزینه استفاده می‌کند و در
 * دو مرحله کار می‌کند:
 *   ۱) ساخت اولیه حریصانه (Greedy): دانش‌آموزان به‌ترتیب اولویت (بی‌انضباط/ضعیف
 *      و دارای هم‌نام، سپس بقیه) به گروهی که کمترین هزینه‌ی وزن‌دار را ایجاد
 *      می‌کند اضافه می‌شوند.
 *   ۲) بهینه‌سازی محلی (Local Search): جای دو دانش‌آموز بین دو گروه مختلف
 *      امتحان می‌شود؛ اگر هزینه‌ی کل کاهش یافت، جابه‌جایی پذیرفته می‌شود. این کار
 *      تا نرسیدن به بهبود یا رسیدن به سقف تکرار ادامه می‌یابد.
 */
export class GroupingEngine {
  private readonly rules: IGroupingRule[]

  constructor(rules: IGroupingRule[] = createAllGroupingRules()) {
    this.rules = rules
  }

  run(students: Student[], groupSetups: GroupSetup[], ruleConfigs: GroupingRuleConfig[]): GroupingRunResult {
    const enabledRules = this.rules.filter((rule) => ruleConfigs.find((c) => c.ruleId === rule.id)?.enabled !== false)
    const weightOf = (ruleId: string): number => ruleConfigs.find((c) => c.ruleId === ruleId)?.weight ?? 1

    const context = buildContext(students)
    const groups: WorkingGroup[] = groupSetups.map((setup) => ({
      id: setup.id,
      gender: setup.gender,
      capacity: setup.capacity,
      teacherStrengthScore: setup.teacherStrengthScore,
      studentIds: [],
    }))

    const orderedStudents = orderStudentsByPriority(students)

    for (const student of orderedStudents) {
      const eligibleGroups = groups.filter((g) => g.gender === student.gender)
      let bestGroup: WorkingGroup | null = null
      let bestCost = Number.POSITIVE_INFINITY
      for (const group of eligibleGroups) {
        const cost = weightedCost(student, group, context, enabledRules, weightOf)
        if (cost < bestCost) {
          bestCost = cost
          bestGroup = group
        }
      }
      if (bestGroup) bestGroup.studentIds.push(student.id)
    }

    runLocalSearch(groups, context, enabledRules, weightOf)

    const totalCost = groups.reduce((sum, g) => sum + computeGroupTotalCost(g, context, enabledRules, weightOf), 0)
    return { groups, totalCost }
  }
}

function buildContext(students: Student[]): GroupingContext {
  const studentsById = new Map(students.map((s) => [s.id, s]))
  const gpas = students.map((s) => normalizedGpaOf(s)).filter((v): v is number => v !== null)
  const disciplines = students.map((s) => s.disciplineScore).filter((v): v is number => v !== null)
  const gradeAverageGpa = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0
  const gradeAverageDiscipline = disciplines.length ? disciplines.reduce((a, b) => a + b, 0) / disciplines.length : 0
  return { gradeAverageGpa, gradeAverageDiscipline, studentsById }
}

function normalizedGpaOf(student: Student): number | null {
  if (student.gpa !== null) return student.gpa
  if (student.gpaBand === null) return null
  const bandScore: Record<string, number> = { excellent: 19, good: 16, acceptable: 13, 'needs-effort': 10 }
  return bandScore[student.gpaBand] ?? null
}

function orderStudentsByPriority(students: Student[]): Student[] {
  const nameCount = new Map<string, number>()
  for (const s of students) {
    const key = `${s.firstName}|${s.lastName}`
    nameCount.set(key, (nameCount.get(key) ?? 0) + 1)
  }
  return [...students].sort((a, b) => {
    const priorityA = priorityScore(a, nameCount)
    const priorityB = priorityScore(b, nameCount)
    return priorityB - priorityA
  })
}

function priorityScore(student: Student, nameCount: Map<string, number>): number {
  let score = 0
  if (student.isAcademicallyWeak) score += 3
  if (student.isDisruptive) score += 3
  const key = `${student.firstName}|${student.lastName}`
  if ((nameCount.get(key) ?? 0) > 1) score += 2
  return score
}

function weightedCost(
  student: Student,
  group: WorkingGroup,
  context: GroupingContext,
  rules: IGroupingRule[],
  weightOf: (ruleId: string) => number,
): number {
  let total = 0
  for (const rule of rules) {
    const cost = rule.costOfAssigning(student, group, context)
    if (cost === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY
    total += cost * weightOf(rule.id)
  }
  return total
}

function computeGroupTotalCost(
  group: WorkingGroup,
  context: GroupingContext,
  rules: IGroupingRule[],
  weightOf: (ruleId: string) => number,
): number {
  let total = 0
  for (const studentId of group.studentIds) {
    const student = context.studentsById.get(studentId)
    if (!student) continue
    const groupWithoutSelf: WorkingGroup = { ...group, studentIds: group.studentIds.filter((id) => id !== studentId) }
    const cost = weightedCost(student, groupWithoutSelf, context, rules, weightOf)
    total += cost === Number.POSITIVE_INFINITY ? 1_000_000 : cost
  }
  return total
}

function runLocalSearch(
  groups: WorkingGroup[],
  context: GroupingContext,
  rules: IGroupingRule[],
  weightOf: (ruleId: string) => number,
): void {
  let improved = true
  let iterations = 0

  while (improved && iterations < LOCAL_SEARCH_MAX_ITERATIONS) {
    improved = false
    iterations++

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const groupA = groups[i]
        const groupB = groups[j]
        if (groupA.gender !== groupB.gender) continue

        for (const studentAId of [...groupA.studentIds]) {
          for (const studentBId of [...groupB.studentIds]) {
            const beforeCost = computeGroupTotalCost(groupA, context, rules, weightOf) + computeGroupTotalCost(groupB, context, rules, weightOf)

            swapStudents(groupA, groupB, studentAId, studentBId)
            const afterCost = computeGroupTotalCost(groupA, context, rules, weightOf) + computeGroupTotalCost(groupB, context, rules, weightOf)

            if (afterCost < beforeCost - 0.0001) {
              improved = true
            } else {
              swapStudents(groupA, groupB, studentBId, studentAId)
            }
          }
        }
      }
    }
  }
}

function swapStudents(groupA: WorkingGroup, groupB: WorkingGroup, studentAId: string, studentBId: string): void {
  groupA.studentIds = groupA.studentIds.filter((id) => id !== studentAId)
  groupB.studentIds = groupB.studentIds.filter((id) => id !== studentBId)
  groupA.studentIds.push(studentBId)
  groupB.studentIds.push(studentAId)
}
