import type { Student, Gender } from '@/types'

export interface WorkingGroup {
  id: string
  gender: Gender
  capacity: number
  teacherStrengthScore: number
  studentIds: string[]
}

export interface GroupingContext {
  gradeAverageGpa: number
  gradeAverageDiscipline: number
  studentsById: Map<string, Student>
}

/**
 * الگوی Strategy: هر قانون گروه‌بندی یک کلاس مستقل است که فقط می‌داند چگونه «هزینه‌ی»
 * اضافه‌کردن یک دانش‌آموز مشخص به یک گروه مشخص را حساب کند. موتور اصلی (GroupingEngine)
 * این هزینه‌ها را با وزن هرکدام جمع می‌زند. این یعنی افزودن/حذف/تفییر وزن یک قانون هیچ
 * تفییری در الگوریتم اصلی لازم ندارد.
 */
export interface IGroupingRule {
  readonly id: string
  costOfAssigning(student: Student, group: WorkingGroup, context: GroupingContext): number
}

function studentsOf(group: WorkingGroup, context: GroupingContext): Student[] {
  return group.studentIds.map((id) => context.studentsById.get(id)).filter((s): s is Student => !!s)
}

function normalizedGpa(student: Student): number | null {
  if (student.gpa !== null) return student.gpa
  if (student.gpaBand === null) return null
  const bandScore: Record<string, number> = { excellent: 19, good: 16, acceptable: 13, 'needs-effort': 10 }
  return bandScore[student.gpaBand] ?? null
}

/** قید سخت: هیچ گروهی نباید دو جنسیت داشته باشد */
export class GenderSeparationRule implements IGroupingRule {
  readonly id = 'gender-separation'
  costOfAssigning(student: Student, group: WorkingGroup): number {
    return student.gender === group.gender ? 0 : Number.POSITIVE_INFINITY
  }
}

/** پرهیز از هم‌نامی: اگر گروه از قبل دانش‌آموزی با همین نام یا نام‌خانوادگی دارد، هزینه اضافه می‌شود */
export class NameDuplicationRule implements IGroupingRule {
  readonly id = 'name-duplication'
  costOfAssigning(student: Student, group: WorkingGroup, context: GroupingContext): number {
    let cost = 0
    for (const other of studentsOf(group, context)) {
      if (other.firstName === student.firstName && other.lastName === student.lastName) cost += 3
      else if (other.firstName === student.firstName) cost += 1
    }
    return cost
  }
}

/** توازن معدل: هرچه اضافه‌کردن این دانش‌آموز میانگین گروه را از میانگین پایه دورتر کند، هزینه بیشتر است */
export class GpaBalanceRule implements IGroupingRule {
  readonly id = 'gpa-balance'
  costOfAssigning(student: Student, group: WorkingGroup, context: GroupingContext): number {
    const studentGpa = normalizedGpa(student)
    if (studentGpa === null) return 0
    const currentStudents = studentsOf(group, context)
    const currentSum = currentStudents.reduce((sum, s) => sum + (normalizedGpa(s) ?? context.gradeAverageGpa), 0)
    const newAverage = (currentSum + studentGpa) / (currentStudents.length + 1)
    return Math.abs(newAverage - context.gradeAverageGpa)
  }
}

/** توازن انضباط: مشابه توازن معدل، برای امتیاز انضباطی */
export class DisciplineBalanceRule implements IGroupingRule {
  readonly id = 'discipline-balance'
  costOfAssigning(student: Student, group: WorkingGroup, context: GroupingContext): number {
    if (student.disciplineScore === null) return 0
    const currentStudents = studentsOf(group, context)
    const currentSum = currentStudents.reduce((sum, s) => sum + (s.disciplineScore ?? context.gradeAverageDiscipline), 0)
    const newAverage = (currentSum + student.disciplineScore) / (currentStudents.length + 1)
    return Math.abs(newAverage - context.gradeAverageDiscipline)
  }
}

/** دانش‌آموز ضعیف/بی‌انضباط ترجیحاً باید به گروه با معلم قوی‌تر برود (هزینه کمتر برای معلم قوی‌تر) */
export class WeakStudentToStrongTeacherRule implements IGroupingRule {
  readonly id = 'weak-to-strong-teacher'
  costOfAssigning(student: Student, group: WorkingGroup): number {
    if (!student.isAcademicallyWeak && !student.isDisruptive) return 0
    const maxStrength = 5
    return maxStrength - group.teacherStrengthScore
  }
}

/** توازن حجم گروه‌ها: هرچه گروه به ظرفیت نزدیک‌تر باشد، هزینه بیشتر می‌شود */
export class GroupSizeBalanceRule implements IGroupingRule {
  readonly id = 'group-size-balance'
  costOfAssigning(_student: Student, group: WorkingGroup): number {
    if (group.studentIds.length >= group.capacity) return Number.POSITIVE_INFINITY
    return group.studentIds.length
  }
}

/** کاتالوگ همه قوانین موجود؛ اضافه‌کردن قانون جدید فقط یک آیتم به همین لیست اضافه می‌کند */
export function createAllGroupingRules(): IGroupingRule[] {
  return [
    new GenderSeparationRule(),
    new NameDuplicationRule(),
    new GpaBalanceRule(),
    new DisciplineBalanceRule(),
    new WeakStudentToStrongTeacherRule(),
    new GroupSizeBalanceRule(),
  ]
}
