import type {
  SavedSchedule,
  GradeSchedule,
  LessonCell,
  LevelId,
  ShiftId,
  ShiftTimeConfig,
  Teacher,
  Audience,
  RuleToggles,
} from '@/types'
import { BASE_COURSES } from '@/config/courses.config'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { getSinglePeriodPair } from '@/config/single-period-pairs.config'
import { generateGradeSchedule, type CourseRequirement, type AdjacencyPair, type ComboRequirement } from './scheduler'
import { assignTeachersFairly, type GradeCourseLoad } from './teacher-assignment'
import { mainTeacherKey, sportTeacherKey } from './wizard-keys'
import { mandatoryRuleOverridesForGrade } from './schedule-feasibility'

export interface GenerateInput {
  audience: Audience
  schoolName: string
  levelId: LevelId
  grades: number[]
  shiftId: ShiftId
  shiftConfig: ShiftTimeConfig
  teacherSelections: Record<string, string[]>
  lockedSportCells: Record<number, LessonCell[]>
  teachersPool: Teacher[]
  ruleToggles: RuleToggles
}

export interface GenerateOutput {
  schedule: Omit<SavedSchedule, 'id' | 'createdAt' | 'updatedAt'>
  warnings: string[]
}

const ELEMENTARY_ADJACENCY: AdjacencyPair[] = [
  { anchorCourseId: 'persian-reading', followerCourseIds: ['persian-writing', 'dictation'] },
]

const AVOID_LAST_PERIOD_COURSES: Record<LevelId, string[]> = {
  elementary: ['heaven-gifts'],
  lower_secondary: [],
  upper_secondary: [],
}

function adjacencyPairsFor(levelId: LevelId): AdjacencyPair[] {
  return levelId === 'elementary' ? ELEMENTARY_ADJACENCY : []
}

function comboRequirementsFor(grade: number): ComboRequirement[] {
  const pair = getSinglePeriodPair(grade)
  return pair ? [{ primaryCourseId: pair.primaryCourseId, secondaryCourseId: pair.secondaryCourseId }] : []
}

