import { getCurriculumForGrade, totalWeeklyHours } from '@/config/curriculum.config'
import type { LevelId, ShiftTimeConfig } from '@/types'

export interface GradeScheduleFeasibility {
  grade: number
  requiredHours: number
  availableSlots: number
  isOverCapacity: boolean
  isUnderCapacity: boolean
  recommendedPeriodsPerDay: number
  message: string | null
}

/**
 * اعتبارسنجی پیش از ساخت برنامه: جدول رسمی ساعات هر پایه با تعداد زنگ‌های انتخابی
 * مقایسه می‌شود. موتور هرگز نباید مسئله‌ای را که ریاضاً غیرممکن است، به‌صورت
 * برنامه‌ای با خانه‌های خالی/ساعت‌های جاافتاده به کاربر تحویل دهد.
 */
export function analyzeGradeScheduleFeasibility(
  levelId: LevelId,
  grade: number,
  shiftConfig: ShiftTimeConfig,
): GradeScheduleFeasibility {
  const requiredHours = totalWeeklyHours(levelId, grade)
  const availableSlots = shiftConfig.periodsCount * 5
  const recommendedPeriodsPerDay = Math.ceil(requiredHours / 5)
  const isOverCapacity = requiredHours > availableSlots
  const isUnderCapacity = requiredHours < availableSlots

  let message: string | null = null
  if (isOverCapacity) {
    message = `پایه ${grade}: طبق جدول ساعات درسی، ${requiredHours} ساعت در هفته نیاز دارد اما با ${shiftConfig.periodsCount} زنگ در روز فقط ${availableSlots} خانه در هفته وجود دارد. حداقل ${recommendedPeriodsPerDay} زنگ در روز لازم است.`
  } else if (isUnderCapacity) {
    message = `پایه ${grade}: ${requiredHours} ساعت درسی در هفته دارد، اما برنامه فعلی ${availableSlots} خانه دارد؛ ${availableSlots - requiredHours} خانه ناگزیر خالی می‌ماند مگر «فعالیت تکمیلی» تعریف شود.`
  }

  return { requiredHours, availableSlots, isOverCapacity, isUnderCapacity, recommendedPeriodsPerDay, message }
}

/** پایه اول ۱۱ ساعت فارسی دارد؛ پس منع تکرار یک درس در روز برای آن از نظر ریاضی ناممکن است. */
export function mustDisableSameDayRepeat(levelId: LevelId, grade: number): boolean {
  return levelId === 'elementary' && grade === 1
}

/**
 * در پایه اول فارسی تنها درس فارسی است؛ انشا و املا وجود ندارند. این تابع صرفاً
 * برای قراردادن علت در رابط کاربری استفاده می‌شود.
 */
export function firstGradeRuleExplanation(levelId: LevelId, grade: number): string | null {
  if (!mustDisableSameDayRepeat(levelId, grade)) return null
  const curriculum = getCurriculumForGrade(levelId, grade)
  return `پایه اول ${curriculum['persian-reading'] ?? 0} ساعت فارسی دارد و انشا/املا ندارد؛ بنابراین قانون «عدم تکرار یک درس در یک روز» به‌صورت خودکار غیرفعال شده تا برنامه قابل ساخت باشد.`
}
