import type {
  ExamRoom,
  SeatAdjacency,
  SeatAssignment,
  SeatSpacing,
  SeatingSettings,
  SeatingStrategy,
  SeparationPair,
} from '../types'

export interface SeatingParticipant {
  id: string
  sortKey: string
  classKey: string
}

export interface SeatingConflict {
  roomId: string
  studentAId: string
  studentBId: string
  reason: 'class' | 'pair'
  rowA: number
  colA: number
  rowB: number
  colB: number
}

export interface SeatingRequest {
  examSessionId: string
  rooms: ExamRoom[]
  participants: SeatingParticipant[]
  separationPairs: SeparationPair[]
  settings: SeatingSettings
}

export interface SeatingResult {
  assignments: SeatAssignment[]
  unseatedIds: string[]
  conflicts: SeatingConflict[]
  warnings: string[]
}

interface SeatSlot {
  roomId: string
  roomIndex: number
  row: number
  col: number
}

const ADJACENCY_OFFSETS: Record<SeatAdjacency, [number, number][]> = {
  side: [[0, -1], [0, 1]],
  cross: [[0, -1], [0, 1], [-1, 0], [1, 0]],
  all: [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]],
}

const MAX_REPAIR_ITERATIONS = 8000

/** مولد عدد تصادفی قطعی (mulberry32): با seed یکسان همیشه دنباله‌ی یکسان می‌دهد. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function compareParticipants(a: SeatingParticipant, b: SeatingParticipant): number {
  return a.sortKey.localeCompare(b.sortKey, 'fa') || a.id.localeCompare(b.id)
}

function pairKeyOf(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function slotKey(roomId: string, row: number, col: number): string {
  return `${roomId}|${row}|${col}`
}

/**
 * همه‌ی مجاورت‌های ممنوع (هم‌کلاسی یا جفت‌های جداسازی) را در یک چیدمان پیدا می‌کند.
 * هم برای ارزیابی خروجی موتور و هم برای ارزیابی مجدد بعد از جابه‌جایی دستی استفاده می‌شود.
 */
export function computeConflicts(
  assignments: SeatAssignment[],
  classKeyOf: (studentId: string) => string,
  pairs: SeparationPair[],
  settings: SeatingSettings,
): SeatingConflict[] {
  const pairKeys = new Set(pairs.map((p) => pairKeyOf(p.studentAId, p.studentBId)))
  const bySeat = new Map<string, SeatAssignment>()
  for (const assignment of assignments) bySeat.set(slotKey(assignment.roomId, assignment.row, assignment.col), assignment)

  const offsets = ADJACENCY_OFFSETS[settings.adjacency]
  const conflicts: SeatingConflict[] = []

  for (const a of assignments) {
    for (const [dr, dc] of offsets) {
      const b = bySeat.get(slotKey(a.roomId, a.row + dr, a.col + dc))
      if (!b || a.studentId >= b.studentId) continue
      const isPair = pairKeys.has(pairKeyOf(a.studentId, b.studentId))
      const isClass = settings.avoidSameClass && classKeyOf(a.studentId) === classKeyOf(b.studentId)
      if (!isPair && !isClass) continue
      conflicts.push({
        roomId: a.roomId,
        studentAId: a.studentId,
        studentBId: b.studentId,
        reason: isPair ? 'pair' : 'class',
        rowA: a.row,
        colA: a.col,
        rowB: b.row,
        colB: b.col,
      })
    }
  }
  return conflicts
}

function isPreferredSeat(spacing: SeatSpacing, row: number, col: number): boolean {
  if (spacing === 'checkerboard') return (row + col) % 2 === 0
  if (spacing === 'skip-columns') return col % 2 === 0
  return true
}

