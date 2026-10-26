import {
  JALAALI_MONTH_NAMES,
  JALAALI_WEEKDAY_NAMES,
  isoStringToJalaali,
  jalaaliMonthLength,
  jalaaliToIsoString,
} from '@/utils/jalaali'
import type { DateRange, TrendGranularity } from '@/types'

const pad = (value: number): string => String(value).padStart(2, '0')

export function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

export function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`
}

export function todayIso(): string {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso)
  if (!parts) return iso
  const date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + days))
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function daysBetween(from: string, to: string): number {
  const a = parseIso(from)
  const b = parseIso(to)
  if (!a || !b) return 0
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}

export function weekdayIndex(iso: string): number {
  const parts = parseIso(iso)
  if (!parts) return 0
  const jsDay = new Date(Date.UTC(parts.y, parts.m - 1, parts.d)).getUTCDay()
  return (jsDay + 1) % 7
}

export function weekdayName(iso: string): string {
  return JALAALI_WEEKDAY_NAMES[weekdayIndex(iso)]
}

export function jalaliLabel(iso: string): string {
  const j = isoStringToJalaali(iso)
  return j ? `${j.jd} ${JALAALI_MONTH_NAMES[j.jm - 1]} ${j.jy}` : ''
}

export function jalaliLabelWithWeekday(iso: string): string {
  const label = jalaliLabel(iso)
  return label ? `${weekdayName(iso)} ${label}` : ''
}

export function weekRangeOf(iso: string): DateRange {
  const from = addDays(iso, -weekdayIndex(iso))
  return { from, to: addDays(from, 6) }
}

export function monthRangeOf(iso: string): DateRange {
  const j = isoStringToJalaali(iso)
  if (!j) return { from: iso, to: iso }
  return {
    from: jalaaliToIsoString(j.jy, j.jm, 1),
    to: jalaaliToIsoString(j.jy, j.jm, jalaaliMonthLength(j.jy, j.jm)),
  }
}

export function previousMonthRangeOf(iso: string): DateRange {
  return monthRangeOf(addDays(monthRangeOf(iso).from, -1))
}

export function bucketKey(iso: string, granularity: TrendGranularity): string {
  if (granularity === 'day') return iso
  if (granularity === 'week') return addDays(iso, -weekdayIndex(iso))
  const j = isoStringToJalaali(iso)
  return j ? `${j.jy}-${pad(j.jm)}` : iso
}

export function bucketLabel(key: string, granularity: TrendGranularity): string {
  if (granularity === 'day') return jalaliLabel(key)
  if (granularity === 'week') return `هفته ${jalaliLabel(key)}`
  const [jy, jm] = key.split('-').map(Number)
  return `${JALAALI_MONTH_NAMES[jm - 1]} ${jy}`
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function nowTime(): string {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}
