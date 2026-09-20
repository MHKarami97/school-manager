import { getCurriculumForGrade, totalWeeklyHours } from '@/config/curriculum.config'
import type { LevelId, ShiftTimeConfig, RuleToggles } from '@/types'

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

  return { grade, requiredHours, availableSlots, isOverCapacity, isUnderCapacity, recommendedPeriodsPerDay, message }
}

/**
 * پایه اول ۱۱ ساعت فارسی در پنج روز دارد؛ هر دو قانون عدم تکرار روزانه (عرضی)
 * و عدم تکرار شماره‌زنگ (طولی) برای فارسی از نظر ریاضی ناممکن هستند. این یک
 * استثنای اجباری برنامه درسی است، نه تغییر انتخابی کاربر.
 */
export function mandatoryRuleOverrides(levelId: LevelId | null, grades: number[]): Partial<RuleToggles> {
  if (levelId === 'elementary' && grades.includes(1)) {
    return { noSameDayRepeat: false, noSameColumnRepeat: false }
  }
  return {}
}

export function firstGradeRuleExplanation(levelId: LevelId, grade: number): string | null {
  if (levelId !== 'elementary' || grade !== 1) return null
  const curriculum = getCurriculumForGrade(levelId, grade)
  return `پایه اول ${curriculum['persian-reading'] ?? 0} ساعت فارسی دارد و انشا/املا ندارد؛ بنابراین دو قانون «عدم تکرار در روز» و «عدم تکرار در یک شماره‌زنگ هفته» فقط برای قابل‌ساخت‌بودن این پایه به‌صورت خودکار غیرفعال شده‌اند.`
}
