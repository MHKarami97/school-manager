<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCelebrationsStore } from '../stores/celebrations'
import { CELEBRATION_STATUS_LABELS, CELEBRATION_STATUS_BADGE_CLASSES } from '../config/celebration.config'
import {
  buildJalaliYearCalendar,
  celebrationYearsPresent,
  jalaaliDateLabel,
  matchesStatusFilter,
  openTasksCountOf,
  overdueTasksOf,
  sortCelebrationsByDate,
  type CelebrationCalendarStatusFilter,
} from '../utils/celebration-helpers'
import { todayJalaali, JALAALI_MONTH_NAMES } from '../utils/jalaali'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import CelebrationYearCalendar from '../components/celebrations/CelebrationYearCalendar.vue'
import PrintableCelebrationYearCalendar from '../components/celebrations/PrintableCelebrationYearCalendar.vue'
import type { Celebration } from '../types'

const celebrationsStore = useCelebrationsStore()
onMounted(() => celebrationsStore.loadFromDb())

const viewMode = ref<'list' | 'calendar'>('list')

const sortedCelebrations = computed(() => sortCelebrationsByDate(celebrationsStore.items))

const celebrationsWithOverdueTasks = computed(() =>
  sortedCelebrations.value
    .map((celebration) => ({ celebration, overdue: overdueTasksOf(celebration) }))
    .filter((item) => item.overdue.length > 0),
)

async function deleteCelebration(id: string): Promise<void> {
  if (!confirm('این جشن حذف شود؟')) return
  await celebrationsStore.remove(id)
}

// --- تقویم کلی سالانه ---------------------------------------------------
const selectedYear = ref(todayJalaali().jy)
const monthFilter = ref<'all' | number>('all')
const statusFilter = ref<CelebrationCalendarStatusFilter>('all')
const selectedDayCelebrations = ref<Celebration[]>([])
const isPrintingCalendar = ref(false)

const availableYears = computed(() => {
  const years = celebrationYearsPresent(celebrationsStore.items)
  if (!years.includes(selectedYear.value)) years.push(selectedYear.value)
  return [...years].sort((a, b) => a - b)
})

function goPrevYear(): void {
  selectedYear.value -= 1
}

function goNextYear(): void {
  selectedYear.value += 1
}

const statusFilteredCelebrations = computed(() =>
  celebrationsStore.items.filter((celebration) => matchesStatusFilter(celebration, statusFilter.value)),
)

const yearCalendarMonths = computed(() => {
  const months = buildJalaliYearCalendar(statusFilteredCelebrations.value, selectedYear.value)
  return monthFilter.value === 'all' ? months : months.filter((month) => month.jm === monthFilter.value)
})

function openDay(celebrations: Celebration[]): void {
  selectedDayCelebrations.value = celebrations
}

function closeDayPanel(): void {
  selectedDayCelebrations.value = []
}

