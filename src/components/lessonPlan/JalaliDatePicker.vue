<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  JALAALI_MONTH_NAMES,
  JALAALI_WEEKDAY_NAMES,
  isoStringToJalaali,
  jalaaliMonthLength,
  jalaaliToIsoString,
  formatJalaaliDate,
  todayJalaali,
  type JalaaliDate,
} from '@/utils/jalaali'

const modelValue = defineModel<string>({ default: '' })

const isOpen = ref(false)

const selected = computed<JalaaliDate | null>(() =>
  modelValue.value ? isoStringToJalaali(modelValue.value) : null,
)

const today = todayJalaali()
const viewYear = ref(selected.value?.jy ?? today.jy)
const viewMonth = ref(selected.value?.jm ?? today.jm)

function openPicker(): void {
  viewYear.value = selected.value?.jy ?? today.jy
  viewMonth.value = selected.value?.jm ?? today.jm
  isOpen.value = true
}

function closePicker(): void {
  isOpen.value = false
}

function goPrevMonth(): void {
  if (viewMonth.value === 1) {
    viewMonth.value = 12
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function goNextMonth(): void {
  if (viewMonth.value === 12) {
    viewMonth.value = 1
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

const daysInMonth = computed(() => jalaaliMonthLength(viewYear.value, viewMonth.value))
const dayCells = computed(() => Array.from({ length: daysInMonth.value }, (_, i) => i + 1))

function selectDay(day: number): void {
  modelValue.value = jalaaliToIsoString(viewYear.value, viewMonth.value, day)
  closePicker()
}

function selectToday(): void {
  modelValue.value = jalaaliToIsoString(today.jy, today.jm, today.jd)
  closePicker()
}

function isSelectedDay(day: number): boolean {
  return (
    !!selected.value &&
    selected.value.jy === viewYear.value &&
    selected.value.jm === viewMonth.value &&
    selected.value.jd === day
  )
}

function isTodayDay(day: number): boolean {
  return today.jy === viewYear.value && today.jm === viewMonth.value && today.jd === day
}

const displayText = computed(() =>
  selected.value ? formatJalaaliDate(selected.value) : 'انتخاب تاریخ',
)
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-right text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
      @click="openPicker"
    >
      {{ displayText }}
    </button>

    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closePicker"></div>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 w-64 rounded-xl border border-ink-200 bg-white p-3 shadow-lg dark:border-ink-700 dark:bg-ink-900"
    >
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
          @click="goPrevMonth"
        >
          ‹
        </button>
        <span class="text-xs font-semibold text-ink-700 dark:text-ink-200">
          {{ JALAALI_MONTH_NAMES[viewMonth - 1] }} {{ viewYear }}
        </span>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
          @click="goNextMonth"
        >
          ›
        </button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-1 text-center text-10px text-ink-400 dark:text-ink-500">
        <span v-for="w in JALAALI_WEEKDAY_NAMES" :key="w">{{ w.slice(0, 1) }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in dayCells"
          :key="day"
          type="button"
          class="rounded-lg py-1.5 text-sm transition"
          :class="[
            isSelectedDay(day)
              ? 'bg-brand-600 font-semibold text-white'
              : isTodayDay(day)
                ? 'border border-brand-300 text-brand-600 dark:text-brand-400'
                : 'text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800',
          ]"
          @click="selectDay(day)"
        >
          {{ day }}
        </button>
      </div>

      <button
        type="button"
        class="mt-2 w-full rounded-lg border border-ink-200 py-1.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
        @click="selectToday"
      >
        امروز
      </button>
    </div>
  </div>
</template>