export class SeatingEngine {
  run(request: SeatingRequest): SeatingResult {
    const { settings } = request
    const warnings: string[] = []
    const rng = createRng(settings.seed)
    const sorted = [...request.participants].sort(compareParticipants)

    const { preferred, others } = this.collectSeats(request.rooms, settings.spacing)
    const totalSeats = preferred.length + others.length
    if (!totalSeats) {
      return {
        assignments: [],
        unseatedIds: sorted.map((p) => p.id),
        conflicts: [],
        warnings: ['هیچ صندلی فعالی در سالن‌های انتخاب‌شده وجود ندارد.'],
      }
    }

    const seatedCount = Math.min(sorted.length, totalSeats)
    const pool = this.pickPool(preferred, others, seatedCount, settings.spacing, warnings)

    const sequence = this.orderParticipants(sorted, settings.strategy, rng)
    const seated = sequence.slice(0, seatedCount)
    const unseated = sequence.slice(seatedCount)
    if (unseated.length) {
      warnings.push(`ظرفیت سالن‌ها کافی نبود؛ ${unseated.length} نفر بدون صندلی ماندند.`)
    }

    const classCount = new Set(seated.map((p) => p.classKey)).size
    const needsRepair =
      settings.strategy !== 'alphabetical' &&
      ((settings.avoidSameClass && classCount > 1) || request.separationPairs.length > 0)
    if (settings.avoidSameClass && classCount <= 1 && sorted.length > 1) {
      warnings.push('همه‌ی شرکت‌کنندگان از یک کلاس هستند؛ فاصله‌گذاری بر اساس کلاس ممکن نیست.')
    }

    const occupants = needsRepair ? this.repair(pool, seated, request, rng) : seated

    const assignments: SeatAssignment[] = pool.map((slot, index) => ({
      examSessionId: request.examSessionId,
      studentId: occupants[index].id,
      roomId: slot.roomId,
      row: slot.row,
      col: slot.col,
    }))

    const classKeyById = new Map(request.participants.map((p) => [p.id, p.classKey]))
    const conflicts = computeConflicts(
      assignments,
      (id) => classKeyById.get(id) ?? '',
      request.separationPairs,
      settings,
    )
    if (conflicts.length) {
      warnings.push(
        `${conflicts.length} مورد مجاورت ممنوع باقی ماند. فاصله‌گذاری را سخت‌گیرانه‌تر کن، سالن بیشتری اضافه کن یا seed دیگری امتحان کن.`,
      )
    }

    return { assignments, unseatedIds: unseated.map((p) => p.id), conflicts, warnings }
  }

  private collectSeats(rooms: ExamRoom[], spacing: SeatSpacing): { preferred: SeatSlot[]; others: SeatSlot[] } {
    const preferred: SeatSlot[] = []
    const others: SeatSlot[] = []
    rooms.forEach((room, roomIndex) => {
      const blocked = new Set(room.blockedSeats)
      for (let row = 0; row < room.rows; row += 1) {
        for (let col = 0; col < room.cols; col += 1) {
          if (blocked.has(`${row}-${col}`)) continue
          const slot: SeatSlot = { roomId: room.id, roomIndex, row, col }
          if (isPreferredSeat(spacing, row, col)) preferred.push(slot)
          else others.push(slot)
        }
      }
    })
    return { preferred, others }
  }

  /** ابتدا صندلی‌های الگوی انتخابی؛ فقط در صورت کمبود ظرفیت، از صندلی‌های میانی هم استفاده می‌شود. */
  private pickPool(
    preferred: SeatSlot[],
    others: SeatSlot[],
    seatedCount: number,
    spacing: SeatSpacing,
    warnings: string[],
  ): SeatSlot[] {
    let pool: SeatSlot[]
    if (preferred.length >= seatedCount) {
      pool = preferred.slice(0, seatedCount)
    } else {
      const extra = seatedCount - preferred.length
      pool = [...preferred, ...others.slice(0, extra)]
      if (spacing !== 'none') {
        warnings.push(`ظرفیت الگوی فاصله‌گذاری کافی نبود؛ ${extra} صندلی میانی هم استفاده شد.`)
      }
    }
    return pool.sort((a, b) => a.roomIndex - b.roomIndex || a.row - b.row || a.col - b.col)
  }

