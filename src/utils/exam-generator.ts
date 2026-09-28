import type { Exam, ExamQuestionRef, ExamTemplate, ExamVersion, Question } from '../types'
import { filterQuestions, pickRandom, shuffle } from './question-bank-helpers'

export interface GenerateExamResult {
  questionRefs: ExamQuestionRef[]
  warnings: string[]
}

/**
 * برای هر قانون قالب (سطح دشواری + تعداد + تگ اختیاری)، از بانک سوال به‌صورت
 * تصادفی انتخاب می‌کند؛ یک سوال در بیش از یک قانون تکرار نمی‌شود.
 */
export function generateExamFromTemplate(template: ExamTemplate, questionBank: Question[]): GenerateExamResult {
  const usedIds = new Set<string>()
  const questionRefs: ExamQuestionRef[] = []
  const warnings: string[] = []
  let order = 0

  for (const rule of template.rules) {
    const pool = filterQuestions(questionBank, {
      courseId: template.courseId || undefined,
      grade: template.grade || undefined,
      difficulty: rule.difficulty,
      tag: rule.tag ?? undefined,
    }).filter((question) => !usedIds.has(question.id))

    const picked = pickRandom(pool, rule.count)
    for (const question of picked) {
      usedIds.add(question.id)
      questionRefs.push({ questionId: question.id, score: question.suggestedScore, order })
      order += 1
    }

    if (picked.length < rule.count) {
      warnings.push(
        `برای سطح «${rule.difficulty}»${rule.tag ? ` با تگ «${rule.tag}»` : ''} فقط ${picked.length} از ${rule.count} سوال در بانک موجود بود.`,
      )
    }
  }

  return { questionRefs, warnings }
}

export function totalScoreOfExam(exam: Exam): number {
  return exam.questionRefs.reduce((sum, ref) => sum + ref.score, 0)
}

/**
 * یک نسخه‌ی شخصی‌سازی‌شده از آزمون می‌سازد: ترتیب سوالات و (برای سوالات
 * تستی) ترتیب گزینه‌ها را به‌صورت تصادفی جابه‌جا می‌کند تا هر دانش‌آموز/کلاس
 * نسخه‌ی متفاوتی داشته باشد (کاهش امکان تقلب).
 */
export function generateExamVersion(exam: Exam, label: string, questions: Question[]): ExamVersion {
  const shuffledOrder = shuffle(exam.questionRefs.map((ref) => ref.questionId))
  const optionOrders: Record<string, number[]> = {}

  for (const ref of exam.questionRefs) {
    const question = questions.find((q) => q.id === ref.questionId)
    if (question && question.type === 'multiple-choice' && question.options.length) {
      optionOrders[ref.questionId] = shuffle(question.options.map((_, index) => index))
    }
  }

  return {
    id: crypto.randomUUID(),
    examId: exam.id,
    label,
    questionOrder: shuffledOrder,
    optionOrders,
    createdAt: Date.now(),
  }
}

export function generateExamVersions(exam: Exam, count: number, questions: Question[]): ExamVersion[] {
  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    generateExamVersion(exam, `نسخه ${index + 1}`, questions),
  )
}
