<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import MoneyInput from '@/components/service/MoneyInput.vue'
import ServicePaymentModal, { type NewPayment } from '@/components/service/ServicePaymentModal.vue'
import { gradeLabel } from '@/config/levels.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { useServiceDriversStore } from '@/stores/service-drivers'
import { useServicePlansStore } from '@/stores/service-plans'
import { useServiceStudentsStore } from '@/stores/service-students'
import { useStudentsStore } from '@/stores/students'
import { studentFullName } from '@/utils/attendance-format'
import { feeSummary, ServiceDomainError, type FeeSummary } from '@/utils/service-domain'
import { exportFeesToExcel, formatMoney, monthKeyLabel, type FeeExportRow } from '@/utils/service-fees-export'

type StatusFilter = 'all' | 'debtor' | 'settled' | 'no-fee'

interface FeeRow {
  studentId: string
  name: string
  grade: number
  driverId: string
  driverName: string
  fee: number
  summary: FeeSummary
}

const studentsStore = useStudentsStore()
const serviceStudents = useServiceStudentsStore()
const driversStore = useServiceDriversStore()
const plansStore = useServicePlansStore()
const { message, isError, show } = useFlashMessage(4000)

const isLoading = ref(true)
const search = ref('')
const driverFilter = ref('')
const statusFilter = ref<StatusFilter>('all')
const bulkFee = ref(0)
const activeStudentId = ref('')
const isModalOpen = ref(false)
const modalError = ref('')

const plan = computed(() => plansStore.activePlan)
const months = computed(() => plan.value?.months ?? [])

const rows = computed<FeeRow[]>(() => {
  const current = plan.value
  if (!current) return []
  const byStudent = new Map<string, typeof plansStore.payments>()
  for (const payment of plansStore.payments) {
    const list = byStudent.get(payment.studentId)
    if (list) list.push(payment)
    else byStudent.set(payment.studentId, [payment])
  }
  return plansStore.assignmentList
    .map((item): FeeRow => ({
      studentId: item.studentId,
      name: studentFullName(studentsStore.byId(item.studentId)),
      grade: studentsStore.byId(item.studentId)?.grade ?? 0,
      driverId: item.driverId,
      driverName: driversStore.byId(item.driverId)?.fullName ?? '—',
      fee: item.monthlyFee,
      summary: feeSummary(item.monthlyFee, current.months, byStudent.get(item.studentId) ?? []),
    }))
    .sort((a, b) => a.driverName.localeCompare(b.driverName, 'fa') || a.name.localeCompare(b.name, 'fa'))
})

const filtered = computed(() =>
  rows.value
    .filter((row) => (driverFilter.value ? row.driverId === driverFilter.value : true))
    .filter((row) => (search.value.trim() ? row.name.includes(search.value.trim()) : true))
    .filter((row) => {
      if (statusFilter.value === 'debtor') return row.summary.balance > 0
      if (statusFilter.value === 'settled') return row.fee > 0 && row.summary.balance <= 0
      if (statusFilter.value === 'no-fee') return row.fee === 0
      return true
    }),
)

const totals = computed(() => ({
  due: filtered.value.reduce((sum, row) => sum + row.summary.totalDue, 0),
  paid: filtered.value.reduce((sum, row) => sum + row.summary.totalPaid, 0),
  debtors: filtered.value.filter((row) => row.summary.balance > 0).length,
}))

const activeRow = computed(() => rows.value.find((row) => row.studentId === activeStudentId.value))
const activePayments = computed(() => plansStore.payments.filter((payment) => payment.studentId === activeStudentId.value))

onMounted(async () => {
  await Promise.all([studentsStore.loadFromDb(), serviceStudents.loadFromDb(), driversStore.loadFromDb(), plansStore.loadPlans()])
  isLoading.value = false
})

function openRow(studentId: string): void {
  activeStudentId.value = studentId
  modalError.value = ''
  isModalOpen.value = true
}

async function guarded(action: () => Promise<unknown>, fallback: string): Promise<boolean> {
  modalError.value = ''
  try {
    await action()
    return true
  } catch (error) {
    modalError.value = error instanceof ServiceDomainError ? error.message : fallback
    return false
  }
}

async function addPayment(payment: NewPayment): Promise<void> {
  const ok = await guarded(() => plansStore.addPayment({ studentId: activeStudentId.value, ...payment }), 'ثبت پرداخت انجام نشد.')
  if (ok) show('پرداخت ثبت شد.')
}

async function removePayment(paymentId: string): Promise<void> {
  if (!confirm('این پرداخت حذف شود؟')) return
  await guarded(() => plansStore.removePayment(paymentId), 'حذف انجام نشد.')
}

async function setFee(value: number): Promise<void> {
  const ok = await guarded(() => plansStore.setFee(activeStudentId.value, value), 'ذخیره‌ی هزینه انجام نشد.')
  if (ok) show('هزینه ذخیره شد.')
}

async function applyBulkFee(): Promise<void> {
  const targets = filtered.value
  if (!targets.length) return
  if (!confirm(`هزینه‌ی ماهانه‌ی ${targets.length.toLocaleString('fa-IR')} دانش‌آموز نمایش‌داده‌شده برابر ${formatMoney(bulkFee.value)} شود؟`)) return
  try {
    for (const row of targets) await plansStore.setFee(row.studentId, bulkFee.value)
    show('هزینه برای همه‌ی موارد نمایش‌داده‌شده اعمال شد.')
  } catch (error) {
    show(error instanceof ServiceDomainError ? error.message : 'اعمال انجام نشد.', true)
  }
}

