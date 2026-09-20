import type { Teacher } from '@/types'

export interface GradeCourseLoad {
  grade: number
  courseId: string
  weeklyHours: number
}

export interface TeacherAssignment {
  teacherId: string
  grade: number
  courseId: string
  weeklyHours: number
}

export interface TeacherWorkload {
  teacherId: string
  totalWeeklyHours: number
  isOvertime: boolean
}

export interface FairAssignmentResult {
  assignments: TeacherAssignment[]
  workloads: TeacherWorkload[]
}

/**
 * توزیع عادلانه‌ی ساعت‌های هفتگی هر درس بین معلم‌های همان درس (برای متوسطه اول/دوم).
 *
 * استراتژی: الگوریتم حریصانه‌ی «کمترین بار فعلی» (Load Balancing) — بارهای درسی
 * (grade + weeklyHours) به‌ترتیب نزولی ساعت به معلمی که در آن لحظه کمترین مجموع
 * ساعت هفتگی را دارد، اختصاص می‌یابد؛ این کار تفاوت بار بین معلم‌های یک درس را
 * به کمترین مقدار ممکن می‌رساند (max-min fairness).
 *
 * @param standardWeeklyHours ساعت استاندارد تدریس در هفته که فراتر از آن «اضافه‌کار» محسوب می‌شود
 */
export function assignTeachersFairly(
  loads: GradeCourseLoad[],
  teachersByCourse: Map<string, Teacher[]>,
  standardWeeklyHours = 24,
): FairAssignmentResult {
  const totalHoursByTeacher = new Map<string, number>()
  const assignments: TeacherAssignment[] = []

  const loadsByCourse = groupBy(loads, (l) => l.courseId)

  for (const [courseId, courseLoads] of loadsByCourse) {
    const teachers = teachersByCourse.get(courseId) ?? []
    if (teachers.length === 0) continue

    for (const t of teachers) {
      if (!totalHoursByTeacher.has(t.id)) totalHoursByTeacher.set(t.id, 0)
    }

    const sortedLoads = [...courseLoads].sort((a, b) => b.weeklyHours - a.weeklyHours)

    for (const load of sortedLoads) {
      const leastLoadedTeacher = teachers
        .slice()
        .sort((a, b) => (totalHoursByTeacher.get(a.id) ?? 0) - (totalHoursByTeacher.get(b.id) ?? 0))[0]

      assignments.push({
        teacherId: leastLoadedTeacher.id,
        grade: load.grade,
        courseId,
        weeklyHours: load.weeklyHours,
      })

      totalHoursByTeacher.set(
        leastLoadedTeacher.id,
        (totalHoursByTeacher.get(leastLoadedTeacher.id) ?? 0) + load.weeklyHours,
      )
    }
  }

  const workloads: TeacherWorkload[] = Array.from(totalHoursByTeacher.entries()).map(([teacherId, total]) => ({
    teacherId,
    totalWeeklyHours: total,
    isOvertime: total > standardWeeklyHours,
  }))

  return { assignments, workloads }
}

function groupBy<T, K>(items: T[], keySelector: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keySelector(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}
