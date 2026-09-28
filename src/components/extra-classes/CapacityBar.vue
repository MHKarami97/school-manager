<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  filled: number
  total: number
}>()

const percent = computed(() => (props.total ? Math.min(100, Math.round((props.filled / props.total) * 100)) : 0))

const colorClass = computed(() => {
  if (percent.value >= 100) return 'bg-red-500'
  if (percent.value >= 75) return 'bg-amber-500'
  return 'bg-emerald-500'
})
</script>

<template>
  <div>
    <div class="mb-1 flex items-center justify-between text-10px text-ink-500 dark:text-ink-400">
      <span>ظرفیت</span>
      <span>{{ filled }} / {{ total }}</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div class="h-full rounded-full transition-all" :class="colorClass" :style="{ width: `${percent}%` }"></div>
    </div>
  </div>
</template>
