import {
  getCurriculumForGrade,
  totalWeeklyHours,
} from "@/config/curriculum.config";
import type { LevelId, ShiftTimeConfig, RuleToggles } from "@/types";

export interface GradeScheduleFeasibility {
  grade: number;
  requiredHours: number;
  availableSlots: number;
  isOverCapacity: boolean;
  isUnderCapacity: boolean;
  recommendedPeriodsPerDay: number;
  message: string | null;
}

export function analyzeGradeScheduleFeasibility(
  levelId: LevelId,
  grade: number,
  shiftConfig: ShiftTimeConfig,
): GradeScheduleFeasibility {
  const requiredHours = totalWeeklyHours(levelId, grade);
  const availableSlots = shiftConfig.periodsCount * 5;
  const recommendedPeriodsPerDay = Math.ceil(requiredHours / 5);
  const isOverCapacity = requiredHours > availableSlots;
  const isUnderCapacity = requiredHours < availableSlots;

  let message: string | null = null;
  if (isOverCapacity) {
    message = `پایه ${grade}: طبق جدول ساعات درسی، ${requiredHours} ساعت در هفته نیاز دارد اما با ${shiftConfig.periodsCount} زنگ در روز فقط ${availableSlots} خانه در هفته وجود دارد. حداقل ${recommendedPeriodsPerDay} زنگ در روز لازم است.`;
  } else if (isUnderCapacity) {
    message = `پایه ${grade}: ${requiredHours} ساعت درسی در هفته دارد، اما برنامه فعلی ${availableSlots} خانه دارد؛ ${availableSlots - requiredHours} خانه ناگزیر خالی می‌ماند مگر «فعالیت تکمیلی» تعریف شود.`;
  }

  return {
    grade,
    requiredHours,
    availableSlots,
    isOverCapacity,
    isUnderCapacity,
    recommendedPeriodsPerDay,
    message,
  };
}

const ELEMENTARY_EXEMPT_GRADES = [1, 2] as const;

function isExemptGrade(levelId: LevelId | null, grade: number): boolean {
  return (
    levelId === "elementary" &&
    (ELEMENTARY_EXEMPT_GRADES as readonly number[]).includes(grade)
  );
}

/**
 * override واقعیِ per-grade. مستقل از این‌که چه پایه‌های دیگری هم‌زمان انتخاب
 * شده‌اند، همیشه فقط برای خودِ این پایه (۱ یا ۲) اعمال می‌شود. این تابع باید در
 * generate-schedule.ts به‌ازای هر پایه جداگانه صدا زده شود، نه یک‌بار برای کل
 * دسته‌ی انتخاب‌شده.
 */
export function mandatoryRuleOverridesForGrade(
  levelId: LevelId | null,
  grade: number,
): Partial<RuleToggles> {
  if (isExemptGrade(levelId, grade)) {
    return { noSameDayRepeat: false, noSameColumnRepeat: false };
  }
  return {};
}

/**
 * override در سطح UI/Store. توگل فقط وقتی به‌طور کامل قفل می‌شود که همه‌ی
 * پایه‌های انتخاب‌شده مستثنا باشند (فقط ۱ و/یا ۲). اگر ترکیبی از پایه‌های
 * مستثنا و غیرمستثنا انتخاب شده (مثلاً ۱،۲،۳،۴)، این تابع دیگر توگل را قفل
 * نمی‌کند؛ استثنای واقعی فقط در چیدمان داخلی پایه‌های ۱ و ۲ از طریق
 * mandatoryRuleOverridesForGrade اعمال می‌شود، نه در کل دسته.
 */
export function mandatoryRuleOverrides(
  levelId: LevelId | null,
  grades: number[],
): Partial<RuleToggles> {
  if (grades.length === 0) return {};
  const allExempt = grades.every((g) => isExemptGrade(levelId, g));
  if (allExempt) {
    return { noSameDayRepeat: false, noSameColumnRepeat: false };
  }
  return {};
}

/**
 * پایه‌های مستثنایی که هم‌زمان با پایه‌های غیرمستثنا انتخاب شده‌اند؛ برای نمایش
 * پیام زرد هشدار در UI استفاده می‌شود. اگر همه انتخاب‌ها مستثنا باشند یا هیچ‌کدام
 * مستثنا نباشند، آرایه خالی برمی‌گردد (چون در آن حالت‌ها نیازی به توضیح ترکیبی
 * نیست).
 */
export function partialExemptGrades(
  levelId: LevelId | null,
  grades: number[],
): number[] {
  if (grades.length === 0) return [];
  const exempt = grades.filter((g) => isExemptGrade(levelId, g));
  const hasNonExempt = grades.some((g) => !isExemptGrade(levelId, g));
  return exempt.length > 0 && hasNonExempt ? exempt : [];
}

export function firstGradeRuleExplanation(
  levelId: LevelId,
  grade: number,
): string | null {
  if (levelId !== "elementary") return null;

  if (grade === 1) {
    const curriculum = getCurriculumForGrade(levelId, grade);
    return `پایه اول ${curriculum["persian-reading"] ?? 0} ساعت فارسی دارد و انشا/املا ندارد؛ بنابراین دو قانون «عدم تکرار در روز» و «عدم تکرار در یک شماره‌زنگ هفته» فقط برای قابل‌ساخت‌بودن این پایه به‌صورت خودکار غیرفعال شده‌اند. این یک ضرورت ریاضی است.`;
  }

  if (grade === 2) {
    return `برای پایه دوم، دو قانون «عدم تکرار در روز» و «عدم تکرار در یک شماره‌زنگ هفته» غیرفعال شده‌اند؛ برخلاف پایه اول، این مورد یک ضرورت ریاضی نیست (بالاترین ساعت هفتگی این پایه ۵ ساعت است و در ۵ روز بدون تکرار هم قابل‌چیدمان است)، بلکه برای انعطاف بیشتر چیدمان در حالت انتخاب دستی ورزش انتخاب شده است.`;
  }

  return null;
}
