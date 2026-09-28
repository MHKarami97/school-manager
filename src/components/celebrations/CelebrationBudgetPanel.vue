<script setup lang="ts">
import { computed } from 'vue'
import type { CelebrationBudget } from '../../types'
import CurrencyInput from '../CurrencyInput.vue'

const budget = defineModel<CelebrationBudget>({ required: true })

const variance = computed(() => budget.value.actualCost - budget.value.estimatedCost)

const varianceLabel = computed(() => {
  if (!budget.value.actualCost) return 'هنوز هزینه واقعی ثبت نشده است.'
  if (variance.value === 0) return 'هزینه واقعی برابر با تخمین است.'
  return variance.value > 0
    ? `${variance.value.toLocaleString('fa-IR')} تومان بیشتر از تخمین`
    : `${Math.abs(variance.value).toLocaleString('fa-IR')} تومان کمتر از تخمین`
})
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">بودجه جشن</p>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">هزینه تخمینی</label>
        <CurrencyInput v-model="budget.estimatedCost" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">هزینه واقعی</label>
        <CurrencyInput v-model="budget.actualCost" />
      </div>
    </div>
    <p
      class="mt-3 text-xs"
      :class="variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'"
    >
      {{ varianceLabel }}
    </p>
  </div>
</template>
