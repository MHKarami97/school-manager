import type { Celebration, CelebrationStatus, CelebrationTask, CelebrationTaskStatus } from '../types'

export const CELEBRATION_STATUS_LABELS: Record<CelebrationStatus, string> = {
  planned: 'برنامه‌ریزی‌شده',
  'in-progress': 'در حال اجرا',
  held: 'برگزار شده',
}

export const CELEBRATION_STATUS_BADGE_CLASSES: Record<CelebrationStatus, string> = {
  planned: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  held: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const CELEBRATION_STATUSES: CelebrationStatus[] = ['planned', 'in-progress', 'held']

export const CELEBRATION_TASK_STATUS_LABELS: Record<CelebrationTaskStatus, string> = {
  todo: 'انجام‌نشده',
  'in-progress': 'در حال انجام',
  done: 'انجام‌شده',
}

export const CELEBRATION_TASK_STATUSES: CelebrationTaskStatus[] = ['todo', 'in-progress', 'done']

export function createEmptyCelebrationTask(celebrationId: string): CelebrationTask {
  return {
    id: crypto.randomUUID(),
    celebrationId,
    title: '',
    assignee: '',
    dueDate: '',
    status: 'todo',
  }
}

export function createEmptyCelebration(): Celebration {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    date: '',
    location: '',
    organizer: '',
    status: 'planned',
    tasks: [],
    budget: { estimatedCost: 0, actualCost: 0 },
    createdAt: now,
    updatedAt: now,
  }
}