async function handlePrintCalendar(): Promise<void> {
  isPrintingCalendar.value = true
  await nextTick()
  printPage()
  window.addEventListener(
    'afterprint',
    () => {
      isPrintingCalendar.value = false
    },
    { once: true },
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">برنامه‌ریزی جشن‌ها</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ celebrationsStore.items.length }} جشن ثبت‌شده</p>
        </div>
        <RouterLink
          to="/celebrations/new"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + جشن جدید
        </RouterLink>
      </div>

      <div class="mb-4 flex gap-2 print:hidden">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            viewMode === 'list'
              ? 'bg-ink-900 text-white dark:bg-brand-600'
              : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
          "
          @click="viewMode = 'list'"
        >
          فهرست
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            viewMode === 'calendar'
              ? 'bg-ink-900 text-white dark:bg-brand-600'
              : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
          "
          @click="viewMode = 'calendar'"
        >
          تقویم کل سال
        </button>
      </div>

      <div
        v-if="celebrationsWithOverdueTasks.length"
        class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700 print:hidden dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300"
      >
        <p class="mb-2 font-semibold">هشدار کارهای عقب‌افتاده</p>
        <p v-for="item in celebrationsWithOverdueTasks" :key="item.celebration.id">
          {{ item.celebration.title }}: {{ item.overdue.length }} کار عقب‌افتاده
        </p>
      </div>

      <div
        v-if="!sortedCelebrations.length"
        class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center print:hidden dark:border-ink-700 dark:bg-ink-900"
      >
        <p class="text-ink-500 dark:text-ink-400">هنوز جشنی ثبت نشده است.</p>
        <RouterLink
          to="/celebrations/new"
          class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          ثبت اولین جشن
        </RouterLink>
      </div>

      <!-- ===================== نمای فهرست ===================== -->
      <div v-else-if="viewMode === 'list'" class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="celebration in sortedCelebrations"
          :key="celebration.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ celebration.title }}</p>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-sm font-medium"
                :class="CELEBRATION_STATUS_BADGE_CLASSES[celebration.status]"
              >
                {{ CELEBRATION_STATUS_LABELS[celebration.status] }}
              </span>
            </div>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              {{ jalaaliDateLabel(celebration.date) }} - {{ celebration.location || '—' }}
            </p>
            <p class="mb-3 text-sm text-ink-400 dark:text-ink-500">مسئول: {{ celebration.organizer || '—' }}</p>
            <div class="mb-3 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
              <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ openTasksCountOf(celebration) }} کار باز</span>
              <span
                v-if="overdueTasksOf(celebration).length"
                class="rounded-lg bg-red-50 px-2 py-1 text-red-600 dark:bg-red-900/10 dark:text-red-400"
              >
                {{ overdueTasksOf(celebration).length }} عقب‌افتاده
              </span>
            </div>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink
                :to="`/celebrations/${celebration.id}`"
                class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                مشاهده و مدیریت
              </RouterLink>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteCelebration(celebration.id)">
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== نمای تقویم کل سال ===================== -->
      <div v-else>
        <div class="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 print:hidden dark:border-ink-800 dark:bg-ink-900">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-ink-200 px-2 py-1.5 text-xs text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              @click="goPrevYear"
            >
              سال قبل
            </button>
            <select
              v-model.number="selectedYear"
              class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
            <button
              type="button"
              class="rounded-lg border border-ink-200 px-2 py-1.5 text-xs text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              @click="goNextYear"
            >
              سال بعد
            </button>
          </div>

          <select
            v-model="monthFilter"
            class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          >
            <option value="all">همه ماه‌ها</option>
            <option v-for="(name, index) in JALAALI_MONTH_NAMES" :key="name" :value="index + 1">{{ name }}</option>
          </select>

          <select
            v-model="statusFilter"
            class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          >
            <option value="all">همه جشن‌ها</option>
            <option value="remaining">جشن‌های مانده</option>
            <option value="held">جشن‌های برگزار شده</option>
          </select>

          <button
            type="button"
            class="mr-auto rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
            @click="handlePrintCalendar"
          >
            چاپ / خروجی PDF
          </button>
        </div>

        <div
          v-if="selectedDayCelebrations.length"
          class="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-xs print:hidden dark:border-brand-900/30 dark:bg-brand-900/10"
        >
          <div class="mb-2 flex items-center justify-between">
            <p class="font-semibold text-brand-700 dark:text-brand-300">جشن‌های این روز</p>
            <button type="button" class="text-ink-500 hover:text-ink-800 dark:text-ink-400" @click="closeDayPanel">✕</button>
          </div>
          <RouterLink
            v-for="celebration in selectedDayCelebrations"
            :key="celebration.id"
            :to="`/celebrations/${celebration.id}`"
            class="mb-1 block rounded-lg bg-white px-3 py-2 text-ink-700 hover:border-brand-300 dark:bg-ink-900 dark:text-ink-200"
          >
            {{ celebration.title }} - {{ CELEBRATION_STATUS_LABELS[celebration.status] }}
          </RouterLink>
        </div>

        <div class="print:hidden">
          <CelebrationYearCalendar :months="yearCalendarMonths" :jy="selectedYear" @open-day="openDay" />
        </div>

        <div v-if="isPrintingCalendar" id="print-root" class="hidden print:block">
          <PrintableCelebrationYearCalendar :months="yearCalendarMonths" :jy="selectedYear" />
        </div>
      </div>
    </div>
  </div>
</template>
