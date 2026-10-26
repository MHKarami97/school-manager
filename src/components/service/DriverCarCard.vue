<script setup lang="ts">
import { computed } from 'vue'
import type { ServiceDriver } from '@/types'
import { DRIVER_GENDER_LABELS } from '@/config/service.config'
import { capacityOf } from '@/utils/service-domain'
import { vehicleText } from '@/utils/service-print'
import CarSeatMap, { type SeatMapOccupant } from './CarSeatMap.vue'

export interface Rider {
  studentId: string
  name: string
  grade: number
  seatId: string | null
  absent: boolean
}

const props = defineProps<{
  driver: ServiceDriver
  riders: Rider[]
  confirmed: boolean
  hasSelection: boolean
  selectedSeatId?: string | null
}>()

const emit = defineEmits<{
  (e: 'seat', seatId: string): void
  (e: 'place-here'): void
  (e: 'pick-unseated', studentId: string): void
  (e: 'confirm'): void
  (e: 'reopen'): void
  (e: 'print'): void
}>()

const capacity = computed(() => capacityOf(props.driver.seatLayout))
const occupants = computed(() => {
  const result: Record<string, SeatMapOccupant> = {}
  for (const rider of props.riders) {
    if (rider.seatId) result[rider.seatId] = { label: `${rider.name}${rider.absent ? ' ✕' : ''}`, grade: rider.grade }
  }
  return result
})
const unseated = computed(() => props.riders.filter((rider) => !rider.seatId))
const absentCount = computed(() => props.riders.filter((rider) => rider.absent).length)
const isFull = computed(() => props.riders.length >= capacity.value)
</script>

<template>
  <article class="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-ink-900" :class="confirmed ? 'border-emerald-300 dark:border-emerald-700' : 'border-ink-100 dark:border-ink-800'">
    <div class="h-1.5" :class="confirmed ? 'bg-emerald-500' : 'bg-gradient-to-l from-brand-600 to-brand-400'"></div>
    <div class="p-4">
      <div class="mb-1 flex items-start justify-between gap-2">
        <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ DRIVER_GENDER_LABELS[driver.gender] }} {{ driver.fullName }}</p>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium" :class="confirmed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'">{{ confirmed ? '✓ تأیید شده' : 'پیش‌نویس' }}</span>
      </div>
      <p class="mb-1 text-11px text-ink-500 dark:text-ink-400">{{ vehicleText(driver) }}<template v-if="driver.plate"> - پلاک {{ driver.plate }}</template></p>
      <p class="mb-3 text-xs text-ink-600 dark:text-ink-300">
        {{ riders.length.toLocaleString('fa-IR') }} از {{ capacity.toLocaleString('fa-IR') }} نفر
        <span v-if="absentCount" class="mr-2 rounded-full bg-red-50 px-2 py-0.5 text-11px text-red-700 dark:bg-red-900/30 dark:text-red-300">✕ {{ absentCount.toLocaleString('fa-IR') }} غایب امروز</span>
      </p>

      <CarSeatMap :layout="driver.seatLayout" :occupants="occupants" :selected-seat-id="selectedSeatId" :interactive="!confirmed" @select="emit('seat', $event)" />

      <div v-if="unseated.length" class="mt-3">
        <p class="mb-1 text-11px text-ink-500 dark:text-ink-400">بدون صندلی (برای جابه‌جایی لمس کنید):</p>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="rider in unseated" :key="rider.studentId" type="button" :disabled="confirmed" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="emit('pick-unseated', rider.studentId)">{{ rider.name }}</button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button v-if="hasSelection && !confirmed" type="button" :disabled="isFull" class="min-h-11 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white disabled:opacity-40" @click="emit('place-here')">قرار دادن انتخاب‌شده اینجا</button>
        <button v-if="!confirmed" type="button" :disabled="!riders.length" class="min-h-11 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white disabled:opacity-40" @click="emit('confirm')">تأیید این راننده</button>
        <button v-else type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="emit('reopen')">بازگشایی برای ویرایش</button>
        <button type="button" :disabled="!riders.length" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" @click="emit('print')">PDF</button>
      </div>
    </div>
  </article>
</template>
