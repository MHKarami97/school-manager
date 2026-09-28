<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useAnnualPlansStore } from '../stores/annual-plans'
import { useBudgetCategoriesStore } from '../stores/budget-categories'
import { useTransactionsStore } from '../stores/transactions'
import {
  ANNUAL_PLAN_STATUS_LABELS,
  ANNUAL_PLAN_STATUS_BADGE_CLASSES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
  categoryColor,
  createEmptyAnnualPlan,
  createEmptyBudgetCategory,
  createEmptyTransaction,
} from '../config/budget.config'
import {
  categoryDistribution,
  groupTransactionsByJalaliMonth,
  groupTransactionsBySeason,
  isOverBudget,
  jalaaliDateLabel,
  remainingOfCategory,
  spentOfCategory,
  totalBudgetOfCategories,
  totalIncomeOfPlan,
  totalSpentOfPlan,
} from '../utils/budget-helpers'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import CapacityBar from '../components/extra-classes/CapacityBar.vue'
import PieChart from '../components/budget/PieChart.vue'
import MonthlyComparisonChart from '../components/budget/MonthlyComparisonChart.vue'
import TransactionFormModal from '../components/budget/TransactionFormModal.vue'
import PrintableBudgetReport from '../components/budget/PrintableBudgetReport.vue'
import CurrencyInput from '../components/CurrencyInput.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import type { BudgetCategory, Transaction, TransactionType } from '../types'

const annualPlansStore = useAnnualPlansStore()
const categoriesStore = useBudgetCategoriesStore()
const transactionsStore = useTransactionsStore()

onMounted(async () => {
  await Promise.all([annualPlansStore.loadFromDb(), categoriesStore.loadFromDb(), transactionsStore.loadFromDb()])
  if (!selectedPlanId.value && annualPlansStore.items.length) {
    selectedPlanId.value = annualPlansStore.items[0].id
  }
})

const selectedPlanId = ref('')
const selectedPlan = computed(() => annualPlansStore.items.find((p) => p.id === selectedPlanId.value) ?? null)

// --- ساخت پلن سالانه جدید --------------------------------------------------
const isAddingPlan = ref(false)
const newPlanYear = ref('')
const newPlanBudget = ref(0)

async function addPlan(): Promise<void> {
  if (!newPlanYear.value.trim()) return
  const plan = createEmptyAnnualPlan()
  plan.academicYear = newPlanYear.value.trim()
  plan.totalBudget = newPlanBudget.value
  await annualPlansStore.save(plan)
  selectedPlanId.value = plan.id
  newPlanYear.value = ''
  newPlanBudget.value = 0
  isAddingPlan.value = false
}

async function toggleClosePlan(): Promise<void> {
  if (!selectedPlan.value) return
  await annualPlansStore.save({
    ...selectedPlan.value,
    status: selectedPlan.value.status === 'active' ? 'closed' : 'active',
  })
}

async function updatePlanBudget(value: number): Promise<void> {
  if (!selectedPlan.value) return
  await annualPlansStore.save({ ...selectedPlan.value, totalBudget: value })
}

// --- دسته‌های بودجه --------------------------------------------------
const planCategories = computed(() => (selectedPlan.value ? categoriesStore.byPlan(selectedPlan.value.id) : []))
const planTransactions = computed(() => (selectedPlan.value ? transactionsStore.byPlan(selectedPlan.value.id) : []))

const newCategoryTitle = ref('')
const newCategoryBudget = ref(0)

async function addCategory(): Promise<void> {
  if (!selectedPlan.value || !newCategoryTitle.value.trim()) return
  const category = createEmptyBudgetCategory(selectedPlan.value.id)
  category.title = newCategoryTitle.value.trim()
  category.annualBudget = newCategoryBudget.value
  await categoriesStore.save(category)
  newCategoryTitle.value = ''
  newCategoryBudget.value = 0
}

async function removeCategory(id: string): Promise<void> {
  if (!confirm('این دسته حذف شود؟ تراکنش‌های آن حذف نمی‌شوند اما بدون دسته باقی می‌مانند.')) return
  await categoriesStore.remove(id)
}

