<script setup lang="ts">
import { computed } from 'vue'
import type { SportPlan, SportSlot } from '@/types'
import { WEEK_DAYS } from '@/types'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{
  plan: SportPlan
}>()

const lessonPeriods = computed(() => buildBellSchedule(props.plan.shiftConfig).filter((p) => p.type === 'lesson'))

function teacherName(id: string | null): string {
  if (!id) return '—'
  const teacher = props.plan.teachers.find((t) => t.id === id)
  return teacher ? formatTeacherName(teacher) : '—'
}
function facilityName(id: string | null): string {
  if (!id) return ''
  return props.plan.facilities.find((f) => f.id === id)?.name ?? ''
}
function classLabel(classId: string): string {
  return props.plan.classes.find((c) => c.id === classId)?.label ?? classId
}

/** همه‌ی کلاس‌هایی که در این روز/زنگ، هم‌زمان ورزش دارند (بدون توجه به کلاس فعال) */
function slotsAt(dayIndex: number, periodIndex: number): SportSlot[] {
  return props.plan.slots
    .filter((s) => s.dayIndex === dayIndex && s.periodIndex === periodIndex && s.teacherId)
    .sort((a, b) => classLabel(a.classId).localeCompare(classLabel(b.classId), 'fa'))
}

const totalAssignedSlots = computed(() => props.plan.slots.filter((s) => s.teacherId).length)
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-ink-400 dark:text-ink-500">
      نمای کلی همه‌ی پایه‌ها، همه‌ی زنگ‌ها و همه‌ی معلمان ورزش این برنامه، در یک جدول. برای ویرایش، به «نمایش تک‌کلاس» برگرد.
    </p>

    <div class="overflow-x-auto rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
      <table class="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr>
            <th class="w-20 border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-500 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-400"></th>
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
          <tr v-for="p in lessonPeriods" :key="p.index">
            <td class="border border-ink-100 p-2 text-center text-ink-500 dark:border-ink-800 dark:text-ink-400">
              {{ p.index }}
              <br />
              <span class="text-10px text-ink-400 dark:text-ink-500">{{ p.start }}-{{ p.end }}</span>
            </td>
            <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-100 p-1 align-top dark:border-ink-800">
              <div class="flex min-h-16 flex-col gap-1">
                <div
                  v-for="slot in slotsAt(dayIndex, p.index - 1)"
                  :key="slot.classId"
                  class="rounded-lg border border-ink-100 bg-ink-50 p-1.5 text-center dark:border-ink-700 dark:bg-ink-800"
                >
                  <p class="text-sm font-medium text-ink-800 dark:text-ink-200">{{ classLabel(slot.classId) }}</p>
                  <p class="text-10px text-ink-500 dark:text-ink-400">
                    {{ teacherName(slot.teacherId) }}
                    <template v-if="facilityName(slot.facilityId)"> · {{ facilityName(slot.facilityId) }}</template>
                  </p>
                </div>
                <p v-if="!slotsAt(dayIndex, p.index - 1).length" class="flex flex-1 items-center justify-center text-ink-300 dark:text-ink-600">
                  -
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-sm text-ink-400 dark:text-ink-500">
      مجموع زنگ‌های تخصیص‌یافته در کل مدرسه: {{ totalAssignedSlots }}
    </p>
  </div>
</template>
