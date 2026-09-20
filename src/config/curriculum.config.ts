import type { CurriculumMap } from '@/types'

/**
 * منابع رسمی:
 *  - دوره ابتدایی: جدول «مواد درسی و جلسات هفتگی پایه‌های دوره ابتدایی».
 *  - دوره متوسطه اول: جدول «مواد درسی و ساعات هفتگی دوره اول متوسطه» (۳۰ ساعت در هفته،
 *    یکسان برای پایه‌های هفتم، هشتم و نهم طبق سند ارجاعی؛ در صورت داشتن جدول تفکیکی هر
 *    پایه، همین فایل قابل ویرایش است).
 *  - دوره متوسطه دوم: مصوبه ۹۲۶مین جلسه شورای عالی آموزش و پرورش (۱۳۹۴/۱۲/۱۰) - «جدول مواد
 *    درسی و ساعات تدریس هفتگی دوره دوم متوسطه»، شاخه نظری / رشته علوم تجربی (پرکاربردترین
 *    رشته). سایر رشته‌ها (ریاضی‌فیزیک، ادبیات و علوم انسانی، علوم و معارف اسلامی، فنی و
 *    حرفه‌ای) در همان مصوبه موجودند و به همین شکل قابل افزودن به این فایل هستند.
 *
 * این مقادیر پیش‌فرض هستند و در صفحه تنظیمات/کد قابل ویرایش و افزودن می‌باشند.
 */
export const CURRICULUM: CurriculumMap = {
  elementary: {
    1: {
      quran: 2,
      'persian-reading': 11,
      art: 2,
      science: 3,
      math: 5,
      sport: 2,
    },
    2: {
      quran: 3,
      'heaven-gifts': 2,
      'persian-writing': 2,
      dictation: 3,
      'persian-reading': 3,
      art: 2,
      science: 3,
      math: 5,
      sport: 2,
    },
    3: {
      quran: 3,
      'heaven-gifts': 2,
      'persian-writing': 2,
      dictation: 2,
      'persian-reading': 4,
      art: 2,
      science: 3,
      math: 4,
      sport: 2,
    },
    4: {
      quran: 3,
      'heaven-gifts': 2,
      'persian-writing': 2,
      dictation: 2,
      'persian-reading': 3,
      'social-studies': 2,
      art: 2,
      science: 3,
      math: 4,
      sport: 2,
    },
    5: {
      quran: 3,
      'heaven-gifts': 2,
      'persian-writing': 2,
      dictation: 2,
      'persian-reading': 3,
      'social-studies': 3,
      art: 2,
      science: 3,
      math: 4,
      sport: 2,
    },
    6: {
      quran: 3,
      'heaven-gifts': 2,
      'persian-writing': 2,
      dictation: 1,
      'persian-reading': 2,
      'social-studies': 3,
      art: 2,
      science: 2,
      math: 4,
      sport: 2,
      'thinking-research': 1,
      'work-tech': 1,
    },
  },
  lower_secondary: {
    7: {
      quran: 2,
      'religious-education': 2,
      literature: 4,
      arabic: 2,
      english: 2,
      science: 3,
      math: 4,
      sport: 2,
      'social-studies': 3,
      art: 2,
      'work-tech': 2,
      'thinking-research': 2,
    },
    8: {
      quran: 2,
      'religious-education': 2,
      literature: 4,
      arabic: 2,
      english: 2,
      science: 3,
      math: 4,
      sport: 2,
      'social-studies': 3,
      art: 2,
      'work-tech': 2,
      'thinking-research': 2,
    },
    9: {
      quran: 2,
      'religious-education': 2,
      literature: 4,
      arabic: 2,
      english: 2,
      science: 3,
      math: 4,
      sport: 2,
      'social-studies': 3,
      art: 2,
      'work-tech': 2,
      'thinking-research': 2,
    },
  },
  upper_secondary: {
    10: {
      'religious-education': 2,
      arabic: 2,
      literature: 2,
      'persian-writing': 2,
      english: 3,
      geography: 2,
      sport: 2,
      'defense-readiness': 3,
      'thinking-research': 2,
      math: 4,
      physics: 3,
      chemistry: 3,
      biology: 3,
      'science-lab': 2,
    },
    11: {
      'religious-education': 2,
      arabic: 2,
      literature: 2,
      'persian-writing': 1,
      english: 3,
      history: 2,
      sport: 2,
      environment: 2,
      'thinking-research': 2,
      math: 4,
      physics: 3,
      chemistry: 3,
      biology: 4,
      'science-lab': 1,
      geology: 2,
    },
    12: {
      'religious-education': 2,
      arabic: 2,
      literature: 2,
      'persian-writing': 2,
      english: 4,
      'social-studies': 2,
      sport: 2,
      health: 2,
      'family-management': 2,
      math: 4,
      physics: 3,
      chemistry: 4,
      biology: 4,
    },
  },
}

export function getCurriculumForGrade(levelId: string, grade: number): Record<string, number> {
  return { ...(CURRICULUM[levelId]?.[grade] ?? {}) }
}

export function totalWeeklyHours(levelId: string, grade: number): number {
  const hours = getCurriculumForGrade(levelId, grade)
  return Object.values(hours).reduce((sum, h) => sum + h, 0)
}
