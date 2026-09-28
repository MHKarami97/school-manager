<script setup lang="ts">
import { computed } from 'vue'
import type { PeriodTotals } from '../../utils/budget-helpers'

const props = defineProps<{
  periods: PeriodTotals[]
}>()

const maxValue = computed(() => Math.max(1, ...props.periods.flatMap((p) => [p.income, p.expense])))
</script>

<template>
  <div class="space-y-3">
    <div v-for="period in periods" :key="period.label" class="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
      <div class="mb-2 flex items-center justify-between text-xs font-semibold text-ink-700 dark:text-ink-200">
        <span>{{ period.label }}</span>
        <span :class="period.income - period.expense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          خالص: {{ (period.income - period.expense).toLocaleString('fa-IR') }} تومان
        </span>
      </div>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 text-10px">
          <span class="w-10 text-ink-500 dark:text-ink-400">درآمد</span>
          <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${(period.income / maxValue) * 100}%` }"></div>
          </div>
          <span class="w-24 text-left text-ink-500 dark:text-ink-400">{{ period.income.toLocaleString('fa-IR') }}</span>
        </div>
        <div class="flex items-center gap-2 text-10px">
          <span class="w-10 text-ink-500 dark:text-ink-400">هزینه</span>
          <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div class="h-full rounded-full bg-red-500" :style="{ width: `${(period.expense / maxValue) * 100}%` }"></div>
          </div>
          <span class="w-24 text-left text-ink-500 dark:text-ink-400">{{ period.expense.toLocaleString('fa-IR') }}</span>
        </div>
      </div>
    </div>
    <p
      v-if="!periods.length"
      class="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500"
    >
      تراکنشی برای مقایسه ثبت نشده است.
    </p>
  </div>
</template>
