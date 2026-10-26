<script setup lang="ts">
import { computed } from 'vue'
import type { SheetSummary } from '@/utils/attendance-domain'
import {
  ATTENDANCE_STATUS_BADGE_CLASSES,
  ATTENDANCE_STATUS_ICONS,
  ATTENDANCE_STATUS_LABELS,
  UNRECORDED_LABEL,
} from '@/config/attendance.config'

const props = defineProps<{ summary: SheetSummary }>()

const items = computed(() => [
  { key: 'total', label: 'کل', icon: '∑', value: props.summary.total, classes: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200' },
  { key: 'present', label: ATTENDANCE_STATUS_LABELS.present, icon: ATTENDANCE_STATUS_ICONS.present, value: props.summary.present, classes: ATTENDANCE_STATUS_BADGE_CLASSES.present },
  { key: 'absent', label: ATTENDANCE_STATUS_LABELS.absent, icon: ATTENDANCE_STATUS_ICONS.absent, value: props.summary.absent, classes: ATTENDANCE_STATUS_BADGE_CLASSES.absent },
  { key: 'late', label: ATTENDANCE_STATUS_LABELS.late, icon: ATTENDANCE_STATUS_ICONS.late, value: props.summary.late, classes: ATTENDANCE_STATUS_BADGE_CLASSES.late },
  { key: 'excused', label: ATTENDANCE_STATUS_LABELS.excused, icon: ATTENDANCE_STATUS_ICONS.excused, value: props.summary.excused, classes: ATTENDANCE_STATUS_BADGE_CLASSES.excused },
  { key: 'unrecorded', label: UNRECORDED_LABEL, icon: '–', value: props.summary.unrecorded, classes: 'bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-400' },
])
</script>

<template>
  <dl class="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="خلاصه‌ی حضور و غیاب">
    <div v-for="item in items" :key="item.key" class="rounded-xl px-3 py-2 text-center" :class="item.classes">
      <dt class="text-11px font-medium"><span aria-hidden="true">{{ item.icon }}</span> {{ item.label }}</dt>
      <dd class="mt-0.5 text-lg font-bold">{{ item.value.toLocaleString('fa-IR') }}</dd>
    </div>
  </dl>
</template>
