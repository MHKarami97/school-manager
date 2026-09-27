<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  {
    to: '/history',
    label: 'تاریخچه',
    icon: 'M12 7v5l3 3M12 3a9 9 0 100 18 9 9 0 000-18z',
  },
  {
    to: '/tools',
    label: 'ابزارها',
    icon: 'M12 6V4m0 2a6 6 0 100 12 6 6 0 000-12zm0 0v2m6 4h2M6 12H4m12.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41',
    primary: true,
  },
  {
    to: '/guide',
    label: 'راهنما',
    icon: 'M12 18h.01M9.09 9a3 3 0 115.83 1c0 2-3 2-3 5',
  },
]

const activePath = computed(() => route.path)
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-ink-100 bg-white/95 backdrop-blur sm:hidden print:hidden dark:border-ink-800 dark:bg-ink-900/95"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-10px font-medium"
      :class="[
        item.primary
          ? 'text-brand-600 dark:text-brand-400'
          : activePath === item.to
            ? 'text-brand-600 dark:text-brand-400'
            : 'text-ink-400 dark:text-ink-500',
      ]"
    >
      <span
        v-if="item.primary"
        class="-mt-6 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path :d="item.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
        <path :d="item.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
