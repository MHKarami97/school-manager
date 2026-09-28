<script setup lang="ts">
import { WEEK_DAYS } from '../../types'
import type { WeeklyBoardItem } from '../../utils/extra-class-helpers'

const props = defineProps<{
  items: WeeklyBoardItem[]
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

function itemsOfDay(dayIndex: number): WeeklyBoardItem[] {
  return props.items.filter((item) => item.dayIndex === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime))
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-5">
    <div v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="space-y-2">
      <p class="mb-1 text-center text-xs font-semibold text-ink-600 dark:text-ink-300">{{ day }}</p>
      <button
        v-for="item in itemsOfDay(dayIndex)"
        :key="item.id"
        type="button"
        class="w-full rounded-xl border border-ink-100 bg-white p-2.5 text-right text-xs transition hover:border-brand-200 dark:border-ink-800 dark:bg-ink-900"
        @click="emit('select', item.id)"
      >
        <p class="font-semibold text-ink-800 dark:text-ink-200">{{ item.title }}</p>
        <p class="mt-0.5 text-10px text-ink-500 dark:text-ink-400">{{ item.startTime }} - {{ item.endTime }}</p>
        <p v-if="item.subtitle" class="mt-0.5 text-10px text-ink-400 dark:text-ink-500">{{ item.subtitle }}</p>
        <span
          v-if="item.badge"
          class="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-10px font-medium text-brand-700 dark:bg-brand-900/10 dark:text-brand-300"
        >
          {{ item.badge }}
        </span>
      </button>
      <p
        v-if="!itemsOfDay(dayIndex).length"
        class="rounded-xl border border-dashed border-ink-200 p-3 text-center text-10px text-ink-400 dark:border-ink-700 dark:text-ink-500"
      >
        کلاسی نیست
      </p>
    </div>
  </div>
</template>
