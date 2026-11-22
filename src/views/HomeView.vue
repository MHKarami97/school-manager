<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES, AUDIENCE_TABS, type FeatureAudience } from '@/config/features.config'

const selectedTab = ref<'all' | FeatureAudience>('all')

const filteredFeatures = computed(() => {
  if (selectedTab.value === 'all') {
    return SITE_FEATURES
  }
  return SITE_FEATURES.filter((f) => f.audiences.includes(selectedTab.value as FeatureAudience))
})

function countForAudience(audienceId: 'all' | FeatureAudience): number {
  if (audienceId === 'all') return SITE_FEATURES.length
  return SITE_FEATURES.filter((f) => f.audiences.includes(audienceId)).length
}

const audiencePillMap: Record<FeatureAudience, { label: string; class: string }> = {
  admin: { label: 'مدیر و معاون', class: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  teacher: { label: 'معلم', class: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' },
  parent: { label: 'اولیا', class: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' },
  student: { label: 'دانش‌آموز', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

function scrollToFeatures(): void {
  const el = document.getElementById('features')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

function viewUpcomingGames(): void {
  selectedTab.value = 'student'
  const el = document.getElementById('features')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 sm:pb-0 transition-colors dark:bg-ink-950">
    <AppHeader />

    <main>
      <!-- بخش هیرو (Hero Section) -->
      <section class="relative overflow-hidden border-b border-ink-100 dark:border-ink-800">
        <!-- گرادیان پس‌زمینه لطیف -->
        <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/50 via-ink-50 to-transparent dark:from-brand-900/20 dark:via-ink-950 dark:to-transparent"></div>

        <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <div class="mx-auto max-w-3xl text-center">
            <!-- برچسب بالایی هیرو -->
            <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur dark:border-brand-500/30 dark:bg-ink-900/80 dark:text-brand-300">
              <span class="flex h-2 w-2 rounded-full bg-brand-600"></span>
              سامانه جامع و یکپارچه آموزشگاهی مدیریار
            </div>

            <!-- تیتر اصلی بدون کاراکترهای اضافی و با متن هماهنگ و یکدست -->
            <h1 class="mt-6 text-3xl font-black tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              مدیریت هوشمند مدرسه و یادگیری تعاملی دانش‌آموزان
            </h1>

            <p class="mt-5 text-sm leading-7 text-ink-600 sm:text-base sm:leading-8 dark:text-ink-300">
              ابزارهای جامع و کاربردی برای مدیران، معلمان و اولیا، در کنار آزمایشگاه مجازی و بازی‌های درسی برای دانش‌آموزان؛ با امکان برنامه‌ریزی هفتگی، چارت تدریس، گروه‌بندی عادلانه، حضور و غیاب و سرویس مدارس.
            </p>

            <!-- دکمه‌های اقدام سریع هیرو -->
            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 sm:w-auto"
                @click="scrollToFeatures"
              >
                <span>مشاهده امکانات و بخش‌ها</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <RouterLink
                to="/experiments"
                class="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 px-6 py-3.5 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:w-auto dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 text-emerald-600 dark:text-emerald-400">
                  <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>آزمایشگاه مجازی علوم</span>
                <span class="rounded bg-emerald-200/80 px-1.5 py-0.5 text-10px font-bold text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-300">جدید</span>
              </RouterLink>

              <RouterLink
                to="/history"
                class="w-full rounded-xl border border-ink-200 bg-white px-5 py-3.5 text-center text-sm font-semibold text-ink-700 transition hover:border-brand-300 sm:w-auto dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-ink-700"
              >
                تاریخچه فعالیت‌ها
              </RouterLink>
            </div>

            <!-- شاخص‌های اعتماد هیرو -->
            <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-right">
              <div class="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 p-3 shadow-xs dark:border-ink-800/80 dark:bg-ink-900/60">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  🔒
                </span>
                <div>
                  <h4 class="text-xs font-bold text-ink-800 dark:text-ink-200">حفظ حریم خصوصی</h4>
                  <p class="text-10px text-ink-400">امنیت کامل اطلاعات مدرسه</p>
                </div>
              </div>

              <div class="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 p-3 shadow-xs dark:border-ink-800/80 dark:bg-ink-900/60">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  ⚡
                </span>
                <div>
                  <h4 class="text-xs font-bold text-ink-800 dark:text-ink-200">سریع و دردسترس</h4>
                  <p class="text-10px text-ink-400">عملکرد آنی در تمام شرایط</p>
                </div>
              </div>

              <div class="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 p-3 shadow-xs dark:border-ink-800/80 dark:bg-ink-900/60">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  📚
                </span>
                <div>
                  <h4 class="text-xs font-bold text-ink-800 dark:text-ink-200">۳ دوره تحصیلی</h4>
                  <p class="text-10px text-ink-400">ابتدایی، متوسطه اول و دوم</p>
                </div>
              </div>

              <div class="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 p-3 shadow-xs dark:border-ink-800/80 dark:bg-ink-900/60">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  🎮
                </span>
                <div>
                  <h4 class="text-xs font-bold text-ink-800 dark:text-ink-200">یادگیری تعاملی</h4>
                  <p class="text-10px text-ink-400">آزمایشگاه و بازی‌های آموزشی</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- بخش کارت ویژه آزمایشگاه مجازی علوم (Spotlight Banner) -->
      <section class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-ink-900 p-6 sm:p-10 text-white shadow-xl shadow-emerald-950/20">
          <div class="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div class="max-w-2xl space-y-3">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                بخش جدید دانش‌آموزی و کلاسی
              </div>
              <h2 class="text-2xl font-black sm:text-3xl">آزمایشگاه مجازی علوم؛ شبیه‌سازی زنده و بدون نیاز به تجهیزات</h2>
              <p class="text-xs leading-6 text-emerald-100/90 sm:text-sm sm:leading-7">
                دانش‌آموزان و معلمان می‌توانند مفاهیم فیزیک، شیمی و زیست‌شناسی را با شبیه‌سازهای تعاملی و دقیق در محیط مرورگر، به صورت کاملاً زنده و ایمن آزمایش کنند.
              </p>
            </div>

            <RouterLink
              to="/experiments"
              class="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg shadow-black/20 transition hover:bg-emerald-50 hover:scale-105"
            >
              <span>ورود به آزمایشگاه علوم</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- بخش ویژگی‌ها و نقش‌ها (Role Tabs & Features) -->
      <section id="features" class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-black text-ink-900 sm:text-3xl dark:text-white">امکانات مدیریار بر اساس نقش شما</h2>
          <p class="mt-3 text-sm text-ink-500 dark:text-ink-400">
            برای مشاهده سریع ابزارهای متناسب با خود، نقش مورد نظرتان را انتخاب کنید:
          </p>
        </div>

        <!-- تب‌های نقش‌ها (کاملاً واکنش‌گرا و اسکرول‌پذیر در موبایل) -->
        <div class="mt-8 flex items-center justify-start sm:justify-center overflow-x-auto pb-3 pt-1 scrollbar-none">
          <div class="inline-flex gap-2 rounded-2xl border border-ink-200/80 bg-white/70 p-1.5 shadow-xs backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
            <button
              v-for="tab in AUDIENCE_TABS"
              :key="tab.id"
              type="button"
              class="flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition"
              :class="
                selectedTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white'
              "
              @click="selectedTab = tab.id"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path :d="tab.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ tab.shortLabel }}</span>
              <span
                class="rounded-full px-1.5 py-0.2 text-10px font-bold"
                :class="selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
              >
                {{ countForAudience(tab.id) }}
              </span>
            </button>
          </div>
        </div>

        <!-- کارت‌های ابزارها و امکانات -->
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in filteredFeatures"
            :key="feature.id"
            class="group relative flex flex-col rounded-2xl border bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-md dark:bg-ink-900"
            :class="[
              feature.isNew
                ? 'border-emerald-300 ring-1 ring-emerald-500/20 dark:border-emerald-500/30'
                : feature.status === 'coming-soon'
                  ? 'border-dashed border-amber-300/80 bg-amber-50/20 dark:border-amber-500/30 dark:bg-amber-950/10'
                  : 'border-ink-100 hover:border-brand-200 dark:border-ink-800 dark:hover:border-ink-700'
            ]"
          >
            <!-- سربرگ کارت: آیکون، برچسب‌ها و نشان -->
            <div class="flex items-start justify-between">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs transition group-hover:scale-105"
                :class="[
                  feature.isNew
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : feature.status === 'coming-soon'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                ]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <path :d="feature.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <!-- نشان جدید یا به‌زودی -->
              <span
                v-if="feature.badge"
                class="rounded-full px-2.5 py-0.5 text-11px font-bold"
                :class="[
                  feature.status === 'coming-soon'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                ]"
              >
                {{ feature.badge }}
              </span>
            </div>

            <!-- عنوان و توضیحات -->
            <h3 class="mt-4 text-base font-bold text-ink-900 dark:text-white">
              {{ feature.title }}
            </h3>
            <p class="mt-2 flex-1 text-xs leading-6 text-ink-500 dark:text-ink-400">
              {{ feature.description }}
            </p>

            <!-- برچسب‌های مخاطب کارت -->
            <div class="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-ink-100/70 dark:border-ink-800/60">
              <span
                v-for="aud in feature.audiences"
                :key="aud"
                class="rounded-md px-2 py-0.5 text-10px font-medium"
                :class="audiencePillMap[aud].class"
              >
                {{ audiencePillMap[aud].label }}
              </span>
            </div>

            <!-- دکمه‌های اقدام کارت -->
            <div class="mt-4 flex items-center gap-2">
              <template v-if="feature.status === 'coming-soon'">
                <button
                  type="button"
                  disabled
                  class="flex-1 cursor-not-allowed rounded-xl bg-ink-100 py-2.5 text-center text-xs font-semibold text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                >
                  {{ feature.startLabel }}
                </button>
              </template>
              <template v-else>
                <RouterLink
                  :to="feature.startPath"
                  class="flex-1 rounded-xl py-2.5 text-center text-xs font-bold text-white shadow-xs transition"
                  :class="[
                    feature.isNew
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
                  ]"
                >
                  {{ feature.startLabel }}
                </RouterLink>

                <RouterLink
                  v-if="feature.historyPath && feature.historyPath !== feature.startPath"
                  :to="feature.historyPath"
                  class="rounded-xl border border-ink-200 px-3 py-2.5 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-300"
                >
                  تاریخچه
                </RouterLink>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- بخش پیش‌نمایش بازی‌های یادگیری دانش‌آموزان -->
      <section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div class="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-white to-orange-500/5 p-6 sm:p-10 dark:border-amber-500/20 dark:bg-ink-900/60">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div class="space-y-3">
              <div class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                🚀 در مسیر توسعه (Roadmap)
              </div>
              <h3 class="text-xl font-black text-ink-900 sm:text-2xl dark:text-white">
                بازی‌های آموزشی درسی؛ یادگیری شاد، هدفمند و جذاب
              </h3>
              <p class="max-w-2xl text-xs leading-6 text-ink-600 sm:text-sm sm:leading-7 dark:text-ink-300">
                مشابه بازی محبوب <b>«نبرد موشکی»</b>، به زودی مینی‌گیم‌های تعاملی و پرهیجانی به مدیریار اضافه می‌شوند که مستقیماً به بانک سوالات کتاب‌های درسی متصل هستند. پاسخ درست در بازی شلیک موشک و ارتقای پایگاه‌ها را ممکن می‌کند و پاسخ اشتباه با راهنمایی‌های مفهومی به یادگیری درس کمک می‌نماید.
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 cursor-pointer rounded-2xl border border-amber-300 bg-white px-5 py-3 text-xs font-bold text-amber-800 shadow-xs transition hover:bg-amber-50 dark:border-amber-500/30 dark:bg-ink-800 dark:text-amber-300 active:scale-95"
              @click="viewUpcomingGames"
            >
              مشاهده بازی‌های در دست ساخت ←
            </button>
          </div>
        </div>
      </section>

      <!-- بخش چرایی مدیریار (Core Pillars) -->
      <section class="bg-white py-16 transition-colors dark:bg-ink-900/60">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-2xl font-black text-ink-900 sm:text-3xl dark:text-white">چرا سامانه مدیریار؟</h2>
            <p class="mt-3 text-xs leading-6 text-ink-500 sm:text-sm dark:text-ink-400">
              ویژگی‌های متمایزی که مدیریت امور مدرسه و یادگیری را ساده، سریع و استاندارد می‌کند.
            </p>
          </div>

          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-ink-100 p-5 dark:border-ink-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                  <path d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-bold text-ink-900 dark:text-white">سازگار با تمام دستگاه‌ها</h3>
              <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400">
                روی ویندوز، مک، گوشی‌های هوشمند و تبلت‌ها با طراحی روان، مدرن و کاملاً واکنش‌گرا در دسترس است.
              </p>
            </div>

            <div class="rounded-2xl border border-ink-100 p-5 dark:border-ink-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-bold text-ink-900 dark:text-white">امنیت و استقلال کامل</h3>
              <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400">
                اطلاعات معلمان، دانش‌آموزان و برنامه‌ها با نهایت دقت و امنیت نگهداری شده و کنترل کامل اطلاعات در اختیار خود شماست.
              </p>
            </div>

            <div class="rounded-2xl border border-ink-100 p-5 dark:border-ink-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-bold text-ink-900 dark:text-white">پوشش تمامی ارکان مدرسه</h3>
              <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400">
                از مدیر و معاونان اجرایی گرفته تا معلمان، اولیا و دانش‌آموزان، هر فرد ابزارهای اختصاصی و کاربردی خود را دارد.
              </p>
            </div>

            <div class="rounded-2xl border border-ink-100 p-5 dark:border-ink-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-bold text-ink-900 dark:text-white">قوانین رسمی آموزش و پرورش</h3>
              <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400">
                منطبق بر مصوبات رسمی شورای عالی آموزش و پرورش در ساعات درسی، عدم تکرار طولی/عرضی و چینش استاندارد.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>
