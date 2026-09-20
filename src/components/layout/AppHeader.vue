<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const isMenuOpen = ref(false)

const navLinks = [
  { label: 'امکانات', href: '#features' },
  { label: 'راهنما', href: '#guide' },
  { label: 'درباره ما', href: '#about' },
  { label: 'تماس با ما', href: '#contact' },
]

function closeMenu(): void {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">م</span>
        <span class="text-lg font-bold text-ink-800">مدیریار</span>
      </RouterLink>

      <nav class="hidden items-center gap-8 md:flex">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="text-sm font-medium text-ink-600 transition hover:text-brand-600"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <RouterLink
          to="/schedules"
          class="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          برنامه‌های من
        </RouterLink>
        <RouterLink
          to="/wizard"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          شروع کنید
        </RouterLink>
      </div>

      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 md:hidden"
        aria-label="باز کردن منو"
        @click="isMenuOpen = !isMenuOpen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="isMenuOpen" class="border-t border-ink-100 bg-white px-4 py-4 md:hidden">
        <nav class="flex flex-col gap-3">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
          <RouterLink
            to="/schedules"
            class="rounded-lg px-2 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            @click="closeMenu"
          >
            برنامه‌های من
          </RouterLink>
          <RouterLink
            to="/wizard"
            class="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white"
            @click="closeMenu"
          >
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
