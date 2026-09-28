<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useExamsStore } from '../stores/exams'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { gradeLabel } from '../config/levels.config'
import { totalScoreOfExam } from '../utils/exam-generator'
import { jalaaliDateLabel } from '../utils/question-bank-date'
import AppHeader from '../components/layout/AppHeader.vue'

const examsStore = useExamsStore()
onMounted(() => examsStore.loadFromDb())

const sortedExams = computed(() => [...examsStore.items].sort((a, b) => b.updatedAt - a.updatedAt))

async function deleteExam(id: string): Promise<void> {
  if (!confirm('این آزمون حذف شود؟')) return
  await examsStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">آزمون‌ها</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ examsStore.items.length }} آزمون ثبت‌شده</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/question-bank" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            بانک سوال
          </RouterLink>
          <RouterLink to="/exams/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
            + آزمون جدید
          </RouterLink>
        </div>
      </div>

      <div v-if="!sortedExams.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز آزمونی ساخته نشده است.</p>
        <RouterLink to="/exams/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          ساخت اولین آزمون
        </RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="exam in sortedExams"
          :key="exam.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ exam.title || 'بدون عنوان' }}</p>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              {{ findCourse(BASE_COURSES, exam.courseId)?.name ?? exam.courseId }} - {{ gradeLabel(exam.grade) }}
            </p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
              {{ jalaaliDateLabel(exam.date) }} - {{ exam.questionRefs.length }} سوال - جمع بارم {{ totalScoreOfExam(exam) }}
            </p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink :to="`/exams/${exam.id}`" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                مدیریت و چاپ
              </RouterLink>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteExam(exam.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
