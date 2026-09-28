import type { BudgetCategory, Transaction } from '../types'
import { isoStringToJalaali, formatJalaaliDate, JALAALI_MONTH_NAMES } from './jalaali'

/**
 * برای پرهیز از خطای معروف جمع اعشاری در جاوااسکریپت (مثل 0.1 + 0.2)، همه‌ی
 * مبلغ‌ها همیشه به‌عنوان تومان صحیح (بدون اعشار) ذخیره و جمع می‌شوند.
 * CurrencyInput.vue هم همیشه یک عدد صحیح برمی‌گرداند، پس این تابع فقط یک
 * محافظ اضافه در برابر مقادیر ناخواسته‌ی اعشاری است.
 */
function toInt(value: number): number {
  return Math.round(value)
}

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}

export function formatToman(amount: number): string {
  return `${amount.toLocaleString('fa-IR')} تومان`
}

export function transactionsOfCategory(categoryId: string, transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.categoryId === categoryId)
}

export function spentOfCategory(categoryId: string, transactions: Transaction[]): number {
  return transactionsOfCategory(categoryId, transactions)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => toInt(sum + t.amount), 0)
}

export function incomeOfCategory(categoryId: string, transactions: Transaction[]): number {
  return transactionsOfCategory(categoryId, transactions)
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => toInt(sum + t.amount), 0)
}

/** مانده‌ی بودجه‌ی یک دسته پس از همه‌ی تراکنش‌ها: بودجه + درآمد اضافه - هزینه. */
export function remainingOfCategory(category: BudgetCategory, transactions: Transaction[]): number {
  const spent = spentOfCategory(category.id, transactions)
  const income = incomeOfCategory(category.id, transactions)
  return toInt(category.annualBudget + income - spent)
}

export function isOverBudget(category: BudgetCategory, transactions: Transaction[]): boolean {
  return remainingOfCategory(category, transactions) < 0
}

export function totalBudgetOfCategories(categories: BudgetCategory[]): number {
  return categories.reduce((sum, c) => toInt(sum + c.annualBudget), 0)
}

export function totalSpentOfPlan(planId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.planId === planId && t.type === 'expense')
    .reduce((sum, t) => toInt(sum + t.amount), 0)
}

export function totalIncomeOfPlan(planId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.planId === planId && t.type === 'income')
    .reduce((sum, t) => toInt(sum + t.amount), 0)
}

export interface CategoryDistributionSlice {
  categoryId: string
  label: string
  value: number
  color: string
}

/** توزیع هزینه‌ها بین دسته‌ها، برای نمودار دایره‌ای؛ دسته‌های بدون هزینه نمایش داده نمی‌شوند. */
export function categoryDistribution(
  categories: BudgetCategory[],
  transactions: Transaction[],
  colorOf: (index: number) => string,
): CategoryDistributionSlice[] {
  return categories
    .map((category, index) => ({
      categoryId: category.id,
      label: category.title,
      value: spentOfCategory(category.id, transactions),
      color: colorOf(index),
    }))
    .filter((slice) => slice.value > 0)
}

const SEASON_NAMES = ['بهار', 'تابستان', 'پاییز', 'زمستان']

export function seasonOfJalaliMonth(jm: number): string {
  return SEASON_NAMES[Math.floor((jm - 1) / 3)]
}

export interface PeriodTotals {
  label: string
  income: number
  expense: number
}

export function groupTransactionsByJalaliMonth(planId: string, transactions: Transaction[]): PeriodTotals[] {
  const map = new Map<string, { jy: number; jm: number; income: number; expense: number }>()
  for (const transaction of transactions) {
    if (transaction.planId !== planId || !transaction.date) continue
    const jalaali = isoStringToJalaali(transaction.date)
    if (!jalaali) continue
    const key = `${jalaali.jy}-${jalaali.jm}`
    if (!map.has(key)) map.set(key, { jy: jalaali.jy, jm: jalaali.jm, income: 0, expense: 0 })
    const bucket = map.get(key)!
    if (transaction.type === 'income') bucket.income = toInt(bucket.income + transaction.amount)
    else bucket.expense = toInt(bucket.expense + transaction.amount)
  }
  return Array.from(map.values())
    .sort((a, b) => a.jy - b.jy || a.jm - b.jm)
    .map((bucket) => ({
      label: `${JALAALI_MONTH_NAMES[bucket.jm - 1]} ${bucket.jy}`,
      income: bucket.income,
      expense: bucket.expense,
    }))
}

export function groupTransactionsBySeason(planId: string, transactions: Transaction[]): PeriodTotals[] {
  const map = new Map<string, { jy: number; seasonIndex: number; income: number; expense: number }>()
  for (const transaction of transactions) {
    if (transaction.planId !== planId || !transaction.date) continue
    const jalaali = isoStringToJalaali(transaction.date)
    if (!jalaali) continue
    const seasonIndex = Math.floor((jalaali.jm - 1) / 3)
    const key = `${jalaali.jy}-${seasonIndex}`
    if (!map.has(key)) map.set(key, { jy: jalaali.jy, seasonIndex, income: 0, expense: 0 })
    const bucket = map.get(key)!
    if (transaction.type === 'income') bucket.income = toInt(bucket.income + transaction.amount)
    else bucket.expense = toInt(bucket.expense + transaction.amount)
  }
  return Array.from(map.values())
    .sort((a, b) => a.jy - b.jy || a.seasonIndex - b.seasonIndex)
    .map((bucket) => ({
      label: `${SEASON_NAMES[bucket.seasonIndex]} ${bucket.jy}`,
      income: bucket.income,
      expense: bucket.expense,
    }))
}
