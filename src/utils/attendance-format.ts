import type { Student } from '@/types'

export function studentFullName(student: Student | undefined): string {
  return student ? `${student.firstName} ${student.lastName}`.trim() : 'دانش‌آموز حذف‌شده'
}

export function sortByName<T>(items: T[], nameOf: (item: T) => string): T[] {
  return items.slice().sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fa'))
}
