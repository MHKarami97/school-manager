<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LevelId } from '../../types'
import { BASE_COURSES, findCourse } from '../../config/courses.config'
import { gradeLabel } from '../../config/levels.config'
import { defaultCurriculumForGrade } from '../../config/teaching-plan.config'

const curriculum = defineModel<Record<number, Record<string, number>>>({ required: true })

const props = defineProps<{
  levelId: LevelId
  grades: number[]
}>()

const addCourseId = ref<Record<number, string | undefined>>({})

const sortedGrades = computed(() => [...props.grades].sort((a, b) => a - b))

function totalOf(grade: number): number {
  return Object.values(curriculum.value[grade] ?? {}).reduce((sum, hours) => sum + hours, 0)
}

function entriesOf(grade: number): [string, number][] {
  return Object.entries(curriculum.value[grade] ?? {}).sort(
    (a, b) => (findCourse(BASE_COURSES, a[0])?.name ?? a[0]).localeCompare(findCourse(BASE_COURSES, b[0])?.name ?? b[0], 'fa'),
  )
}

function update(grade: number, next: Record<string, number>): void {
  curriculum.value = { ...curriculum.value, [grade]: next }
}

function setHours(grade: number, courseId: string, value: number): void {
  const next = { ...(curriculum.value[grade] ?? {}) }
  if (!Number.isFinite(value) || value <= 0) delete next[courseId]
  else next[courseId] = Math.round(value)
  update(grade, next)
}

function addCourse(grade: number): void {
  const courseId = addCourseId.value[grade]
  if (!courseId) return
  update(grade, { ...(curriculum.value[grade] ?? {}), [courseId]: curriculum.value[grade]?.[courseId] ?? 1 })
  addCourseId.value = { ...addCourseId.value, [grade]: '' }
}

function resetGrade(grade: number): void {
  if (!confirm('سرفصل این پایه به مقدار پیش‌فرض برنامه برگردد؟')) return
  update(grade, defaultCurriculumForGrade(props.levelId, grade))
}

function availableCourses(grade: number) {
  const used = curriculum.value[grade] ?? {}
  return BASE_COURSES.filter((course) => !(course.id in used))
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="grade in sortedGrades" :key="grade" class="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold text-ink-800 dark:text-ink-200">{{ gradeLabel(grade) }} - جمع {{ totalOf(grade) }} ساعت در هفته</p>
        <button type="button" class="text-11px text-ink-500 hover:underline dark:text-ink-400" @click="resetGrade(grade)">بازنشانی به پیش‌فرض</button>
      </div>
      <div class="grid gap-1.5 sm:grid-cols-2">
        <div v-for="[courseId, hours] in entriesOf(grade)" :key="courseId" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-xs dark:bg-ink-800">
          <span class="flex items-center gap-1.5 text-ink-700 dark:text-ink-200">
            <i class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: findCourse(BASE_COURSES, courseId)?.color ?? '#8892a6' }"></i>
            {{ findCourse(BASE_COURSES, courseId)?.name ?? courseId }}
          </span>
          <input
            type="number"
            min="0"
            max="12"
            :value="hours"
            class="w-14 rounded border border-ink-200 bg-white px-1 py-0.5 text-center dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
            @change="setHours(grade, courseId, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
      <div class="mt-2 flex gap-2">
        <select v-model="addCourseId[grade]" class="flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option :value="undefined">افزودن درس به سرفصل…</option>
          <option v-for="course in availableCourses(grade)" :key="course.id" :value="course.id">{{ course.name }}</option>
        </select>
        <button type="button" class="rounded-lg border border-ink-200 px-3 text-11px font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="addCourse(grade)">افزودن</button>
      </div>
    </div>
    <p v-if="!sortedGrades.length" class="text-11px text-ink-400 dark:text-ink-500">ابتدا پایه‌ها را انتخاب کن.</p>
  </div>
</template>
