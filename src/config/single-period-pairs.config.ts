export interface SinglePeriodPair {
  grade: number
  primaryCourseId: string
  secondaryCourseId: string
}

/**
 * دروس «تک‌زنگ»: در برخی پایه‌های ابتدایی، یک زنگ به‌طور مشترک بین دو درس
 * تقسیم می‌شود (نیمه‌نیمه در همان جلسه یا هفته‌درمیان) تا هر دو درس در همان یک
 * زنگ فیزیکی جا بگیرند. یک ساعت از سهم هفتگی هرکدام از این دو درس، به‌جای یک
 * زنگ کامل جداگانه، در همین یک زنگ مشترک تدریس می‌شود.
 *
 * منبع: مشخصات ارسالی کاربر برای دوره ابتدایی. پایه‌های اول، دوم و ششم اصلاً
 * درس تک‌زنگ ندارند.
 */
export const SINGLE_PERIOD_PAIRS: SinglePeriodPair[] = [
  { grade: 3, primaryCourseId: 'art', secondaryCourseId: 'science' },
  { grade: 4, primaryCourseId: 'art', secondaryCourseId: 'social-studies' },
  { grade: 5, primaryCourseId: 'art', secondaryCourseId: 'social-studies' },
]

export function getSinglePeriodPair(grade: number): SinglePeriodPair | undefined {
  return SINGLE_PERIOD_PAIRS.find((p) => p.grade === grade)
}
