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
 * ترتیب اولویت کنارگذاشتن قوانین برای یک پایه‌ی خاص، فقط در صورت نیاز واقعی.
 * موتور ابتدا با هر دو قانون فعال تلاش می‌کند؛ اگر جا نشد، اول «عرضی»
 * (noSameDayRepeat) و در نهایت «طولی» (noSameColumnRepeat) را کنار می‌گذارد.
 * برای پایه‌های غیرمستثنا آرایه خالی برمی‌گردد، یعنی Escalation انجام نمی‌شود.
 */
export function relaxableRulesForGrade(
  levelId: LevelId | null,
  grade: number,
): (keyof RuleToggles)[] {
  return isExemptGrade(levelId, grade)
    ? ["noSameDayRepeat", "noSameColumnRepeat"]
    : [];
}

/**
 * @deprecated دیگر توگل را force نمی‌کند؛ چون موتور جدید فقط در صورت نیاز
 * واقعی قانون را کنار می‌گذارد (Escalation)، نه به‌طور کامل و از پیش. برای
 * سازگاری با کدهای موجود (wizard.ts) نگه داشته شده و همیشه {} برمی‌گرداند.
 */
export function mandatoryRuleOverrides(
  _levelId: LevelId | null,
  _grades: number[],
): Partial<RuleToggles> {
  return {};
}

/**
 * @deprecated دیگر لازم نیست؛ توگل هیچ‌وقت force-لاک نمی‌شود. برای سازگاری با
 * SchedulingRulesPanel.vue نگه داشته شده و همیشه آرایه خالی برمی‌گرداند.
 */
export function partialExemptGrades(
  _levelId: LevelId | null,
  _grades: number[],
): number[] {
  return [];
}

export function firstGradeRuleExplanation(
  levelId: LevelId,
  grade: number,
): string | null {
  if (levelId !== "elementary") return null;

  if (grade === 1) {
    const curriculum = getCurriculumForGrade(levelId, grade);
    return `پایه اول ${curriculum["persian-reading"] ?? 0} ساعت فارسی دارد. موتور ابتدا سعی می‌کند بدون تکرار روزانه/طولی بچیند؛ اگر ممکن نبود، فقط به‌اندازه‌ی لازم و به‌ترتیب (اول عدم‌تکرار در روز، سپس عدم‌تکرار در شماره‌زنگ) کنار گذاشته می‌شود تا دروس تا حد امکان در طول هفته پخش بمانند.`;
  }

  if (grade === 2) {
    return `برای پایه دوم، موتور ابتدا با هر دو قانون فعال تلاش می‌کند. فقط اگر ترکیب دروس ناسازگار باشد، به همان ترتیب (اول عدم‌تکرار در روز، سپس عدم‌تکرار در شماره‌زنگ) به‌اندازه‌ی لازم کنار گذاشته می‌شود؛ نه از پیش و به‌طور کامل.`;
  }

  return null;
}