function exportExcel(): void {
  const current = plan.value
  if (!current || !filtered.value.length) return
  const exportRows: FeeExportRow[] = filtered.value.map((row) => ({
    name: row.name,
    grade: gradeLabel(row.grade),
    driver: row.driverName,
    monthlyFee: row.fee,
    monthPaid: row.summary.months.map((item) => item.paid),
    totalPaid: row.summary.totalPaid,
    balance: row.summary.balance,
  }))
  exportFeesToExcel(current.months, exportRows, `هزینه-سرویس-${current.academicYear}`)
}

const STATE_ICON = { paid: '✓', partial: '◐', unpaid: '✕' } as const
const STATE_CLASS = {
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  unpaid: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
} as const
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">هزینه و پرداخت سرویس</h1>
          <p v-if="plan" class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ plan.title }} - سال تحصیلی {{ plan.academicYear }}</p>
        </div>
        <nav class="flex flex-wrap gap-3 text-sm text-ink-500 dark:text-ink-400">
          <RouterLink to="/service/assign" class="flex min-h-11 items-center">تخصیص</RouterLink>
          <RouterLink to="/service/drivers" class="flex min-h-11 items-center">رانندگان</RouterLink>
        </nav>
      </div>

      <p v-if="message" role="status" class="mb-3 text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>
      <p v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</p>
      <p v-else-if="!plan" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">ابتدا در صفحه‌ی «تخصیص» یک طرح سرویس بسازید.</p>

      <template v-else>
        <dl class="mb-4 grid grid-cols-3 gap-2">
          <div class="rounded-xl bg-ink-100 p-3 text-center dark:bg-ink-800"><dt class="text-11px text-ink-500 dark:text-ink-400">کل هزینه</dt><dd class="text-sm font-bold text-ink-800 dark:text-ink-200">{{ formatMoney(totals.due) }}</dd></div>
          <div class="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-900/30"><dt class="text-11px text-emerald-700 dark:text-emerald-300">پرداخت‌شده</dt><dd class="text-sm font-bold text-emerald-800 dark:text-emerald-200">{{ formatMoney(totals.paid) }}</dd></div>
          <div class="rounded-xl bg-red-50 p-3 text-center dark:bg-red-900/30"><dt class="text-11px text-red-700 dark:text-red-300">مانده ({{ totals.debtors.toLocaleString('fa-IR') }} نفر بدهکار)</dt><dd class="text-sm font-bold text-red-800 dark:text-red-200">{{ formatMoney(Math.max(0, totals.due - totals.paid)) }}</dd></div>
        </dl>

        <div class="mb-3 grid gap-2 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-3 dark:border-ink-800 dark:bg-ink-900">
          <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="fee-search">جستجو</label><input id="fee-search" v-model="search" type="search" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" /></div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="fee-driver">راننده</label>
            <select id="fee-driver" v-model="driverFilter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option value="">همه</option><option v-for="driver in driversStore.items" :key="driver.id" :value="driver.id">{{ driver.fullName }}</option></select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="fee-status">وضعیت</label>
            <select id="fee-status" v-model="statusFilter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option value="all">همه</option><option value="debtor">بدهکار</option><option value="settled">تسویه‌شده</option><option value="no-fee">بدون هزینه</option>
            </select>
          </div>
          <div class="flex items-end gap-2 sm:col-span-2">
            <div class="flex-1"><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="fee-bulk">هزینه‌ی ماهانه برای همه‌ی نمایش‌داده‌شده‌ها</label><MoneyInput id="fee-bulk" v-model="bulkFee" /></div>
            <button type="button" :disabled="!filtered.length" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="applyBulkFee">اعمال</button>
          </div>
          <div class="flex items-end"><button type="button" :disabled="!filtered.length" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200 w-full" @click="exportExcel">خروجی اکسل</button></div>
        </div>

        <p v-if="!filtered.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">{{ rows.length ? 'موردی با این فیلتر نیست.' : 'هنوز دانش‌آموزی به راننده تخصیص داده نشده است.' }}</p>
        <ul v-else class="space-y-2">
          <li v-for="row in filtered" :key="row.studentId" class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-ink-800 dark:text-ink-200">{{ row.name }} <span class="text-11px font-normal text-ink-400">{{ gradeLabel(row.grade) }}</span></p>
                <p class="text-11px text-ink-500 dark:text-ink-400">راننده: {{ row.driverName }} - ماهانه {{ formatMoney(row.fee) }}</p>
              </div>
              <div class="shrink-0 text-left">
                <p class="text-xs font-medium" :class="row.summary.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ row.summary.balance > 0 ? `مانده ${formatMoney(row.summary.balance)}` : row.fee > 0 ? '✓ تسویه' : 'بدون هزینه' }}</p>
                <button type="button" class="min-h-11 text-xs font-medium text-brand-600 dark:text-brand-400" @click="openRow(row.studentId)">ثبت پرداخت / جزئیات</button>
              </div>
            </div>
            <ul class="mt-1 flex flex-wrap gap-1" aria-label="وضعیت ماه‌ها">
              <li v-for="item in row.summary.months" :key="item.month" class="rounded-md px-2 py-0.5 text-11px" :class="STATE_CLASS[item.state]" :title="`${monthKeyLabel(item.month)}: ${item.paid.toLocaleString('fa-IR')} از ${item.due.toLocaleString('fa-IR')}`">
                {{ STATE_ICON[item.state] }} {{ monthKeyLabel(item.month, false) }}
              </li>
            </ul>
          </li>
        </ul>
      </template>
    </div>

    <ServicePaymentModal
      v-model="isModalOpen"
      :student-name="activeRow?.name ?? ''"
      :months="months"
      :monthly-fee="activeRow?.fee ?? 0"
      :payments="activePayments"
      :error-message="modalError"
      @add="addPayment"
      @remove="removePayment"
      @set-fee="setFee"
    />
  </div>
</template>
