import type { CourseDefinition, DifficultyLevel, Question } from '../types'
import { BASE_COURSES } from '../config/courses.config'
import { LEVELS } from '../config/levels.config'
import { getCurriculumForGrade } from '../config/curriculum.config'

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

/**
 * تگ‌ها را جدا می‌کند؛ هم با ویرگول انگلیسی «,» و هم ویرگول فارسی «،»
 * (همانی که با کیبورد فارسی تایپ می‌شود) کار می‌کند.
 */
export function parseTagsInput(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * فقط درس‌هایی را برمی‌گرداند که طبق سرفصل موجود پروژه (curriculum.config.ts)
 * برای آن پایه/مقطع تعریف شده‌اند. اگر پایه به هیچ مقطعی تعلق نداشت یا
 * سرفصلی برایش ثبت نشده بود، برای اینکه فرم بن‌بست نشود، همه‌ی درس‌ها را
 * برمی‌گرداند.
 */
export function coursesAllowedForGrade(grade: number): CourseDefinition[] {
  const levelId = LEVELS.find((level) => level.grades.includes(grade))?.id
  if (!levelId) return BASE_COURSES

  const curriculum = getCurriculumForGrade(levelId, grade)
  const allowedIds = new Set(Object.keys(curriculum))
  const filtered = BASE_COURSES.filter((course) => allowedIds.has(course.id))
  return filtered.length ? filtered : BASE_COURSES
}
