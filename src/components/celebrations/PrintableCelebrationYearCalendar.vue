<script setup lang="ts">
import type { CelebrationYearMonth } from '../../utils/celebration-helpers'

defineProps<{
  months: CelebrationYearMonth[]
  jy: number
}>()

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })

function rowsOf(month: CelebrationYearMonth): number {
  return Math.ceil(month.days.length / 7)
}

function cellOf(month: CelebrationYearMonth, row: number, col: number) {
  return month.days[(row - 1) * 7 + (col - 1)]
}
</script>

<template>
  <div class="celebration-calendar-print p-4 text-ink-900" dir="rtl">
    <div class="mb-3 flex items-center justify-between border-b-2 border-ink-800 pb-2">
      <h1 class="text-base font-bold">تقویم سالانه جشن‌های مدرسه - سال {{ jy }}</h1>
      <p class="text-sm text-ink-500">{{ printDate }}</p>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div v-for="month in months" :key="month.jm" class="break-inside-avoid">
        <p class="mb-1 text-center text-xs font-semibold">{{ month.label }}</p>
        <table class="w-full border-collapse text-9px">
          <tbody>
            <tr v-for="row in rowsOf(month)" :key="row">
              <td
                v-for="col in 7"
                :key="col"
                class="border border-ink-400 p-1 text-center align-top"
                style="height: 26px"
              >
                <template v-if="cellOf(month, row, col)">
                  <div class="font-medium">{{ cellOf(month, row, col)!.jd }}</div>
                  <div
                    v-if="cellOf(month, row, col)!.celebrations.length"
                    class="text-8px leading-tight text-ink-600"
                  >
                    {{ cellOf(month, row, col)!.celebrations.map((c) => c.title).join('، ') }}
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="mt-3 text-9px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }
}
</style>
