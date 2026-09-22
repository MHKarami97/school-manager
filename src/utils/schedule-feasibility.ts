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
 * دو دسته استثنا برای دو دلیل متفاوت وجود دارد؛ این تفکیک عمداً حفظ شده تا
 * برچسب «اجباری» فقط برای موردی به‌کار رود که واقعاً ریاضاً ناممکن است:
 *
 * - پایه اول: فارسی ۱۱ ساعت در ۵ روز دارد. هیچ درسی نمی‌تواند بدون تکرار روزانه
 *   بیش از ۵ بار در هفته جا بگیرد؛ بنابراین غیرفعال‌کردن هر دو قانون برای این
 *   پایه یک ضرورت ریاضی است، نه انتخاب کاربر.
 * - پایه دوم: بالاترین ساعت هفتگی (ریاضی = ۵ ساعت) دقیقاً با ۵ روز هفته برابر
 *   است و از نظر ریاضی چیدمان بدون تکرار ممکن است؛ اما به‌درخواست کاربر و به
 *   دلیل تنگی فضای چیدمان (فارسی‌خوانی/انشا/املا/قرآن هم‌زمان)، همین دو قانون
 *   برای پایه دوم هم به‌صورت عملیاتی (نه اجباری ریاضی) غیرفعال شده است.
 */
export function mandatoryRuleOverrides(levelId: LevelId | null, grades: number[]): Partial<RuleToggles> {
  if (levelId === 'elementary' && (grades.includes(1) || grades.includes(2))) {
    return { noSameDayRepeat: false, noSameColumnRepeat: false }
  }
  return {}
}


export function firstGradeRuleExplanation(levelId: LevelId, grade: number): string | null {
  if (levelId !== 'elementary') return null

  if (grade === 1) {
    const curriculum = getCurriculumForGrade(levelId, grade)
    return `پایه اول ${curriculum['persian-reading'] ?? 0} ساعت فارسی دارد و انشا/املا ندارد؛ بنابراین دو قانون «عدم تکرار در روز» و «عدم تکرار در یک شماره‌زنگ هفته» فقط برای قابل‌ساخت‌بودن این پایه به‌صورت خودکار غیرفعال شده‌اند. این یک ضرورت ریاضی است.`
  }

  if (grade === 2) {
    return `برای پایه دوم، دو قانون «عدم تکرار در روز» و «عدم تکرار در یک شماره‌زنگ هفته» غیرفعال شده‌اند؛ برخلاف پایه اول، این مورد یک ضرورت ریاضی نیست (بالاترین ساعت هفتگی این پایه ۵ ساعت است و در ۵ روز بدون تکرار هم قابل‌چیدمان است)، بلکه برای انعطاف بیشتر چیدمان در حالت انتخاب دستی ورزش انتخاب شده است.`
  }

  return null
}