<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useTeachersStore } from '../stores/teachers'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { gradeLabel } from '../config/levels.config'
import { WEEK_DAYS } from '../types'
import { formatTeacherName } from '../utils/teacher-format'
import AppHeader from '../components/layout/AppHeader.vue'
import TeacherConstraintsEditor from '../components/teaching-plan/TeacherConstraintsEditor.vue'
import type { Teacher } from '../types'

const teachersStore = useTeachersStore()
onMounted(() => teachersStore.loadFromDb())

const searchText = ref('')
const newTeacherName = ref('')
const expandedId = ref('')

const teachers = computed(() => {
  const query = searchText.value.trim()
  return teachersStore.sortedByName.filter((t) => !query || t.name.includes(query))
})

async function addTeacher(): Promise<void> {
  const name = newTeacherName.value.trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, [])
  newTeacherName.value = ''
  expandedId.value = teacher.id
}

async function saveTeacher(teacher: Teacher): Promise<void> {
  await teachersStore.updateTeacher(teacher)
}

function courseNames(teacher: Teacher): string {
  return teacher.courseIds.map((id) => findCourse(BASE_COURSES, id)?.name ?? id).join('، ') || 'درسی ثبت نشده'
}

function summary(teacher: Teacher): string[] {
  const parts: string[] = []
  if (teacher.allowedGrades?.length) parts.push(`پایه‌ها: ${teacher.allowedGrades.map((g) => gradeLabel(g)).join('، ')}`)
  if (teacher.availability?.length) parts.push(`حضور: ${teacher.availability.map((a) => WEEK_DAYS[a.dayIndex]).join('، ')}`)
  if (teacher.maxDailyHours) parts.push(`حداکثر روزانه ${teacher.maxDailyHours}`)
  if (teacher.maxWeeklyHours) parts.push(`حداکثر هفتگی ${Math.floor(teacher.maxWeeklyHours)}`)
  if (teacher.blockedSlots?.length) parts.push(`${teacher.blockedSlots.length} ساعت غیرقابل‌تدریس`)
  return parts
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">معلمان و محدودیت‌های تدریس</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ teachersStore.items.length }} معلم - معلم‌های ثبت‌شده در بقیه‌ی بخش‌های برنامه</p>
        </div>
        <RouterLink to="/teaching-plans" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
          برنامه‌های تدریس
        </RouterLink>
      </div>

      <div class="mb-4 grid gap-2 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 dark:border-ink-800 dark:bg-ink-900">
        <input v-model="searchText" type="text" placeholder="جست‌وجوی معلم..." class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
        <div class="flex gap-2">
          <input v-model="newTeacherName" type="text" placeholder="افزودن معلم جدید" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @keyup.enter="addTeacher" />
          <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addTeacher">افزودن</button>
        </div>
      </div>

      <div v-if="!teachers.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400">
        معلمی پیدا نشد.
      </div>

      <div class="space-y-3">
        <div v-for="teacher in teachers" :key="teacher.id" class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <button type="button" class="flex w-full items-start justify-between gap-3 text-right" @click="expandedId = expandedId === teacher.id ? '' : teacher.id">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ formatTeacherName(teacher) }}</p>
              <p class="mt-0.5 truncate text-11px text-ink-500 dark:text-ink-400">{{ courseNames(teacher) }}</p>
              <div v-if="summary(teacher).length" class="mt-1.5 flex flex-wrap gap-1.5">
                <span v-for="part in summary(teacher)" :key="part" class="rounded-lg bg-ink-50 px-2 py-0.5 text-10px text-ink-600 dark:bg-ink-800 dark:text-ink-300">{{ part }}</span>
              </div>
            </div>
            <span class="shrink-0 text-xs text-brand-600 dark:text-brand-400">{{ expandedId === teacher.id ? 'بستن' : 'ویرایش' }}</span>
          </button>
          <TeacherConstraintsEditor v-if="expandedId === teacher.id" :teacher="teacher" class="mt-4" @save="saveTeacher" />
        </div>
      </div>
    </div>
  </div>
</template>
