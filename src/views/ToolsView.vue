<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES, AUDIENCE_TABS, type FeatureAudience, type SiteFeature } from '@/config/features.config'
import { CHOGAN_GAMES } from '@/config/chogan-games.config'

const selectedTab = ref<'all' | FeatureAudience>('all')
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'new' | 'coming-soon'>('all')

// باکس‌های معرفی ۴ نقش اصلی در حالت نمایش همه
interface RoleGatewayCard {
  id: FeatureAudience
  title: string
  subtitle: string
  description: string
  icon: string
  shortLabel: string
  badge: string
  gradient: string
  borderClass: string
  badgeClass: string
  btnClass: string
  highlights: string[]
}

const ROLE_GATEWAY_CARDS: RoleGatewayCard[] = [
  {
    id: 'admin',
    title: 'امکانات مدیران و معاونان مدرسه',
    shortLabel: 'مدیر و معاون',
    subtitle: 'مدیریت و برنامه‌ریزی کلان',
    description:
      'چیدمان خودکار برنامه هفتگی بر اساس ضوابط رسمی، گروه‌بندی عادلانه کلاس‌ها، چارت هفتگی تدریس، برنامه‌ریزی ورزش و سرویس مدرسه.',
    icon: '🏛️',
    badge: 'مدیریت مدرسه',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-transparent',
    borderClass: 'border-blue-200 hover:border-blue-400 dark:border-blue-800/80 dark:hover:border-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25',
    highlights: ['برنامه هفتگی کلاس‌ها', 'گروه‌بندی عادلانه دانش‌آموزان', 'چارت تدریس معلمان', 'مدیریت سرویس مدرسه'],
  },
  {
    id: 'teacher',
    title: 'امکانات و ابزارهای معلمان',
    shortLabel: 'معلم',
    subtitle: 'آزمایشگاه، آزمون‌ساز، طرح درس و کلاس',
    description:
      'آزمایشگاه مجازی علوم برای تدریس تعاملی، آزمون‌ساز هوشمند و بانک سوالات، طراحی و ثبت طرح درس جلسات و حضور و غیاب.',
    icon: '🧑‍🏫',
    badge: 'ویژه معلمان',
    gradient: 'from-purple-500/10 via-violet-500/5 to-transparent dark:from-purple-900/20 dark:via-violet-900/10 dark:to-transparent',
    borderClass: 'border-purple-200 hover:border-purple-400 dark:border-purple-800/80 dark:hover:border-purple-700',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    btnClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25',
    highlights: ['آزمایشگاه مجازی علوم', 'بانک سوال و آزمون‌ساز هوشمند', 'طرح درس جلسات با استاندارد رسمی', 'حضور و غیاب کلاسی'],
  },
  {
    id: 'student',
    title: 'باشگاه بازی‌های دانایی و مهارت',
    shortLabel: 'دانش‌آموز',
    subtitle: 'یادگیری، سرگرمی و رقابت',
    description:
      'مجموعه کامل بازی‌های هوش، تخته‌ای، مهارتی و پازل پیوندخورده با کتب درسی؛ حل سوالات درسی برای کسب سکه، جان و لیگ فصلی.',
    icon: '🎮',
    badge: 'سرگرمی علمی',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-transparent',
    borderClass: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-800/80 dark:hover:border-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
    highlights: ['باشگاه بازی‌های فکری و مهارتی', 'چالش سوالات درسی برای کسب سکه', 'مدال‌ها و لیگ فصلی قهرمانان', 'رقابت‌های هوش و سرگرمی'],
  },
  {
    id: 'parent',
    title: 'امکانات اولیا و خانواده‌ها',
    shortLabel: 'اولیا',
    subtitle: 'ارتباط مستمر خانه و مدرسه',
    description:
      'آزمایشگاه مجازی علوم برای انجام آزمایش‌های جذاب همراه با فرزند در منزل، دریافت دعوت‌نامه‌های رسمی جلسات و پیگیری امور آموزشی.',
    icon: '👨‍👩‍👧‍👦',
    badge: 'ارتباط با مدرسه',
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-900/20 dark:via-orange-900/10 dark:to-transparent',
    borderClass: 'border-amber-200 hover:border-amber-400 dark:border-amber-800/80 dark:hover:border-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
    highlights: ['آزمایشگاه مجازی علوم در منزل', 'دعوت‌نامه‌های رسمی جلسات', 'پیگیری وضعیت تحصیلی', 'ارتباط مستمر با مدرسه'],
  },
]

