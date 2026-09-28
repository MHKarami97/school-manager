import { isoStringToJalaali, formatJalaaliDate } from './jalaali'

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}
