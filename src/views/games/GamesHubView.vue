<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useGameProfilesStore } from '@/stores/game-profiles'
import {
  CHOGAN_GAMES,
  CHOGAN_CATEGORIES,
  getGamePlayRoute,
  type GameCategory,
  type ChoganGame,
} from '@/config/chogan-games.config'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import GameProfileBar from '@/components/games/GameProfileBar.vue'
import GameJourneyModal from '@/components/games/GameJourneyModal.vue'
import GameMedalsModal from '@/components/games/GameMedalsModal.vue'
import GameAnalyticsModal from '@/components/games/GameAnalyticsModal.vue'

const router = useRouter()
const profilesStore = useGameProfilesStore()

// مودال‌های پیشرفت و پروفایل
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

// وضعیت فیلترها
const selectedCategory = ref<'all' | GameCategory>('all')
const searchQuery = ref('')
const selectedPlayers = ref<'all' | '1' | 'multi'>('all')

// صفحه‌بندی
const currentPage = ref(1)
const itemsPerPage = 24

// بازی‌های اختصاصی و منتخب سامانه
const FLAGSHIP_GAMES = [
  {
    id: 'rocket',
    title: 'نبرد موشکی علمی',
    category: 'علمی و پرتابی',
    desc: 'محاسبه زاویه و قدرت پرتاب با حل تست‌های درسی برای ارتقای قدرت تخریب موشک.',
    icon: '🚀',
    color: 'from-cyan-500 to-blue-600',
    path: '/games/rocket',
    badge: 'بازی اختصاصی',
  },
  {
    id: 'tower-defense',
    title: 'برج دفاعی دانایی',
    category: 'استراتژیک',
    desc: 'استقرار و ارتقای برج‌ها و سپرهای جادویی در برابر امواج جهل با پاسخ به سوالات.',
    icon: '🏰',
    color: 'from-amber-500 to-orange-600',
    path: '/games/tower-defense',
    badge: 'بازی اختصاصی',
  },
  {
    id: 'speed-race',
    title: 'مسابقه سرعت ریاضی',
    category: 'سرعتی و رکوردی',
    desc: 'رانندگی پرهیجان در پیست گرندپری با حل ضرب‌های سریع و محاسبات ذهنی.',
    icon: '🏎️',
    color: 'from-emerald-500 to-green-600',
    path: '/games/speed-race',
    badge: 'بازی اختصاصی',
  },
  {
    id: 'conquest',
    title: 'فتح قلمروهای دانش',
    category: 'نقشه و جغرافیا',
    desc: 'سفر روی نقشه ایران و جهان و فتح سرزمین‌ها با پاسخ به سوالات تاریخ، جغرافیا و علوم.',
    icon: '🗺️',
    color: 'from-purple-500 to-indigo-600',
    path: '/games/conquest',
    badge: 'بازی اختصاصی',
  },
]

// فیلتر هوشمند ۹۵ بازی چوگان
const filteredGames = computed(() => {
  let list = CHOGAN_GAMES

  // فیلتر دسته‌بندی
  if (selectedCategory.value !== 'all') {
    list = list.filter((g) => g.category === selectedCategory.value)
  }

  // فیلتر تعداد بازیکن
  if (selectedPlayers.value === '1') {
    list = list.filter((g) => g.people === 1)
  } else if (selectedPlayers.value === 'multi') {
    list = list.filter((g) => g.people > 1)
  }

  // فیلتر متنی جستجو
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((g) => {
      return (
        g.nameFa.toLowerCase().includes(q) ||
        g.nameEn.toLowerCase().includes(q) ||
        g.summaryFa.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
      )
    })
  }

  return list
})

// محاسبه صفحات
const totalPages = computed(() => Math.ceil(filteredGames.value.length / itemsPerPage) || 1)

const paginatedGames = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredGames.value.slice(start, start + itemsPerPage)
})

// بازنشانی صفحه با تغییر فیلتر
watch([selectedCategory, searchQuery, selectedPlayers], () => {
  currentPage.value = 1
})

function selectCategory(catId: 'all' | GameCategory): void {
  selectedCategory.value = catId
}

function clearFilters(): void {
  selectedCategory.value = 'all'
  searchQuery.value = ''
  selectedPlayers.value = 'all'
  currentPage.value = 1
}

