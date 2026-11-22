<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES, AUDIENCE_TABS, type FeatureAudience, type SiteFeature } from '@/config/features.config'
import { CHOGAN_GAMES, CHOGAN_CATEGORIES, getGamePlayRoute, type GameCategory } from '@/config/chogan-games.config'

const selectedTab = ref<'all' | FeatureAudience>('all')

// برای تب دانش‌آموز: جستجو و فیلتر بازی‌ها
const studentGameSearch = ref('')
const studentGameCategory = ref<'all' | GameCategory>('all')
const studentGamesPage = ref(1)
const studentGamesPerPage = 16

const allStudentGames = computed(() => {
  let list = CHOGAN_GAMES
  if (studentGameCategory.value !== 'all') {
    list = list.filter((g) => g.category === studentGameCategory.value)
  }
  const q = studentGameSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter((g) =>
      g.nameFa.toLowerCase().includes(q) ||
      g.nameEn.toLowerCase().includes(q) ||
      g.summaryFa.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q)
    )
  }
  return list
})

const paginatedStudentGames = computed(() => {
  const start = (studentGamesPage.value - 1) * studentGamesPerPage
  return allStudentGames.value.slice(start, start + studentGamesPerPage)
})

const studentTotalPages = computed(() =>
  Math.ceil(allStudentGames.value.length / studentGamesPerPage) || 1
)

