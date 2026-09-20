<script setup lang="ts">
import { computed } from 'vue'
import type { StudentGroup, Student, Teacher } from '@/types'
import { gradeLabel } from '@/config/levels.config'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{
  modelValue: boolean
  group: StudentGroup | null
  students: Student[]
  teacher: Teacher | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close(): void {
  emit('update:modelValue', false)
}

const stats = computed(() => {
  const gpas = props.students.map((s) => s.gpa).filter((v): v is number => v !== null)
  const disciplines = props.students.map((s) => s.disciplineScore).filter((v): v is number => v !== null)
  return {
    avgGpa: gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(1) : '-',
    avgDiscipline: disciplines.length ? (disciplines.reduce((a, b) => a + b, 0) / disciplines.length).toFixed(1) : '-',
    weakCount: props.students.filter((s) => s.isAcademicallyWeak).length,
    disruptiveCount: props.students.filter((s) => s.isDisruptive).length,
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && group" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" @click.self="close">
      <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-base font-bold text-ink-900 dark:text-ink-50">{{ group.title }}</p>
            <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
              پایه {{ gradeLabel(group.grade) }} - {{ group.gender === 'female' ? 'دختر' : 'پسر' }}
            </p>
          </div>
          <button type="button" class="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200" @click="close">✕</button>
        </div>

        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-ink-50 p-3 text-center dark:bg-ink-800">
            <p class="text-lg font-bold text-ink-800 dark:text-ink-100">{{ students.length }}/{{ group.capacity }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-400">نفرات</p>
          </div>
          <div class="rounded-xl bg-ink-50 p-3 text-center dark:bg-ink-800">
            <p class="text-lg font-bold text-ink-800 dark:text-ink-100">{{ stats.avgGpa }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-400">میانگین معدل</p>
          </div>
          <div class="rounded-xl bg-ink-50 p-3 text-center dark:bg-ink-800">
            <p class="text-lg font-bold text-ink-800 dark:text-ink-100">{{ stats.avgDiscipline }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-400">میانگین انضباط</p>
          </div>
          <div class="rounded-xl bg-ink-50 p-3 text-center dark:bg-ink-800">
            <p class="text-lg font-bold text-ink-800 dark:text-ink-100">{{ group.teacherStrengthScore }}/۵</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-400">قدرت معلم</p>
          </div>
        </div>

        <p v-if="teacher" class="mb-4 text-xs text-ink-600 dark:text-ink-300">معلم: {{ formatTeacherName(teacher) }}</p>

        <p class="mb-2 text-xs font-semibold text-ink-700 dark:text-ink-200">لیست دانش‌آموزان ({{ students.length }} نفر)</p>
        <div class="overflow-hidden rounded-xl border border-ink-100 dark:border-ink-800">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50 text-right text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                <th class="p-2">نام</th>
                <th class="p-2">معدل</th>
                <th class="p-2">انضباط</th>
                <th class="p-2">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id" class="border-t border-ink-50 dark:border-ink-800/60">
                <td class="p-2 text-ink-800 dark:text-ink-100">{{ student.firstName }} {{ student.lastName }}</td>
                <td class="p-2 text-ink-500 dark:text-ink-400">{{ student.gpa ?? '-' }}</td>
                <td class="p-2 text-ink-500 dark:text-ink-400">{{ student.disciplineScore ?? '-' }}</td>
                <td class="p-2">
                  <span v-if="student.isAcademicallyWeak" class="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">ضعیف</span>
                  <span v-if="student.isDisruptive" class="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 dark:bg-red-500/10 dark:text-red-400">بی‌انضباط</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="stats.weakCount || stats.disruptiveCount" class="mt-3 text-[11px] text-ink-400 dark:text-ink-500">
          {{ stats.weakCount }} دانش‌آموز ضعیف علمی و {{ stats.disruptiveCount }} دانش‌آموز بی‌انضباط در این گروه هستند.
        </p>
      </div>
    </div>
  </Teleport>
</template>
