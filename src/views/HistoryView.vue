<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES, AUDIENCE_TABS, type FeatureAudience } from '@/config/features.config'

const searchQuery = ref('')
const selectedAudience = ref<'all' | FeatureAudience>('all')

const historyFeatures = computed(() =>
  SITE_FEATURES.filter((f) => f.historyPath && f.historyPath !== '#' && f.status !== 'coming-soon')
)

const filteredFeatures = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return historyFeatures.value.filter((feature) => {
    const matchesAudience =
      selectedAudience.value === 'all' || feature.audiences.includes(selectedAudience.value)
    if (!matchesAudience) return false

    if (!query) return true
    return (
      feature.title.toLowerCase().includes(query) ||
      feature.shortTitle.toLowerCase().includes(query) ||
      feature.description.toLowerCase().includes(query) ||
      feature.historyLabel.toLowerCase().includes(query)
    )
  })
})

function getAudienceBadge(aud: FeatureAudience): { label: string; class: string } {
  switch (aud) {
    case 'admin':
      return { label: 'مدیریت', class: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' }
    case 'teacher':
      return { label: 'معلم', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' }
    case 'parent':
      return { label: 'اولیا', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' }
    case 'student':
      return { label: 'دانش‌آموز', class: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' }
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <!-- بخش سربرگ اصلی با ظاهر مدرن -->
      <div class="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <div class="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div class="max-w-2xl text-center md:text-right">
            <div class="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>مرکز بایگانی و سوابق مدیریار</span>
            </div>
            <h1 class="mt-3 text-2xl font-black text-ink-900 sm:text-3xl dark:text-white">
              تاریخچه و سوابق فعالیت‌ها
            </h1>
            <p class="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              هر اطلاعات، طرح درس، چیدمان هفتگی، صندلی امتحان یا داده‌ای که تا کنون در سامانه ساخته‌اید، به تفکیک ابزارها در این بخش قابل مرور، چاپ و ویرایش مجدد است.
            </p>
          </div>

          <!-- دکمه‌های سریع دسترسی به مدیریت داده‌ها -->
          <div class="flex flex-wrap items-center justify-center gap-2.5 sm:flex-nowrap">
            <RouterLink
              to="/settings/data"
              class="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-ink-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7h16M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>مدیریت جامع داده‌ها</span>
            </RouterLink>

            <RouterLink
              to="/settings"
              class="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>پشتیبان‌گیری</span>
            </RouterLink>
          </div>
        </div>

        <!-- فیلتر و جستجوی آنی -->
        <div class="mt-8 pt-6 border-t border-ink-100 dark:border-ink-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <!-- تب‌های فیلتر بر اساس مخاطب -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="tab in AUDIENCE_TABS"
              :key="tab.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="[
                selectedAudience === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700 dark:hover:text-white'
              ]"
              @click="selectedAudience = tab.id"
            >
              {{ tab.shortLabel }}
            </button>
          </div>

          <!-- باکس جستجو -->
          <div class="relative w-full md:w-72">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجو در سوابق و ابزارها..."
              class="w-full rounded-xl border border-ink-200 bg-ink-50/70 py-2 pe-3 ps-9 text-xs text-ink-800 placeholder-ink-400 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-100 dark:placeholder-ink-500 dark:focus:bg-ink-800"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="absolute start-3 top-2.5 h-4 w-4 text-ink-400">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <button
              v-if="searchQuery"
              type="button"
              class="absolute end-2.5 top-2.5 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              @click="searchQuery = ''"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- کارت‌های تاریخچه -->
      <div v-if="filteredFeatures.length > 0" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in filteredFeatures"
          :key="feature.id"
          class="group flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-500/40"
        >
          <div>
            <div class="flex items-start justify-between gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-300 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <path :d="feature.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <!-- نشان‌های مخاطب -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="aud in feature.audiences"
                  :key="aud"
                  class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  :class="getAudienceBadge(aud).class"
                >
                  {{ getAudienceBadge(aud).label }}
                </span>
              </div>
            </div>

            <h2 class="mt-4 text-base font-extrabold text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition">
              {{ feature.historyLabel }}
            </h2>
            <p class="mt-1.5 text-xs font-medium text-ink-400 dark:text-ink-400">
              {{ feature.title }}
            </p>
            <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400 line-clamp-2">
              {{ feature.description }}
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-ink-100 dark:border-ink-800/80 flex items-center justify-between gap-2">
            <RouterLink
              :to="feature.historyPath"
              class="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <span>مشاهده سوابق</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 transition group-hover:translate-x-[-3px]">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>

            <RouterLink
              v-if="feature.startPath"
              :to="feature.startPath"
              class="rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-brand-500/20 dark:hover:text-brand-300"
            >
              + ثبت جدید
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- وضعیت عدم یافت نتیجه -->
      <div v-else class="mt-12 rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center dark:border-ink-800 dark:bg-ink-900">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-7 w-7">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h3 class="mt-4 text-base font-bold text-ink-800 dark:text-ink-200">موردی یافت نشد</h3>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
          برای عبارت «{{ searchQuery }}» هیچ بخش فعالی در دسته انتخابی پیدا نشد.
        </p>
        <button
          type="button"
          class="mt-4 rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300"
          @click="searchQuery = ''; selectedAudience = 'all'"
        >
          پاکسازی فیلترها
        </button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
