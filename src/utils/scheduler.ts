import type { LessonCell, ShiftTimeConfig, CourseDefinition, RuleToggles } from '@/types'
import { WEEK_DAYS } from '@/types'

export interface CourseRequirement {
  courseId: string
  weeklyHours: number
}

export interface AdjacencyPair {
  anchorCourseId: string
  followerCourseIds: string[]
}

export interface SchedulerOptions {
  shiftConfig: ShiftTimeConfig
  requirements: CourseRequirement[]
  courses: CourseDefinition[]
  lockedCells?: LessonCell[]
  maxAttempts?: number
  ruleToggles?: RuleToggles
  adjacencyPairs?: AdjacencyPair[]
}

export interface SchedulerResult {
  success: boolean
  cells: LessonCell[]
  unplaced: CourseRequirement[]
}

const DAYS_COUNT = WEEK_DAYS.length

const DEFAULT_RULE_TOGGLES: RuleToggles = {
  noSameDayRepeat: true,
  noSameColumnRepeat: true,
  quranAlwaysFirstPeriod: true,
  persianWritingAdjacency: true,
}

/**
 * موتور چیدمان برنامه هفتگی یک پایه/کلاس.
 *
 * قوانین پیش‌فرض (هرکدام از طریق `ruleToggles` قابل قطع هستند):
 *  - noSameDayRepeat: هیچ درسی دوبار در یک روز تکرار نمی‌شود.
 *  - noSameColumnRepeat: هیچ درسی دوبار در یک ستون (شماره زنگ) در طول هفته تکرار نمی‌شود.
 *  - quranAlwaysFirstPeriod: هر وقت قرآن/دینی در برنامه باشد، فقط در زنگ اول قرار می‌گیرد
 *    (زنگ اول انحصاری قرآن نیست؛ در روزهایی که قرآن نیاز ندارد، سایر درس‌ها هم
 *    می‌توانند طبق همان قوانین معمول در زنگ اول بیایند).
 *  - persianWritingAdjacency: از طریق پارامتر adjacencyPairs، هر وقت درس anchor (مثل فارسی)
 *    قرار می‌گیرد، تا حد امکان بلافاصله بعد از آن یکی از followerCourseIds (مانند انشا/املا)
 *    می‌آید. اگر ساعت anchor کمتر از مجموع ساعت‌های follower باشد، فقط به همان تعداد ممکن
 *    جفت ساخته می‌شود و باقی ساعت‌های follower به‌صورت عادی چیده می‌شوند.
 *
 * استثنای ورزش (specialRule = 'sport-fixed') از طریق lockedCells پیش‌تعیین می‌شود.
 */
export function generateGradeSchedule(options: SchedulerOptions): SchedulerResult {
  const {
    shiftConfig,
    requirements,
    courses,
    lockedCells = [],
    maxAttempts = 60,
    ruleToggles = DEFAULT_RULE_TOGGLES,
    adjacencyPairs = [],
  } = options
  const periodsCount = shiftConfig.periodsCount

  const specialRuleOf = (courseId: string) => courses.find((c) => c.id === courseId)?.specialRule ?? 'none'

  const quranReqs = ruleToggles.quranAlwaysFirstPeriod
    ? requirements.filter((r) => specialRuleOf(r.courseId) === 'quran-first')
    : []
  const poolReqs = ruleToggles.quranAlwaysFirstPeriod
    ? requirements.filter((r) => specialRuleOf(r.courseId) !== 'quran-first')
    : requirements

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

    const remaining = new Map<string, number>(poolReqs.map((r) => [r.courseId, r.weeklyHours]))

    if (ruleToggles.persianWritingAdjacency) {
      for (const pair of adjacencyPairs) {
        placeAdjacencyPair(pair, grid, remaining, dayHasCourse, columnHasCourse, periodsCount, attempt, ruleToggles)
      }
    }

    const sortedReqs = [...poolReqs].sort((a, b) => b.weeklyHours - a.weeklyHours)
    const unplacedThisAttempt: CourseRequirement[] = []

    for (const [reqIndex, req] of sortedReqs.entries()) {
      const targetCount = remaining.get(req.courseId) ?? req.weeklyHours
      let placedCount = countPlaced(grid, req.courseId)
      const seed = attempt * 977 + reqIndex * 53 + req.weeklyHours
      const candidateCells = shuffle(allFreeCells(grid, periodsCount), seed)

      for (const [day, period] of candidateCells) {
        if (placedCount >= targetCount) break
        if (grid[day][period] !== null) continue
        if (ruleToggles.noSameDayRepeat && dayHasCourse.get(req.courseId)?.has(day)) continue
        if (ruleToggles.noSameColumnRepeat && columnHasCourse.get(req.courseId)?.has(period)) continue

        grid[day][period] = { dayIndex: day, periodIndex: period, courseId: req.courseId, teacherId: null }
        markUsage(dayHasCourse, columnHasCourse, req.courseId, day, period)
        placedCount++
      }

      if (placedCount < targetCount) {
        unplacedThisAttempt.push({ courseId: req.courseId, weeklyHours: targetCount - placedCount })
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

function placeAdjacencyPair(
  pair: AdjacencyPair,
  grid: (LessonCell | null)[][],
  remaining: Map<string, number>,
  dayHasCourse: Map<string, Set<number>>,
  columnHasCourse: Map<string, Set<number>>,
  periodsCount: number,
  attempt: number,
  ruleToggles: RuleToggles,
): void {
  const anchorTotal = remaining.get(pair.anchorCourseId) ?? 0
  const followerTotal = pair.followerCourseIds.reduce((sum, id) => sum + (remaining.get(id) ?? 0), 0)
  const pairsToPlace = Math.min(anchorTotal, followerTotal)
  if (pairsToPlace <= 0) return

  const followerQueue: string[] = []
  for (const followerId of pair.followerCourseIds) {
    const count = remaining.get(followerId) ?? 0
    for (let i = 0; i < count; i++) followerQueue.push(followerId)
  }

  let placed = 0
  const dayOrder = shuffle(range(grid.length), attempt * 191 + 7)

  for (const day of dayOrder) {
    if (placed >= pairsToPlace) break
    for (let period = 0; period < periodsCount - 1; period++) {
      if (placed >= pairsToPlace) break
      if (grid[day][period] !== null || grid[day][period + 1] !== null) continue
      if (ruleToggles.noSameDayRepeat && dayHasCourse.get(pair.anchorCourseId)?.has(day)) continue
      if (ruleToggles.noSameColumnRepeat && columnHasCourse.get(pair.anchorCourseId)?.has(period)) continue

      const followerId = followerQueue[placed]
      if (ruleToggles.noSameDayRepeat && dayHasCourse.get(followerId)?.has(day)) continue
      if (ruleToggles.noSameColumnRepeat && columnHasCourse.get(followerId)?.has(period + 1)) continue

      grid[day][period] = { dayIndex: day, periodIndex: period, courseId: pair.anchorCourseId, teacherId: null }
      grid[day][period + 1] = { dayIndex: day, periodIndex: period + 1, courseId: followerId, teacherId: null }
      markUsage(dayHasCourse, columnHasCourse, pair.anchorCourseId, day, period)
      markUsage(dayHasCourse, columnHasCourse, followerId, day, period + 1)

      remaining.set(pair.anchorCourseId, (remaining.get(pair.anchorCourseId) ?? 1) - 1)
      remaining.set(followerId, (remaining.get(followerId) ?? 1) - 1)
      placed++
    }
  }
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
