import type { Teacher } from '@/types'

/**
 * نام معلم را به‌همراه پیشوند «آقای»/«خانم» بر اساس جنسیت ثبت‌شده برمی‌گرداند؛
 * اگر جنسیتی ثبت نشده باشد، فقط نام خام بازگردانده می‌شود. این تابع در هر جای
 * برنامه (جدول، ویرایشگر، خروجی چاپی) که نام معلم نمایش داده می‌شود استفاده شود
 * تا رفتار همه‌جا یکسان باشد.
 */
export function formatTeacherName(teacher: Teacher | null | undefined): string {
  if (!teacher) return ''
  if (teacher.gender === 'male') return `آقای ${teacher.name}`
  if (teacher.gender === 'female') return `خانم ${teacher.name}`
  return teacher.name
}