  private orderParticipants(
    sorted: SeatingParticipant[],
    strategy: SeatingStrategy,
    rng: () => number,
  ): SeatingParticipant[] {
    if (strategy === 'alphabetical') return sorted
    if (strategy === 'random') return seededShuffle(sorted, rng)
    return this.spreadSequence(sorted, rng)
  }

  /**
   * دنباله‌ای می‌سازد که در آن هم‌کلاسی‌ها تا حد ممکن کنار هم نیایند: هر بار از کلاسی که
   * بیشترین نفر باقی‌مانده دارد (و با نفر قبلی هم‌کلاس نیست) یک نفر برمی‌دارد.
   */
  private spreadSequence(sorted: SeatingParticipant[], rng: () => number): SeatingParticipant[] {
    const groups = new Map<string, SeatingParticipant[]>()
    for (const participant of sorted) {
      const list = groups.get(participant.classKey) ?? []
      list.push(participant)
      groups.set(participant.classKey, list)
    }
    const keys = Array.from(groups.keys()).sort()
    const queues = keys.map((key) => seededShuffle(groups.get(key)!, rng))

    const result: SeatingParticipant[] = []
    let lastQueue = -1
    while (result.length < sorted.length) {
      let best = -1
      const ties: number[] = []
      for (let q = 0; q < queues.length; q += 1) {
        if (!queues[q].length || q === lastQueue) continue
        if (queues[q].length > best) {
          best = queues[q].length
          ties.length = 0
          ties.push(q)
        } else if (queues[q].length === best) {
          ties.push(q)
        }
      }
      const chosen =
        ties.length > 0
          ? ties[Math.floor(rng() * ties.length)]
          : queues.findIndex((queue) => queue.length > 0)
      result.push(queues[chosen].shift()!)
      lastQueue = chosen
    }
    return result
  }

  /** جست‌وجوی محلی با تعویض: تا کاهش مجاورت‌های ممنوع ادامه می‌دهد (کاملاً قطعی با rng ثابت). */
  private repair(
    pool: SeatSlot[],
    seated: SeatingParticipant[],
    request: SeatingRequest,
    rng: () => number,
  ): SeatingParticipant[] {
    const { settings } = request
    const occupants = [...seated]
    const pairKeys = new Set(request.separationPairs.map((p) => pairKeyOf(p.studentAId, p.studentBId)))
    const offsets = ADJACENCY_OFFSETS[settings.adjacency]

    const indexBySlot = new Map<string, number>()
    pool.forEach((slot, index) => indexBySlot.set(slotKey(slot.roomId, slot.row, slot.col), index))
    const neighbors: number[][] = pool.map((slot) =>
      offsets
        .map(([dr, dc]) => indexBySlot.get(slotKey(slot.roomId, slot.row + dr, slot.col + dc)))
        .filter((value): value is number => value !== undefined),
    )

    const weight = (a: SeatingParticipant, b: SeatingParticipant): number =>
      (settings.avoidSameClass && a.classKey === b.classKey ? 1 : 0) + (pairKeys.has(pairKeyOf(a.id, b.id)) ? 3 : 0)

    const costOf = (index: number): number => {
      let total = 0
      for (const n of neighbors[index]) total += weight(occupants[index], occupants[n])
      return total
    }

    const iterations = Math.min(MAX_REPAIR_ITERATIONS, 300 * occupants.length)
    for (let step = 0; step < iterations; step += 1) {
      const conflicted: number[] = []
      for (let i = 0; i < occupants.length; i += 1) {
        if (costOf(i) > 0) conflicted.push(i)
      }
      if (!conflicted.length) break

      const i = conflicted[Math.floor(rng() * conflicted.length)]
      const j = Math.floor(rng() * occupants.length)
      if (i === j) continue

      const before = costOf(i) + costOf(j)
      ;[occupants[i], occupants[j]] = [occupants[j], occupants[i]]
      const after = costOf(i) + costOf(j)
      const keep = after < before || (after === before && rng() < 0.2)
      if (!keep) [occupants[i], occupants[j]] = [occupants[j], occupants[i]]
    }
    return occupants
  }
}
