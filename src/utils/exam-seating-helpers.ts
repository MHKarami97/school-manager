import type { ExamRoom, SeatAssignment } from '../types'
import { CLASS_COLOR_PALETTE } from '../config/exam-seating.config'
import { isoStringToJalaali, formatJalaaliDate } from './jalaali'

export function seatKey(row: number, col: number): string {
  return `${row}-${col}`
}

function isInsideRoom(room: ExamRoom, key: string): boolean {
  const [row, col] = key.split('-').map(Number)
  return row >= 0 && row < room.rows && col >= 0 && col < room.cols
}

export function isSeatBlocked(room: ExamRoom, row: number, col: number): boolean {
  return room.blockedSeats.includes(seatKey(row, col))
}

/** ظرفیت واقعی سالن: کل صندلی‌ها منهای صندلی‌های مسدودشده (فقط آن‌هایی که داخل ابعاد فعلی‌اند). */
export function roomCapacity(room: ExamRoom): number {
  const blocked = room.blockedSeats.filter((key) => isInsideRoom(room, key)).length
  return Math.max(0, room.rows * room.cols - blocked)
}

export function cleanBlockedSeats(room: ExamRoom): string[] {
  return Array.from(new Set(room.blockedSeats.filter((key) => isInsideRoom(room, key))))
}

export function seatLabel(row: number, col: number): string {
  return `ردیف ${row + 1}، صندلی ${col + 1}`
}

export function assignmentsOfRoom(assignments: SeatAssignment[], roomId: string): SeatAssignment[] {
  return assignments
    .filter((a) => a.roomId === roomId)
    .sort((a, b) => a.row - b.row || a.col - b.col)
}

/** نگاشت کلید کلاس -> رنگ؛ کلیدها مرتب می‌شوند تا رنگ هر کلاس بین دفعات ثابت بماند. */
export function buildClassColorMap(classKeys: string[]): Map<string, string> {
  const map = new Map<string, string>()
  Array.from(new Set(classKeys))
    .sort()
    .forEach((key, index) => map.set(key, CLASS_COLOR_PALETTE[index % CLASS_COLOR_PALETTE.length]))
  return map
}

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}
