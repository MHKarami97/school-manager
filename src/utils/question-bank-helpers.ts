import type { DifficultyLevel, Question } from '../types'

export interface QuestionFilters {
  courseId?: string
  grade?: number
  difficulty?: DifficultyLevel
  tag?: string
  searchText?: string
}

export function filterQuestions(questions: Question[], filters: QuestionFilters): Question[] {
  const query = filters.searchText?.trim().toLowerCase()
  return questions.filter((question) => {
    if (filters.courseId && question.courseId !== filters.courseId) return false
    if (filters.grade && question.grade !== filters.grade) return false
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false
    if (filters.tag && !question.tags.includes(filters.tag)) return false
    if (query && !question.text.toLowerCase().includes(query)) return false
    return true
  })
}

export function allTagsOf(questions: Question[]): string[] {
  const set = new Set<string>()
  for (const question of questions) {
    for (const tag of question.tags) set.add(tag)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'))
}

/** جابه‌جایی تصادفی Fisher-Yates؛ آرایه‌ی ورودی را تغییر نمی‌دهد. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pickRandom<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, Math.max(0, count))
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
