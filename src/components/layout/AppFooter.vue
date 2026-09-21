<script setup lang="ts">
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const year = new Date().getFullYear()
const theme = useThemeStore()

const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'روشن', icon: 'M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7 17.5 5.6 18.9M18.4 18.9 17 17.5M7 6.4 5.6 5m6 1a5 5 0 100 10 5 5 0 000-10z' },
  { mode: 'dark', label: 'تیره', icon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z' },
  { mode: 'system', label: 'سیستم', icon: 'M4 5h16v10H4zM8 19h8M12 15v4' },
]

function chooseTheme(mode: ThemeMode): void {
  theme.setMode(mode)
}
</script>

<template>
  <footer id="contact" class="border-t border-ink-100 bg-white pb-16 sm:pb-0 dark:border-ink-800 dark:bg-ink-900">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">م</span>
          <span class="text-base font-bold text-ink-800 dark:text-ink-200">مدیریار</span>
        </div>
        <p class="mt-3 text-sm leading-6 text-ink-500 dark:text-ink-400">
          ابزار رایگان و آفلاین برای چیدن، ویرایش و چاپ برنامه هفتگی کلاس‌های ابتدایی، متوسطه اول و دوم.
          تمام داده‌ها فقط در سیستم شما ذخیره می‌شود.
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-ink-800 dark:text-ink-200">تماس با ما</h3>
        <ul class="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
          <li>ایمیل: <a href="mailto:mhkarami97@gmail.com" class="text-brand-600 hover:underline dark:text-brand-400">mhkarami97@gmail.com</a></li>
          <li>وب‌سایت: <a href="https://mhkarami97.ir" target="_blank" rel="noopener" class="text-brand-600 hover:underline dark:text-brand-400">mhkarami97.ir</a></li>
          <li>تلگرام: <a href="https://t.me/mhkarami_97" target="_blank" rel="noopener" class="text-brand-600 hover:underline dark:text-brand-400">@mhkarami_97</a></li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-ink-800 dark:text-ink-200">دسترسی سریع</h3>
        <ul class="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
          <li><a href="#features" class="hover:text-brand-600 dark:hover:text-brand-400">امکانات</a></li>
          <li><a href="/guide" class="hover:text-brand-600 dark:hover:text-brand-400">راهنمای استفاده</a></li>
          <li><a href="/about" class="hover:text-brand-600 dark:hover:text-brand-400">درباره ما</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-ink-100 py-4 dark:border-ink-800">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6">
        <p class="text-center text-xs text-ink-400 dark:text-ink-500 sm:text-right">© {{ year }} مدیریار - تمام حقوق محفوظ است.</p>
        <div class="flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 p-1 dark:border-ink-700 dark:bg-ink-800">
          <button
            v-for="opt in themeOptions"
            :key="opt.mode"
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition"
            :class="theme.mode === opt.mode ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-900 dark:text-brand-300' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'"
            :aria-pressed="theme.mode === opt.mode"
            @click="chooseTheme(opt.mode)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
              <path :d="opt.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>
