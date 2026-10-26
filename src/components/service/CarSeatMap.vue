<script setup lang="ts">
import { computed } from 'vue'
import type { SeatLayout } from '@/types'
import { isFrontSeatWarning, seatsOf, type Seat } from '@/utils/service-domain'

export interface SeatMapOccupant {
  label: string
  grade: number | null
}

const props = withDefaults(
  defineProps<{
    layout: SeatLayout
    occupants?: Record<string, SeatMapOccupant>
    selectedSeatId?: string | null
    interactive?: boolean
  }>(),
  { occupants: () => ({}), selectedSeatId: null, interactive: false },
)

const emit = defineEmits<{ (e: 'select', seatId: string): void }>()

const rows = computed(() => {
  const grouped: Seat[][] = props.layout.rows.map(() => [])
  for (const seat of seatsOf(props.layout)) grouped[seat.row].push(seat)
  return grouped
})

function occupantOf(seat: Seat): SeatMapOccupant | undefined {
  return props.occupants[seat.id]
}

function isWarning(seat: Seat): boolean {
  const occupant = occupantOf(seat)
  return !!occupant && occupant.grade !== null && isFrontSeatWarning(seat.id, occupant.grade)
}

function seatClasses(seat: Seat): string {
  if (isWarning(seat)) return 'border-2 border-yellow-400 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200'
  if (occupantOf(seat)) return 'border border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-500/10 dark:text-brand-200'
  if (props.selectedSeatId === seat.id) return 'border-2 border-brand-500 bg-white text-brand-700 dark:bg-ink-900'
  return 'border border-dashed border-ink-300 bg-white text-ink-400 dark:border-ink-600 dark:bg-ink-900'
}

function seatTitle(seat: Seat): string {
  const occupant = occupantOf(seat)
  const place = seat.isFront ? 'جلو' : `ردیف ${seat.row + 1}`
  if (!occupant) return `صندلی ${place} (خالی)`
  return `${occupant.label} - ${place}${isWarning(seat) ? ' - سن کم روی صندلی جلو' : ''}`
}
</script>

<template>
  <div class="mx-auto w-full max-w-xs rounded-[2rem] border-2 border-ink-300 bg-ink-50 p-3 dark:border-ink-600 dark:bg-ink-800" dir="ltr">
    <p class="mb-2 text-center text-11px text-ink-400">جلوی خودرو</p>
    <div v-for="(rowSeats, rowIndex) in rows" :key="rowIndex" class="mb-2 flex items-stretch justify-center gap-2">
      <div
        v-if="rowIndex === 0"
        class="flex min-h-14 min-w-16 flex-1 flex-col items-center justify-center rounded-xl border border-ink-200 bg-ink-100 text-11px text-ink-500 dark:border-ink-600 dark:bg-ink-900"
        aria-label="صندلی راننده"
      >
        <span aria-hidden="true">🛞</span>
        راننده
      </div>
      <button
        v-for="seat in rowSeats"
        :key="seat.id"
        type="button"
        class="flex min-h-14 min-w-16 flex-1 flex-col items-center justify-center rounded-xl px-1 text-center text-11px font-medium transition"
        :class="[seatClasses(seat), interactive ? 'cursor-pointer hover:opacity-90' : 'cursor-default']"
        :disabled="!interactive"
        :title="seatTitle(seat)"
        :aria-label="seatTitle(seat)"
        @click="emit('select', seat.id)"
      >
        <template v-if="occupantOf(seat)">
          <span v-if="isWarning(seat)" aria-hidden="true">⚠</span>
          <span class="line-clamp-2 break-words" dir="rtl">{{ occupantOf(seat)?.label }}</span>
        </template>
        <span v-else dir="rtl">{{ seat.isFront ? 'جلو' : `ردیف ${seat.row + 1}` }}</span>
      </button>
    </div>
  </div>
</template>
