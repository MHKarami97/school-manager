<script setup lang="ts">
import type { AttendanceStatus } from '@/types'
import { ATTENDANCE_STATUS_ACTIVE_CLASSES } from '@/config/attendance.config'
import StatusBadge from './StatusBadge.vue'

withDefaults(
  defineProps<{
    name: string
    index: number
    status: AttendanceStatus | null
    isDirty: boolean
    showDetails?: boolean
  }>(),
  { showDetails: true },
)

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'details'): void
}>()
</script>

<template>
  <li
    class="flex items-center justify-between gap-2 rounded-2xl border bg-white p-2 ps-3 dark:bg-ink-900"
    :class="isDirty ? 'border-brand-300 dark:border-brand-700' : 'border-ink-100 dark:border-ink-800'"
  >
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-ink-800 dark:text-ink-200">
        <span class="text-ink-400">{{ (index + 1).toLocaleString('fa-IR') }}.</span> {{ name }}
      </p>
      <StatusBadge v-if="status !== 'absent' && status !== null" :status="status" class="mt-1" />
    </div>
    <div class="flex shrink-0 items-center gap-1.5">
      <button v-if="showDetails" type="button" class="min-h-11 px-2 text-11px text-ink-500 dark:text-ink-400" @click="emit('details')">
        تأخیر/موجه/خروج
      </button>
      <button
        type="button"
        class="min-h-11 min-w-20 rounded-lg border px-3 text-sm font-semibold transition"
        :class="
          status === 'absent'
            ? ATTENDANCE_STATUS_ACTIVE_CLASSES.absent
            : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
        "
        :aria-pressed="status === 'absent'"
        @click="emit('toggle')"
      >
        <span aria-hidden="true">✕</span> غایب
      </button>
    </div>
  </li>
</template>
