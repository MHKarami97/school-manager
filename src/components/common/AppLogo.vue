<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
  }>(),
  {
    size: 'md',
    showText: false,
  }
)

const containerClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 rounded-lg'
    case 'lg':
      return 'h-12 w-12 rounded-2xl'
    case 'md':
    default:
      return 'h-9 w-9 rounded-xl'
  }
})

const iconClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-5 w-5'
    case 'lg':
      return 'h-7 w-7'
    case 'md':
    default:
      return 'h-5.5 w-5.5'
  }
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div
      class="relative flex shrink-0 items-center justify-center bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105 dark:shadow-brand-500/15 dark:ring-white/10"
      :class="containerClasses"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        :class="iconClasses"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logoCapGrad" x1="4" y1="5" x2="28" y2="17" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#D0E2FF" />
          </linearGradient>
          <linearGradient id="logoBookGrad" x1="6" y1="18" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFFFFF" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#93C5FD" stop-opacity="0.85" />
          </linearGradient>
          <linearGradient id="logoGoldTassel" x1="26" y1="12" x2="29" y2="21" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FDE047" />
            <stop offset="100%" stop-color="#EAB308" />
          </linearGradient>
        </defs>

        <!-- کلاه فارغ‌التحصیلی و دانش (رأس نماد) -->
        <path
          d="M16 4.5L3.5 10.5L16 16.5L27 11.22V17H28.5V10.5L16 4.5Z"
          fill="url(#logoCapGrad)"
        />

        <!-- منگوله زرین کلاه دانشگاهی -->
        <path
          d="M25 11.5L27.5 13.5V19.5"
          stroke="url(#logoGoldTassel)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle cx="27.5" cy="20.5" r="1.3" fill="#FDE047" />

        <!-- انحنای پایه کلاه بر سر -->
        <path
          d="M8.5 13.2V17C8.5 19.5 11.8 21.5 16 21.5C20.2 21.5 23.5 19.5 23.5 17V13.2L16 16.8L8.5 13.2Z"
          fill="white"
          fill-opacity="0.4"
        />

        <!-- کتاب گشوده یادگیری و برنامه هفتگی مدارس -->
        <path
          d="M6 21.5C9 20 12.5 20.2 15 21.5V27.5C12.5 26.2 9 26 6 27.5V21.5Z"
          fill="url(#logoBookGrad)"
        />
        <path
          d="M26 21.5C23 20 19.5 20.2 17 21.5V27.5C19.5 26.2 23 26 26 27.5V21.5Z"
          fill="url(#logoBookGrad)"
        />
        <!-- شیرازه وسط کتاب -->
        <path d="M16 21.2V27.8" stroke="#1E40AF" stroke-width="1.2" stroke-linecap="round" />

        <!-- خطوط ظریف زنگ‌های جدول و سرفصل‌ها -->
        <path
          d="M8.5 23.2C10.5 22.5 12.8 22.6 14 23.3M8.5 25.2C10.5 24.5 12.8 24.6 14 25.3"
          stroke="#1D4ED8"
          stroke-width="0.9"
          stroke-linecap="round"
          stroke-opacity="0.6"
        />
        <path
          d="M18 23.3C19.2 22.6 21.5 22.5 23.5 23.2M18 25.3C19.2 24.6 21.5 24.5 23.5 25.2"
          stroke="#1D4ED8"
          stroke-width="0.9"
          stroke-linecap="round"
          stroke-opacity="0.6"
        />

        <!-- ستاره طلایی هوشمندی در گوشه بالایی -->
        <path
          d="M5.5 4.5L6.2 6.2L7.9 6.9L6.2 7.6L5.5 9.3L4.8 7.6L3.1 6.9L4.8 6.2L5.5 4.5Z"
          fill="#FDE047"
        />
      </svg>
    </div>

    <!-- عنوان متنی در صورت درخواست -->
    <div v-if="showText" class="flex flex-col">
      <span class="text-base font-extrabold text-ink-900 dark:text-ink-100">مدیریار</span>
      <span class="hidden text-10px font-medium text-ink-400 sm:inline dark:text-ink-400">سامانه هوشمند مدارس</span>
    </div>
  </div>
</template>
