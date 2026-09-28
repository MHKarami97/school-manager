<script setup lang="ts">
import { computed } from 'vue'
import type { ExtraClass } from '../../types'
import { WEEK_DAYS } from '../../types'
import { EXTRA_CLASS_TYPE_LABELS } from '../../config/extra-class.config'
import { activeEnrollmentsOf, waitlistOf } from '../../utils/extra-class-helpers'
import { formatTeacherName } from '../../utils/teacher-format'
import { useStudentsStore } from '../../stores/students'
import { useEnrollmentsStore } from '../../stores/enrollments'
import { useTeachersStore } from '../../stores/teachers'

const props = defineProps<{
  mode: 'class' | 'teacher' | 'school'
  classes: ExtraClass[]
  classId?: string
  teacherId?: string
}>()

const studentsStore = useStudentsStore()
const enrollmentsStore = useEnrollmentsStore()
const teachersStore = useTeachersStore()

function teacherName(teacherId: string | null): string {
  if (!teacherId) return '—'
  const teacher = teachersStore.items.find((t) => t.id === teacherId)
  return teacher ? formatTeacherName(teacher) : '—'
}

function studentName(studentId: string): string {
  const student = studentsStore.items.find((s) => s.id === studentId)
  return student ? `${student.firstName} ${student.lastName}` : '—'
}

function dayRangeLabel(klass: ExtraClass): string {
  return klass.dayIndexes
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEK_DAYS[d])
    .join('، ')
}

const singleClass = computed(() => props.classes.find((c) => c.id === props.classId) ?? null)
const roster = computed(() => (singleClass.value ? activeEnrollmentsOf(singleClass.value.id, enrollmentsStore.items) : []))
const waitlist = computed(() => (singleClass.value ? waitlistOf(singleClass.value.id, enrollmentsStore.items) : []))

const teacherClasses = computed(() =>
  props.mode === 'teacher' ? props.classes.filter((c) => c.teacherId === props.teacherId) : [],
)

function classesOfDay(dayIndex: number): ExtraClass[] {
  const source = props.mode === 'teacher' ? teacherClasses.value : props.classes
  return source.filter((c) => c.dayIndexes.includes(dayIndex)).sort((a, b) => a.startTime.localeCompare(b.startTime))
}

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="extra-class-print p-6 text-ink-900" dir="rtl">
    <template v-if="mode === 'class' && singleClass">
      <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
        <div>
          <h1 class="text-lg font-bold">{{ singleClass.title }}</h1>
          <p class="text-xs text-ink-600">
            {{ EXTRA_CLASS_TYPE_LABELS[singleClass.type] }} - {{ dayRangeLabel(singleClass) }}
            {{ singleClass.startTime }} تا {{ singleClass.endTime }} - مدرس: {{ teacherName(singleClass.teacherId) }}
          </p>
        </div>
        <p class="text-xs text-ink-500">{{ printDate }}</p>
      </div>
      <p class="mb-3 text-xs text-ink-600">
        <strong>ظرفیت:</strong> {{ roster.length }} / {{ singleClass.capacity }}
        <template v-if="singleClass.cost"> - <strong>هزینه:</strong> {{ singleClass.cost.toLocaleString('fa-IR') }} تومان</template>
      </p>
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="w-10 border border-ink-400 bg-ink-100 p-2">#</th>
            <th class="border border-ink-400 bg-ink-100 p-2">نام دانش‌آموز</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(enrollment, index) in roster" :key="enrollment.id">
            <td class="border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
            <td class="border border-ink-400 p-2">{{ studentName(enrollment.studentId) }}</td>
          </tr>
          <tr v-if="!roster.length">
            <td colspan="2" class="border border-ink-400 p-3 text-center text-ink-400">ثبت‌نامی وجود ندارد.</td>
          </tr>
        </tbody>
      </table>
      <template v-if="waitlist.length">
        <p class="mb-2 mt-4 text-xs font-semibold">لیست انتظار</p>
        <table class="w-full border-collapse text-sm">
          <tbody>
            <tr v-for="(enrollment, index) in waitlist" :key="enrollment.id">
              <td class="w-10 border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
              <td class="border border-ink-400 p-2">{{ studentName(enrollment.studentId) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>

    <template v-else>
      <div class="mb-3 flex items-center justify-between border-b-2 border-ink-800 pb-2">
        <h1 class="text-base font-bold">
          <template v-if="mode === 'teacher'">برنامه هفتگی {{ teacherName(teacherId ?? null) }}</template>
          <template v-else>برنامه هفتگی کلاس‌های تقویتی و فوق‌برنامه مدرسه</template>
        </h1>
        <p class="text-sm text-ink-500">{{ printDate }}</p>
      </div>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="(day, dayIndex) in WEEK_DAYS" :key="day">
          <p class="mb-1 text-center text-xs font-semibold">{{ day }}</p>
          <div
            v-for="klass in classesOfDay(dayIndex)"
            :key="klass.id"
            class="mb-1 rounded border border-ink-300 p-1.5 text-9px leading-tight"
          >
            <p class="font-medium">{{ klass.title }}</p>
            <p class="text-ink-600">{{ klass.startTime }}-{{ klass.endTime }}</p>
            <p v-if="mode === 'school'" class="text-ink-500">{{ teacherName(klass.teacherId) }}</p>
          </div>
          <p v-if="!classesOfDay(dayIndex).length" class="text-center text-9px text-ink-300">-</p>
        </div>
      </div>
    </template>

    <p class="mt-4 text-10px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
}
</style>