function countForAudience(audienceId: 'all' | FeatureAudience): number {
  if (audienceId === 'all') return 4
  if (audienceId === 'student') return CHOGAN_GAMES.length
  return SITE_FEATURES.filter((f) => f.audiences.includes(audienceId)).length
}

// تشخیص نقش اصلی ویژگی برای اعمال رنگ اختصاصی
function getFeatureRole(feature: SiteFeature): FeatureAudience {
  if (selectedTab.value !== 'all') {
    return selectedTab.value
  }
  if (feature.audiences.includes('teacher') && feature.audiences.length === 1) return 'teacher'
  if (feature.audiences.includes('admin') && feature.audiences.length === 1) return 'admin'
  if (feature.audiences.includes('parent') && feature.audiences.length === 1) return 'parent'
  if (feature.audiences.includes('student')) return 'student'
  return feature.audiences[0] || 'admin'
}

// سیستم رنگ‌بندی اختصاصی هر نقش
const ROLE_THEMES: Record<
  FeatureAudience,
  {
    border: string
    iconBg: string
    badge: string
    primaryBtn: string
    historyBtn: string
  }
> = {
  admin: {
    border: 'border-blue-200/90 hover:border-blue-400 dark:border-blue-900/60 dark:hover:border-blue-700 shadow-blue-500/5',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
    historyBtn: 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50',
  },
  teacher: {
    border: 'border-purple-200/90 hover:border-purple-400 dark:border-purple-900/60 dark:hover:border-purple-700 shadow-purple-500/5',
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25',
    historyBtn: 'border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/50',
  },
  student: {
    border: 'border-emerald-200/90 hover:border-emerald-400 dark:border-emerald-900/60 dark:hover:border-emerald-700 shadow-emerald-500/5',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
    historyBtn: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
  },
  parent: {
    border: 'border-amber-200/90 hover:border-amber-400 dark:border-amber-900/60 dark:hover:border-amber-700 shadow-amber-500/5',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
    historyBtn: 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50',
  },
}

// نام فارسی نقش
const ROLE_NAMES: Record<FeatureAudience, string> = {
  admin: 'مدیر و معاون',
  teacher: 'معلم',
  student: 'دانش‌آموز',
  parent: 'اولیا',
}

// فیلتر و جستجوی امکانات
const filteredFeatures = computed(() => {
  let list = [...SITE_FEATURES]

  // فیلتر بر اساس تب
  if (selectedTab.value !== 'all') {
    list = list.filter((f) => f.audiences.includes(selectedTab.value as FeatureAudience))
  }

  // فیلتر بر اساس جستجو
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((f) =>
      f.title.toLowerCase().includes(q) ||
      f.shortTitle.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.startLabel.toLowerCase().includes(q) ||
      (f.badge && f.badge.toLowerCase().includes(q)),
    )
  }

  // فیلتر بر اساس وضعیت
  if (statusFilter.value === 'active') {
    list = list.filter((f) => f.status === 'active' && !f.isNew)
  } else if (statusFilter.value === 'new') {
    list = list.filter((f) => f.isNew)
  } else if (statusFilter.value === 'coming-soon') {
    list = list.filter((f) => f.status === 'coming-soon')
  }

  // اولویت‌بندی برای تب معلم: آزمایشگاه، بانک سوالات، طرح درس اول باشند
  if (selectedTab.value === 'teacher') {
    const priority = ['virtual-lab', 'question-bank', 'lesson-plan']
    return list.sort((a, b) => {
      const idxA = priority.indexOf(a.id)
      const idxB = priority.indexOf(b.id)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return 0
    })
  }

  return list
})

function selectAudienceTab(tabId: FeatureAudience): void {
  selectedTab.value = tabId
  searchQuery.value = ''
  statusFilter.value = 'all'
}

