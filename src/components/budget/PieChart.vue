<script setup lang="ts">
import { computed } from 'vue'

export interface PieSlice {
  label: string
  value: number
  color: string
}

const props = defineProps<{
  slices: PieSlice[]
}>()

const total = computed(() => props.slices.reduce((sum, s) => sum + s.value, 0))

const gradient = computed(() => {
  if (!total.value) return 'conic-gradient(#e5e7eb 0deg 360deg)'
  let cursor = 0
  const stops: string[] = []
  for (const slice of props.slices) {
    const degrees = (slice.value / total.value) * 360
    stops.push(`${slice.color} ${cursor}deg ${cursor + degrees}deg`)
    cursor += degrees
  }
  return `conic-gradient(${stops.join(', ')})`
})

function percentOf(value: number): number {
  return total.value ? Math.round((value / total.value) * 100) : 0
}
</script>

<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
    <div class="h-40 w-40 shrink-0 rounded-full" :style="{ background: gradient }"></div>
    <div class="w-full space-y-1.5">
      <div v-for="slice in slices" :key="slice.label" class="flex items-center justify-between text-xs">
        <span class="flex items-center gap-2 text-ink-600 dark:text-ink-300">
          <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: slice.color }"></span>
          {{ slice.label }}
        </span>
        <span class="text-ink-500 dark:text-ink-400">{{ slice.value.toLocaleString('fa-IR') }} تومان ({{ percentOf(slice.value) }}٪)</span>
      </div>
      <p v-if="!slices.length" class="text-11px text-ink-400 dark:text-ink-500">هزینه‌ای برای نمایش ثبت نشده است.</p>
    </div>
  </div>
</template>