// فیلتر امکانات برای نقش‌های معلم، مدیر و اولیا
const filteredFeatures = computed(() => {
  if (selectedTab.value === 'all' || selectedTab.value === 'student') {
    return []
  }
  const list = SITE_FEATURES.filter((f) => f.audiences.includes(selectedTab.value as FeatureAudience))

  // برای معلم: آزمایشگاه، بانک سوالات و طرح درس اول لیست باشند
  if (selectedTab.value === 'teacher') {
    const priority = ['virtual-lab', 'question-bank', 'lesson-plan']
    return [...list].sort((a, b) => {
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

function countForAudience(audienceId: 'all' | FeatureAudience): number {
  if (audienceId === 'all') return 4
  if (audienceId === 'student') return CHOGAN_GAMES.length
  return SITE_FEATURES.filter((f) => f.audiences.includes(audienceId)).length
}

function isTeacherStyled(feature: SiteFeature): boolean {
  return selectedTab.value === 'teacher' || (feature.audiences.length === 1 && feature.audiences[0] === 'teacher')
}

const audiencePillMap: Record<FeatureAudience, { label: string; class: string }> = {
  admin: { label: 'مدیر و معاون', class: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  teacher: { label: 'معلم', class: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' },
  parent: { label: 'اولیا', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  student: { label: 'دانش‌آموز', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
}

// باکس‌های معرفی نقش‌ها در حالت نمایش همه
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

function selectAudienceTab(tabId: FeatureAudience): void {
  selectedTab.value = tabId
  const el = document.getElementById('features')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

function scrollToFeatures(): void {
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

            <!-- تیتر اصلی -->
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
              </RouterLink>

              <RouterLink
                to="/games"
                class="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-50 px-6 py-3.5 text-center text-sm font-semibold text-purple-800 transition hover:bg-purple-100 sm:w-auto dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                <span>🎮</span>
                <span>باشگاه بازی‌های دانایی</span>
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
                بخش ویژه معلمان و اولیا
              </div>
              <h2 class="text-2xl font-black sm:text-3xl">آزمایشگاه مجازی علوم؛ شبیه‌سازی زنده و بدون نیاز به تجهیزات</h2>
              <p class="text-xs leading-6 text-emerald-100/90 sm:text-sm sm:leading-7">
                معلمان در کلاس درس و اولیا در منزل می‌توانند مفاهیم فیزیک، شیمی و زیست‌شناسی را با شبیه‌سازهای تعاملی و دقیق در محیط مرورگر، به صورت کاملاً زنده و ایمن آزمایش کنند.
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

      <!-- بخش کارت ویژه باشگاه بازی‌های دانایی (Games Hub Banner) -->
      <section class="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-950 p-6 sm:p-10 text-white shadow-xl shadow-indigo-950/20">
          <div class="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div class="max-w-2xl space-y-3">
              <div class="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300">
                <span class="h-2 w-2 rounded-full bg-brand-400 animate-pulse"></span>
                باشگاه بازی‌های دانایی و مهارت
              </div>
              <h2 class="text-2xl font-black sm:text-3xl">دنیای بازی‌های هوش، تخته‌ای و مهارتی پیوندخورده با کتب درسی</h2>
              <p class="text-xs leading-6 text-indigo-100/90 sm:text-sm sm:leading-7">
                مجموعه‌ای کامل از بازی‌های اصیل (مار و پله، منچ، شطرنج، ماز، سودوکو و...)؛ دانش‌آموزان با حل سوالات درسی سکه، جان و امتیاز کسب می‌کنند و در لیگ فصلی قهرمانان رقابت می‌نمایند.
              </p>
            </div>

            <!-- دکمه با متن مشکی کاملاً خوانا و بدون رنگ سفید نامناسب -->
            <RouterLink
              to="/games"
              class="flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black shadow-lg shadow-black/20 transition hover:scale-105 cursor-pointer"
              style="background-color: #ffffff !important; color: #0f172a !important;"
            >
              <span class="font-black" style="color: #0f172a !important;">ورود به باشگاه بازی‌ها</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4" style="color: #0f172a !important;">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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

        <!-- تب‌های نقش‌ها (واکنش‌گرا و اسکرول‌پذیر در موبایل) -->
        <div class="mt-8 -mx-4 flex items-center overflow-x-auto px-4 pb-3 pt-1 scrollbar-none sm:mx-0 sm:justify-center sm:px-0">
          <div class="inline-flex w-max shrink-0 items-center gap-1.5 rounded-2xl border border-ink-200/80 bg-white/70 p-1.5 shadow-xs backdrop-blur sm:gap-2 dark:border-ink-800 dark:bg-ink-900/80">
            <button
              v-for="tab in AUDIENCE_TABS"
              :key="tab.id"
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs cursor-pointer"
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
                class="rounded-full px-1.5 py-0.2 text-[10px] font-bold"
                :class="selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
              >
                {{ countForAudience(tab.id) }}
              </span>
            </button>
          </div>
        </div>

        <!-- ۱. حالت نمایش همه: ۴ باکس تفکیک‌شده معرفی نقش‌ها (برای جلوگیری از شلوغی) -->
        <div v-if="selectedTab === 'all'" class="mt-8 grid gap-6 sm:grid-cols-2">
          <div
            v-for="role in ROLE_GATEWAY_CARDS"
            :key="role.id"
            class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-ink-900 cursor-pointer"
            :class="role.borderClass"
            @click="selectAudienceTab(role.id)"
          >
            <!-- گرادیان ملایم پس‌زمینه -->
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
                <span>مشاهده امکانات و بخش‌های {{ role.shortLabel }}</span>
                <span class="group-hover:translate-x-1 transition-transform">←</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ۲. حالت تب دانش‌آموز: بازی‌ها مستقیماً در بالای صفحه با چینش یکدست و مشابه تب‌های دیگر -->
        <div v-else-if="selectedTab === 'student'" class="mt-8">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 dark:border-ink-800">
              <div>
                <h3 class="text-xl font-black text-ink-900 dark:text-white flex items-center gap-2">
                  <span>🎮</span>
                  <span>باشگاه و تالار بازی‌های دانایی</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-ink-400 mt-1">
                  مجموعه کامل بازی‌های فکری، تخته‌ای و مهارتی؛ با پاسخ به سوالات درسی سکه و جان کسب کرده و بازی را به پیش ببرید.
                </p>
              </div>

              <!-- فیلد جستجوی سریع بازی و لینک تمام‌صفحه -->
              <div class="flex items-center gap-2">
                <input
                  v-model="studentGameSearch"
                  type="text"
                  placeholder="جستجوی نام بازی..."
                  class="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                />
                <RouterLink
                  to="/games"
                  class="shrink-0 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
                >
                  نمای تمام‌صفحه تالار بازی‌ها ←
                </RouterLink>
              </div>
            </div>

            <!-- فیلتر دسته‌بندی موضوعی بازی‌ها -->
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <button
                v-for="cat in CHOGAN_CATEGORIES"
                :key="cat.id"
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                :class="
                  studentGameCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-300'
                "
                @click="studentGameCategory = cat.id; studentGamesPage = 1"
              >
                {{ cat.titleFa }} ({{ cat.count }})
              </button>
            </div>

            <!-- گرید تمام کارت‌های بازی -->
            <div class="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <RouterLink
                v-for="g in paginatedStudentGames"
                :key="g.id"
                :to="getGamePlayRoute(g)"
                class="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs transition hover:-translate-y-1 hover:border-brand-500/50 hover:bg-white hover:shadow-md dark:border-ink-800 dark:bg-ink-800/40 dark:hover:bg-ink-800"
              >
                <div>
                  <div class="flex items-start justify-between">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 transition group-hover:scale-105"
                      :style="{ backgroundColor: g.soft || '#f1f5f9' }"
                    >
                      <img :src="g.iconUrl" :alt="g.nameFa" class="h-7 w-7 object-contain" loading="lazy" />
                    </div>
                    <span class="rounded-md bg-white px-2 py-0.5 text-9px font-bold text-slate-600 dark:bg-ink-700 dark:text-ink-200 shadow-2xs">
                      {{ g.categoryFa }}
                    </span>
                  </div>
                  <h4 class="mt-3 text-sm font-bold text-ink-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                    {{ g.nameFa }}
                  </h4>
                  <p class="mt-1.5 text-xs text-slate-600 dark:text-ink-300 line-clamp-2 leading-relaxed">
                    {{ g.summaryFa }}
                  </p>
                </div>
                <div class="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-2.5 dark:border-ink-700/60">
                  <span class="text-xs font-bold text-brand-600 dark:text-brand-400">شروع بازی</span>
                  <span class="text-xs text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">←</span>
                </div>
              </RouterLink>
            </div>

            <!-- صفحه‌بندی بازی‌ها -->
            <div v-if="studentTotalPages > 1" class="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 dark:border-ink-800">
              <button
                type="button"
                class="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-ink-300 disabled:opacity-40 cursor-pointer"
                :disabled="studentGamesPage === 1"
                @click="studentGamesPage--"
              >
                قبلی
              </button>
              <button
                v-for="p in studentTotalPages"
                :key="p"
                type="button"
                class="h-7 w-7 rounded-lg text-xs font-bold transition cursor-pointer"
                :class="studentGamesPage === p ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300'"
                @click="studentGamesPage = p"
              >
                {{ p }}
              </button>
              <button
                type="button"
                class="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-ink-300 disabled:opacity-40 cursor-pointer"
                :disabled="studentGamesPage === studentTotalPages"
                @click="studentGamesPage++"
              >
                بعدی
              </button>
            </div>
          </div>
        </div>

        <!-- ۳. حالت سایر نقش‌ها (معلم، مدیر، اولیا) با رنگ متمایز بنفش برای معلمان -->
        <div v-else class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in filteredFeatures"
            :key="feature.id"
            class="group relative flex flex-col rounded-2xl border bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-md dark:bg-ink-900"
            :class="[
              isTeacherStyled(feature)
                ? 'border-purple-200 hover:border-purple-400 dark:border-purple-900/60 dark:hover:border-purple-700'
                : feature.isNew
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
                  isTeacherStyled(feature)
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                    : feature.isNew
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
                  isTeacherStyled(feature)
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : feature.status === 'coming-soon'
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
                    isTeacherStyled(feature)
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                      : feature.isNew
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
    </main>

    <AppFooter />
  </div>
</template>
