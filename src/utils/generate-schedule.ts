import type {
  SavedSchedule,
  GradeSchedule,
  LessonCell,
  LevelId,
  ShiftId,
  ShiftTimeConfig,
  Teacher,
  Audience,
} from '@/types'
import { BASE_COURSES } from '@/config/courses.config'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { generateGradeSchedule, type CourseRequirement } from './scheduler'
import { assignTeachersFairly, type GradeCourseLoad } from './teacher-assignment'
import { mainTeacherKey, sportTeacherKey } from './wizard-keys'

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
}

export interface GenerateOutput {
  schedule: Omit<SavedSchedule, 'id' | 'createdAt' | 'updatedAt'>
  warnings: string[]
}

/**
 * تبدیل انتخاب‌های ویزارد به یک برنامه هفتگی کامل.
 *
 * دو مسیر مجزا بر اساس schedulingMode دوره تحصیلی دنبال می‌شود:
 *  - single-teacher (ابتدایی): هر پایه یک معلم اصلی دارد؛ ورزش در صورت وجود معلم
 *    جداگانه، جدا از باقی درس‌ها به آن معلم اختصاص می‌یابد. اگر تعدادی از ساعت‌های
 *    ورزش از قبل (lockedSportCells) قفل شده باشند، از سهم موتور چیدمان کم می‌شود.
 *  - subject-teachers (متوسطه اول/دوم): بار هر (پایه، درس) با الگوریتم عادلانه بین
 *    معلم‌های همان درس توزیع و سپس برای هر پایه، جدول با موتور چیدمان ساخته می‌شود.
 */
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

      const requirements: CourseRequirement[] = Object.entries(hours)
        .map(([courseId, weeklyHours]) => ({
          courseId,
          weeklyHours: courseId === 'sport' ? Math.max(0, weeklyHours - lockedSportCount) : weeklyHours,
        }))
        .filter((r) => r.weeklyHours > 0)

      const result = generateGradeSchedule({
        shiftConfig: input.shiftConfig,
        requirements,
        courses: BASE_COURSES,
        lockedCells,
      })

      if (!result.success && result.unplaced.length > 0) {
        warnings.push(
          `پایه ${gradeLabel(grade)}: برخی ساعت‌ها به دلیل تنگی فضا کامل جا نگرفت (${result.unplaced.map((u) => u.courseId).join('، ')}).`,
        )
      }

      const mainTeacherId = input.teacherSelections[mainTeacherKey(grade)]?.[0] ?? null
      const sportTeacherId = input.teacherSelections[sportTeacherKey(grade)]?.[0] ?? mainTeacherId

      const cells: LessonCell[] = result.cells.map((cell) => ({
        ...cell,
        teacherId: cell.courseId === 'sport' ? sportTeacherId : cell.courseId ? mainTeacherId : null,
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
        warnings.push(`${name}: مجموع ساعت هفتگی (${w.totalWeeklyHours}) بیشتر از سقف استاندارد است و نیاز به اضافه‌کار دارد.`)
      }
    }

    for (const grade of input.grades) {
      const gradeAssignments = assignments.filter((a) => a.grade === grade)
      const requirements: CourseRequirement[] = gradeAssignments.map((a) => ({
        courseId: a.courseId,
        weeklyHours: a.weeklyHours,
      }))

      const result = generateGradeSchedule({
        shiftConfig: input.shiftConfig,
        requirements,
        courses: BASE_COURSES,
        lockedCells: input.lockedSportCells[grade] ?? [],
      })

      if (!result.success && result.unplaced.length > 0) {
        warnings.push(
          `پایه ${gradeLabel(grade)}: برخی ساعت‌ها به دلیل تنگی فضا کامل جا نگرفت (${result.unplaced.map((u) => u.courseId).join('، ')}).`,
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
      ? `${input.schoolName} — ${level?.name ?? ''}`
      : `${level?.name ?? ''} — پایه ${input.grades.map((g) => gradeLabel(g)).join('، ')}`

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
    },
    warnings,
  }
}
