import type { TeachingSlot } from '../types'

export interface SlotPosition {
  dayIndex: number
  periodIndex: number
}

function sameCell(slot: TeachingSlot, classId: string, position: SlotPosition): boolean {
  return slot.classId === classId && slot.dayIndex === position.dayIndex && slot.periodIndex === position.periodIndex
}

/** یک درس را به خانه‌ی دیگر همان کلاس می‌برد؛ اگر مقصد پر بود، جای دو درس عوض می‌شود. */
export function moveLesson(slots: TeachingSlot[], classId: string, from: SlotPosition, to: SlotPosition): TeachingSlot[] {
  if (from.dayIndex === to.dayIndex && from.periodIndex === to.periodIndex) return slots
  const source = slots.find((s) => sameCell(s, classId, from))
  if (!source) return slots
  const target = slots.find((s) => sameCell(s, classId, to))
  return slots.map((s) => {
    if (s === source) return { ...s, dayIndex: to.dayIndex, periodIndex: to.periodIndex }
    if (target && s === target) return { ...s, dayIndex: from.dayIndex, periodIndex: from.periodIndex }
    return s
  })
}

/** درس خانه را جای‌گزین می‌کند (یا اگر نبود اضافه می‌کند). */
export function upsertLesson(slots: TeachingSlot[], lesson: TeachingSlot): TeachingSlot[] {
  const position = { dayIndex: lesson.dayIndex, periodIndex: lesson.periodIndex }
  const exists = slots.some((s) => sameCell(s, lesson.classId, position))
  return exists ? slots.map((s) => (sameCell(s, lesson.classId, position) ? lesson : s)) : [...slots, lesson]
}

export function removeLesson(slots: TeachingSlot[], classId: string, position: SlotPosition): TeachingSlot[] {
  return slots.filter((s) => !sameCell(s, classId, position))
}
