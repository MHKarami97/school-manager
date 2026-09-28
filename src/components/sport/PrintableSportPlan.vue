<script setup lang="ts">
import { computed } from 'vue'
import type { SportPlan, SportSlot } from '@/types'
import { WEEK_DAYS } from '@/types'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{
  plan: SportPlan
  mode: 'class' | 'teacher' | 'school' | 'school-by-period'
  classId?: string
  teacherId?: string
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

function cellForClass(dayIndex: number, periodIndex: number) {
  return props.plan.slots.find(
    (s) => s.classId === props.classId && s.dayIndex === dayIndex && s.periodIndex === periodIndex,
  )
}
function cellForTeacher(dayIndex: number, periodIndex: number) {
  return props.plan.slots.find(
    (s) => s.teacherId === props.teacherId && s.dayIndex === dayIndex && s.periodIndex === periodIndex,
  )
}

/** همه‌ی کلاس‌هایی که در این روز/زنگ، در همین برنامه، همزمان ورزش دارند */
function slotsForSchool(dayIndex: number, periodIndex: number): SportSlot[] {
  return props.plan.slots
    .filter((s) => s.dayIndex === dayIndex && s.periodIndex === periodIndex && s.teacherId)
    .sort((a, b) => classLabel(a.classId).localeCompare(classLabel(b.classId), 'fa'))
}

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="sport-plan-print p-4 text-ink-900" dir="rtl">
    <div class="mb-3 flex items-center justify-between border-b-2 border-ink-800 pb-2">
      <div>
        <h1 class="text-base font-bold">
          {{ plan.title }}
          <template v-if="mode === 'class' && classId"> — {{ classLabel(classId) }}</template>
          <template v-if="mode === 'teacher' && teacherId"> — {{ teacherName(teacherId) }}</template>
          <template v-if="mode === 'school'"> — نمای کل مدرسه</template>
          <template v-if="mode === 'school-by-period'"> — نمای کل مدرسه (به تفکیک هر زنگ)</template>
        </h1>
        <p class="text-sm text-ink-600">{{ plan.shiftConfig.name }} · {{ plan.shiftConfig.startTime }}-{{ plan.shiftConfig.endTime }}</p>
      </div>
      <p class="text-sm text-ink-500">{{ printDate }}</p>
    </div>

    <!-- نمای «کلاس»: یک برنامه هفتگی برای همان کلاس -->
    <table v-if="mode === 'class'" class="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-2"></th>
          <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-400 bg-ink-100 p-2">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-400 p-2 text-center font-medium">{{ p.index }}<br /><span class="text-10px text-ink-500">{{ p.start }}-{{ p.end }}</span></td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-400 p-2 text-center">
            <template v-if="cellForClass(dayIndex, p.index - 1)?.teacherId">
              <p class="font-medium">{{ teacherName(cellForClass(dayIndex, p.index - 1)?.teacherId ?? null) }}</p>
              <p class="text-10px text-ink-500">{{ facilityName(cellForClass(dayIndex, p.index - 1)?.facilityId ?? null) }}</p>
            </template>
            <template v-else>-</template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- نمای «معلم»: کدام کلاس‌ها را در چه ساعتی تدریس می‌کند -->
    <table v-else-if="mode === 'teacher'" class="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-2"></th>
          <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-400 bg-ink-100 p-2">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-400 p-2 text-center font-medium">{{ p.index }}<br /><span class="text-10px text-ink-500">{{ p.start }}-{{ p.end }}</span></td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-400 p-2 text-center">
            <template v-if="cellForTeacher(dayIndex, p.index - 1)">
              <p class="font-medium">{{ classLabel(cellForTeacher(dayIndex, p.index - 1)!.classId) }}</p>
              <p class="text-10px text-ink-500">{{ facilityName(cellForTeacher(dayIndex, p.index - 1)?.facilityId ?? null) }}</p>
            </template>
            <template v-else>-</template>
          </td>
        </tr>
      </tbody>
    </table>

    <!--
      نمای «کل مدرسه»: یک جدول واحد و فشرده (متن ریزتر تا در یک صفحه جا شود).
      هر خانه (روز × زنگ) تمام کلاس‌هایی که همان لحظه همزمان ورزش دارند را،
      به‌همراه معلم هرکدام، نشان می‌دهد.
    -->
    <table v-else-if="mode === 'school'" class="w-full border-collapse text-9px leading-tight">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1 w-12"></th>
          <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-400 bg-ink-100 p-1">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-400 p-1 text-center font-medium">
            {{ p.index }}<br /><span class="text-8px text-ink-500">{{ p.start }}-{{ p.end }}</span>
          </td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-400 p-1 align-top">
            <div
              v-for="slot in slotsForSchool(dayIndex, p.index - 1)"
              :key="slot.classId"
              class="mb-0.5 border-b border-dashed border-ink-200 pb-0.5 last:mb-0 last:border-0 last:pb-0"
            >
              <p class="font-medium">{{ classLabel(slot.classId) }}</p>
              <p class="text-8px text-ink-500">
                {{ teacherName(slot.teacherId) }}
                <template v-if="facilityName(slot.facilityId)"> · {{ facilityName(slot.facilityId) }}</template>
              </p>
            </div>
            <span v-if="!slotsForSchool(dayIndex, p.index - 1).length" class="text-ink-300">-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!--
      نمای «کل مدرسه به تفکیک هر زنگ»: به‌جای یک جدول بزرگ، برای هر زنگ یک جدول
      کوچک و جدا (ستون‌ها = روزهای هفته) رسم می‌شود؛ مناسب وقتی می‌خواهی برنامه‌ی
      هر زنگ را جدا و بزرگ‌تر چاپ/نصب کنی.
    -->
    <div v-else class="space-y-4">
      <div v-for="p in lessonPeriods" :key="p.index" class="break-inside-avoid">
        <p class="mb-1 text-xs font-semibold">زنگ {{ p.index }} <span class="text-10px text-ink-500">({{ p.start }}-{{ p.end }})</span></p>
        <table class="w-full border-collapse text-10px">
          <thead>
            <tr>
              <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-400 bg-ink-100 p-1">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-400 p-1 align-top">
                <div
                  v-for="slot in slotsForSchool(dayIndex, p.index - 1)"
                  :key="slot.classId"
                  class="mb-0.5 border-b border-dashed border-ink-200 pb-0.5 last:mb-0 last:border-0 last:pb-0"
                >
                  <p class="font-medium">{{ classLabel(slot.classId) }}</p>
                  <p class="text-9px text-ink-500">
                    {{ teacherName(slot.teacherId) }}
                    <template v-if="facilityName(slot.facilityId)"> · {{ facilityName(slot.facilityId) }}</template>
                  </p>
                </div>
                <span v-if="!slotsForSchool(dayIndex, p.index - 1).length" class="text-ink-300">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between border-t border-ink-300 pt-2">
      <p class="text-9px text-ink-400">school.mhkarami97.ir</p>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }
}
</style>