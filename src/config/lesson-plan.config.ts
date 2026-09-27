import type { LessonPlan, LessonPlanBlock, LessonPlanSnapshot, LessonPlanStatus } from '@/types'

export const LESSON_PLAN_STATUS_LABELS: Record<LessonPlanStatus, string> = {
  draft: 'پیش‌نویس',
  final: 'نهایی‌شده',
  executed: 'اجرا شده',
}

export const LESSON_PLAN_STATUS_BADGE_CLASSES: Record<LessonPlanStatus, string> = {
  draft: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  final: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  executed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const LESSON_PLAN_STATUSES: LessonPlanStatus[] = ['draft', 'final', 'executed']

/** یک بخش خام و خالی برای شروع طرح درس جدید */
export function createEmptyLessonPlanBlock(): LessonPlanBlock {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    estimatedMinutes: 10,
  }
}

/** مجموع دقیقه‌های تخمینی تمام بخش‌های یک طرح درس */
export function totalEstimatedMinutes(blocks: LessonPlanBlock[]): number {
  return blocks.reduce((sum, block) => sum + (block.estimatedMinutes || 0), 0)
}

/** استخراج snapshot قابل‌آرشیو از یک طرح درس (بدون id و history) */
export function toLessonPlanSnapshot(plan: LessonPlan): LessonPlanSnapshot {
  return {
    title: plan.title,
    teacherId: plan.teacherId,
    courseId: plan.courseId,
    grade: plan.grade,
    levelId: plan.levelId,
    sessionDate: plan.sessionDate,
    weekNumber: plan.weekNumber,
    objectives: plan.objectives,
    teachingMethod: plan.teachingMethod,
    resources: plan.resources,
    assessment: plan.assessment,
    blocks: JSON.parse(JSON.stringify(plan.blocks)),
    status: plan.status,
  }
}
