<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Teacher } from '../../types'
import type { TeacherWorkload } from '../../utils/teaching-analysis'
import { formatTeacherName } from '../../utils/teacher-format'

const props = defineProps<{
  workloads: TeacherWorkload[]
  teachers: Teacher[]
  activeTeacherId?: string
}>()

const emit = defineEmits<{
  (e: 'select', teacherId: string): void
}>()

const isOpen = ref(false)

const rows = computed(() =>
  props.workloads
    .map((workload) => ({
      workload,
      teacher: props.teachers.find((t) => t.id === workload.teacherId),
    }))
    .filter((row): row is { workload: TeacherWorkload; teacher: Teacher } => !!row.teacher)
    .sort((a, b) => b.workload.weekly - a.workload.weekly),
)

const overCount = computed(() => rows.value.filter((r) => r.workload.overWeekly || r.workload.overDaily).length)

function percentOf(workload: TeacherWorkload): number {
  if (!workload.maxWeekly) return Math.min(100, workload.weekly * 4)
  return Math.min(100, Math.round((workload.weekly / workload.maxWeekly) * 100))
}
</script>

<template>
  <div class="fixed bottom-20 left-3 z-30 print:hidden sm:bottom-4">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 shadow-lg dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
      @click="isOpen = !isOpen"
    >
      ساعت تدریس معلمان
      <span v-if="overCount" class="rounded-full bg-red-500 px-1.5 py-0.5 text-10px text-white">{{ overCount }}</span>
    </button>

    <div
      v-if="isOpen"
      class="mt-2 max-h-[60vh] w-72 space-y-2 overflow-y-auto rounded-2xl border border-ink-100 bg-white p-3 shadow-xl dark:border-ink-800 dark:bg-ink-900"
    >
      <button
        v-for="row in rows"
        :key="row.teacher.id"
        type="button"
        class="block w-full rounded-lg px-2 py-1.5 text-right hover:bg-ink-50 dark:hover:bg-ink-800"
        :class="activeTeacherId === row.teacher.id ? 'bg-brand-50 dark:bg-brand-900/10' : ''"
        @click="emit('select', row.teacher.id)"
      >
        <div class="mb-1 flex items-center justify-between text-11px">
          <span class="truncate text-ink-700 dark:text-ink-200">{{ formatTeacherName(row.teacher) }}</span>
          <span :class="row.workload.overWeekly || row.workload.overDaily ? 'font-bold text-red-600 dark:text-red-400' : 'text-ink-500 dark:text-ink-400'">
            {{ row.workload.weekly }}<template v-if="row.workload.maxWeekly"> / {{ row.workload.maxWeekly }}</template>
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div
            class="h-full rounded-full"
            :class="row.workload.overWeekly || row.workload.overDaily ? 'bg-red-500' : 'bg-emerald-500'"
            :style="{ width: `${percentOf(row.workload)}%` }"
          ></div>
        </div>
        <p class="mt-1 text-9px text-ink-400 dark:text-ink-500">روزانه: {{ row.workload.daily.join(' - ') }}</p>
      </button>
      <p v-if="!rows.length" class="text-11px text-ink-400 dark:text-ink-500">معلمی انتخاب نشده است.</p>
    </div>
  </div>
</template>
