<script setup lang="ts">
/**
 * دکمه شناور انتخاب حالت روشن/تیره/سیستم. عمداً به‌صورت مستقل در App.vue قرار
 * گرفته (نه داخل AppHeader) تا به چیدمان هدر/فوتر که در حال ویرایش مکرر است
 * دست زده نشود.
 */
import { computed, ref } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const theme = useThemeStore()
const isOpen = ref(false)

const options: { mode: ThemeMode; label: string; icon: string }[] = [
  {
    mode: 'light',
    label: 'روشن',
    icon: 'M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7 17.5 5.6 18.9M18.4 18.9 17 17.5M7 6.4 5.6 5m6 1a5 5 0 100 10 5 5 0 000-10z',
  },
  {
    mode: 'dark',
    label: 'تیره',
    icon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z',
  },
  {
    mode: 'system',
    label: 'سیستم',
    icon: 'M4 5h16v10H4zM8 19h8M12 15v4',
  },
]

const currentIcon = computed(() => options.find((o) => o.mode === theme.mode)?.icon ?? options[2].icon)

function choose(mode: ThemeMode): void {
  theme.setMode(mode)
  isOpen.value = false
}

function handleBlur(): void {
  window.setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-40 print:hidden" tabindex="-1" @focusout="handleBlur">
    <Transition name="pop">
      <div v-if="isOpen" class="mb-2 flex flex-col gap-1 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lg">
        <button
          v-for="opt in options"
          :key="opt.mode"
          type="button"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition"
          :class="theme.mode === opt.mode ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'"
          @click="choose(opt.mode)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path :d="opt.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ opt.label }}
        </button>
      </div>
    </Transition>

    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-lg transition hover:text-brand-600"
      aria-label="تنظیم حالت روشن، تیره یا سیستم"
      @click="isOpen = !isOpen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
        <path :d="currentIcon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: all 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