const overBudgetCategories = computed(() => planCategories.value.filter((c) => isOverBudget(c, planTransactions.value)))

// --- نمودار دایره‌ای توزیع هزینه --------------------------------------------------
const distribution = computed(() => categoryDistribution(planCategories.value, planTransactions.value, categoryColor))

// --- مقایسه ماهانه/فصلی --------------------------------------------------
const comparisonMode = ref<'month' | 'season'>('month')
const comparisonPeriods = computed(() =>
  !selectedPlan.value
    ? []
    : comparisonMode.value === 'month'
      ? groupTransactionsByJalaliMonth(selectedPlan.value.id, planTransactions.value)
      : groupTransactionsBySeason(selectedPlan.value.id, planTransactions.value),
)

// --- فیلتر جدول تراکنش‌ها --------------------------------------------------
const categoryFilter = ref('all')
const typeFilter = ref<'all' | TransactionType>('all')
const dateFrom = ref('')
const dateTo = ref('')

const filteredTransactions = computed(() =>
  planTransactions.value
    .filter((t) => categoryFilter.value === 'all' || t.categoryId === categoryFilter.value)
    .filter((t) => typeFilter.value === 'all' || t.type === typeFilter.value)
    .filter((t) => !dateFrom.value || t.date >= dateFrom.value)
    .filter((t) => !dateTo.value || t.date <= dateTo.value)
    .sort((a, b) => b.date.localeCompare(a.date)),
)

function categoryTitle(categoryId: string): string {
  return planCategories.value.find((c) => c.id === categoryId)?.title ?? '—'
}

// --- ثبت/ویرایش تراکنش --------------------------------------------------
const activeTransaction = ref<Transaction | null>(null)
const isTransactionModalOpen = ref(false)

function openNewTransaction(): void {
  if (!selectedPlan.value || !planCategories.value.length) return
  activeTransaction.value = createEmptyTransaction(selectedPlan.value.id, planCategories.value[0].id)
  isTransactionModalOpen.value = true
}

function openTransaction(transaction: Transaction): void {
  activeTransaction.value = transaction
  isTransactionModalOpen.value = true
}

async function saveTransaction(transaction: Transaction): Promise<void> {
  await transactionsStore.save(transaction)
}

async function deleteTransaction(id: string): Promise<void> {
  await transactionsStore.remove(id)
}

// --- چاپ / PDF --------------------------------------------------
const isPrinting = ref(false)

