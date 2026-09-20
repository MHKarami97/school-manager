import type { LessonCell, ShiftTimeConfig, CourseDefinition } from '@/types'
import { WEEK_DAYS } from '@/types'

export interface CourseRequirement {
  courseId: string
  weeklyHours: number
}

export interface SchedulerOptions {
  shiftConfig: ShiftTimeConfig
  requirements: CourseRequirement[]
  courses: CourseDefinition[]
  lockedCells?: LessonCell[]
  maxAttempts?: number
}

export interface SchedulerResult {
  success: boolean
  cells: LessonCell[]
  unplaced: CourseRequirement[]
}

const DAYS_COUNT = WEEK_DAYS.length

/**
 * موتور چیدمان برنامه هفتگی یک پایه/کلاس.
 *
 * قوانین اعمال‌شده:
 *  - عدم تکرار «عرضی»: هیچ درسی دوبار در یک روز تکرار نمی‌شود.
 *  - عدم تکرار «طولی»: هیچ درسی دوبار در یک ستون (همان شماره زنگ در روزهای متفاوت) تکرار نمی‌شود.
 *  - استثنای قرآن/دینی (specialRule = 'quran-first'): هر وقت قرآن در برنامه باشد، فقط در زنگ اول
 *    (ستون ۱) قرار می‌گیرد. اما زنگ اول رزرو انحصاری قرآن نیست؛ در روزهایی که قرآن نیاز
 *    ندارد، سایر درس‌ها هم می‌توانند طبق همان قوانین معمول در زنگ اول قرار بگیرند (دقیقاً مطابق
 *    نمونه برنامه رسمی که هم قرآن و هم درس‌های دیگر در زنگ اول دیده می‌شوند) — بنابراین هیچ
 *    زنگ اولی خالی نمی‌ماند مگر اینکه واقعاً ساعت درسی کافی برای پر کردن آن نباشد.
 *  - استثنای ورزش (specialRule = 'sport-fixed') و هر سلول قفل‌شده دیگر: از قوانین تکرار مستثنا و
 *    از پیش در جدول ثابت می‌شود؛ موتور فقط باقی ساعت‌های آزاد را دور آن پر می‌کند.
 *
 * الگوریتم: Backtracking با ترتیب حریصانه به‌همراه چند تلاش تصادفی (shuffle) با seed یکتا برای
 * هر درس تا درس‌هایی با ساعت هفتگی یکسان روی سلول‌های متفاوتی قرار بگیرند و کل هفته یکنواخت پُر شود.
 */
export function generateGradeSchedule(options: SchedulerOptions): SchedulerResult {
  const { shiftConfig, requirements, courses, lockedCells = [], maxAttempts = 60 } = options
  const periodsCount = shiftConfig.periodsCount

  const specialRuleOf = (courseId: string) => courses.find((c) => c.id === courseId)?.specialRule ?? 'none'

  const quranReqs = requirements.filter((r) => specialRuleOf(r.courseId) === 'quran-first')
  const normalReqs = requirements.filter((r) => specialRuleOf(r.courseId) !== 'quran-first')

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: (LessonCell | null)[][] = Array.from({ length: DAYS_COUNT }, () => Array(periodsCount).fill(null))

    for (const cell of lockedCells) {
      grid[cell.dayIndex][cell.periodIndex] = { ...cell, isLocked: true }
    }

    const dayHasCourse = new Map<string, Set<number>>()
    const columnHasCourse = new Map<string, Set<number>>()
    for (const cell of lockedCells) {
      if (!cell.courseId) continue
      markUsage(dayHasCourse, columnHasCourse, cell.courseId, cell.dayIndex, cell.periodIndex)
    }

    let ok = true

    for (const [quranIndex, req] of quranReqs.entries()) {
      const availableDays = shuffle(range(DAYS_COUNT), attempt * 131 + quranIndex * 17 + 1)
      let placedCount = 0
      for (const day of availableDays) {
        if (placedCount >= req.weeklyHours) break
        if (grid[day][0] === null) {
          grid[day][0] = { dayIndex: day, periodIndex: 0, courseId: req.courseId, teacherId: null }
          markUsage(dayHasCourse, columnHasCourse, req.courseId, day, 0)
          placedCount++
        }
      }
      if (placedCount < req.weeklyHours) {
        ok = false
        break
      }
    }

    if (!ok) continue

    const sortedReqs = [...normalReqs].sort((a, b) => b.weeklyHours - a.weeklyHours)
    const unplacedThisAttempt: CourseRequirement[] = []

    for (const [reqIndex, req] of sortedReqs.entries()) {
      let placedCount = countPlaced(grid, req.courseId)
      const seed = attempt * 977 + reqIndex * 53 + req.weeklyHours
      const candidateCells = shuffle(allFreeCells(grid, periodsCount), seed)

      for (const [day, period] of candidateCells) {
        if (placedCount >= req.weeklyHours) break
        if (grid[day][period] !== null) continue
        if (dayHasCourse.get(req.courseId)?.has(day)) continue
        if (columnHasCourse.get(req.courseId)?.has(period)) continue

        grid[day][period] = { dayIndex: day, periodIndex: period, courseId: req.courseId, teacherId: null }
        markUsage(dayHasCourse, columnHasCourse, req.courseId, day, period)
        placedCount++
      }

      if (placedCount < req.weeklyHours) {
        unplacedThisAttempt.push({ courseId: req.courseId, weeklyHours: req.weeklyHours - placedCount })
      }
    }

    if (unplacedThisAttempt.length === 0) {
      return { success: true, cells: flatten(grid), unplaced: [] }
    }

    if (attempt === maxAttempts - 1) {
      return { success: false, cells: flatten(grid), unplaced: unplacedThisAttempt }
    }
  }

  return { success: false, cells: [], unplaced: requirements }
}

function markUsage(
  dayMap: Map<string, Set<number>>,
  columnMap: Map<string, Set<number>>,
  courseId: string,
  day: number,
  period: number,
): void {
  if (!dayMap.has(courseId)) dayMap.set(courseId, new Set())
  if (!columnMap.has(courseId)) columnMap.set(courseId, new Set())
  dayMap.get(courseId)!.add(day)
  columnMap.get(courseId)!.add(period)
}

function countPlaced(grid: (LessonCell | null)[][], courseId: string): number {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell?.courseId === courseId) count++
    }
  }
  return count
}

function allFreeCells(grid: (LessonCell | null)[][], periodsCount: number): [number, number][] {
  const cells: [number, number][] = []
  for (let day = 0; day < grid.length; day++) {
    for (let period = 0; period < periodsCount; period++) {
      if (grid[day][period] === null) cells.push([day, period])
    }
  }
  return cells
}

function flatten(grid: (LessonCell | null)[][]): LessonCell[] {
  const result: LessonCell[] = []
  for (let day = 0; day < grid.length; day++) {
    for (let period = 0; period < grid[day].length; period++) {
      const cell = grid[day][period]
      result.push(cell ?? { dayIndex: day, periodIndex: period, courseId: null, teacherId: null })
    }
  }
  return result
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

/** shuffle قطعی (seed-based) تا نتیجه هر attempt قابل بازتولید و متفاوت از قبلی باشد */
function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  let s = seed + 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
