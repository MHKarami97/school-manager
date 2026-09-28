<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useLessonPlansStore } from '@/stores/lesson-plans'
import { useTeachersStore } from '@/stores/teachers'
import { LEVELS, gradeLabel } from '@/config/levels.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { LESSON_PLAN_STATUS_LABELS, LESSON_PLAN_STATUS_BADGE_CLASSES } from '@/config/lesson-plan.config'
import { formatTeacherName } from '@/utils/teacher-format'
import AppHeader from '@/components/layout/AppHeader.vue'
import type { LessonPlan, LevelId } from '@/types'

const lessonPlansStore = useLessonPlansStore()
const teachersStore = useTeachersStore()

onMounted(async () => {
  await Promise.all([lessonPlansStore.loadFromDb(), teachersStore.loadFromDb()])
})

const viewMode = ref<'list' | 'calendar'>('list')

const searchText = ref('')
const filterTeacherId = ref<string>('')
const filterCourseId = ref<string>('')
const filterLevelId = ref<LevelId | ''>('')
const filterGrade = ref<number | ''>('')

const gradesForLevel = computed(() => {
  if (!filterLevelId.value) return []
  return LEVELS.find((l) => l.id === filterLevelId.value)?.grades ?? []
})

const filteredPlans = computed<LessonPlan[]>(() => {
  const query = searchText.value.trim().toLowerCase()
  return lessonPlansStore.items.filter((plan) => {
    if (filterTeacherId.value && plan.teacherId !== filterTeacherId.value) return false
    if (filterCourseId.value && plan.courseId !== filterCourseId.value) return false
    if (filterLevelId.value && plan.levelId !== filterLevelId.value) return false
    if (filterGrade.value && plan.grade !== filterGrade.value) return false
    if (!query) return true
    const teacherName = teacherNameOf(plan.teacherId).toLowerCase()
    const courseName = courseNameOf(plan.courseId).toLowerCase()
    return (
      plan.title.toLowerCase().includes(query) ||
      teacherName.includes(query) ||
      courseName.includes(query)
    )
  })
})

const plansByWeek = computed(() => {
  const map = new Map<number, LessonPlan[]>()
  for (const plan of filteredPlans.value) {
    if (!map.has(plan.weekNumber)) map.set(plan.weekNumber, [])
    map.get(plan.weekNumber)!.push(plan)
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
})

function teacherNameOf(teacherId: string): string {
  const teacher = teachersStore.byId(teacherId)
  return teacher ? formatTeacherName(teacher) : '—'
}

function courseNameOf(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}

async function deletePlan(id: string): Promise<void> {
  if (!confirm('این طرح درس حذف شود؟')) return
  await lessonPlansStore.remove(id)
}

async function duplicatePlan(id: string): Promise<void> {
  await lessonPlansStore.duplicateAsTemplate(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">طرح درس معلم‌ها</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {{ lessonPlansStore.items.length }} طرح درس ثبت‌شده
          </p>
        </div>
        <RouterLink
          to="/lesson-plans/new"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + طرح درس جدید
        </RouterLink>
      </div>

      <div class="mb-4 flex gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="viewMode === 'list' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
          @click="viewMode = 'list'"
        >
          لیست طرح‌ها
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="viewMode === 'calendar' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
          @click="viewMode = 'calendar'"
        >
          نمای تقویمی هفتگی
        </button>
      </div>

      <div class="mb-6 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-4 dark:border-ink-800 dark:bg-ink-900">
        <input
          v-model="searchText"
          type="text"
          placeholder="جستجو در عنوان، معلم یا درس..."
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 sm:col-span-2"
        />
        <select
          v-model="filterTeacherId"
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option value="">همه معلم‌ها</option>
          <option v-for="t in teachersStore.sortedByName" :key="t.id" :value="t.id">
            {{ formatTeacherName(t) }}
          </option>
        </select>
        <select
          v-model="filterCourseId"
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option value="">همه دروس</option>
          <option v-for="c in BASE_COURSES" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select
          v-model="filterLevelId"
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option value="">همه مقاطع</option>
          <option v-for="l in LEVELS" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
        <select
          v-model="filterGrade"
          :disabled="!filterLevelId"
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 disabled:opacity-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option value="">همه پایه‌ها</option>
          <option v-for="g in gradesForLevel" :key="g" :value="g">{{ gradeLabel(g) }}</option>
        </select>
      </div>

      <div v-if="!filteredPlans.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">طرح درسی با این فیلترها یافت نشد.</p>
      </div>

      <!-- نمای لیست -->
      <div v-else-if="viewMode === 'list'" class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="plan in filteredPlans"
          :key="plan.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">
                {{ plan.title || 'بدون عنوان' }}
              </p>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-sm font-medium"
                :class="LESSON_PLAN_STATUS_BADGE_CLASSES[plan.status]"
              >
                {{ LESSON_PLAN_STATUS_LABELS[plan.status] }}
              </span>
            </div>
            <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">
              {{ courseNameOf(plan.courseId) }} · {{ gradeLabel(plan.grade) }} ·
              {{ teacherNameOf(plan.teacherId) }}
            </p>
            <p class="mb-3 text-sm text-ink-400 dark:text-ink-500">
              هفته {{ plan.weekNumber }} · {{ plan.sessionDate || 'بدون تاریخ' }}
            </p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink
                :to="`/lesson-plans/${plan.id}`"
                class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                ویرایش / مشاهده
              </RouterLink>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="text-xs text-ink-500 hover:text-ink-800 dark:text-ink-400"
                  @click="duplicatePlan(plan.id)"
                >
                  کپی برای جلسه بعد
                </button>
                <button
                  type="button"
                  class="text-xs text-red-600 dark:text-red-400"
                  @click="deletePlan(plan.id)"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- نمای تقویمی هفتگی -->
      <div v-else class="space-y-8">
        <div v-for="[week, plans] in plansByWeek" :key="week">
          <h2 class="mb-3 flex items-center gap-2 text-base font-bold text-ink-800 dark:text-ink-200">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white dark:bg-brand-600">
              {{ plans.length }}
            </span>
            هفته {{ week }}
          </h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <RouterLink
              v-for="plan in plans"
              :key="plan.id"
              :to="`/lesson-plans/${plan.id}`"
              class="rounded-xl border border-ink-100 bg-white p-3 text-xs hover:border-brand-200 dark:border-ink-800 dark:bg-ink-900"
            >
              <p class="font-semibold text-ink-800 dark:text-ink-200">{{ plan.title || 'بدون عنوان' }}</p>
              <p class="mt-1 text-ink-500 dark:text-ink-400">
                {{ plan.sessionDate || 'بدون تاریخ' }} · {{ courseNameOf(plan.courseId) }} ·
                {{ gradeLabel(plan.grade) }}
              </p>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
