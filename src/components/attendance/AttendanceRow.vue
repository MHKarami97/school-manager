<script setup lang="ts">
import { computed } from 'vue'
import type { AttendanceRecord, AttendanceStatus, DraftEntry } from '@/types'
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_ACTIVE_CLASSES,
  ATTENDANCE_STATUS_ICONS,
  ATTENDANCE_STATUS_LABELS,
} from '@/config/attendance.config'

const props = defineProps<{
  name: string
  index: number
  draft: DraftEntry
  record: AttendanceRecord | undefined
  isDirty: boolean
  canExit: boolean
}>()

const emit = defineEmits<{
  (e: 'status', status: AttendanceStatus): void
  (e: 'arrival', value: string): void
  (e: 'reason', value: string): void
  (e: 'exit'): void
}>()

const exitInfo = computed(() => props.record?.exit ?? null)

function onInput(event: Event, kind: 'arrival' | 'reason'): void {
  const value = (event.target as HTMLInputElement).value
  if (kind === 'arrival') emit('arrival', value)
  else emit('reason', value)
}
</script>

<template>
  <li
    class="rounded-2xl border bg-white p-3 dark:bg-ink-900"
    :class="isDirty ? 'border-brand-300 dark:border-brand-700' : 'border-ink-100 dark:border-ink-800'"
  >
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="min-w-0 truncate text-sm font-semibold text-ink-800 dark:text-ink-200">
        <span class="text-ink-400">{{ (index + 1).toLocaleString('fa-IR') }}.</span> {{ name }}
      </p>
      <span v-if="isDirty" class="shrink-0 text-11px font-medium text-brand-600 dark:text-brand-400">ذخیره‌نشده</span>
    </div>

    <div class="grid grid-cols-4 gap-1.5" role="group" :aria-label="`وضعیت ${name}`">
      <button
        v-for="status in ATTENDANCE_STATUSES"
        :key="status"
        type="button"
        class="flex min-h-11 flex-col items-center justify-center rounded-lg border px-1 py-1 text-11px font-medium transition"
        :class="
          draft.status === status
            ? ATTENDANCE_STATUS_ACTIVE_CLASSES[status]
            : 'border-ink-200 text-ink-500 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800'
        "
        :aria-pressed="draft.status === status"
        @click="emit('status', status)"
      >
        <span aria-hidden="true" class="text-sm leading-none">{{ ATTENDANCE_STATUS_ICONS[status] }}</span>
        {{ ATTENDANCE_STATUS_LABELS[status] }}
      </button>
    </div>

    <div v-if="draft.status === 'late'" class="mt-2 flex items-center gap-2">
      <label class="text-xs text-ink-600 dark:text-ink-300" :for="`arrival-${index}`">ساعت ورود (اختیاری)</label>
      <input
        :id="`arrival-${index}`"
        type="time"
        :value="draft.arrivalTime"
        class="min-h-11 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        @input="onInput($event, 'arrival')"
      />
    </div>

    <div v-if="draft.status === 'excused'" class="mt-2">
      <label class="mb-1 block text-xs text-ink-600 dark:text-ink-300" :for="`reason-${index}`">دلیل (اختیاری)</label>
      <input
        :id="`reason-${index}`"
        type="text"
        :value="draft.excuseReason"
        class="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        @input="onInput($event, 'reason')"
      />
    </div>

    <div v-if="exitInfo || canExit" class="mt-2 flex flex-wrap items-center justify-between gap-2">
      <p v-if="exitInfo" class="text-xs text-ink-600 dark:text-ink-300">
        <span aria-hidden="true">⇥</span> خروج ساعت {{ exitInfo.time }} - {{ exitInfo.reason }}
        <template v-if="exitInfo.receiver"> ({{ exitInfo.receiver }})</template>
      </p>
      <button
        v-if="canExit"
        type="button"
        class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
        @click="emit('exit')"
      >
        {{ exitInfo ? 'ویرایش خروج' : 'ثبت خروج' }}
      </button>
    </div>
  </li>
</template>
