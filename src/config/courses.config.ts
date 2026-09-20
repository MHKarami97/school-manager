import type { CourseDefinition } from '@/types'

/**
 * کاتالوگ پایه درس‌ها. قابل ویرایش/افزودن است.
 * quran-first: همیشه باید در زنگ اول روز قرار بگیرد (استثنای تکرار).
 * sport-fixed: می‌تواند مطابق برنامه مشخص مدرسه پشت سرهم باشد (استثنای تکرار).
 */
export const BASE_COURSES: CourseDefinition[] = [
  { id: 'quran', name: 'قرآن', specialRule: 'quran-first', color: '#16a34a' },
  { id: 'heaven-gifts', name: 'هدیه‌های آسمان', specialRule: 'none', color: '#0ea5e9' },
  { id: 'persian-writing', name: 'انشای فارسی', specialRule: 'none', color: '#6366f1' },
  { id: 'dictation', name: 'املا', specialRule: 'none', color: '#8b5cf6' },
  { id: 'persian-reading', name: 'فارسی (خواندن و درک مطلب)', specialRule: 'none', color: '#a855f7' },
  { id: 'social-studies', name: 'مطالعات اجتماعی', specialRule: 'none', color: '#f59e0b' },
  { id: 'art', name: 'هنر (نقاشی، خطاطی، کاردستی)', specialRule: 'none', color: '#ec4899' },
  { id: 'science', name: 'علوم تجربی و بهداشت', specialRule: 'none', color: '#14b8a6' },
  { id: 'math', name: 'ریاضی', specialRule: 'none', color: '#2563eb' },
  { id: 'sport', name: 'ورزش', specialRule: 'sport-fixed', color: '#dc2626' },
  { id: 'thinking-research', name: 'تفکر و پژوهش', specialRule: 'none', color: '#0891b2' },
  { id: 'work-tech', name: 'کار و فناوری', specialRule: 'none', color: '#65a30d' },
  { id: 'arabic', name: 'عربی', specialRule: 'none', color: '#7c3aed' },
  { id: 'religious-education', name: 'دینی و قرآن', specialRule: 'quran-first', color: '#16a34a' },
  { id: 'literature', name: 'ادبیات فارسی', specialRule: 'none', color: '#9333ea' },
  { id: 'english', name: 'زبان انگلیسی', specialRule: 'none', color: '#0284c7' },
  { id: 'chemistry', name: 'شیمی', specialRule: 'none', color: '#ca8a04' },
  { id: 'physics', name: 'فیزیک', specialRule: 'none', color: '#4338ca' },
  { id: 'biology', name: 'زیست‌شناسی', specialRule: 'none', color: '#059669' },
  { id: 'geography', name: 'جغرافیا', specialRule: 'none', color: '#d97706' },
  { id: 'history', name: 'تاریخ', specialRule: 'none', color: '#b45309' },
  { id: 'social-skills', name: 'مهارت‌های زندگی و حرفه و فناوری', specialRule: 'none', color: '#0d9488' },
  { id: 'statistics-probability', name: 'آمار و احتمال', specialRule: 'none', color: '#1d4ed8' },
]

export function findCourse(courses: CourseDefinition[], id: string): CourseDefinition | undefined {
  return courses.find((c) => c.id === id)
}
