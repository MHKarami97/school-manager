import type { LevelId, Teacher, TeacherBlockedSlot } from '../types'

export interface PeriodTime {
  start: string
  end: string
}

export interface DateRange {
  from: string
  to: string
}

export function toMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

/** ساعت درسی در curriculum گاهی اعشاری است (مثلاً 0.5)؛ برای زنگ‌های صحیح گرد می‌شود. */
export function hoursToUnits(hours: number): number {
  return hours > 0 ? Math.max(1, Math.round(hours)) : 0
}

export function slotKey(classId: string, dayIndex: number, periodIndex: number): string {
  return `${classId}|${dayIndex}|${periodIndex}`
}

export function teacherSlotKey(teacherId: string, dayIndex: number, periodIndex: number): string {
  return `${teacherId}|${dayIndex}|${periodIndex}`
}

/** معلم این درس را تدریس می‌کند، برای این پایه/مقطع مجاز است. (لیست خالی پایه/مقطع = بدون محدودیت) */
export function isQualified(teacher: Teacher, courseId: string, grade: number, levelId: LevelId): boolean {
  if (!teacher.courseIds.includes(courseId)) return false
  if (teacher.allowedGrades && teacher.allowedGrades.length && !teacher.allowedGrades.includes(grade)) return false
  if (teacher.levelIds && teacher.levelIds.length && !teacher.levelIds.includes(levelId)) return false
  return true
}

/** روزهای حضور: اگر هیچ روزی ثبت نشده باشد یعنی همه‌ی روزها حاضر است. */
export function isTeacherPresent(teacher: Teacher, dayIndex: number, period: PeriodTime): boolean {
  if (!teacher.availability || !teacher.availability.length) return true
  const start = toMinutes(period.start)
  const end = toMinutes(period.end)
  return teacher.availability.some(
    (slot) => slot.dayIndex === dayIndex && toMinutes(slot.startTime) <= start && toMinutes(slot.endTime) >= end,
  )
}

/** بازه‌ی تاریخی یک ساعت غیرقابل‌تدریس با بازه‌ی اعتبار برنامه (هر دو شمسی/ISO) هم‌پوشانی دارد؟ خالی = نامحدود. */
export function blockedSlotApplies(slot: TeacherBlockedSlot, range: DateRange): boolean {
  const slotFrom = slot.fromDate || '0000-00-00'
  const slotTo = slot.toDate || '9999-99-99'
  const planFrom = range.from || '0000-00-00'
  const planTo = range.to || '9999-99-99'
  return slotFrom <= planTo && planFrom <= slotTo
}

export function isTeacherBlocked(teacher: Teacher, dayIndex: number, period: PeriodTime, range: DateRange): boolean {
  if (!teacher.blockedSlots || !teacher.blockedSlots.length) return false
  const start = toMinutes(period.start)
  const end = toMinutes(period.end)
  return teacher.blockedSlots.some(
    (slot) =>
      slot.dayIndex === dayIndex &&
      blockedSlotApplies(slot, range) &&
      toMinutes(slot.startTime) < end &&
      start < toMinutes(slot.endTime),
  )
}

export function isTeacherFree(teacher: Teacher, dayIndex: number, period: PeriodTime, range: DateRange): boolean {
  return isTeacherPresent(teacher, dayIndex, period) && !isTeacherBlocked(teacher, dayIndex, period, range)
}