async function handlePrint(): Promise<void> {
  isPrinting.value = true
  await nextTick()
  printPage()
  window.addEventListener('afterprint', () => { isPrinting.value = false }, { once: true })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">بودجه و برنامه مالی سالیانه</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ annualPlansStore.items.length }} سال تحصیلی ثبت‌شده</p>
        </div>
        <button
          type="button"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          @click="isAddingPlan = !isAddingPlan"
        >
          + سال تحصیلی جدید
        </button>
      </div>

      <div v-if="isAddingPlan" class="mb-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 print:hidden">
        <div class="flex flex-wrap gap-2">
          <input
            v-model="newPlanYear"
            type="text"
            placeholder="سال تحصیلی، مثلاً ۱۴۰۴-۱۴۰۵"
            class="min-w-160px flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          />
          <div class="w-48">
            <CurrencyInput v-model="newPlanBudget" placeholder="مجموع بودجه هدف" />
          </div>
          <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addPlan">
            ثبت
          </button>
        </div>
      </div>

      <div v-if="!annualPlansStore.items.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center print:hidden dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز سال تحصیلی/بودجه‌ای ثبت نشده است.</p>
      </div>

      <template v-else>
        <div class="mb-4 flex flex-wrap items-center gap-3 print:hidden">
          <select
            v-model="selectedPlanId"
            class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          >
            <option v-for="plan in annualPlansStore.items" :key="plan.id" :value="plan.id">{{ plan.academicYear }}</option>
          </select>
          <span
            v-if="selectedPlan"
            class="rounded-full px-2.5 py-1 text-11px font-medium"
            :class="ANNUAL_PLAN_STATUS_BADGE_CLASSES[selectedPlan.status]"
          >
            {{ ANNUAL_PLAN_STATUS_LABELS[selectedPlan.status] }}
          </span>
          <button
            v-if="selectedPlan"
            type="button"
            class="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
            @click="toggleClosePlan"
          >
            {{ selectedPlan.status === 'active' ? 'بستن سال مالی' : 'بازگشایی سال مالی' }}
          </button>
          <button
            v-if="selectedPlan"
            type="button"
            class="mr-auto rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
            @click="handlePrint"
          >
            چاپ / خروجی PDF گزارش سالانه
          </button>
        </div>

        <template v-if="selectedPlan">
          <!-- KPI ها -->
          <div class="mb-4 grid grid-cols-2 gap-3 print:hidden sm:grid-cols-4">
            <div class="rounded-2xl border border-ink-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-900">
              <p class="text-11px text-ink-400 dark:text-ink-500">بودجه کل (هدف)</p>
              <div class="mt-1">
                <CurrencyInput :model-value="selectedPlan.totalBudget" @update:model-value="updatePlanBudget" />
              </div>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-900">
              <p class="text-11px text-ink-400 dark:text-ink-500">مجموع بودجه دسته‌ها</p>
              <p class="mt-1 text-sm font-bold text-ink-800 dark:text-ink-200">{{ totalBudgetOfCategories(planCategories).toLocaleString('fa-IR') }}</p>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-900">
              <p class="text-11px text-ink-400 dark:text-ink-500">مجموع هزینه</p>
              <p class="mt-1 text-sm font-bold text-red-600 dark:text-red-400">{{ totalSpentOfPlan(selectedPlan.id, planTransactions).toLocaleString('fa-IR') }}</p>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-900">
              <p class="text-11px text-ink-400 dark:text-ink-500">مجموع درآمد</p>
              <p class="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ totalIncomeOfPlan(selectedPlan.id, planTransactions).toLocaleString('fa-IR') }}</p>
            </div>
          </div>

          <div
            v-if="overBudgetCategories.length"
            class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700 print:hidden dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300"
          >
            <p class="mb-1 font-semibold">هشدار عبور از بودجه</p>
            <p v-for="category in overBudgetCategories" :key="category.id">
              دسته «{{ category.title }}» {{ Math.abs(remainingOfCategory(category, planTransactions)).toLocaleString('fa-IR') }} تومان بیشتر از بودجه‌ی پیش‌بینی‌شده هزینه کرده است.
            </p>
          </div>

          <!-- نمودار دایره‌ای توزیع هزینه -->
          <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 print:hidden dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">توزیع هزینه‌ها بین دسته‌ها</p>
            <PieChart :slices="distribution" />
          </div>

          <!-- مقایسه ماهانه/فصلی -->
          <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 print:hidden dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">مقایسه درآمد و هزینه</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-lg px-3 py-1 text-11px font-medium transition"
                  :class="comparisonMode === 'month' ? 'bg-brand-600 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                  @click="comparisonMode = 'month'"
                >
                  ماه‌به‌ماه
                </button>
                <button
                  type="button"
                  class="rounded-lg px-3 py-1 text-11px font-medium transition"
                  :class="comparisonMode === 'season' ? 'bg-brand-600 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                  @click="comparisonMode = 'season'"
                >
                  فصل‌به‌فصل
                </button>
              </div>
            </div>
            <MonthlyComparisonChart :periods="comparisonPeriods" />
          </div>

          <!-- دسته‌های بودجه -->
          <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 print:hidden dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">دسته‌های بودجه</p>
            <div class="mb-4 flex flex-wrap gap-2">
              <input
                v-model="newCategoryTitle"
                type="text"
                placeholder="عنوان دسته، مثلاً تجهیزات"
                class="min-w-140px flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
              <div class="w-40">
                <CurrencyInput v-model="newCategoryBudget" placeholder="بودجه سالانه" />
              </div>
              <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addCategory">
                افزودن
              </button>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="category in planCategories" :key="category.id" class="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-xs font-semibold text-ink-800 dark:text-ink-200">{{ category.title }}</p>
                  <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeCategory(category.id)">حذف</button>
                </div>
                <CapacityBar :filled="spentOfCategory(category.id, planTransactions)" :total="category.annualBudget" />
                <p
                  class="mt-1.5 text-10px"
                  :class="isOverBudget(category, planTransactions) ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink-400 dark:text-ink-500'"
                >
                  مانده: {{ remainingOfCategory(category, planTransactions).toLocaleString('fa-IR') }} تومان
                </p>
              </div>
              <p v-if="!planCategories.length" class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-11px text-ink-400 sm:col-span-2 dark:border-ink-700 dark:text-ink-500">
                هنوز دسته‌ای ثبت نشده است.
              </p>
            </div>
          </div>

          <!-- جدول تراکنش‌ها -->
          <div class="mb-8 rounded-2xl border border-ink-100 bg-white p-5 print:hidden dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">تراکنش‌ها</p>
              <button
                type="button"
                class="rounded-lg bg-ink-800 px-3 py-1.5 text-11px font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-ink-700"
                :disabled="!planCategories.length"
                @click="openNewTransaction"
              >
                + تراکنش جدید
              </button>
            </div>

            <div class="mb-3 grid gap-2 sm:grid-cols-4">
              <select v-model="categoryFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option value="all">همه دسته‌ها</option>
                <option v-for="category in planCategories" :key="category.id" :value="category.id">{{ category.title }}</option>
              </select>
              <select v-model="typeFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option value="all">همه انواع</option>
                <option v-for="t in TRANSACTION_TYPES" :key="t" :value="t">{{ TRANSACTION_TYPE_LABELS[t] }}</option>
              </select>
              <JalaliDatePicker v-model="dateFrom" />
              <JalaliDatePicker v-model="dateTo" />
            </div>

            <div class="overflow-x-auto rounded-xl border border-ink-100 dark:border-ink-800">
              <table class="w-full min-w-560px text-xs">
                <thead>
                  <tr class="border-b border-ink-100 bg-ink-50 text-right text-ink-500 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-400">
                    <th class="p-2">تاریخ</th>
                    <th class="p-2">دسته</th>
                    <th class="p-2">نوع</th>
                    <th class="p-2">مبلغ</th>
                    <th class="p-2">توضیح</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="transaction in filteredTransactions"
                    :key="transaction.id"
                    class="cursor-pointer border-b border-ink-50 hover:bg-ink-50 dark:border-ink-800/60 dark:hover:bg-ink-800"
                    @click="openTransaction(transaction)"
                  >
                    <td class="p-2 text-ink-600 dark:text-ink-300">{{ jalaaliDateLabel(transaction.date) }}</td>
                    <td class="p-2 text-ink-700 dark:text-ink-200">{{ categoryTitle(transaction.categoryId) }}</td>
                    <td class="p-2" :class="transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                      {{ TRANSACTION_TYPE_LABELS[transaction.type] }}
                    </td>
                    <td class="p-2 font-medium text-ink-800 dark:text-ink-200">{{ transaction.amount.toLocaleString('fa-IR') }}</td>
                    <td class="p-2 text-ink-500 dark:text-ink-400">{{ transaction.description || '—' }}</td>
                  </tr>
                  <tr v-if="!filteredTransactions.length">
                    <td colspan="5" class="p-6 text-center text-ink-400 dark:text-ink-500">تراکنشی یافت نشد.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>

      <div v-if="isPrinting && selectedPlan" id="print-root" class="hidden print:block">
        <PrintableBudgetReport :plan="selectedPlan" :categories="planCategories" :transactions="transactionsStore.items" />
      </div>
    </div>

    <TransactionFormModal
      v-model="isTransactionModalOpen"
      :transaction="activeTransaction"
      :categories="planCategories"
      @save="saveTransaction"
      @delete="deleteTransaction"
    />
  </div>
</template>
