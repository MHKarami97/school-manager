import type { LessonCell, ShiftTimeConfig, CourseDefinition, RuleToggles } from '@/types'
import { WEEK_DAYS } from '@/types'

export interface CourseRequirement {
  courseId: string
  weeklyHours: number
}

export interface ComboRequirement {
  primaryCourseId: string
  secondaryCourseId: string
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
  ruleToggles?: RuleToggles
  adjacencyPairs?: AdjacencyPair[]
  comboRequirements?: ComboRequirement[]
  avoidLastPeriodCourseIds?: string[]
  maxAttempts?: number
}

export interface SchedulerResult {
  success: boolean
  cells: LessonCell[]
  unplaced: CourseRequirement[]
}

const DAYS_COUNT = WEEK_DAYS.length
const MAX_BACKTRACK_STEPS = 400000

const DEFAULT_RULE_TOGGLES: RuleToggles = {
  noSameDayRepeat: true,
  noSameColumnRepeat: true,
  quranAlwaysFirstPeriod: true,
  persianWritingAdjacency: true,
}

type Token = { kind: 'course'; courseId: string } | { kind: 'combo'; primaryCourseId: string; secondaryCourseId: string }

/**
 * موتور چیدمان برنامه هفتگی یک پایه/کلاس.
 *
 * برخلاف نسخه‌های قبلی که فقط با «تلاش تصادفی مجدد» (random restart) کار می‌کرد و
 * برای مسائل کاملاً پر (بدون هیچ زنگ خالی اضافه) قابل‌اعتماد نبود، این نسخه از
 * یک الگوریتم Backtracking واقعی با undo استفاده می‌کند: هر واحد ساعت باقی‌مانده
 * (و هر «زنگ مشترک/تک‌زنگ») به‌عنوان یک token در نظر گرفته می‌شود؛ موتور برای هر
 * token سلول‌های آزاد را امتحان می‌کند؛ اگر یک انتخاب به بن‌بست برسد، آن را برمی‌گرداند
 * (undo) و گزینه بعدی را امتحان می‌کند. این تضمین می‌کند که اگر اصلاً چیدمانی معتبر
 * برای این ورودی وجود داشته باشد، موتور پیدایش کند (نه فقط با شانس).
 */
export function generateGradeSchedule(options: SchedulerOptions): SchedulerResult {
  const {
    shiftConfig,
    requirements,
    courses,
    lockedCells = [],
    ruleToggles = DEFAULT_RULE_TOGGLES,
    adjacencyPairs = [],
    comboRequirements = [],
    avoidLastPeriodCourseIds = [],
    maxAttempts = 12,
  } = options
  const periodsCount = shiftConfig.periodsCount

  const specialRuleOf = (courseId: string) => courses.find((c) => c.id === courseId)?.specialRule ?? 'none'

  const quranReqs = ruleToggles.quranAlwaysFirstPeriod
    ? requirements.filter((r) => specialRuleOf(r.courseId) === 'quran-first')
    : []
  const poolReqs = ruleToggles.quranAlwaysFirstPeriod
    ? requirements.filter((r) => specialRuleOf(r.courseId) !== 'quran-first')
    : requirements

  let lastGrid: (LessonCell | null)[][] | null = null
  let lastTokens: Token[] | null = null

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

    const tokens: Token[] = []
    for (const combo of comboRequirements) {
      tokens.push({ kind: 'combo', primaryCourseId: combo.primaryCourseId, secondaryCourseId: combo.secondaryCourseId })
    }
    const normalEntries = Array.from(remaining.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
    for (const [courseId, count] of normalEntries) {
      for (let i = 0; i < count; i++) tokens.push({ kind: 'course', courseId })
    }

    const freeCells = allFreeCells(grid, periodsCount)
    const stepBudget = { remaining: MAX_BACKTRACK_STEPS }
    const seed = attempt * 7919 + 3

    const success = backtrackPlace(
      tokens,
      0,
      freeCells,
      grid,
      dayHasCourse,
      columnHasCourse,
      ruleToggles,
      avoidLastPeriodCourseIds,
      seed,
      stepBudget,
    )

    if (success) {
      return { success: true, cells: flatten(grid), unplaced: [] }
    }

    lastGrid = grid
    lastTokens = tokens
  }

  if (lastGrid && lastTokens) {
    return { success: false, cells: flatten(lastGrid), unplaced: summarizeUnplaced(lastTokens, lastGrid) }
  }
  return { success: false, cells: [], unplaced: requirements }
}

