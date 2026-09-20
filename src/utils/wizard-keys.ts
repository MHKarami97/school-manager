/**
 * سازنده‌ی کلیدهای teacherSelections برای دوره‌های single-teacher (ابتدایی).
 * جدا کردن این توابع از کامپوننت‌ها، رشته‌های جادویی (magic string) را حذف می‌کند
 * و منبع واحدی برای قرارداد نام‌گذاری کلیدها فراهم می‌کند.
 */
export function mainTeacherKey(grade: number): string {
  return `main-${grade}`
}

export function sportTeacherKey(grade: number): string {
  return `sport-${grade}`
}
