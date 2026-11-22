<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppLogo from '@/components/common/AppLogo.vue'

const isMenuOpen = ref(false)
const theme = useThemeStore()
const route = useRoute()

function closeMenu(): void {
  isMenuOpen.value = false
}

function toggleTheme(): void {
  if (theme.mode === 'dark') {
    theme.setMode('light')
  } else {
    theme.setMode('dark')
  }
}

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-md transition-colors dark:border-ink-800 dark:bg-ink-950/90">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
      <!-- لوگو و برندینگ -->
      <RouterLink to="/" class="group flex items-center gap-2.5" @click="closeMenu">
        <AppLogo size="md" />
        <div class="flex flex-col">
          <span class="text-base font-extrabold text-ink-900 dark:text-white">مدیریار</span>
          <span class="hidden text-10px font-medium text-ink-400 sm:inline dark:text-ink-300">سامانه هوشمند مدارس</span>
        </div>
      </RouterLink>

      <!-- منوی اصلی دسکتاپ -->
      <nav class="hidden items-center gap-1 lg:gap-2 md:flex">
        <RouterLink
          to="/"
          class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'"
        >
          صفحه اصلی
        </RouterLink>

        <RouterLink
          to="/tools"
          class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/tools') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'"
        >
          ابزارها و بخش‌ها
        </RouterLink>

        <!-- لینک آزمایشگاه با برچسب جدید -->
        <RouterLink
          to="/experiments"
          class="relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/experiments') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
            <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>آزمایشگاه علوم</span>
          <span class="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-9px font-bold text-emerald-600 dark:text-emerald-300">جدید</span>
        </RouterLink>

        <RouterLink
          to="/history"
          class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/history') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'"
        >
          تاریخچه
        </RouterLink>

        <RouterLink
          to="/guide"
          class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/guide') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'"
        >
          راهنما
        </RouterLink>

        <RouterLink
          to="/about"
          class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="isActive('/about') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'"
        >
          درباره ما
        </RouterLink>
      </nav>

      <!-- بخش دکمه‌ها و ابزارهای سریع هدر -->
      <div class="hidden items-center gap-2 md:flex">
        <!-- دکمه تغییر تم سریع -->
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-ink-700 dark:hover:text-white"
          :title="theme.mode === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'"
          @click="toggleTheme"
        >
          <svg v-if="theme.mode === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7 17.5 5.6 18.9M18.4 18.9 17 17.5M7 6.4 5.6 5m6 1a5 5 0 100 10 5 5 0 000-10z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <RouterLink
          to="/settings"
          class="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-ink-700 dark:hover:text-white"
        >
          تنظیمات
        </RouterLink>

        <RouterLink
          to="/tools"
          class="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
        >
          <span>شروع کار</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
      </div>

      <!-- دکمه همبرگری موبایل -->
      <div class="flex items-center gap-2 md:hidden">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
          :aria-label="theme.mode === 'dark' ? 'حالت روشن' : 'حالت تیره'"
          @click="toggleTheme"
        >
          <svg v-if="theme.mode === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7 17.5 5.6 18.9M18.4 18.9 17 17.5M7 6.4 5.6 5m6 1a5 5 0 100 10 5 5 0 000-10z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
          :aria-expanded="isMenuOpen"
          aria-label="باز کردن منو"
          @click="isMenuOpen = !isMenuOpen"
        >
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- پنل منوی موبایل کشویی -->
    <Transition name="slide">
      <div v-if="isMenuOpen" class="border-t border-ink-100 bg-white/95 px-4 py-4 md:hidden backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/95 shadow-xl">
        <nav class="flex flex-col gap-1.5">
          <RouterLink
            to="/"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <span>صفحه اصلی</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 opacity-50">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <RouterLink
            to="/tools"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/tools') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <span>ابزارها و بخش‌ها</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 opacity-50">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <RouterLink
            to="/experiments"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/experiments') ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-emerald-700 hover:bg-emerald-50/60 dark:text-emerald-400 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 text-emerald-600 dark:text-emerald-400">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>آزمایشگاه مجازی علوم</span>
            </div>
            <span class="rounded-full bg-emerald-200 px-2 py-0.5 text-10px font-bold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
              جدید
            </span>
          </RouterLink>

          <RouterLink
            to="/history"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/history') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <span>تاریخچه فعالیت‌ها</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 opacity-50">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <RouterLink
            to="/guide"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/guide') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <span>راهنمای استفاده</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 opacity-50">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <RouterLink
            to="/settings"
            class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="isActive('/settings') ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-900'"
            @click="closeMenu"
          >
            <span>تنظیمات سامانه</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 opacity-50">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <div class="mt-2 pt-2 border-t border-ink-100 dark:border-ink-800 flex gap-2">
            <RouterLink
              to="/about"
              class="flex-1 rounded-xl border border-ink-200 bg-white/50 py-2.5 text-center text-xs font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-800"
              @click="closeMenu"
            >
              درباره ما
            </RouterLink>
            <RouterLink
              to="/contact"
              class="flex-1 rounded-xl border border-ink-200 bg-white/50 py-2.5 text-center text-xs font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:bg-ink-800"
              @click="closeMenu"
            >
              تماس با ما
            </RouterLink>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
