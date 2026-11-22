<script setup lang="ts">
import { RouterLink } from 'vue-router'
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
  <footer id="contact" class="border-t border-ink-100 bg-white pb-20 sm:pb-0 transition-colors dark:border-ink-800 dark:bg-ink-950">
    <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <!-- ستون ۱: معرفی مدیریار -->
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-sm font-black text-white shadow-md shadow-brand-500/20">
              م
            </span>
            <div class="flex flex-col">
              <span class="text-base font-extrabold text-ink-900 dark:text-white">مدیریار</span>
              <span class="text-10px font-medium text-ink-400 dark:text-ink-400">سامانه هوشمند و یکپارچه مدارس</span>
            </div>
          </div>
          <p class="text-xs leading-6 text-ink-500 dark:text-ink-400">
            سامانه جامع و امن برای برنامه‌ریزی امور آموزشی، مدیریت اجرایی مدرسه، و ایجاد محیطی تعاملی برای آزمایش و یادگیری دانش‌آموزان.
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <span class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-10px font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              🔒 حفظ کامل حریم خصوصی
            </span>
            <span class="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-10px font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              ⚡ سریع، ساده و کاربردی
            </span>
          </div>
        </div>

        <!-- ستون ۲: ابزارهای مدیریت مدرسه -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">مدیریت و امور مدرسه</h3>
          <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
            <li>
              <RouterLink to="/wizard" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                چیدمان خودکار برنامه هفتگی
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/students" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                گروه‌بندی عادلانه کلاس‌ها
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/teaching-plans/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                چارت و تخصیص معلمان به کلاس
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/exam-seating/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                چیدمان ضدتقلب صندلی‌های امتحان
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/attendance" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                حضور و غیاب دانش‌آموزان
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/service/drivers" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                مدیریت سرویس مدارس و رانندگان
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/budget" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                بودجه و مالی مدرسه
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- ستون ۳: معلمان، اولیا و دانش‌آموزان -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">آموزش و تعامل</h3>
          <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
            <li>
              <RouterLink to="/experiments" class="flex items-center gap-1.5 font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400">
                <span>آزمایشگاه مجازی علوم</span>
                <span class="rounded bg-emerald-100 px-1 py-0.2 text-9px dark:bg-emerald-500/20">زنده</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/tools" class="flex items-center gap-1.5 font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-400">
                <span>بازی‌های یادگیری درسی</span>
                <span class="rounded bg-purple-100 px-1 py-0.2 text-9px dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">۴ بازی فعال</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/lesson-plans/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                طرح درس الکترونیک معلم
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/exams/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                بانک سوال و آزمون‌ساز
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/invitations/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                سامانه دعوت‌نامه و جلسات اولیا
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/elections/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                انتخابات شورای دانش‌آموزی و انجمن
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/extra-classes/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                کلاس‌های تقویتی و فوق‌برنامه
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- ستون ۴: ارتباط و دسترسی -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">ارتباط و دسترسی</h3>
          <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
            <li>
              وب‌سایت:
              <a href="https://mhkarami97.ir" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                mhkarami97.ir
              </a>
            </li>
            <li>
              ایمیل:
              <a href="mailto:mhkarami97@gmail.com" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                mhkarami97@gmail.com
              </a>
            </li>
            <li>
              تلگرام:
              <a href="https://t.me/mhkarami_97" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                @mhkarami_97
              </a>
            </li>
            <li class="pt-2">
              <div class="flex items-center gap-2">
                <RouterLink to="/guide" class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:text-white">
                  راهنمای سامانه
                </RouterLink>
                <RouterLink to="/about" class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:text-white">
                  درباره ما
                </RouterLink>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- نوار پایین فوتر -->
    <div class="border-t border-ink-100 py-5 dark:border-ink-800">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p class="text-center text-xs text-ink-400 dark:text-ink-500 sm:text-right">
          © {{ year }} سامانه مدیریار · تمامی حقوق محفوظ است.
        </p>

        <!-- انتخاب حالت تم روز/شب -->
        <div class="flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 p-1 dark:border-ink-800 dark:bg-ink-900">
          <button
            v-for="opt in themeOptions"
            :key="opt.mode"
            type="button"
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition"
            :class="theme.mode === opt.mode ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-800 dark:text-brand-300' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'"
            :aria-pressed="theme.mode === opt.mode"
            @click="chooseTheme(opt.mode)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
              <path :d="opt.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>
