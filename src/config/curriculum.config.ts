import type { CurriculumMap } from '@/types'

/**
 * منبع: جدول رسمی «مواد درسی و جلسات هفتگی پایه‌های دوره ابتدایی».
 * هر عدد، تعداد ساعت (زنگ) هفتگی آن درس برای آن پایه است.
 * این مقادیر صرفاً مقدار پیش‌فرض هستند و در صفحه تنظیمات قابل ویرایش/افزودن می‌باشند.
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
    7: { quran: 2, literature: 3, dictation: 1, arabic: 2, english: 2, 'social-studies': 2, science: 4, math: 4, sport: 2, 'work-tech': 2, art: 1 },
    8: { quran: 2, literature: 3, dictation: 1, arabic: 2, english: 2, 'social-studies': 2, science: 4, math: 4, sport: 2, 'work-tech': 2, art: 1 },
    9: { quran: 2, literature: 3, dictation: 1, arabic: 2, english: 2, 'social-studies': 2, science: 4, math: 4, sport: 2, 'work-tech': 2, art: 1 },
  },
  upper_secondary: {
    10: { quran: 2, literature: 3, arabic: 2, english: 2, math: 5, physics: 3, chemistry: 2, biology: 2, geography: 1, sport: 1 },
    11: { quran: 2, literature: 2, arabic: 2, english: 2, math: 4, physics: 3, chemistry: 3, biology: 2, sport: 1 },
    12: { quran: 2, literature: 2, arabic: 2, english: 2, math: 4, physics: 3, chemistry: 3, biology: 2, sport: 1 },
  },
}

export function getCurriculumForGrade(levelId: string, grade: number): Record<string, number> {
  return { ...(CURRICULUM[levelId]?.[grade] ?? {}) }
}

export function totalWeeklyHours(levelId: string, grade: number): number {
  const hours = getCurriculumForGrade(levelId, grade)
  return Object.values(hours).reduce((sum, h) => sum + h, 0)
}
