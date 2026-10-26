<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ServicePlan } from '@/types'
import { academicYearLabel } from '@/utils/service-domain'
import MoneyInput from './MoneyInput.vue'

const props = defineProps<{
  plans: ServicePlan[]
  activeId: string
  activePlan: ServicePlan | undefined
  canFinalize: boolean
  defaultStartYear: number
  errorMessage: string
}>()

const emit = defineEmits<{
  (e: 'select', planId: string): void
  (e: 'create', input: { academicYear: string; title: string; defaultMonthlyFee: number }): void
  (e: 'remove'): void
  (e: 'finalize'): void
  (e: 'print-all'): void
}>()

const isCreating = ref(props.plans.length === 0)

watch(
  () => props.plans.length,
  (count) => {
    isCreating.value = count === 0
  },
)
const year = ref(academicYearLabel(props.defaultStartYear))
const title = ref('')
const fee = ref(0)

function submit(): void {
  emit('create', { academicYear: year.value, title: title.value, defaultMonthlyFee: fee.value })
}

function onSelect(event: Event): void {
  emit('select', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
    <div v-if="plans.length && !isCreating" class="flex flex-wrap items-end gap-2">
      <div class="min-w-40 flex-1">
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="plan-select">طرح سرویس (سال تحصیلی)</label>
        <select id="plan-select" :value="activeId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="onSelect">
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.title }} ({{ plan.academicYear }})</option>
        </select>
      </div>
      <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="isCreating = true">+ طرح جدید</button>
      <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="emit('print-all')">PDF همه‌ی رانندگان</button>
      <button type="button" :disabled="!canFinalize || activePlan?.status === 'final'" class="min-h-11 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white disabled:opacity-40" @click="emit('finalize')">
        {{ activePlan?.status === 'final' ? '✓ طرح نهایی شده' : 'نهایی کردن طرح' }}
      </button>
      <button type="button" class="min-h-11 px-2 text-xs text-red-600 dark:text-red-400" @click="emit('remove')">حذف طرح</button>
    </div>

    <form v-else class="grid gap-2 sm:grid-cols-3" @submit.prevent="submit">
      <p class="text-sm font-semibold text-ink-800 sm:col-span-3 dark:text-ink-200">ساخت طرح سرویس برای یک سال تحصیلی</p>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="plan-year">سال تحصیلی</label>
        <input id="plan-year" v-model="year" type="text" dir="ltr" placeholder="1405-1406" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="plan-title">عنوان (اختیاری)</label>
        <input id="plan-title" v-model="title" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="plan-fee">هزینه‌ی ماهانه‌ی پیش‌فرض هر دانش‌آموز</label>
        <MoneyInput id="plan-fee" v-model="fee" />
      </div>
      <div class="flex gap-2 sm:col-span-3">
        <button type="submit" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700">ساخت طرح</button>
        <button v-if="plans.length" type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="isCreating = false">انصراف</button>
      </div>
    </form>
    <p v-if="errorMessage" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ errorMessage }}</p>
  </div>
</template>
