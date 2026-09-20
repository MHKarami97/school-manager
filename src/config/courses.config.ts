import type { CourseDefinition } from '@/types'

/**
 * کاتالوگ پایه درس‌ها. قابل ویرایش/افزودن است.
 * quran-first: همیشه باید در زنگ اول روز قرار بگیرد (استثنای تکرار).
 * sport-fixed: می‌تواند مطابق برنامه مشخص مدرسه پشت سرهم باشد (استثنای تکرار).
 */
export const BASE_COURSES: CourseDefinition[] = [
  { id: 'quran', name: 'قرآن', specialRule: 'quran-first', color: '#16a34a' },
  { id: 'heaven-gifts', name: 'هدیه‌های آسمان', specialRule: 'none', color: '#0ea5e9' },
  { id: 'persian-writing', name: 'انشا و نگارش', specialRule: 'none', color: '#6366f1' },
  { id: 'dictation', name: 'املا', specialRule: 'none', color: '#8b5cf6' },
  { id: 'persian-reading', name: 'فارسی (خواندن و درک مطلب)', specialRule: 'none', color: '#a855f7' },
  { id: 'social-studies', name: 'مطالعات اجتماعی', specialRule: 'none', color: '#f59e0b' },
  { id: 'art', name: 'فرهنگ و هنر', specialRule: 'none', color: '#ec4899' },
  { id: 'science', name: 'علوم تجربی و بهداشت', specialRule: 'none', color: '#14b8a6' },
  { id: 'math', name: 'ریاضی', specialRule: 'none', color: '#2563eb' },
  { id: 'sport', name: 'تربیت بدنی و سلامت', specialRule: 'sport-fixed', color: '#dc2626' },
  { id: 'thinking-research', name: 'تفکر و سواد رسانه‌ای / پژوهش', specialRule: 'none', color: '#0891b2' },
  { id: 'work-tech', name: 'کار و فناوری', specialRule: 'none', color: '#65a30d' },
  { id: 'arabic', name: 'عربی', specialRule: 'none', color: '#7c3aed' },
  { id: 'religious-education', name: 'معارف اسلامی / تعلیمات دینی', specialRule: 'quran-first', color: '#15803d' },
  { id: 'literature', name: 'زبان و ادبیات فارسی', specialRule: 'none', color: '#9333ea' },
  { id: 'english', name: 'زبان خارجی', specialRule: 'none', color: '#0284c7' },
  { id: 'chemistry', name: 'شیمی', specialRule: 'none', color: '#ca8a04' },
  { id: 'physics', name: 'فیزیک', specialRule: 'none', color: '#4338ca' },
  { id: 'biology', name: 'زیست‌شناسی', specialRule: 'none', color: '#059669' },
  { id: 'geography', name: 'جغرافیا و استان‌شناسی', specialRule: 'none', color: '#d97706' },
  { id: 'history', name: 'تاریخ معاصر', specialRule: 'none', color: '#b45309' },
  { id: 'social-skills', name: 'مهارت‌های زندگی و حرفه و فناوری', specialRule: 'none', color: '#0d9488' },
  { id: 'statistics-probability', name: 'آمار و احتمال', specialRule: 'none', color: '#1d4ed8' },
  { id: 'defense-readiness', name: 'آمادگی دفاعی', specialRule: 'none', color: '#7f1d1d' },
  { id: 'environment', name: 'انسان و محیط‌زیست', specialRule: 'none', color: '#16a34a' },
  { id: 'health', name: 'سلامت و بهداشت', specialRule: 'none', color: '#0d9488' },
  { id: 'family-management', name: 'مدیریت خانواده و سبک زندگی', specialRule: 'none', color: '#be185d' },
  { id: 'science-lab', name: 'آزمایشگاه علوم تجربی', specialRule: 'none', color: '#0f766e' },
  { id: 'geology', name: 'زمین‌شناسی', specialRule: 'none', color: '#78350f' },
]

export function findCourse(courses: CourseDefinition[], id: string): CourseDefinition | undefined {
  return courses.find((c) => c.id === id)
}