function clearFilters(): void {
  searchQuery.value = ''
  statusFilter.value = 'all'
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors" dir="rtl">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <!-- سربرگ صفحه ابزارها -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur dark:border-brand-500/30 dark:bg-ink-900/80 dark:text-brand-300 mb-3">
          <span class="flex h-2 w-2 rounded-full bg-brand-600"></span>
          میز کار و ابزارهای جامع مدرسه
        </div>
        <h1 class="text-2xl font-black text-ink-900 sm:text-4xl dark:text-white">امکانات و ابزارهای مدیریار</h1>
        <p class="mt-2 text-sm text-ink-600 dark:text-ink-400 max-w-2xl mx-auto">
          سامانه یکپارچه آموزشی و اجرایی ویژه کادر مدرسه، معلمان، اولیا و دانش‌آموزان
        </p>

        <!-- کادر جستجو و فیلتر -->
        <div class="mt-6 mx-auto max-w-xl">
          <div class="relative flex items-center">
            <span class="absolute right-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجو در عنوان، شرح یا امکانات ابزارها..."
              class="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-12 pl-10 text-xs sm:text-sm font-medium text-slate-800 shadow-xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-800 dark:bg-ink-900 dark:text-white dark:focus:border-brand-400"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute left-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>

          <!-- فیلترهای وضعیت سریع -->
          <div class="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <button
              type="button"
              class="rounded-xl px-3 py-1 font-semibold transition cursor-pointer"
              :class="statusFilter === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-400'"
              @click="statusFilter = 'all'"
            >
              همه وضعیت‌ها
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-1 font-semibold transition cursor-pointer"
              :class="statusFilter === 'active' ? 'bg-brand-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-400'"
              @click="statusFilter = 'active'"
            >
              آماده استفاده
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-1 font-semibold transition cursor-pointer"
              :class="statusFilter === 'new' ? 'bg-emerald-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-400'"
              @click="statusFilter = 'new'"
            >
              امکانات جدید
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-1 font-semibold transition cursor-pointer"
              :class="statusFilter === 'coming-soon' ? 'bg-amber-600 text-white' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-400'"
              @click="statusFilter = 'coming-soon'"
            >
              به‌زودی
            </button>
          </div>
        </div>

        <!-- تب‌های نقش‌ها (Role Tabs) -->
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            v-for="tab in AUDIENCE_TABS"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer"
            :class="
              selectedTab === tab.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
            "
            @click="selectedTab = tab.id"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path :d="tab.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ tab.shortLabel }}</span>
            <span
              class="rounded-full px-1.5 py-0.2 text-[10px] font-bold"
              :class="selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
            >
              {{ countForAudience(tab.id) }}
            </span>
          </button>
        </div>
      </div>

      <!-- ۱. حالت نمایش همه (بدون سرچ): ۴ باکس تفکیک‌شده معرفی نقش‌ها با رنگ‌های مجزا -->
      <div v-if="selectedTab === 'all' && !searchQuery.trim() && statusFilter === 'all'" class="grid gap-6 sm:grid-cols-2">
        <div
          v-for="role in ROLE_GATEWAY_CARDS"
          :key="role.id"
          class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-ink-900 cursor-pointer"
          :class="role.borderClass"
          @click="selectAudienceTab(role.id)"
        >
          <!-- گرادیان ملایم پس‌زمینه با رنگ اختصاصی نقش -->
          <div
            class="absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100 pointer-events-none"
            :class="role.gradient"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between">
              <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm dark:bg-ink-800 group-hover:scale-110 transition-transform">
                {{ role.icon }}
              </span>
              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="role.badgeClass"
              >
                {{ role.badge }}
              </span>
            </div>

            <h3 class="mt-5 text-xl font-black text-ink-900 dark:text-white">
              {{ role.title }}
            </h3>
            <p class="mt-1 text-xs font-semibold text-ink-400">
              {{ role.subtitle }}
            </p>
            <p class="mt-3 text-xs leading-6 text-ink-600 dark:text-ink-300">
              {{ role.description }}
            </p>

            <!-- سرفصل‌های شاخص نقش -->
            <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-100/80 pt-4 dark:border-ink-800">
              <span
                v-for="h in role.highlights"
                :key="h"
                class="rounded-lg bg-slate-100 px-2.5 py-1 text-11px font-medium text-slate-700 dark:bg-ink-800 dark:text-ink-300"
              >
                ✓ {{ h }}
              </span>
            </div>
          </div>

          <div class="relative z-10 mt-6 pt-2">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs cursor-pointer"
              :class="role.btnClass"
              @click.stop="selectAudienceTab(role.id)"
            >
              <span>مشاهده و مدیریت امکانات {{ role.shortLabel }}</span>
              <span class="group-hover:translate-x-1 transition-transform">←</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ۲. حالت تب نقش انتخابی یا هنگام فیلتر/جستجو: گرید ابزارها با رنگ اختصاصی هر نقش -->
      <div v-else class="space-y-6">
        <!-- پیام نتایج جستجو -->
        <div v-if="searchQuery || statusFilter !== 'all'" class="flex items-center justify-between rounded-2xl bg-white p-4 shadow-xs border border-slate-200 dark:bg-ink-900 dark:border-ink-800 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-700 dark:text-ink-200">
              یافته‌ها: {{ filteredFeatures.length }} ابزار
            </span>
            <span v-if="searchQuery" class="text-slate-500">
              برای عبارت «{{ searchQuery }}»
            </span>
          </div>
          <button
            type="button"
            class="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400 cursor-pointer"
            @click="clearFilters"
          >
            پاک کردن فیلترها ✕
          </button>
        </div>

        <!-- در تب دانش‌آموز: کارت دعوت ویژه به باشگاه بازی‌های دانایی -->
        <div
          v-if="selectedTab === 'student'"
          class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-ink-900 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20"
        >
          <div class="relative z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div class="space-y-2 max-w-xl">
              <div class="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span>🎮</span>
                <span>باشگاه بازی‌های دانایی و مهارت</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black">مجموعه کامل بازی‌های فکری، تخته‌ای و مهارتی</h2>
              <p class="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                بازی‌های متنوع پیوندخورده با کتب درسی؛ پاسخ به سوالات برای دریافت حرکت و پیشرفت در لیگ قهرمانان!
              </p>
            </div>
            <RouterLink
              to="/games"
              class="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs sm:text-sm font-black text-emerald-950 shadow-lg hover:bg-emerald-50 transition cursor-pointer"
            >
              <span>ورود به باشگاه بازی‌ها</span>
              <span>←</span>
            </RouterLink>
          </div>
        </div>

        <!-- گرید ابزارها -->
        <div v-if="filteredFeatures.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in filteredFeatures"
            :key="feature.id"
            class="relative flex flex-col rounded-3xl border bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-ink-900"
            :class="[
              ROLE_THEMES[getFeatureRole(feature)].border,
              feature.status === 'coming-soon' ? 'opacity-85' : '',
            ]"
          >
            <div class="flex items-center justify-between">
              <!-- آیکون ابزار با رنگ متناسب با نقش -->
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                :class="
                  feature.status === 'coming-soon'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : ROLE_THEMES[getFeatureRole(feature)].iconBg
                "
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <path :d="feature.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <!-- نشان نقش یا برچسب ویژگی -->
              <div class="flex items-center gap-1.5">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  :class="ROLE_THEMES[getFeatureRole(feature)].badge"
                >
                  {{ ROLE_NAMES[getFeatureRole(feature)] }}
                </span>
                <span
                  v-if="feature.badge"
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  :class="
                    feature.status === 'coming-soon'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  "
                >
                  {{ feature.badge }}
                </span>
              </div>
            </div>

            <h2 class="mt-4 text-base font-bold text-ink-900 dark:text-white">{{ feature.title }}</h2>
            <p class="mt-2 flex-1 text-xs leading-6 text-slate-600 dark:text-ink-400">{{ feature.description }}</p>

            <div class="mt-5 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
              <template v-if="feature.status === 'coming-soon'">
                <button
                  type="button"
                  disabled
                  class="flex-1 cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2.5 text-center text-xs font-bold text-slate-400 dark:bg-ink-800 dark:text-ink-500"
                >
                  {{ feature.startLabel }}
                </button>
              </template>
              <template v-else>
                <RouterLink
                  :to="feature.startPath"
                  class="flex-1 rounded-xl px-4 py-2.5 text-center text-xs font-bold transition shadow-xs cursor-pointer"
                  :class="ROLE_THEMES[getFeatureRole(feature)].primaryBtn"
                >
                  {{ feature.startLabel }}
                </RouterLink>
                <RouterLink
                  v-if="feature.historyPath && feature.historyPath !== feature.startPath"
                  :to="feature.historyPath"
                  class="rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer"
                  :class="ROLE_THEMES[getFeatureRole(feature)].historyBtn"
                >
                  تاریخچه
                </RouterLink>
              </template>
            </div>
          </div>
        </div>

        <!-- پیام عدم یافتن نتیجه در جستجو -->
        <div v-else class="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-ink-800">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-ink-900">
            🔍
          </div>
          <h3 class="mt-3 text-sm font-bold text-slate-800 dark:text-white">هیچ ابزاری با این مشخصات یافت نشد</h3>
          <p class="mt-1 text-xs text-slate-500 dark:text-ink-400">
            لطفاً عبارت دیگری را جستجو کرده یا فیلترها را بازنشانی کنید.
          </p>
          <button
            type="button"
            class="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition cursor-pointer"
            @click="clearFilters"
          >
            نمایش همه ابزارها
          </button>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
