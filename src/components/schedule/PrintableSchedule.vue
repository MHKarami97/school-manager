<script setup lang="ts">
import { computed } from 'vue'
import type { GradeSchedule, CourseDefinition, SavedSchedule } from '@/types'
import { WEEK_DAYS } from '@/types'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import { gradeLabel } from '@/config/levels.config'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{
  schedule: SavedSchedule
  gradeSchedule: GradeSchedule
  courses: CourseDefinition[]
}>()

const lessonPeriods = computed(() => buildBellSchedule(props.schedule.shiftConfig).filter((p) => p.type === 'lesson'))

function cellAt(dayIndex: number, periodIndex: number) {
  return props.gradeSchedule.cells.find((c) => c.dayIndex === dayIndex && c.periodIndex === periodIndex)
}

function courseName(courseId: string | null | undefined): string {
  if (!courseId) return ''
  return props.courses.find((c) => c.id === courseId)?.name ?? ''
}

function teacherLabel(teacherId: string | null | undefined): string {
  if (!teacherId) return ''
  return formatTeacherName(props.schedule.teachers.find((t) => t.id === teacherId))
}

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ schedule.title }}</h1>
        <p class="text-xs text-ink-600">پایه {{ gradeLabel(gradeSchedule.grade) }} - {{ schedule.shiftConfig.name }} ({{ schedule.shiftConfig.startTime }}–{{ schedule.shiftConfig.endTime }})</p>
      </div>
      <p class="text-xs text-ink-500">تاریخ چاپ: {{ printDate }}</p>
    </div>
    <table class="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-2">زنگ</th>
          <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-400 bg-ink-100 p-2">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-400 p-2 text-center font-medium">زنگ {{ p.index }}<br /><span class="text-[10px] text-ink-500">{{ p.start }}–{{ p.end }}</span></td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-400 p-2 text-center">
            <template v-if="cellAt(dayIndex, p.index - 1)?.courseId">
              <p class="font-medium">{{ courseName(cellAt(dayIndex, p.index - 1)?.courseId) }}</p>
              <p class="text-[10px] text-ink-500">{{ teacherLabel(cellAt(dayIndex, p.index - 1)?.teacherId) }}</p>
            </template>
            <template v-else>-</template>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 flex items-end justify-between border-t border-ink-300 pt-3">
      <div v-if="schedule.teachers.length" class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-600">
        <span v-for="t in schedule.teachers" :key="t.id">معلم: {{ formatTeacherName(t) }}</span>
      </div>
      <p class="text-[10px] text-ink-400">school.mhkarami97.ir</p>
    </div>
  </div>
</template>
