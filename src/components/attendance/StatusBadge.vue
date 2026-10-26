<script setup lang="ts">
import { computed } from 'vue'
import type { AttendanceStatus } from '@/types'
import {
  ATTENDANCE_STATUS_BADGE_CLASSES,
  ATTENDANCE_STATUS_ICONS,
  ATTENDANCE_STATUS_LABELS,
  UNRECORDED_LABEL,
} from '@/config/attendance.config'

const props = defineProps<{ status: AttendanceStatus | null }>()

const label = computed(() => (props.status ? ATTENDANCE_STATUS_LABELS[props.status] : UNRECORDED_LABEL))
const icon = computed(() => (props.status ? ATTENDANCE_STATUS_ICONS[props.status] : '–'))
const classes = computed(() =>
  props.status
    ? ATTENDANCE_STATUS_BADGE_CLASSES[props.status]
    : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400',
)
</script>

<template>
  <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-11px font-medium" :class="classes">
    <span aria-hidden="true">{{ icon }}</span>
    {{ label }}
  </span>
</template>
