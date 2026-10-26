<script setup lang="ts">
import { computed } from 'vue'
import type { SeatLayout } from '@/types'
import { MAX_ROWS, MAX_ROW_SEATS } from '@/config/service.config'
import { capacityOf, validateLayout } from '@/utils/service-domain'
import CarSeatMap from './CarSeatMap.vue'

const layout = defineModel<SeatLayout>({ required: true })

const capacity = computed(() => capacityOf(layout.value))
const problem = computed(() => validateLayout(layout.value))

function setRows(rows: number[]): void {
  layout.value = { rows }
}

function change(index: number, delta: number): void {
  const rows = [...layout.value.rows]
  rows[index] = Math.min(MAX_ROW_SEATS, Math.max(1, rows[index] + delta))
  setRows(rows)
}

function addRow(): void {
  if (layout.value.rows.length >= MAX_ROWS) return
  setRows([...layout.value.rows, 3])
}

function removeRow(index: number): void {
  if (layout.value.rows.length <= 1) return
  setRows(layout.value.rows.filter((_, rowIndex) => rowIndex !== index))
}

function rowLabel(index: number): string {
  return index === 0 ? 'ردیف جلو (کنار راننده)' : `ردیف ${(index + 1).toLocaleString('fa-IR')}`
}
</script>

<template>
  <div class="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
    <p class="mb-1 text-xs font-medium text-ink-600 dark:text-ink-300">
      چیدمان صندلی‌های دانش‌آموزی (بدون راننده) - ظرفیت: {{ capacity.toLocaleString('fa-IR') }} نفر
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <ul class="space-y-2">
        <li v-for="(count, index) in layout.rows" :key="index" class="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-1 dark:bg-ink-800">
          <span class="text-xs text-ink-700 dark:text-ink-200">{{ rowLabel(index) }}</span>
          <span class="flex items-center gap-1">
            <button type="button" class="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 text-lg dark:border-ink-700 dark:text-ink-200" :aria-label="`کم کردن صندلی ${rowLabel(index)}`" @click="change(index, -1)">−</button>
            <span class="w-6 text-center text-sm font-semibold text-ink-800 dark:text-ink-200">{{ count.toLocaleString('fa-IR') }}</span>
            <button type="button" class="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 text-lg dark:border-ink-700 dark:text-ink-200" :aria-label="`اضافه کردن صندلی ${rowLabel(index)}`" @click="change(index, 1)">+</button>
            <button v-if="layout.rows.length > 1" type="button" class="h-11 px-2 text-xs text-red-600 dark:text-red-400" :aria-label="`حذف ${rowLabel(index)}`" @click="removeRow(index)">حذف</button>
          </span>
        </li>
        <li>
          <button type="button" class="min-h-11 w-full rounded-lg border border-dashed border-ink-300 text-xs text-ink-600 dark:border-ink-600 dark:text-ink-300" :disabled="layout.rows.length >= MAX_ROWS" @click="addRow">+ ردیف جدید</button>
        </li>
      </ul>
      <CarSeatMap :layout="layout" />
    </div>
    <p v-if="problem" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ problem }}</p>
  </div>
</template>
