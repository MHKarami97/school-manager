export interface SinglePeriodPair {
  grade: number
  primaryCourseId: string
  secondaryCourseId: string
  /**
   * مقدار واحد مستقل هر درس پس از جداکردن نیم‌واحد مشترک. برای مثال هنر ۲.۵ واحدی
   * با نیم‌واحد تک‌زنگ، ۲ واحد مستقل دارد و ۰.۵ واحد مشترک. سیستم واحدها را با
   * واحد نیم‌زنگ مدل می‌کند و در نمایش، نیم‌واحد مشترک را در یک زنگ فیزیکی جای
   * می‌دهد.
   */
  primaryStandaloneUnits: number
  secondaryStandaloneUnits: number
  combinedHalfUnitsPerCourse: number
}

/**
 * دروس «تک‌زنگ‌ها در پایه‌های سوم تا پنجم. یک زنگ فیزیکی شامل نیم‌واحد از هر
 * درس است؛ یعنی سهم رسمی کل هر درس (مثلاً هنر ۲.۵ واحد) حفظ می‌شود، اما نصف
 * یک زنگ به‌شکل مشترک تدریس می‌گردد:
 *
 * - پایه سوم: هنر ۲ واحد مستقل + ۰.۵ مشترک، علوم ۲ واحد مستقل + ۰.۵ مشترک
 * - پایه چهارم/پنجم: هنر ۱ واحد مستقل + ۰.۵ مشترک، مطالعات ۲ واحد مستقل + ۰.۵ مشترک
 */
export const SINGLE_PERIOD_PAIRS: SinglePeriodPair[] = [
  {
    grade: 3,
    primaryCourseId: 'art',
    secondaryCourseId: 'science',
    primaryStandaloneUnits: 2,
    secondaryStandaloneUnits: 2,
    combinedHalfUnitsPerCourse: 0.5,
  },
  {
    grade: 4,
    primaryCourseId: 'art',
    secondaryCourseId: 'social-studies',
    primaryStandaloneUnits: 1,
    secondaryStandaloneUnits: 2,
    combinedHalfUnitsPerCourse: 0.5,
  },
  {
    grade: 5,
    primaryCourseId: 'art',
    secondaryCourseId: 'social-studies',
    primaryStandaloneUnits: 1,
    secondaryStandaloneUnits: 2,
    combinedHalfUnitsPerCourse: 0.5,
  },
]

export function getSinglePeriodPair(grade: number): SinglePeriodPair | undefined {
  return SINGLE_PERIOD_PAIRS.find((p) => p.grade === grade)
}
