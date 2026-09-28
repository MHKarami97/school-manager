<script setup lang="ts">
import type { Celebration } from '../../types'
import type { CelebrationYearMonth } from '../../utils/celebration-helpers'

defineProps<{
  months: CelebrationYearMonth[]
  jy: number
}>()

const emit = defineEmits<{
  (e: 'open-day', celebrations: Celebration[]): void
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="month in months"
      :key="month.jm"
      class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900"
    >
      <p class="mb-2 text-center text-xs font-semibold text-ink-700 dark:text-ink-200">{{ month.label }} {{ jy }}</p>
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in month.days"
          :key="day.jd"
          type="button"
          class="relative rounded-lg py-1.5 text-10px transition"
          :class="
            day.celebrations.length
              ? 'bg-brand-600 font-semibold text-white hover:bg-brand-700'
              : 'text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800'
          "
          :title="day.celebrations.map((c) => c.title).join('، ')"
          @click="day.celebrations.length && emit('open-day', day.celebrations)"
        >
          {{ day.jd }}
        </button>
      </div>
      <p
        v-if="!month.days.some((d) => d.celebrations.length)"
        class="mt-2 text-center text-10px text-ink-400 dark:text-ink-500"
      >
        جشنی ثبت نشده
      </p>
    </div>
  </div>
</template>
