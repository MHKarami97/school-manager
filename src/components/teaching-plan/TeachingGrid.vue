<script setup lang="ts">
import { ref } from 'vue'
import { WEEK_DAYS } from '../../types'
import type { DragPayload, GridItem, GridPeriod } from './teaching-grid.types'

const props = defineProps<{
  periods: GridPeriod[]
  itemsAt: (dayIndex: number, periodIndex: number) => GridItem[]
  editable?: boolean
  allowEmptyClick?: boolean
}>()

const emit = defineEmits<{
  (e: 'item-click', item: GridItem, dayIndex: number, periodIndex: number): void
  (e: 'empty-click', dayIndex: number, periodIndex: number): void
  (e: 'move', payload: DragPayload, dayIndex: number, periodIndex: number): void
}>()

const dragged = ref<DragPayload | null>(null)
const hoverKey = ref('')

function onDragStart(item: GridItem, dayIndex: number, periodIndex: number, event: DragEvent): void {
  if (!props.editable) return
  dragged.value = { classId: item.classId, dayIndex, periodIndex }
  event.dataTransfer?.setData('text/plain', item.key)
}

function onDrop(dayIndex: number, periodIndex: number): void {
  hoverKey.value = ''
  if (!props.editable || !dragged.value) return
  emit('move', dragged.value, dayIndex, periodIndex)
  dragged.value = null
}

function cellKey(dayIndex: number, periodIndex: number): string {
  return `${dayIndex}-${periodIndex}`
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-720px border-collapse text-xs">
      <thead>
        <tr>
          <th class="w-24 border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-500 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-400">زنگ</th>
          <th
            v-for="day in WEEK_DAYS"
            :key="day"
            class="border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-300"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="period in periods" :key="period.index">
          <td class="border border-ink-100 p-2 text-center text-ink-500 dark:border-ink-800 dark:text-ink-400">
            {{ period.index + 1 }}
            <br />
            <span class="text-10px text-ink-400 dark:text-ink-500">{{ period.start }} - {{ period.end }}</span>
          </td>
          <td
            v-for="(day, dayIndex) in WEEK_DAYS"
            :key="day"
            class="border border-ink-100 p-1 align-top dark:border-ink-800"
            :class="hoverKey === cellKey(dayIndex, period.index) ? 'bg-brand-50 dark:bg-brand-900/10' : ''"
            @dragover.prevent="hoverKey = cellKey(dayIndex, period.index)"
            @dragleave="hoverKey = ''"
            @drop="onDrop(dayIndex, period.index)"
          >
            <div class="flex min-h-16 flex-col gap-1">
              <button
                v-for="item in itemsAt(dayIndex, period.index)"
                :key="item.key"
                type="button"
                class="flex flex-col justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-center transition hover:brightness-95"
                :class="[
                  item.severity === 'error' ? 'ring-2 ring-red-500' : item.severity === 'warning' ? 'ring-2 ring-amber-400' : '',
                  item.noTeacher ? 'border-dashed' : '',
                  editable ? 'cursor-grab' : 'cursor-pointer',
                ]"
                :style="{ backgroundColor: item.color + '22', borderColor: item.color + '88' }"
                :draggable="editable"
                @dragstart="onDragStart(item, dayIndex, period.index, $event)"
                @click="emit('item-click', item, dayIndex, period.index)"
              >
                <span class="font-medium text-ink-800 dark:text-ink-100">
                  <template v-if="item.locked">🔒 </template>{{ item.title }}
                </span>
                <span class="text-10px" :class="item.noTeacher ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink-500 dark:text-ink-400'">
                  {{ item.subtitle }}
                </span>
              </button>
              <button
                v-if="!itemsAt(dayIndex, period.index).length && allowEmptyClick"
                type="button"
                class="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300 hover:border-brand-300 hover:text-brand-500 dark:border-ink-700 dark:text-ink-600"
                @click="emit('empty-click', dayIndex, period.index)"
              >
                +
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
