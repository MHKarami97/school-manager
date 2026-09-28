<script setup lang="ts">
import { computed } from 'vue'
import type { AnnualPlan, BudgetCategory, Transaction } from '../../types'
import { ANNUAL_PLAN_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../config/budget.config'
import {
  groupTransactionsByJalaliMonth,
  isOverBudget,
  jalaaliDateLabel,
  remainingOfCategory,
  spentOfCategory,
  totalIncomeOfPlan,
  totalSpentOfPlan,
} from '../../utils/budget-helpers'

const props = defineProps<{
  plan: AnnualPlan
  categories: BudgetCategory[]
  transactions: Transaction[]
}>()

const planTransactions = computed(() => props.transactions.filter((t) => t.planId === props.plan.id))
const monthlyTotals = computed(() => groupTransactionsByJalaliMonth(props.plan.id, planTransactions.value))
const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="budget-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">گزارش مالی سالانه - سال تحصیلی {{ plan.academicYear || '—' }}</h1>
        <p class="text-xs text-ink-600">
          وضعیت: {{ ANNUAL_PLAN_STATUS_LABELS[plan.status] }} - بودجه کل: {{ plan.totalBudget.toLocaleString('fa-IR') }} تومان -
          مجموع هزینه: {{ totalSpentOfPlan(plan.id, transactions).toLocaleString('fa-IR') }} تومان -
          مجموع درآمد: {{ totalIncomeOfPlan(plan.id, transactions).toLocaleString('fa-IR') }} تومان
        </p>
      </div>
      <p class="text-xs text-ink-500">{{ printDate }}</p>
    </div>

    <p class="mb-2 text-xs font-semibold">بودجه به تفکیک دسته</p>
    <table class="mb-4 w-full border-collapse text-11px">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1.5">دسته</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">بودجه پیش‌بینی‌شده</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">هزینه‌شده</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">مانده</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">وضعیت</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="category in categories" :key="category.id">
          <td class="border border-ink-400 p-1.5">{{ category.title }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ category.annualBudget.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ spentOfCategory(category.id, transactions).toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ remainingOfCategory(category, transactions).toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">
            <strong v-if="isOverBudget(category, transactions)">عبور از بودجه</strong>
            <span v-else>عادی</span>
          </td>
        </tr>
        <tr v-if="!categories.length">
          <td colspan="5" class="border border-ink-400 p-3 text-center text-ink-400">دسته‌ای ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <p class="mb-2 text-xs font-semibold">مقایسه ماهانه</p>
    <table class="mb-4 w-full border-collapse text-11px">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1.5">ماه</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">درآمد</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">هزینه</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">خالص</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="period in monthlyTotals" :key="period.label">
          <td class="border border-ink-400 p-1.5">{{ period.label }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ period.income.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ period.expense.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ (period.income - period.expense).toLocaleString('fa-IR') }}</td>
        </tr>
        <tr v-if="!monthlyTotals.length">
          <td colspan="4" class="border border-ink-400 p-3 text-center text-ink-400">تراکنشی ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <p class="mb-2 text-xs font-semibold">فهرست تراکنش‌ها</p>
    <table class="w-full border-collapse text-10px">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1.5">تاریخ</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">دسته</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">نوع</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">مبلغ</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">توضیح</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="transaction in planTransactions" :key="transaction.id">
          <td class="border border-ink-400 p-1.5 text-center">{{ jalaaliDateLabel(transaction.date) }}</td>
          <td class="border border-ink-400 p-1.5">{{ categories.find((c) => c.id === transaction.categoryId)?.title ?? '—' }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ TRANSACTION_TYPE_LABELS[transaction.type] }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ transaction.amount.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5">{{ transaction.description || '—' }}</td>
        </tr>
        <tr v-if="!planTransactions.length">
          <td colspan="5" class="border border-ink-400 p-3 text-center text-ink-400">تراکنشی ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <p class="mt-4 text-10px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
}
</style>
