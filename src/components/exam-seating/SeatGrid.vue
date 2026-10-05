<script setup lang="ts">
import { computed } from 'vue'
import type { ExamRoom, SeatAssignment } from '../../types'
import { isSeatBlocked, seatKey } from '../../utils/exam-seating-helpers'

const props = defineProps<{
  room: ExamRoom
  assignments: SeatAssignment[]
  mode: 'edit' | 'view'
  labelOf?: (studentId: string) => string
  colorOf?: (studentId: string) => string | null
  conflictKeys?: Set<string>
  selectedKey?: string | null
  compact?: boolean
  fill?: boolean
  lightOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'cell-click', row: number, col: number): void
}>()

const bySeat = computed(() => {
  const map = new Map<string, SeatAssignment>()
  for (const assignment of props.assignments) {
    if (assignment.roomId === props.room.id) map.set(seatKey(assignment.row, assignment.col), assignment)
  }
  return map
})

const cells = computed(() => {
  const list: { row: number; col: number; key: string }[] = []
  for (let row = 0; row < props.room.rows; row += 1) {
    for (let col = 0; col < props.room.cols; col += 1) {
      list.push({ row, col, key: seatKey(row, col) })
    }
  }
  return list
})

/** اندازه‌ی قلم در حالت fill بر اساس تعداد ستون/ردیف تا نام‌ها داخل خانه جا شوند. */
const fillFontPx = computed(() => {
  let size = props.room.cols <= 6 ? 14 : props.room.cols <= 10 ? 12 : props.room.cols <= 14 ? 10 : 8
  if (props.room.rows > 10) size -= 2
  return Math.max(7, size)
})

const gridStyle = computed(() => {
  const min = props.compact || props.fill ? 0 : 76
  const style: Record<string, string> = {
    gridTemplateColumns: `repeat(${props.room.cols}, minmax(${min}px, 1fr))`,
  }
  if (props.fill) style.gridTemplateRows = `repeat(${props.room.rows}, minmax(0, 1fr))`
  return style
})

function onCellClick(row: number, col: number): void {
  if (props.mode === 'view' && isSeatBlocked(props.room, row, col)) return
  emit('cell-click', row, col)
}

function cellStyle(row: number, col: number, key: string): Record<string, string> {
  const blocked = isSeatBlocked(props.room, row, col)
  const assignment = bySeat.value.get(key)
  const color = assignment && props.colorOf ? props.colorOf(assignment.studentId) : null
  const style: Record<string, string> = {}

  if (props.fill) style.fontSize = `${fillFontPx.value}px`
  if (assignment && !blocked && color) {
    style.backgroundColor = `${color}33`
    style.borderColor = color
  }

  if (props.lightOnly) {
    if (blocked) {
      style.backgroundColor = '#eceef2'
      style.borderColor = '#b3bac8'
      style.color = '#b3bac8'
    } else if (assignment) {
      style.color = '#171a26'
      if (!color) {
        style.backgroundColor = '#ffffff'
        style.borderColor = '#8892a6'
      }
    } else {
      style.backgroundColor = '#ffffff'
      style.borderColor = '#d7dbe3'
      style.color = '#8892a6'
    }
  }
  return style
}

const bannerStyle = computed<Record<string, string>>(() =>
  props.lightOnly ? { backgroundColor: '#d7dbe3', color: '#4d5670' } : {},
)
</script>

<template>
  <div class="seat-grid" :class="fill ? 'flex h-full flex-col' : ''">
    <div
      class="mb-2 flex-none rounded-lg bg-ink-200 py-1 text-center text-11px font-medium text-ink-600 dark:bg-ink-700 dark:text-ink-200"
      :style="bannerStyle"
    >
      جلوی سالن (تخته) - ردیف ۱
    </div>
    <div :class="fill ? 'min-h-0 flex-1' : 'overflow-x-auto'">
      <div class="grid gap-1" :class="fill ? 'h-full' : ''" :style="gridStyle">
        <button
          v-for="cell in cells"
          :key="cell.key"
          type="button"
          class="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border text-center transition"
          :class="[
            fill ? 'min-h-0 px-0.5 py-0.5' : compact ? 'min-h-10 px-0.5 py-0.5 text-9px leading-tight' : 'min-h-14 px-1 py-1 text-11px',
            isSeatBlocked(room, cell.row, cell.col)
              ? 'border-dashed border-ink-300 bg-ink-100 text-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-600'
              : bySeat.get(cell.key)
                ? 'border-2 font-medium text-ink-800 dark:text-ink-100'
                : 'border-ink-200 bg-white text-ink-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-500',
            conflictKeys?.has(cell.key) ? 'ring-2 ring-red-500' : '',
            selectedKey === cell.key ? 'ring-2 ring-brand-500' : '',
            mode === 'edit' || (bySeat.get(cell.key) && !isSeatBlocked(room, cell.row, cell.col)) ? 'cursor-pointer hover:brightness-95' : 'cursor-default',
          ]"
          :style="cellStyle(cell.row, cell.col, cell.key)"
          @click="onCellClick(cell.row, cell.col)"
        >
          <span class="absolute right-1 top-0.5 text-8px leading-none opacity-60">{{ cell.row + 1 }}-{{ cell.col + 1 }}</span>
          <template v-if="isSeatBlocked(room, cell.row, cell.col)">✕</template>
          <template v-else-if="bySeat.get(cell.key) && labelOf">
            <span class="mt-2 line-clamp-2 break-words leading-tight">{{ labelOf(bySeat.get(cell.key)!.studentId) }}</span>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.seat-grid {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
