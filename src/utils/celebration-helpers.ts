import type { Celebration, CelebrationTask } from '../types'
import { isoStringToJalaali, formatJalaaliDate, jalaaliMonthLength, JALAALI_MONTH_NAMES, todayJalaali } from './jalaali'

function todayIsoString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** یک کار «عقب‌افتاده» است اگر انجام نشده باشد و سررسیدش گذشته باشد. */
export function isTaskOverdue(task: CelebrationTask): boolean {
  if (task.status === 'done' || !task.dueDate) return false
  return task.dueDate < todayIsoString()
}

export function overdueTasksOf(celebration: Celebration): CelebrationTask[] {
  return celebration.tasks.filter(isTaskOverdue)
}

export function openTasksCountOf(celebration: Celebration): number {
  return celebration.tasks.filter((task) => task.status !== 'done').length
}

/** کارهایی که هنوز باز هستند و سررسیدشان ظرف withinDays روز آینده است. */
export function upcomingTasksOf(celebration: Celebration, withinDays = 3): CelebrationTask[] {
  const today = new Date()
  const todayIso = todayIsoString()
  const limit = new Date(today.getTime() + withinDays * 24 * 60 * 60 * 1000)
  const limitIso = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(limit.getDate()).padStart(2, '0')}`
  return celebration.tasks.filter(
    (task) => task.status !== 'done' && !!task.dueDate && task.dueDate >= todayIso && task.dueDate <= limitIso,
  )
}

export function sortCelebrationsByDate(celebrations: Celebration[]): Celebration[] {
  return [...celebrations].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}

/** فیلتر «همه / جشن‌های مانده / جشن‌های برگزار شده» برای تقویم سالانه. */
export type CelebrationCalendarStatusFilter = 'all' | 'remaining' | 'held'

export function matchesStatusFilter(celebration: Celebration, filter: CelebrationCalendarStatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'held') return celebration.status === 'held'
  return celebration.status !== 'held'
}

/** سال‌های شمسی‌ای که حداقل یک جشن در آن‌ها ثبت شده، برای پر کردن انتخاب‌گر سال. */
export function celebrationYearsPresent(celebrations: Celebration[]): number[] {
  const years = new Set<number>()
  for (const celebration of celebrations) {
    if (!celebration.date) continue
    const jalaali = isoStringToJalaali(celebration.date)
    if (jalaali) years.add(jalaali.jy)
  }
  if (!years.size) years.add(todayJalaali().jy)
  return Array.from(years).sort((a, b) => a - b)
}

export interface CelebrationYearDay {
  jd: number
  celebrations: Celebration[]
}

export interface CelebrationYearMonth {
  jm: number
  label: string
  days: CelebrationYearDay[]
}

/**
 * تقویم کامل یک سال شمسی را می‌سازد: ۱۲ ماه، هر ماه با روزهای واقعی‌اش
 * (۲۹ تا ۳۱ روز بسته به ماه/کبیسه بودن سال) و جشن‌های همان روز.
 * مطابق با الگوی موجود در JalaliDatePicker.vue، روزها به‌صورت پیوسته در
 * شبکه‌ی ۷‌ستونی چیده می‌شوند (بدون محاسبه‌ی دقیق روز هفته‌ی اول ماه).
 */
export function buildJalaliYearCalendar(celebrations: Celebration[], jy: number): CelebrationYearMonth[] {
  return JALAALI_MONTH_NAMES.map((label, index) => {
    const jm = index + 1
    const length = jalaaliMonthLength(jy, jm)
    const days: CelebrationYearDay[] = Array.from({ length }, (_, i) => ({ jd: i + 1, celebrations: [] }))
    for (const celebration of celebrations) {
      if (!celebration.date) continue
      const jalaali = isoStringToJalaali(celebration.date)
      if (!jalaali || jalaali.jy !== jy || jalaali.jm !== jm) continue
      const day = days.find((d) => d.jd === jalaali.jd)
      if (day) day.celebrations.push(celebration)
    }
    return { jm, label, days }
  })
}
