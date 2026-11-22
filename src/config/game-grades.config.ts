import type { EducationalQuestion } from '@/config/default-questions.config'

export const GAME_GRADES: readonly number[] = Array.from({ length: 12 }, (_, index) => index + 1)

const PRIMARY_CORE = ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies']
const LOWER_SECONDARY = [
  'math', 'science', 'persian-reading', 'arabic', 'english',
  'religious-education', 'social-studies', 'work-tech', 'defense-readiness',
]
const UPPER_SECONDARY = [
  'math', 'physics', 'chemistry', 'biology', 'persian-reading', 'arabic', 'english',
  'religious-education', 'geography', 'history', 'defense-readiness', 'geology', 'environment', 'health',
]

export const GAME_GRADE_COURSE_IDS: Record<number, string[]> = {
  1: ['math', 'science', 'persian-reading', 'quran'],
  2: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts'],
  3: PRIMARY_CORE,
  4: PRIMARY_CORE,
  5: PRIMARY_CORE,
  6: [...PRIMARY_CORE, 'thinking-research', 'work-tech'],
  7: LOWER_SECONDARY,
  8: LOWER_SECONDARY,
  9: LOWER_SECONDARY,
  10: UPPER_SECONDARY,
  11: UPPER_SECONDARY,
  12: UPPER_SECONDARY,
}

function fallbackQuestionFile(grade: number): string {
  if (grade <= 6) return '/data/questions/elementary-curriculum-questions.json'
  if (grade <= 9) return '/data/questions/lower-secondary-curriculum-questions.json'
  return '/data/questions/upper-secondary-curriculum-questions.json'
}

const questionCache = new Map<number, EducationalQuestion[]>()

export async function loadGradeQuestions(grade: number): Promise<EducationalQuestion[]> {
  const cached = questionCache.get(grade)
  if (cached) return cached

  const candidates = [`/data/questions/grade-${grade}.json`, fallbackQuestionFile(grade)]
  for (const url of candidates) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      const questions = (await response.json()) as EducationalQuestion[]
      if (Array.isArray(questions)) {
        questionCache.set(grade, questions)
        return questions
      }
    } catch {
      // فایل وجود ندارد یا JSON نیست؛ مسیر بعدی امتحان می‌شود
    }
  }
  return []
}

export function normalizeCourseIds(grade: number, selected: string[]): string[] {
  const allowed = GAME_GRADE_COURSE_IDS[grade] ?? []
  const kept = selected.filter((id) => allowed.includes(id))
  return kept.length > 0 ? kept : allowed.slice(0, 2)
}
