<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)

function closeMenu(): void {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur dark:border-ink-800 dark:bg-ink-900/85">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">م</span>
        <span class="text-lg font-bold text-ink-800 dark:text-ink-200">مدیریار</span>
      </RouterLink>

      <nav class="hidden items-center gap-8 md:flex">
        <RouterLink :to="{ path: '/', hash: '#features' }" class="text-sm font-medium text-ink-600 transition hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400">
          امکانات
        </RouterLink>
        <RouterLink to="/students" class="text-sm font-medium text-ink-600 transition hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400">دانش‌آموزان</RouterLink>
        <RouterLink to="/guide" class="text-sm font-medium text-ink-600 transition hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400">راهنما</RouterLink>
        <RouterLink to="/about" class="text-sm font-medium text-ink-600 transition hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400">درباره ما</RouterLink>
        <RouterLink to="/contact" class="text-sm font-medium text-ink-600 transition hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400">تماس با ما</RouterLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <RouterLink to="/students/groups" class="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-brand-500 dark:hover:text-brand-400">
          گروه‌بندی‌های من
        </RouterLink>
        <RouterLink to="/schedules" class="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-brand-500 dark:hover:text-brand-400">
          برنامه‌های من
        </RouterLink>
        <RouterLink to="/wizard" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          شروع کنید
        </RouterLink>
      </div>

      <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 md:hidden dark:text-ink-300" aria-label="باز کردن منو" @click="isMenuOpen = !isMenuOpen">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="isMenuOpen" class="border-t border-ink-100 bg-white px-4 py-4 md:hidden dark:border-ink-800 dark:bg-ink-900">
        <nav class="flex flex-col gap-3">
          <RouterLink :to="{ path: '/', hash: '#features' }" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            امکانات
          </RouterLink>
          <RouterLink to="/students" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            دانش‌آموزان
          </RouterLink>
          <RouterLink to="/guide" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            راهنما
          </RouterLink>
          <RouterLink to="/about" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            درباره ما
          </RouterLink>
          <RouterLink to="/contact" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            تماس با ما
          </RouterLink>
          <RouterLink to="/students/groups" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            گروه‌بندی‌های من
          </RouterLink>
          <RouterLink to="/schedules" class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800" @click="closeMenu">
            برنامه‌های من
          </RouterLink>
          <RouterLink to="/wizard" class="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white" @click="closeMenu">
            شروع کنید
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
