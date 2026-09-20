import type { Level } from '@/types'

export const LEVELS: Level[] = [
  { id: 'elementary', name: 'ابتدایی', grades: [1, 2, 3, 4, 5, 6], schedulingMode: 'single-teacher' },
  { id: 'lower_secondary', name: 'متوسطه اول', grades: [7, 8, 9], schedulingMode: 'subject-teachers' },
  { id: 'upper_secondary', name: 'متوسطه دوم', grades: [10, 11, 12], schedulingMode: 'subject-teachers' },
]

export function getLevelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function gradeLabel(grade: number): string {
  const map: Record<number, string> = {
    1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم',
    7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم', 11: 'یازدهم', 12: 'دوازدهم',
  }
  return map[grade] ?? String(grade)
}
