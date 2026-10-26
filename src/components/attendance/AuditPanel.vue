<script setup lang="ts">
import type { AttendanceSnapshot, AuditAction, AuditEntry } from '@/types'
import { ATTENDANCE_STATUS_LABELS, UNRECORDED_LABEL } from '@/config/attendance.config'

defineProps<{ entries: AuditEntry[]; nameOf: (studentId: string) => string }>()

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'ثبت اولیه',
  update: 'ویرایش',
  'exit-set': 'ثبت خروج',
  'exit-remove': 'حذف خروج',
}

function statusText(snapshot: AttendanceSnapshot | null): string {
  return snapshot ? ATTENDANCE_STATUS_LABELS[snapshot.status] : UNRECORDED_LABEL
}

function timeText(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

function dayText(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' })
}
</script>

<template>
  <ul v-if="entries.length" class="space-y-1.5">
    <li v-for="entry in entries" :key="entry.id" class="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700 dark:bg-ink-800 dark:text-ink-200">
      <span class="font-medium">{{ nameOf(entry.studentId) }}</span>
      - {{ ACTION_LABELS[entry.action] }}: {{ statusText(entry.before) }} ← {{ statusText(entry.after) }}
      <span class="block text-11px text-ink-400 dark:text-ink-500">{{ entry.actor }} - {{ dayText(entry.at) }} {{ timeText(entry.at) }}</span>
    </li>
  </ul>
  <p v-else class="text-xs text-ink-400 dark:text-ink-500">هنوز تغییری ثبت نشده است.</p>
</template>
