import type {
  ExamRoom,
  ExamSession,
  SeatAdjacency,
  SeatSpacing,
  SeatingSettings,
  SeatingStrategy,
} from '../types'

export const SEATING_STRATEGIES: SeatingStrategy[] = ['spread', 'random', 'alphabetical']

export const SEATING_STRATEGY_LABELS: Record<SeatingStrategy, string> = {
  spread: 'پخش‌شده (ضد تقلب)',
  random: 'تصادفی با محدودیت',
  alphabetical: 'الفبایی',
}

export const SEATING_STRATEGY_DESCRIPTIONS: Record<SeatingStrategy, string> = {
  spread: 'هم‌کلاسی‌ها تا جای ممکن از هم دور می‌شوند؛ بهترین گزینه برای جلوگیری از تقلب.',
  random: 'ترتیب تصادفی (با seed ثابت)، سپس تعویض‌ها تا محدودیت‌ها رعایت شود.',
  alphabetical: 'به ترتیب نام‌خانوادگی از ردیف اول؛ برای پیدا کردن راحت جای هر نفر. محدودیت‌ها فقط گزارش می‌شوند.',
}

export const SEAT_SPACINGS: SeatSpacing[] = ['none', 'checkerboard', 'skip-columns']

export const SEAT_SPACING_LABELS: Record<SeatSpacing, string> = {
  none: 'همه صندلی‌ها',
  checkerboard: 'شطرنجی (زیگزاگ)',
  'skip-columns': 'یک ستون در میان',
}

export const SEAT_ADJACENCIES: SeatAdjacency[] = ['side', 'cross', 'all']

export const SEAT_ADJACENCY_LABELS: Record<SeatAdjacency, string> = {
  side: 'فقط چپ و راست',
  cross: 'چپ، راست، جلو و عقب',
  all: 'هر هشت صندلی اطراف (با قطری‌ها)',
}

/** رنگ هر کلاس در نقشه‌ی صندلی (برای بررسی چشمی پخش‌شدگی). */
export const CLASS_COLOR_PALETTE = [
  '#2f7bfa', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#0ea5e9',
  '#ec4899', '#14b8a6', '#65a30d', '#7c3aed', '#ea580c', '#0d9488',
]

export const DEFAULT_SEATING_SETTINGS: SeatingSettings = {
  strategy: 'spread',
  spacing: 'none',
  adjacency: 'cross',
  avoidSameClass: true,
  seed: 1,
}

export function createEmptyExamRoom(): ExamRoom {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: '',
    rows: 5,
    cols: 6,
    blockedSeats: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyExamSession(): ExamSession {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    courseId: '',
    date: '',
    time: '',
    roomIds: [],
    participantIds: [],
    separationPairs: [],
    settings: { ...DEFAULT_SEATING_SETTINGS },
    assignments: [],
    unseatedIds: [],
    generatedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}
