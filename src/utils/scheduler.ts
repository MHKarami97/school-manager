import type { LessonCell, ShiftTimeConfig, CourseDefinition, RuleToggles } from '@/types'
import { WEEK_DAYS } from '@/types'

export interface CourseRequirement {
  courseId: string
  /** واحد درسی؛ مقادیر اعشاری فقط توسط زنگ مشترک نیم‌واحدی پوشش داده می‌شوند. */
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
  distributeAcrossDays?: boolean
  maxAttempts?: number
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

type Token = { kind: 'course'; courseId: string } | { kind: 'combo'; primaryCourseId: string; secondaryCourseId: string }

/**
 * موتور چیدمان bounded: ابتدا قیدهای سخت را جاگذاری می‌کند، سپس با Greedy چندتلاشی
 * برنامه را می‌سازد. واحدهای اعشاری باید از طریق یک زنگ ترکیبی نیم‌واحدی به
 * واحدهای کامل قابل چیدمان تبدیل شوند؛ مسئله ناسازگار هرگز مرورگر را فریز نمی‌کند.
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
    distributeAcrossDays = false,
    maxAttempts = 20,
  } = options
  const periodsCount = shiftConfig.periodsCount
  const specialRuleOf = (courseId: string) => courses.find((c) => c.id === courseId)?.specialRule ?? 'none'
  const quranReqs = ruleToggles.quranAlwaysFirstPeriod ? requirements.filter((r) => specialRuleOf(r.courseId) === 'quran-first') : []
  const poolReqs = ruleToggles.quranAlwaysFirstPeriod ? requirements.filter((r) => specialRuleOf(r.courseId) !== 'quran-first') : requirements

  let best: SchedulerResult | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: (LessonCell | null)[][] = Array.from({ length: DAYS_COUNT }, () => Array(periodsCount).fill(null))
    const dayHasCourse = new Map<string, Set<number>>()
    const columnHasCourse = new Map<string, Set<number>>()

    for (const cell of lockedCells) {
      if (cell.dayIndex >= DAYS_COUNT || cell.periodIndex >= periodsCount) continue
      grid[cell.dayIndex][cell.periodIndex] = { ...cell, isLocked: true }
      if (cell.courseId) markUsage(dayHasCourse, columnHasCourse, cell.courseId, cell.dayIndex, cell.periodIndex)
    }

    if (!placeFirstPeriodCourses(quranReqs, grid, dayHasCourse, columnHasCourse, attempt)) continue

    const comboCourseIds = new Set(comboRequirements.flatMap((combo) => [combo.primaryCourseId, combo.secondaryCourseId]))
    const remaining = new Map(
      poolReqs.map((r) => [r.courseId, comboCourseIds.has(r.courseId) ? Math.floor(r.weeklyHours) : r.weeklyHours]),
    )

    if (ruleToggles.persianWritingAdjacency) {
      for (const pair of adjacencyPairs) {
        placeAdjacencyPair(pair, grid, remaining, dayHasCourse, columnHasCourse, periodsCount, attempt, ruleToggles)
      }
    }

    const tokens = buildTokens(remaining, comboRequirements)
    const greedySucceeded = placeGreedily(
      tokens,
      grid,
      dayHasCourse,
      columnHasCourse,
      ruleToggles,
      avoidLastPeriodCourseIds,
      distributeAcrossDays,
      attempt,
    )

    if (greedySucceeded) return { success: true, cells: flatten(grid), unplaced: [] }

    const partial = { success: false, cells: flatten(grid), unplaced: summarizeUnplaced(tokens, grid) }
    if (!best || partial.unplaced.length < best.unplaced.length) best = partial
  }

  return best ?? { success: false, cells: [], unplaced: requirements }
}

function placeFirstPeriodCourses(
  requirements: CourseRequirement[],
  grid: (LessonCell | null)[][],
  dayHasCourse: Map<string, Set<number>>,
  columnHasCourse: Map<string, Set<number>>,
  attempt: number,
): boolean {
  for (const [index, requirement] of requirements.entries()) {
    const days = shuffle(range(DAYS_COUNT), attempt * 97 + index)
    let placed = 0
    for (const day of days) {
      if (placed >= requirement.weeklyHours) break
      if (grid[day][0] !== null) continue
      grid[day][0] = { dayIndex: day, periodIndex: 0, courseId: requirement.courseId, teacherId: null }
      markUsage(dayHasCourse, columnHasCourse, requirement.courseId, day, 0)
      placed++
    }
    if (placed < requirement.weeklyHours) return false
  }
  return true
}

function buildTokens(remaining: Map<string, number>, combos: ComboRequirement[]): Token[] {
  const tokens: Token[] = combos.map((combo) => ({ kind: 'combo', primaryCourseId: combo.primaryCourseId, secondaryCourseId: combo.secondaryCourseId }))
  const entries = Array.from(remaining.entries()).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1])
  for (const [courseId, count] of entries) {
    for (let i = 0; i < count; i++) tokens.push({ kind: 'course', courseId })
  }
  return tokens
}

function placeGreedily(
  tokens: Token[],
  grid: (LessonCell | null)[][],
  dayHasCourse: Map<string, Set<number>>,
  columnHasCourse: Map<string, Set<number>>,
  rules: RuleToggles,
  avoidLast: string[],
  distributeAcrossDays: boolean,
  attempt: number,
): boolean {
  const periodsCount = grid[0]?.length ?? 0
  for (const [index, token] of tokens.entries()) {
    const courseIds = token.kind === 'course' ? [token.courseId] : [token.primaryCourseId, token.secondaryCourseId]
    const candidates = orderedFreeCells(
      grid,
      periodsCount,
      token.kind === 'course' && avoidLast.includes(token.courseId),
      token.kind === 'course' ? token.courseId : null,
      dayHasCourse,
      distributeAcrossDays,
      attempt + index * 71,
    )
    const target = candidates.find(([day, period]) => courseIds.every((courseId) => isAllowed(courseId, day, period, dayHasCourse, columnHasCourse, rules)))
    if (!target) return false
    const [day, period] = target
    grid[day][period] = token.kind === 'course'
      ? { dayIndex: day, periodIndex: period, courseId: token.courseId, teacherId: null }
      : { dayIndex: day, periodIndex: period, courseId: token.primaryCourseId, teacherId: null, secondaryCourseId: token.secondaryCourseId, secondaryTeacherId: null }
    for (const courseId of courseIds) markUsage(dayHasCourse, columnHasCourse, courseId, day, period)
  }
  return true
}

function isAllowed(courseId: string, day: number, period: number, dayMap: Map<string, Set<number>>, columnMap: Map<string, Set<number>>, rules: RuleToggles): boolean {
  if (rules.noSameDayRepeat && dayMap.get(courseId)?.has(day)) return false
  if (rules.noSameColumnRepeat && columnMap.get(courseId)?.has(period)) return false
  return true
}

function orderedFreeCells(
  grid: (LessonCell | null)[][],
  periodsCount: number,
  avoidLast: boolean,
  courseId: string | null,
  dayMap: Map<string, Set<number>>,
  distributeAcrossDays: boolean,
  seed: number,
): [number, number][] {
  const cells: [number, number][] = []
  for (let day = 0; day < grid.length; day++) {
    for (let period = 0; period < periodsCount; period++) {
      if (grid[day][period] === null) cells.push([day, period])
    }
  }
  let result = shuffle(cells, seed)

  if (distributeAcrossDays && courseId) {
    result = result.sort(([dayA], [dayB]) => {
      const countA = dayMap.get(courseId)?.has(dayA) ? 1 : 0
      const countB = dayMap.get(courseId)?.has(dayB) ? 1 : 0
      return countA - countB
    })
  }

  if (!avoidLast) return result
  const lastPeriod = periodsCount - 1
  return [...result.filter(([, p]) => p !== lastPeriod), ...result.filter(([, p]) => p === lastPeriod)]
}

function placeAdjacencyPair(
  pair: AdjacencyPair,
  grid: (LessonCell | null)[][],
  remaining: Map<string, number>,
  dayHasCourse: Map<string, Set<number>>,
  columnHasCourse: Map<string, Set<number>>,
  periodsCount: number,
  attempt: number,
  rules: RuleToggles,
): void {
  const anchorCount = remaining.get(pair.anchorCourseId) ?? 0
  const followers = pair.followerCourseIds.flatMap((id) => Array(remaining.get(id) ?? 0).fill(id))
  const targetCount = Math.min(anchorCount, followers.length)
  const days = shuffle(range(grid.length), attempt * 131 + 17)
  let placed = 0

  for (const day of days) {
    for (let period = 0; period < periodsCount - 1 && placed < targetCount; period++) {
      const follower = followers[placed]
      if (grid[day][period] !== null || grid[day][period + 1] !== null) continue
      if (!isAllowed(pair.anchorCourseId, day, period, dayHasCourse, columnHasCourse, rules)) continue
      if (!isAllowed(follower, day, period + 1, dayHasCourse, columnHasCourse, rules)) continue
      grid[day][period] = { dayIndex: day, periodIndex: period, courseId: pair.anchorCourseId, teacherId: null }
      grid[day][period + 1] = { dayIndex: day, periodIndex: period + 1, courseId: follower, teacherId: null }
      markUsage(dayHasCourse, columnHasCourse, pair.anchorCourseId, day, period)
      markUsage(dayHasCourse, columnHasCourse, follower, day, period + 1)
      remaining.set(pair.anchorCourseId, (remaining.get(pair.anchorCourseId) ?? 1) - 1)
      remaining.set(follower, (remaining.get(follower) ?? 1) - 1)
      placed++
    }
  }
}

function summarizeUnplaced(tokens: Token[], grid: (LessonCell | null)[][]): CourseRequirement[] {
  const placed = new Map<string, number>()
  for (const row of grid) {
    for (const cell of row) {
      if (!cell?.courseId) continue
      placed.set(cell.courseId, (placed.get(cell.courseId) ?? 0) + 1)
      if (cell.secondaryCourseId) placed.set(cell.secondaryCourseId, (placed.get(cell.secondaryCourseId) ?? 0) + 1)
    }
  }
  const required = new Map<string, number>()
  for (const token of tokens) {
    if (token.kind === 'course') required.set(token.courseId, (required.get(token.courseId) ?? 0) + 1)
    else {
      required.set(token.primaryCourseId, (required.get(token.primaryCourseId) ?? 0) + 1)
      required.set(token.secondaryCourseId, (required.get(token.secondaryCourseId) ?? 0) + 1)
    }
  }
  return Array.from(required.entries())
    .map(([courseId, units]) => ({ courseId, weeklyHours: Math.max(0, units - (placed.get(courseId) ?? 0)) }))
    .filter((item) => item.weeklyHours > 0)
}

function markUsage(dayMap: Map<string, Set<number>>, columnMap: Map<string, Set<number>>, courseId: string, day: number, period: number): void {
  if (!dayMap.has(courseId)) dayMap.set(courseId, new Set())
  if (!columnMap.has(courseId)) columnMap.set(courseId, new Set())
  dayMap.get(courseId)!.add(day)
  columnMap.get(courseId)!.add(period)
}

function flatten(grid: (LessonCell | null)[][]): LessonCell[] {
  const result: LessonCell[] = []
  for (let day = 0; day < grid.length; day++) {
    for (let period = 0; period < grid[day].length; period++) {
      result.push(grid[day][period] ?? { dayIndex: day, periodIndex: period, courseId: null, teacherId: null })
    }
  }
  return result
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  let state = seed + 1
  for (let i = arr.length - 1; i > 0; i--) {
    state = (state * 9301 + 49297) % 233280
    const j = Math.floor((state / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
