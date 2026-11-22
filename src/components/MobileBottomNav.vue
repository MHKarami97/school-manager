<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

interface NavItem {
  to: string
  label: string
  icon: string
  isCenter?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  {
    to: '/tools',
    label: 'ابزارها',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    to: '/experiments',
    label: 'آزمایشگاه',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    badge: 'جدید',
  },
  {
    to: '/',
    label: 'خانه',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    isCenter: true,
  },
  {
    to: '/history',
    label: 'تاریخچه',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    to: '/settings',
    label: 'تنظیمات',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

function isItemActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  if (path === '/tools') {
    return route.path === '/tools' || route.path === '/features'
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

const isHomeActive = computed(() => route.path === '/')
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-ink-200/80 bg-white/95 px-2 py-1.5 backdrop-blur-xl sm:hidden print:hidden dark:border-ink-800 dark:bg-ink-950/95 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    style="padding-bottom: max(env(safe-area-inset-bottom), 6px)"
  >
    <template v-for="item in navItems" :key="item.to">
      <!-- دکمه خانه در وسط: برجسته و مدرن -->
      <RouterLink
        v-if="item.isCenter"
        :to="item.to"
        class="group relative -mt-5 flex flex-col items-center justify-center transition active:scale-95"
      >
        <div
          class="relative flex h-13 w-13 items-center justify-center rounded-2xl shadow-lg transition duration-200"
          :class="[
            isHomeActive
              ? 'bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 text-white shadow-brand-500/40 ring-4 ring-brand-500/25'
              : 'border-2 border-white bg-ink-900 text-white shadow-ink-900/30 dark:border-ink-700 dark:bg-ink-800 hover:scale-105'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
            <path :d="item.icon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span
          class="mt-1 text-10px font-extrabold transition"
          :class="isHomeActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-ink-400'"
        >
          {{ item.label }}
        </span>
      </RouterLink>

      <!-- سایر دکمه‌های متقارن اطراف -->
      <RouterLink
        v-else
        :to="item.to"
        class="relative flex flex-1 flex-col items-center justify-center py-1 transition active:scale-90"
      >
        <div class="relative flex items-center justify-center">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl transition"
            :class="[
              isItemActive(item.to)
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 shadow-xs'
                : 'text-ink-400 hover:text-ink-600 dark:text-ink-400 dark:hover:text-ink-200'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path :d="item.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- بج کوچک برای موارد خاص مانند آزمایشگاه -->
          <span
            v-if="item.badge"
            class="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-ink-950"
          ></span>
        </div>

        <span
          class="mt-0.5 text-10px font-semibold transition"
          :class="[
            isItemActive(item.to)
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-ink-400 dark:text-ink-400'
          ]"
        >
          {{ item.label }}
        </span>

        <!-- نشانگر باریک فعال زیر دکمه -->
        <span
          v-if="isItemActive(item.to)"
          class="mt-0.5 h-1 w-3 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse"
        ></span>
      </RouterLink>
    </template>
  </nav>
</template>
