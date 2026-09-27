<script setup lang="ts">
import { computed } from 'vue'
import type { LessonPlan, Teacher, CourseDefinition } from '@/types'
import { gradeLabel } from '@/config/levels.config'
import { formatTeacherName } from '@/utils/teacher-format'
import { LESSON_PLAN_STATUS_LABELS } from '@/config/lesson-plan.config'
import { isoStringToJalaali, formatJalaaliDate } from '@/utils/jalaali'

const props = defineProps<{
  plan: LessonPlan
  teacher?: Teacher | null
  course?: CourseDefinition | null
}>()

const totalMinutes = computed(() =>
  props.plan.blocks.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0),
)

const sessionDateJalaali = computed(() => {
  const j = isoStringToJalaali(props.plan.sessionDate)
  return j ? formatJalaaliDate(j) : '—'
})

const printDate = new Date().toLocaleDateString('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
</script>

<template>
  <div class="lesson-plan-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">طرح درس: {{ plan.title || '—' }}</h1>
        <p class="text-xs text-ink-600">
          {{ course?.name ?? plan.courseId }} · {{ gradeLabel(plan.grade) }} ·
          هفته {{ plan.weekNumber }} · {{ LESSON_PLAN_STATUS_LABELS[plan.status] }}
        </p>
      </div>
      <p class="text-xs text-ink-500">{{ printDate }}</p>
    </div>

    <div class="mb-4 grid grid-cols-4 gap-3 text-xs">
      <p><strong>معلم:</strong> {{ teacher ? formatTeacherName(teacher) : '—' }}</p>
      <p><strong>تاریخ جلسه:</strong> {{ sessionDateJalaali }}</p>
      <p><strong>هفته:</strong> {{ plan.weekNumber }}</p>
      <p><strong>مجموع زمان:</strong> {{ totalMinutes }} دقیقه</p>
    </div>

    <!-- چیدمان دو ستونه، مخصوص برگه‌ی افقی (Landscape) -->
    <div class="grid grid-cols-2 gap-6">
      <div class="space-y-3 text-sm leading-6">
        <div>
          <p class="font-semibold text-ink-800">اهداف آموزشی</p>
          <p class="text-ink-600">{{ plan.objectives || '—' }}</p>
        </div>
        <div>
          <p class="font-semibold text-ink-800">روش تدریس</p>
          <p class="text-ink-600">{{ plan.teachingMethod || '—' }}</p>
        </div>
        <div>
          <p class="font-semibold text-ink-800">منابع و وسایل کمک‌آموزشی</p>
          <p class="text-ink-600">{{ plan.resources || '—' }}</p>
        </div>
        <div>
          <p class="font-semibold text-ink-800">تکلیف و ارزشیابی</p>
          <p class="text-ink-600">{{ plan.assessment || '—' }}</p>
        </div>
      </div>

      <table class="h-fit w-full border-collapse text-xs">
        <thead>
          <tr>
            <th class="border border-ink-400 bg-ink-100 p-2 w-8">#</th>
            <th class="border border-ink-400 bg-ink-100 p-2">عنوان بخش</th>
            <th class="border border-ink-400 bg-ink-100 p-2">توضیح</th>
            <th class="border border-ink-400 bg-ink-100 p-2 w-16">دقیقه</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(block, index) in plan.blocks" :key="block.id">
            <td class="border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
            <td class="border border-ink-400 p-2">{{ block.title }}</td>
            <td class="border border-ink-400 p-2">{{ block.description }}</td>
            <td class="border border-ink-400 p-2 text-center">{{ block.estimatedMinutes }}</td>
          </tr>
          <tr v-if="!plan.blocks.length">
            <td colspan="4" class="border border-ink-400 p-3 text-center text-ink-400">
              بخشی ثبت نشده است.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex items-center justify-between border-t border-ink-300 pt-3">
      <p class="text-11px text-ink-500">school.mhkarami97.ir</p>
    </div>
  </div>
</template>

<style>
/* برگه‌ی چاپ این کامپوننت باید افقی (Landscape) باشد */
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
}
</style>
