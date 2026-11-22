<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BackupPanel from '@/components/settings/BackupPanel.vue'
import CloudBackupCard from '@/components/settings/CloudBackupCard.vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const route = useRoute()
const theme = useThemeStore()
const checkingUpdate = ref(false)
const updateStatus = ref<string | null>(null)

type SettingTabId = 'theme' | 'cloud' | 'backup' | 'database' | 'system'

const activeTab = ref<SettingTabId>(
  (route.query.tab as SettingTabId) || 'theme'
)

const settingTabs = [
  {
    id: 'theme' as SettingTabId,
    label: 'ظاهر و پوسته',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  },
  {
    id: 'cloud' as SettingTabId,
    label: 'همگام‌سازی ابری',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z',
  },
  {
    id: 'backup' as SettingTabId,
    label: 'پشتیبان‌گیری و بازیابی',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  },
  {
    id: 'database' as SettingTabId,
    label: 'مدیریت داده‌ها و جداول',
    icon: 'M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7h16M9 11h6M9 15h4',
  },
  {
    id: 'system' as SettingTabId,
    label: 'درباره و نگارش',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

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

const databaseGroups = [
  {
    title: 'مدارس، کلاس‌ها و دانش‌آموزان',
    desc: 'مشخصات آموزشگاه‌ها، تعریف پایه‌ها، نام کلاس‌ها و فهرست اسامی دانش‌آموزان',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    title: 'معلمان و برنامه‌ریزی هفتگی',
    desc: 'دبیران، دروس، محدودیت‌های تدریس، چیدمان هفتگی و برنامه ورزش',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    title: 'حضور و غیاب، سرویس و بودجه',
    desc: 'دفتر حضور و غیاب روزانه، رانندگان و دانش‌آموزان سرویس، درآمد و هزینه‌های مالی',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    title: 'ارزشیابی، آزمون‌ها و رویدادها',
    desc: 'بانک سوالات، جلسات امتحان، چیدمان صندلی، دعوت‌نامه‌ها، جشن‌ها و انتخابات',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
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
          updateStatus.value = 'شما در حال استفاده از آخرین نسخه پایدار هستید.'
        }
      } else {
        updateStatus.value = 'شما در حال استفاده از آخرین نسخه پایدار هستید.'
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
            <h1 class="mt-3 text-2xl font-black text-ink-900 sm:text-3xl dark:text-white">
              تنظیمات سامانه مدیریار
            </h1>
            <p class="mt-2 text-xs sm:text-sm text-ink-500 dark:text-ink-400">
              شخصی‌سازی ظاهر، مدیریت داده‌های مدارس، پشتیبان‌گیری ابری و کنترل کامل امنیت اطلاعات
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="rounded-xl border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-mono font-bold text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
              نسخه ۲.۴.۰
            </span>
          </div>
        </div>

        <!-- نوار تب‌های واکنش‌گرا و مدرن -->
        <div class="mt-8 pt-6 border-t border-ink-100 dark:border-ink-800 -mx-6 px-6 sm:mx-0 sm:px-0">
          <div class="flex items-center overflow-x-auto pb-2 scrollbar-none">
            <div class="inline-flex w-max shrink-0 items-center gap-1.5 rounded-2xl border border-ink-200/80 bg-ink-50/70 p-1.5 shadow-xs backdrop-blur sm:gap-2 dark:border-ink-800 dark:bg-ink-800/80">
              <button
                v-for="tab in settingTabs"
                :key="tab.id"
                type="button"
                class="flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition"
                :class="
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-ink-600 hover:bg-white hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white'
                "
                @click="activeTab = tab.id"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path :d="tab.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- محتوای تب‌ها -->
      <div class="mt-8">
        <!-- تب ۱: ظاهر و پوسته -->
        <section v-show="activeTab === 'theme'" class="rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-extrabold text-ink-900 dark:text-white">ظاهر و پوسته سامانه</h2>
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

                <h3 class="mt-3 text-sm font-bold text-ink-900 dark:text-white">
                  {{ t.title }}
                </h3>
                <p class="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">
                  {{ t.desc }}
                </p>
              </div>
            </button>
          </div>
        </section>

        <!-- تب ۲: همگام‌سازی ابری -->
        <section v-show="activeTab === 'cloud'">
          <CloudBackupCard />
        </section>

        <!-- تب ۳: پشتیبان‌گیری و بازیابی فایل -->
        <section v-show="activeTab === 'backup'">
          <BackupPanel />
        </section>

        <!-- تب ۴: مدیریت پیشرفته داده‌ها و جداول -->
        <section v-show="activeTab === 'database'" class="space-y-6">
          <div class="rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
            <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div class="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <span>مرکز داده‌ها</span>
                </div>
                <h2 class="mt-2 text-xl font-extrabold text-ink-900 dark:text-white">
                  مدیریت پیشرفته داده‌ها و جداول
                </h2>
                <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  سامانه مدیریار دارای ۲۲ جدول ساختاریافته برای ثبت کامل اطلاعات مدارس است.
                </p>
              </div>

              <RouterLink
                to="/settings/data"
                class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700"
              >
                <span>ورود به محیط مدیریت جدول‌ها</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
            </div>

            <!-- معرفی گروه‌های داده‌ای -->
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div
                v-for="group in databaseGroups"
                :key="group.title"
                class="rounded-2xl border border-ink-100 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-850/50"
              >
                <div class="flex items-center gap-2.5">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                      <path :d="group.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <h3 class="text-xs font-bold text-ink-800 dark:text-ink-200">{{ group.title }}</h3>
                </div>
                <p class="mt-2 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{{ group.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- تب ۵: درباره و نگارش -->
        <section v-show="activeTab === 'system'" class="space-y-6">
          <div class="rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
            <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <h3 class="text-base font-bold text-ink-900 dark:text-white">بررسی آخرین نگارش سامانه</h3>
                <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">اطمینان از دریافت جدیدترین به‌روزرسانی‌ها، امکانات و رفع ایرادات</p>
              </div>

              <button
                type="button"
                :disabled="checkingUpdate"
                class="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 active:scale-95 disabled:opacity-50"
                @click="triggerCheckUpdate"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4" :class="{ 'animate-spin': checkingUpdate }">
                  <path d="M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 13.9 3.4M19.5 9A8 8 0 0 0 5.6 5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>{{ checkingUpdate ? 'در حال بررسی...' : 'بررسی نسخه جدید' }}</span>
              </button>
            </div>

            <p v-if="updateStatus" class="mt-4 rounded-xl bg-brand-50 p-3 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 animate-pulse">
              {{ updateStatus }}
            </p>
          </div>

          <!-- کارت اطلاعات و پیوندهای کمکی -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div>
              <h4 class="text-xs font-bold text-ink-800 dark:text-ink-200">راهنمای کاربری و ارتباط با توسعه‌دهنده</h4>
              <p class="mt-1 text-[11px] text-ink-500 dark:text-ink-400">جهت مطالعه آموزش‌های تفصیلی یا ارسال بازخورد از پیوندهای زیر استفاده کنید.</p>
            </div>
            <div class="flex items-center gap-2">
              <RouterLink
                to="/guide"
                class="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                راهنما
              </RouterLink>
              <RouterLink
                to="/contact"
                class="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                تماس
              </RouterLink>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
