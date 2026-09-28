import type { AnnualPlan, AnnualPlanStatus, BudgetCategory, Transaction, TransactionType } from '../types'

export const ANNUAL_PLAN_STATUS_LABELS: Record<AnnualPlanStatus, string> = {
  active: 'در حال اجرا',
  closed: 'بسته‌شده',
}

export const ANNUAL_PLAN_STATUS_BADGE_CLASSES: Record<AnnualPlanStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'هزینه',
  income: 'درآمد',
}

export const TRANSACTION_TYPES: TransactionType[] = ['expense', 'income']

/** رنگ‌های چرخشی برای دسته‌های بودجه در نمودار دایره‌ای. */
export const CATEGORY_COLOR_PALETTE = [
  '#2f7bfa', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6',
  '#0ea5e9', '#ec4899', '#14b8a6', '#65a30d', '#7c3aed',
]

export function categoryColor(index: number): string {
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length]
}

export function createEmptyAnnualPlan(): AnnualPlan {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    academicYear: '',
    totalBudget: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyBudgetCategory(planId: string): BudgetCategory {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    planId,
    title: '',
    annualBudget: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyTransaction(planId: string, categoryId: string): Transaction {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    planId,
    categoryId,
    type: 'expense',
    amount: 0,
    date: '',
    description: '',
    attachmentDataUrl: null,
    createdAt: now,
    updatedAt: now,
  }
}