function goToPage(page: number): void {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 320, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-ink-900 transition-colors duration-200 dark:bg-ink-950 dark:text-ink-100 flex flex-col justify-between" dir="rtl">
    <AppHeader />

    <main class="flex-1 pb-16">
      <!-- نوار پروفایل و وضعیت دانش‌آموز -->
      <section class="border-b border-slate-200 bg-white/70 backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/70">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <GameProfileBar
            @open-journey="showJourneyModal = true"
            @open-medals="showMedalsModal = true"
            @open-analytics="showAnalyticsModal = true"
          />
        </div>
      </section>

      <!-- بنر قهرمانان و معرفی هاب ۹۵ بازی -->
      <section class="relative overflow-hidden bg-gradient-to-br from-brand-600 via-indigo-700 to-purple-800 px-4 py-10 text-white sm:px-6 sm:py-14 shadow-lg">
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>

        <div class="relative mx-auto max-w-7xl">
          <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div class="max-w-2xl">
              <div class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>باشگاه بازی‌های دانایی و مهارت مدیریار</span>
              </div>
              <h1 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                دنیای بازی، سرگرمی و دانایی
              </h1>
              <p class="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
                مجموعه بازی‌های کلاسیک، تخته‌ای، مهارتی و پازل‌های فکری؛ با حل سوالات کتاب‌های درسی سکه و جان کسب کن، رکورد بزن و مدال‌های فصلی قهرمانی را تصاحب نما!
              </p>
            </div>

            <!-- جعبه آماری سریع -->
            <div class="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div class="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center">
                <div class="text-2xl font-black sm:text-3xl">{{ CHOGAN_GAMES.length }}</div>
                <div class="text-xs text-indigo-100">بازی کامل و آماده</div>
              </div>
              <div class="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center">
                <div class="text-2xl font-black sm:text-3xl">۴</div>
                <div class="text-xs text-indigo-100">تالار دسته‌بندی</div>
              </div>
              <div class="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center">
                <div class="text-2xl font-black sm:text-3xl">۶</div>
                <div class="text-xs text-indigo-100">پایه تحصیلی</div>
              </div>
              <div class="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center">
                <div class="text-2xl font-black sm:text-3xl">۱۰۰٪</div>
                <div class="text-xs text-indigo-100">پیوند با کتب درسی</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- بخش بازی‌های شاخص و اختصاصی سامانه -->
      <section class="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div class="flex items-center justify-between pb-4">
          <div>
            <h2 class="text-xl font-black text-ink-900 sm:text-2xl dark:text-white flex items-center gap-2">
              <span>⭐</span>
              <span>بازی‌های اختصاصی ویژه مدیریار</span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-ink-400 mt-1">
              طراحی اختصاصی با نقشه‌های علمی، ماموریت‌های فصلی و مسابقات تعاملی
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink
            v-for="game in FLAGSHIP_GAMES"
            :key="game.id"
            :to="game.path"
            class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-inner dark:bg-ink-800 group-hover:scale-110 transition-transform">
                  {{ game.icon }}
                </span>
                <span class="rounded-full bg-brand-50 px-2.5 py-1 text-10px font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {{ game.badge }}
                </span>
              </div>
              <h3 class="mt-4 text-base font-bold text-ink-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {{ game.title }}
              </h3>
              <p class="mt-1.5 text-xs text-slate-500 dark:text-ink-400 line-clamp-2 leading-relaxed">
                {{ game.desc }}
              </p>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-ink-800/80">
              <span class="text-xs font-semibold text-brand-600 dark:text-brand-400">ورود به بازی</span>
              <span class="text-xs text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">←</span>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- تالار ۹۵ بازی و فیلترهای موضوعی -->
      <section class="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-5 dark:border-ink-800">
          <div>
            <h2 class="text-2xl font-black text-ink-900 sm:text-3xl dark:text-white flex items-center gap-2">
              <span>🎮</span>
              <span>تالار بازی‌های دانایی و مهارت</span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-ink-400 mt-1">
              از پازل و شطرنج تا مار و پله، برج‌ساز، بیلیارد و سودوکو؛ همراه با چالش‌های سوالات درسی
            </p>
          </div>

          <!-- جعبه جستجوی سریع -->
          <div class="relative w-full md:w-80">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجوی نام بازی (مثلاً: مار و پله، ماز...)"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-xs font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:text-ink-400"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- تب‌های دسته‌بندی موضوعی -->
        <div class="mt-6 flex flex-wrap items-center gap-2">
          <button
            v-for="cat in CHOGAN_CATEGORIES"
            :key="cat.id"
            type="button"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm"
            :class="[
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-brand-600/25 ring-2 ring-brand-500/40'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800 dark:hover:bg-ink-800',
            ]"
            @click="selectCategory(cat.id)"
          >
            <span>{{ cat.titleFa }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-10px font-extrabold"
              :class="selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-400'"
            >
              {{ cat.count }}
            </span>
          </button>

          <!-- فیلتر تعداد بازیکن -->
          <div class="mr-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold dark:border-ink-800 dark:bg-ink-900">
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 transition"
              :class="selectedPlayers === 'all' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500 dark:text-ink-400'"
              @click="selectedPlayers = 'all'"
            >
              همه
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 transition"
              :class="selectedPlayers === '1' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500 dark:text-ink-400'"
              @click="selectedPlayers = '1'"
            >
              تک‌نفره
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-1 transition"
              :class="selectedPlayers === 'multi' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500 dark:text-ink-400'"
              @click="selectedPlayers = 'multi'"
            >
              چندنفر / با هوش مصنوعی
            </button>
          </div>
        </div>

        <!-- نوار وضعیت تعداد نتایج -->
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-ink-400">
          <span>نمایش {{ paginatedGames.length }} بازی از {{ filteredGames.length }} مورد پیدا شده</span>
          <span v-if="totalPages > 1">صفحه {{ currentPage }} از {{ totalPages }}</span>
        </div>

        <!-- گرید کارت‌های بازی -->
        <div v-if="paginatedGames.length > 0" class="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <RouterLink
            v-for="game in paginatedGames"
            :key="game.id"
            :to="getGamePlayRoute(game)"
            class="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <!-- آیکون بازی -->
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-2 transition-transform group-hover:scale-105"
                  :style="{ backgroundColor: game.soft || '#f1f5f9' }"
                >
                  <img
                    :src="game.iconUrl"
                    :alt="game.nameFa"
                    class="h-8 w-8 object-contain"
                    loading="lazy"
                  />
                </div>

                <div class="flex flex-col items-end gap-1">
                  <!-- نشان دسته‌بندی -->
                  <span class="rounded-md bg-slate-100 px-2 py-0.5 text-10px font-semibold text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                    {{ game.categoryFa }}
                  </span>
                  <!-- نشان بازیکن -->
                  <span class="text-9px text-slate-400 dark:text-ink-500">
                    {{ game.people === 1 ? '👤 تک‌نفره' : `👥 ۲ تا ${game.people} نفره` }}
                  </span>
                </div>
              </div>

              <!-- نام فارسی و انگلیسی -->
              <h3 class="mt-3 text-base font-bold text-ink-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors">
                {{ game.nameFa }}
              </h3>
              <p class="text-10px font-medium text-slate-400 dark:text-ink-500" dir="ltr">
                {{ game.nameEn }}
              </p>

              <!-- توضیح کوتاه -->
              <p class="mt-2 text-xs text-slate-600 leading-relaxed dark:text-ink-300 line-clamp-2">
                {{ game.summaryFa || 'بازی آموزشی جذاب با چالش هوش و پاسخ به سوالات کتب درسی.' }}
              </p>
            </div>

            <!-- دکمه شروع بازی -->
            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-ink-800/80">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>چالش دانایی و شروع</span>
              </span>
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 text-xs group-hover:translate-x-1 transition-transform">
                ←
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- پیام عدم وجود نتیجه -->
        <div v-else class="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-ink-800 dark:bg-ink-900">
          <div class="text-4xl">🔍</div>
          <h3 class="mt-3 text-base font-bold text-ink-900 dark:text-white">هیچ بازی با این مشخصات یافت نشد</h3>
          <p class="mt-1 text-xs text-slate-500 dark:text-ink-400">
            لطفاً عبارت دیگری را جستجو کرده یا فیلترها را بازنشانی نمایید.
          </p>
          <button
            type="button"
            class="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
            @click="clearFilters"
          >
            پاک کردن فیلترها
          </button>
        </div>

        <!-- کنترل‌های صفحه‌بندی -->
        <div v-if="totalPages > 1" class="mt-10 flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            صفحه قبلی
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            class="h-9 w-9 rounded-xl text-xs font-bold transition"
            :class="[
              currentPage === p
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800',
            ]"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>

          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            صفحه بعدی
          </button>
        </div>
      </section>
    </main>

    <!-- مودال‌های پیشرفت، مدال‌ها و تحلیل بازی -->
    <GameJourneyModal v-if="showJourneyModal" :is-open="showJourneyModal" @close="showJourneyModal = false" />
    <GameMedalsModal v-if="showMedalsModal" :is-open="showMedalsModal" @close="showMedalsModal = false" />
    <GameAnalyticsModal v-if="showAnalyticsModal" :is-open="showAnalyticsModal" @close="showAnalyticsModal = false" />

    <AppFooter />
  </div>
</template>
