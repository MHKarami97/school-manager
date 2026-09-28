import type {
  DifficultyLevel,
  Exam,
  ExamTemplate,
  ExamTemplateRule,
  Question,
  QuestionType,
} from '../types'

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'multiple-choice': 'تستی',
  essay: 'تشریحی',
  'fill-blank': 'جای‌خالی',
  'true-false': 'صحیح/غلط',
}

export const QUESTION_TYPES: QuestionType[] = ['multiple-choice', 'essay', 'fill-blank', 'true-false']

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'آسان',
  medium: 'متوسط',
  hard: 'سخت',
}

export const DIFFICULTIES: DifficultyLevel[] = ['easy', 'medium', 'hard']

export const DIFFICULTY_BADGE_CLASSES: Record<DifficultyLevel, string> = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  hard: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function createEmptyQuestion(): Question {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '0',
    courseId: '',
    grade: 1,
    difficulty: 'medium',
    tags: [],
    suggestedScore: 1,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyExam(): Exam {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    courseId: '',
    grade: 1,
    date: '',
    durationMinutes: 60,
    questionRefs: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyExamTemplateRule(): ExamTemplateRule {
  return {
    id: crypto.randomUUID(),
    difficulty: 'medium',
    count: 3,
    tag: null,
  }
}

export function createEmptyExamTemplate(): ExamTemplate {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    courseId: '',
    grade: 1,
    rules: [createEmptyExamTemplateRule()],
    createdAt: now,
    updatedAt: now,
  }
}