export function generateSchedule(input: GenerateInput): GenerateOutput {
  const level = getLevelById(input.levelId)
  const warnings: string[] = []
  const gradeSchedules: GradeSchedule[] = []
  const usedTeacherIds = new Set<string>()

  if (level?.schedulingMode === 'single-teacher') {
    for (const grade of input.grades) {
      const hours = getCurriculumForGrade(input.levelId, grade)
      const lockedCells = input.lockedSportCells[grade] ?? []
      const lockedSportCount = lockedCells.filter((c) => c.courseId === 'sport').length
      const comboRequirements = comboRequirementsFor(grade)
      const comboCourseIds = new Set(comboRequirements.flatMap((c) => [c.primaryCourseId, c.secondaryCourseId]))

      /** override per-grade: پایه‌های ۱ و ۲ همیشه بدون عدم‌تکرار روزانه/طولی چیده می‌شوند؛ بقیه طبق انتخاب کاربر. */
      const effectiveRuleToggles: RuleToggles = {
        ...input.ruleToggles,
        ...mandatoryRuleOverridesForGrade(input.levelId, grade),
      }

      const requirements: CourseRequirement[] = Object.entries(hours)
        .map(([courseId, weeklyHours]) => {
          let unitsNeeded = weeklyHours
          if (courseId === 'sport') unitsNeeded = Math.max(0, unitsNeeded - lockedSportCount)
          if (comboCourseIds.has(courseId)) unitsNeeded = Math.floor(weeklyHours)
          return { courseId, weeklyHours: unitsNeeded }
        })
        .filter((r) => r.weeklyHours > 0)

      const result = generateGradeSchedule({
        shiftConfig: input.shiftConfig,
        requirements,
        courses: BASE_COURSES,
        lockedCells,
        ruleToggles: effectiveRuleToggles,
        adjacencyPairs: adjacencyPairsFor(input.levelId),
        comboRequirements,
        avoidLastPeriodCourseIds: AVOID_LAST_PERIOD_COURSES[input.levelId],
        distributeAcrossDays: input.levelId === 'elementary' && grade === 1,
      })

      if (!result.success && result.unplaced.length > 0) {
        warnings.push(
          `پایه ${gradeLabel(grade)}: برخی واحدها به دلیل ناسازگاری قوانین یا ظرفیت کامل جا نگرفت (${result.unplaced.map((u) => u.courseId).join('، ')}).`,
        )
      }

      const mainTeacherId = input.teacherSelections[mainTeacherKey(grade)]?.[0] ?? null
      const sportTeacherId = input.teacherSelections[sportTeacherKey(grade)]?.[0] ?? mainTeacherId

      const cells: LessonCell[] = result.cells.map((cell) => ({
        ...cell,
        teacherId: cell.courseId === 'sport' ? sportTeacherId : cell.courseId ? mainTeacherId : null,
        secondaryTeacherId: cell.secondaryCourseId ? mainTeacherId : null,
      }))

      if (mainTeacherId) usedTeacherIds.add(mainTeacherId)
      if (sportTeacherId) usedTeacherIds.add(sportTeacherId)

      gradeSchedules.push({ grade, levelId: input.levelId, shiftId: input.shiftId, cells })
    }
  } else {
    const loads: GradeCourseLoad[] = []
    for (const grade of input.grades) {
      const hours = getCurriculumForGrade(input.levelId, grade)
      for (const [courseId, weeklyHours] of Object.entries(hours)) {
        if (weeklyHours > 0) loads.push({ grade, courseId, weeklyHours })
      }
    }

    const teachersByCourse = new Map<string, Teacher[]>()
    for (const [courseId, teacherIds] of Object.entries(input.teacherSelections)) {
      const teachers = teacherIds
        .map((id) => input.teachersPool.find((t) => t.id === id))
        .filter((t): t is Teacher => !!t)
      teachersByCourse.set(courseId, teachers)
    }

    const { assignments, workloads } = assignTeachersFairly(loads, teachersByCourse)

    for (const w of workloads) {
      usedTeacherIds.add(w.teacherId)
      if (w.isOvertime) {
        const name = input.teachersPool.find((t) => t.id === w.teacherId)?.name ?? w.teacherId
        warnings.push(`${name}: مجموع واحد هفتگی (${w.totalWeeklyHours}) بیشتر از سقف استاندارد است و نیاز به اضافه‌کار دارد.`)
      }
    }

    for (const grade of input.grades) {
      const gradeAssignments = assignments.filter((a) => a.grade === grade)
      const requirements: CourseRequirement[] = gradeAssignments.map((a) => ({
        courseId: a.courseId,
        weeklyHours: a.weeklyHours,
      }))

      /** override per-grade نیز در مسیر subject-teacher اعمال می‌شود. */
      const effectiveRuleToggles: RuleToggles = {
        ...input.ruleToggles,
        ...mandatoryRuleOverridesForGrade(input.levelId, grade),
      }

      const result = generateGradeSchedule({
        shiftConfig: input.shiftConfig,
        requirements,
        courses: BASE_COURSES,
        lockedCells: input.lockedSportCells[grade] ?? [],
        ruleToggles: effectiveRuleToggles,
      })

      if (!result.success && result.unplaced.length > 0) {
        warnings.push(
          `پایه ${gradeLabel(grade)}: برخی واحدها به دلیل ناسازگاری قوانین یا ظرفیت کامل جا نگرفت (${result.unplaced.map((u) => u.courseId).join('، ')}).`,
        )
      }

      const teacherByCourseForGrade = new Map(gradeAssignments.map((a) => [a.courseId, a.teacherId]))
      const cells: LessonCell[] = result.cells.map((cell) => ({
        ...cell,
        teacherId: cell.courseId ? teacherByCourseForGrade.get(cell.courseId) ?? null : null,
      }))

      gradeSchedules.push({ grade, levelId: input.levelId, shiftId: input.shiftId, cells })
    }
  }

  const teachers = input.teachersPool.filter((t) => usedTeacherIds.has(t.id))

  const title =
    input.audience === 'school' && input.schoolName
      ? `${input.schoolName} - ${level?.name ?? ''}`
      : `${level?.name ?? ''} - پایه ${input.grades.map((g) => gradeLabel(g)).join('، ')}`

  return {
    schedule: {
      title,
      audience: input.audience,
      levelId: input.levelId,
      schoolName: input.schoolName || undefined,
      shiftId: input.shiftId,
      shiftConfig: input.shiftConfig,
      grades: gradeSchedules,
      teachers,
      ruleToggles: input.ruleToggles,
    },
    warnings,
  }
}