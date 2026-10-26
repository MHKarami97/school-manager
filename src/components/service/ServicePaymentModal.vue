<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/config/service.config'
import type { PaymentMethod, ServicePayment } from '@/types'
import { jalaliLabel, todayIso } from '@/utils/attendance-date'
import { feeSummary } from '@/utils/service-domain'
import { formatMoney, monthKeyLabel } from '@/utils/service-fees-export'
import MoneyInput from './MoneyInput.vue'

export interface NewPayment {
  month: string
  amount: number
  paidAt: string
  method: PaymentMethod
  note: string
}

const METHOD_KEY = 'school-manager-service-last-method'

const props = defineProps<{
  modelValue: boolean
  studentName: string
  months: string[]
  monthlyFee: number
  payments: ServicePayment[]
  errorMessage: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'add', value: NewPayment): void
  (e: 'remove', paymentId: string): void
  (e: 'set-fee', value: number): void
}>()

const storedMethod = localStorage.getItem(METHOD_KEY)
const month = ref('')
const amount = ref(0)
const paidAt = ref(todayIso())
const method = ref<PaymentMethod>(PAYMENT_METHODS.includes(storedMethod as PaymentMethod) ? (storedMethod as PaymentMethod) : 'cash')
const note = ref('')
const fee = ref(0)

const summary = computed(() => feeSummary(props.monthlyFee, props.months, props.payments))
const remainingOfSelected = computed(() => {
  const row = summary.value.months.find((item) => item.month === month.value)
  return row ? Math.max(0, row.due - row.paid) : 0
})

const STATE_TEXT = { paid: '✓ پرداخت‌شده', partial: '◐ ناقص', unpaid: '✕ پرداخت‌نشده' } as const
const STATE_CLASS = {
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  unpaid: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
} as const

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    fee.value = props.monthlyFee
    paidAt.value = todayIso()
    note.value = ''
    const firstOpen = summary.value.months.find((item) => item.state !== 'paid')
    month.value = (firstOpen ?? summary.value.months[0])?.month ?? ''
    amount.value = remainingOfSelected.value
  },
)

watch(month, () => {
  amount.value = remainingOfSelected.value
})

function close(): void {
  emit('update:modelValue', false)
}

function submit(): void {
  localStorage.setItem(METHOD_KEY, method.value)
  emit('add', { month: month.value, amount: amount.value, paidAt: paidAt.value, method: method.value, note: note.value })
  note.value = ''
}

function settle(targetMonth: string, remaining: number): void {
  localStorage.setItem(METHOD_KEY, method.value)
  emit('add', { month: targetMonth, amount: remaining, paidAt: todayIso(), method: method.value, note: '' })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <div class="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="pay-title">
        <p id="pay-title" class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">هزینه و پرداخت - {{ studentName }}</p>

        <div class="mb-4 flex flex-wrap items-end gap-2">
          <div class="min-w-40 flex-1">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="pay-fee">هزینه‌ی ماهانه‌ی این دانش‌آموز</label>
            <MoneyInput id="pay-fee" v-model="fee" />
          </div>
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" :disabled="fee === monthlyFee" @click="emit('set-fee', fee)">ذخیره‌ی هزینه</button>
        </div>

        <p class="mb-2 text-xs text-ink-600 dark:text-ink-300">
          کل: {{ formatMoney(summary.totalDue) }} - پرداخت‌شده: {{ formatMoney(summary.totalPaid) }} —
          <strong :class="summary.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">مانده: {{ formatMoney(Math.max(0, summary.balance)) }}</strong>
        </p>
        <ul class="mb-4 grid gap-1.5 sm:grid-cols-3">
          <li v-for="item in summary.months" :key="item.month" class="rounded-lg px-3 py-2 text-xs" :class="STATE_CLASS[item.state]">
            <p class="font-medium">{{ monthKeyLabel(item.month, false) }} - {{ STATE_TEXT[item.state] }}</p>
            <p class="text-11px">{{ item.paid.toLocaleString('fa-IR') }} از {{ item.due.toLocaleString('fa-IR') }}</p>
            <button v-if="item.state !== 'paid' && item.due > 0" type="button" class="mt-1 min-h-11 text-11px font-medium underline" @click="settle(item.month, item.due - item.paid)">تسویه‌ی این ماه</button>
          </li>
        </ul>

        <form class="grid gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-2 dark:border-ink-800" @submit.prevent="submit">
          <p class="text-xs font-semibold text-ink-700 sm:col-span-2 dark:text-ink-200">ثبت پرداخت جدید</p>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="pay-month">برای ماه</label>
            <select id="pay-month" v-model="month" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option v-for="item in months" :key="item" :value="item">{{ monthKeyLabel(item) }}</option></select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="pay-amount">مبلغ</label>
            <MoneyInput id="pay-amount" v-model="amount" />
          </div>
          <div>
            <p class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ پرداخت</p>
            <JalaliDatePicker v-model="paidAt" />
            <p class="mt-1 text-11px text-ink-400">{{ jalaliLabel(paidAt) }}</p>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="pay-method">روش</label>
            <select id="pay-method" v-model="method" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option v-for="item in PAYMENT_METHODS" :key="item" :value="item">{{ PAYMENT_METHOD_LABELS[item] }}</option></select>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="pay-note">یادداشت</label>
            <input id="pay-note" v-model="note" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <p v-if="errorMessage" class="text-xs text-red-600 sm:col-span-2 dark:text-red-400" role="alert">{{ errorMessage }}</p>
          <button type="submit" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 sm:col-span-2">ثبت پرداخت</button>
        </form>

        <p class="mb-1 mt-4 text-xs font-semibold text-ink-700 dark:text-ink-200">پرداخت‌های ثبت‌شده</p>
        <ul v-if="payments.length" class="space-y-1.5">
          <li v-for="payment in payments" :key="payment.id" class="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
            <span class="text-ink-700 dark:text-ink-200">
              {{ monthKeyLabel(payment.month, false) }} - {{ formatMoney(payment.amount) }} - {{ jalaliLabel(payment.paidAt) }} - {{ PAYMENT_METHOD_LABELS[payment.method] }}
              <template v-if="payment.note"> - {{ payment.note }}</template>
            </span>
            <button type="button" class="min-h-11 shrink-0 px-2 text-red-600 dark:text-red-400" @click="emit('remove', payment.id)">حذف</button>
          </li>
        </ul>
        <p v-else class="text-xs text-ink-400">پرداختی ثبت نشده است.</p>

        <div class="mt-4 flex justify-end"><button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">بستن</button></div>
      </div>
    </div>
  </Teleport>
</template>
