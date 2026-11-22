<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BackupPanel from '@/components/settings/BackupPanel.vue'
import CloudBackupCard from '@/components/settings/CloudBackupCard.vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const theme = useThemeStore()
const checkingUpdate = ref(false)
const updateStatus = ref<string | null>(null)

const themes: { mode: ThemeMode; title: string; desc: string; icon: string }[] = [
  {
    mode: 'light',
    title: 'حالت روشن (روز)',
    desc: 'رنگ‌های ملایم، پس‌زمینه سفید و کنتراست شفاف جهت مطالعه در روشنایی روز',
    icon: 'M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7 17.5 5.6 18.9M18.4 18.9 17 17.5M7 6.4 5.6 5m6 1a5 5 0 100 10 5 5 0 000-10z',
  },
  {
    mode: 'dark',
    title: 'حالت تیره (شب)',
    desc: 'پس‌زمینه تیره و کنتراست بهینه جهت کاهش خستگی چشم در محیط‌های کم‌نور',
    icon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z',
  },
  {
    mode: 'system',
    title: 'هماهنگ با دستگاه',
    desc: 'تغییر خودکار تم سامانه بر اساس تنظیمات ساعت و حالت سیستم‌عامل شما',
    icon: 'M4 5h16v10H4zM8 19h8M12 15v4',
  },
]

async function triggerCheckUpdate(): Promise<void> {
  checkingUpdate.value = true
  updateStatus.value = null
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update()
        if (reg.waiting) {
          updateStatus.value = 'نسخه جدید دریافت شد! جهت اعمال، صفحه را رفرش کنید.'
        } else {
          updateStatus.value = 'شما در حال استفاده از آخرین نسخه هستید.'
        }
      } else {
        updateStatus.value = 'شما در حال استفاده از آخرین نسخه هستید.'
      }
    } else {
      updateStatus.value = 'مرورگر شما از به‌روزرسانی سرویس پشتیبانی نمی‌کند.'
    }
  } catch {
    updateStatus.value = 'خطا در ارتباط با سرور به‌روزرسانی.'
  } finally {
    checkingUpdate.value = false
    setTimeout(() => {
      updateStatus.value = null
    }, 5000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors">
    <AppHeader />

    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <!-- سربرگ شیک تنظیمات -->
      <div class="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start text-center sm:text-right">
          <div>
            <div class="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>مرکز پیکربندی و نگهداری سیستم</span>
            </div>
            <h1 class="mt-3 text-2xl font-black text-ink-900 sm:text-3xl dark:text-ink-100">
              تنظیمات سامانه مدیریار
            </h1>
            <p class="mt-2 text-xs sm:text-sm text-ink-500 dark:text-ink-400">
              شخصی‌سازی ظاهر، مدیریت داده‌های مدارس، پشتیبان‌گیری ابری و کنترل کامل امنیت اطلاعات
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="rounded-xl border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-mono font-bold text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
              نسخه ۲.۴.۰
            </span>
          </div>
        </div>
      </div>

      <!-- بخش اول: انتخاب پوسته و تم -->
      <section class="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-extrabold text-ink-900 dark:text-ink-100">ظاهر و پوسته سامانه</h2>
            <p class="text-xs text-ink-500 dark:text-ink-400">پوسته نمایشی مورد نظر خود را برای استفاده در محیط‌های مختلف انتخاب کنید.</p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <button
            v-for="t in themes"
            :key="t.mode"
            type="button"
            class="group relative flex flex-col justify-between rounded-2xl border p-4 text-right transition duration-200"
            :class="[
              theme.mode === t.mode
                ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/10'
                : 'border-ink-200 bg-white hover:border-ink-300 dark:border-ink-800 dark:bg-ink-850/60 dark:hover:border-ink-700'
            ]"
            @click="theme.setMode(t.mode)"
          >
            <div>
              <div class="flex items-center justify-between">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl transition"
                  :class="[
                    theme.mode === t.mode
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                  ]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4.5 w-4.5">
                    <path :d="t.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>

                <span
                  v-if="theme.mode === t.mode"
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-[10px]"
                >
                  ✓
                </span>
              </div>

              <h3 class="mt-3 text-sm font-bold text-ink-900 dark:text-ink-100">
                {{ t.title }}
              </h3>
              <p class="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">
                {{ t.desc }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <!-- بخش دوم: دسترسی به مدیریت پایگاه داده -->
      <section class="mt-6">
        <RouterLink
          to="/settings/data"
          class="group flex flex-col justify-between gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-xs transition duration-200 hover:border-brand-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:p-7"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-500/15 dark:text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                <path d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7h16M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-extrabold text-ink-900 dark:text-ink-100 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition">
                  مدیریت پیشرفته داده‌ها و جداول
                </h2>
                <span class="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  ۲۲ جدول فعال
                </span>
              </div>
              <p class="mt-1 text-xs leading-6 text-ink-500 dark:text-ink-400">
                مشاهده، جستجو، افزودن، ویرایش و حذف رکوردهای تمامی بخش‌های سیستم (دانش‌آموزان، معلمان، برنامه‌ها، تراکنش‌ها و آزمون‌ها)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
            <span>ورود به مدیریت داده‌ها</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 transition group-hover:translate-x-[-4px]">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </RouterLink>
      </section>

      <!-- بخش سوم: پشتیبان‌گیری ابری -->
      <section class="mt-6">
        <CloudBackupCard />
      </section>

      <!-- بخش چهارم: خروجی و بازیابی فایل داده‌ها -->
      <section class="mt-6">
        <BackupPanel />
      </section>

      <!-- بخش پنجم: بررسی وضعیت به‌روزرسانی -->
      <section class="mt-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-7">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 class="text-sm font-bold text-ink-900 dark:text-ink-100">بررسی آخرین نگارش سامانه</h3>
            <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">اطمینان از دریافت جدیدترین به‌روزرسانی‌ها، امکانات و رفع ایرادات</p>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              :disabled="checkingUpdate"
              class="flex items-center gap-2 rounded-xl bg-ink-100 px-4 py-2 text-xs font-bold text-ink-800 transition hover:bg-ink-200 active:scale-95 disabled:opacity-50 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
              @click="triggerCheckUpdate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4" :class="{ 'animate-spin': checkingUpdate }">
                <path d="M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 13.9 3.4M19.5 9A8 8 0 0 0 5.6 5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ checkingUpdate ? 'در حال بررسی...' : 'بررسی نسخه جدید' }}</span>
            </button>
          </div>
        </div>

        <p v-if="updateStatus" class="mt-3 text-xs font-bold text-brand-600 dark:text-brand-400 animate-pulse">
          {{ updateStatus }}
        </p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>
