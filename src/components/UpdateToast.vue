<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl) {
    console.info('Service worker registered:', swUrl)
  },
  onRegisterError(error) {
    console.error('SW registration failed:', error)
  },
})

function refreshApp(): void {
  updateServiceWorker(true)
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh"
      class="fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 pb-4 sm:bottom-0 sm:justify-end sm:pe-6"
      role="status"
    >
      <div class="flex w-full max-w-md items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl dark:border-ink-700 dark:bg-ink-900">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
            <path d="M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 13.9 3.4M19.5 9A8 8 0 0 0 5.6 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex-1 text-sm">
          <p class="font-medium text-ink-800 dark:text-ink-100">نسخه جدیدی از مدیریار در دسترس است</p>
          <p class="mt-0.5 text-ink-500 dark:text-ink-400">برای استفاده از امکانات و اصلاحات جدید، صفحه را به‌روزرسانی کنید.</p>
        </div>
        <button type="button" class="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700" @click="refreshApp">
          به‌روزرسانی
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
