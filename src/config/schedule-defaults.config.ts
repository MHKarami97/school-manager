import type { ShiftTimeConfig, ShiftId } from '@/types'

/**
 * پیش‌فرض‌های زمان‌بندی. تمام مقادیر در صفحه ویزارد و تنظیمات قابل ویرایش هستند.
 * طول هر زنگ ۴۵ دقیقه و زنگ تفریح ۱۵ دقیقه (طبق دستورالعمل ابتدایی) - قابل تفییر برای هر مقطع.
 * تعداد زنگ پیش‌فرض ۵ زنگ در روز است (مطابق نمونه برنامه ابتدایی)؛ اگر مدرسه‌ای بیشتر/کمتر
 * زنگ دارد، از همین صفحه قابل ویرایش است.
 */
export const DEFAULT_SHIFT_CONFIGS: Record<ShiftId, ShiftTimeConfig> = {
  morning: {
    id: 'morning',
    name: 'شیفت صبح',
    startTime: '07:45',
    endTime: '12:30',
    lessonDurationMinutes: 45,
    breakDurationMinutes: 15,
    hasLunchBreak: false,
    lunchDurationMinutes: 45,
    lunchAfterPeriod: 4,
    periodsCount: 5,
  },
  noon: {
    id: 'noon',
    name: 'شیفت ظهر',
    startTime: '12:45',
    endTime: '17:30',
    lessonDurationMinutes: 45,
    breakDurationMinutes: 15,
    hasLunchBreak: false,
    lunchDurationMinutes: 45,
    lunchAfterPeriod: 4,
    periodsCount: 5,
  },
}

export function cloneDefaultShiftConfigs(): Record<ShiftId, ShiftTimeConfig> {
  return JSON.parse(JSON.stringify(DEFAULT_SHIFT_CONFIGS))
}

/**
 * تولید جدول زنگ‌ها (بلز) بر اساس تنظیمات شیفت. اگر زنگ تفریح ناهار فعال باشد،
 * زنگ تفریح بعد از periodِ مشخص‌شده با مدت lunchDurationMinutes جایگزین می‌شود.
 */
export function buildBellSchedule(config: ShiftTimeConfig) {
  const periods: { index: number; type: 'lesson' | 'break'; start: string; end: string; durationMinutes: number }[] = []
  let cursorMinutes = toMinutes(config.startTime)

  for (let i = 1; i <= config.periodsCount; i++) {
    const duration = config.lessonDurationMinutes
    const start = cursorMinutes
    const end = start + duration
    periods.push({ index: i, type: 'lesson', start: toTime(start), end: toTime(end), durationMinutes: duration })
    cursorMinutes = end

    if (i < config.periodsCount) {
      const isLunchSlot = config.hasLunchBreak && i === config.lunchAfterPeriod
      const breakDuration = isLunchSlot ? config.lunchDurationMinutes : config.breakDurationMinutes
      const breakStart = cursorMinutes
      const breakEnd = breakStart + breakDuration
      periods.push({
        index: i,
        type: 'break',
        start: toTime(breakStart),
        end: toTime(breakEnd),
        durationMinutes: breakDuration,
      })
      cursorMinutes = breakEnd
    }
  }

  return periods
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
