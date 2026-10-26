<script setup lang="ts">
import { computed } from 'vue'
import type { BarItem } from '@/types'

const props = withDefaults(defineProps<{ items: BarItem[]; barClass?: string; emptyText?: string }>(), {
  barClass: 'bg-red-500',
  emptyText: 'داده‌ای برای نمایش وجود ندارد.',
})

const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))
</script>

<template>
  <ul v-if="items.length" class="space-y-1.5">
    <li v-for="item in items" :key="item.label" class="flex items-center gap-2 text-11px">
      <span class="w-24 shrink-0 truncate text-ink-600 dark:text-ink-300" :title="item.label">{{ item.label }}</span>
      <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800" aria-hidden="true">
        <span class="block h-full rounded-full" :class="barClass" :style="{ width: `${(item.value / maxValue) * 100}%` }"></span>
      </span>
      <span class="w-12 shrink-0 text-left text-ink-600 dark:text-ink-300">{{ item.display ?? item.value.toLocaleString('fa-IR') }}</span>
    </li>
  </ul>
  <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500">{{ emptyText }}</p>
</template>