function backtrackPlace(
  tokens: Token[],
  index: number,
  freeCells: [number, number][],
  grid: (LessonCell | null)[][],
  dayHasCourse: Map<string, Set<number>>,
  columnHasCourse: Map<string, Set<number>>,
  ruleToggles: RuleToggles,
  avoidLastPeriodCourseIds: string[],
  seed: number,
  stepBudget: { remaining: number },
): boolean {
  if (index >= tokens.length) return true
  if (stepBudget.remaining <= 0) return false
  stepBudget.remaining--

  const token = tokens[index]
  const periodsCount = grid[0]?.length ?? 0
  const lastPeriod = periodsCount - 1

  const courseIdsToCheck = token.kind === 'course' ? [token.courseId] : [token.primaryCourseId, token.secondaryCourseId]
  const avoidLast = token.kind === 'course' && avoidLastPeriodCourseIds.includes(token.courseId)

  let candidates = shuffle(freeCells, seed + index * 101)
  if (avoidLast) {
    const nonLast = candidates.filter(([, period]) => period !== lastPeriod)
    const last = candidates.filter(([, period]) => period === lastPeriod)
    candidates = [...nonLast, ...last]
  }

  for (const [day, period] of candidates) {
    let valid = true
    for (const courseId of courseIdsToCheck) {
      if (ruleToggles.noSameDayRepeat && dayHasCourse.get(courseId)?.has(day)) {
        valid = false
        break
      }
      if (ruleToggles.noSameColumnRepeat && columnHasCourse.get(courseId)?.has(period)) {
        valid = false
        break
      }
    }
    if (!valid) continue

    const placedCell: LessonCell =
      token.kind === 'course'
        ? { dayIndex: day, periodIndex: period, courseId: token.courseId, teacherId: null }
        : {
            dayIndex: day,
            periodIndex: period,
            courseId: token.primaryCourseId,
            teacherId: null,
            secondaryCourseId: token.secondaryCourseId,
            secondaryTeacherId: null,
          }

    grid[day][period] = placedCell
    for (const courseId of courseIdsToCheck) markUsage(dayHasCourse, columnHasCourse, courseId, day, period)
    const remainingFreeCells = candidates.filter(([d, p]) => !(d === day && p === period))

    if (backtrackPlace(tokens, index + 1, remainingFreeCells, grid, dayHasCourse, columnHasCourse, ruleToggles, avoidLastPeriodCourseIds, seed, stepBudget)) {
      return true
    }

    grid[day][period] = null
    for (const courseId of courseIdsToCheck) unmarkUsage(dayHasCourse, columnHasCourse, courseId, day, period)
  }

  return false
}

function summarizeUnplaced(tokens: Token[], grid: (LessonCell | null)[][]): CourseRequirement[] {
  const placedCount = new Map<string, number>()
  for (const row of grid) {
    for (const cell of row) {
      if (!cell?.courseId) continue
      placedCount.set(cell.courseId, (placedCount.get(cell.courseId) ?? 0) + 1)
      if (cell.secondaryCourseId) placedCount.set(cell.secondaryCourseId, (placedCount.get(cell.secondaryCourseId) ?? 0) + 1)
    }
  }
  const neededCount = new Map<string, number>()
  for (const token of tokens) {
    if (token.kind === 'course') {
      neededCount.set(token.courseId, (neededCount.get(token.courseId) ?? 0) + 1)
    } else {
      neededCount.set(token.primaryCourseId, (neededCount.get(token.primaryCourseId) ?? 0) + 1)
      neededCount.set(token.secondaryCourseId, (neededCount.get(token.secondaryCourseId) ?? 0) + 1)
    }
  }
  const result: CourseRequirement[] = []
  for (const [courseId, needed] of neededCount) {
    const placed = placedCount.get(courseId) ?? 0
    if (placed < needed) result.push({ courseId, weeklyHours: needed - placed })
  }
  return result
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

function markUsage(dayMap: Map<string, Set<number>>, columnMap: Map<string, Set<number>>, courseId: string, day: number, period: number): void {
  if (!dayMap.has(courseId)) dayMap.set(courseId, new Set())
  if (!columnMap.has(courseId)) columnMap.set(courseId, new Set())
  dayMap.get(courseId)!.add(day)
  columnMap.get(courseId)!.add(period)
}

function unmarkUsage(dayMap: Map<string, Set<number>>, columnMap: Map<string, Set<number>>, courseId: string, day: number, period: number): void {
  dayMap.get(courseId)?.delete(day)
  columnMap.get(courseId)?.delete(period)
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
