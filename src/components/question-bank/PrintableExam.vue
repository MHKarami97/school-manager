<script setup lang="ts">
import { computed } from 'vue'
import type { Exam, ExamVersion, Question } from '../../types'
import { findCourse, BASE_COURSES } from '../../config/courses.config'
import { gradeLabel } from '../../config/levels.config'
import { isoStringToJalaali, formatJalaaliDate } from '../../utils/jalaali'
import { totalScoreOfExam } from '../../utils/exam-generator'

const props = defineProps<{
  exam: Exam
  questions: Question[]
  mode: 'with-answers' | 'without-answers'
  version?: ExamVersion | null
}>()

const orderedRefs = computed(() => {
  if (props.version) {
    return props.version.questionOrder
      .map((questionId) => props.exam.questionRefs.find((ref) => ref.questionId === questionId))
      .filter((ref): ref is Exam['questionRefs'][number] => !!ref)
  }
  return [...props.exam.questionRefs].sort((a, b) => a.order - b.order)
})

function questionOf(questionId: string): Question | undefined {
  return props.questions.find((q) => q.id === questionId)
}

function optionsOf(question: Question): string[] {
  const permutation = props.version?.optionOrders[question.id]
  if (!permutation) return question.options
  return permutation.map((originalIndex) => question.options[originalIndex])
}

function isCorrectOption(question: Question, displayedIndex: number): boolean {
  const permutation = props.version?.optionOrders[question.id]
  const originalIndex = permutation ? permutation[displayedIndex] : displayedIndex
  return String(originalIndex) === question.correctAnswer
}

function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="exam-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 border-b-2 border-ink-800 pb-3">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-bold">{{ exam.title }}</h1>
        <p class="text-xs text-ink-500">{{ printDate }}</p>
      </div>
      <p class="mt-1 text-xs text-ink-600">
        {{ findCourse(BASE_COURSES, exam.courseId)?.name ?? exam.courseId }} - {{ gradeLabel(exam.grade) }} -
        {{ jalaaliDateLabel(exam.date) }} - مدت: {{ exam.durationMinutes }} دقیقه - جمع بارم: {{ totalScoreOfExam(exam) }}
        <span v-if="version"> - {{ version.label }}</span>
        <strong v-if="mode === 'with-answers'"> (کلید پاسخ)</strong>
      </p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-11px text-ink-500">
        <p>نام و نام‌خانوادگی: ..........................</p>
        <p>کلاس: ..........................</p>
      </div>
    </div>

    <ol class="space-y-4">
      <li v-for="(ref, index) in orderedRefs" :key="ref.questionId">
        <template v-if="questionOf(ref.questionId)">
          <p class="text-sm">
            <strong>{{ index + 1 }}.</strong> {{ questionOf(ref.questionId)!.text }}
            <span class="text-11px text-ink-400">({{ ref.score }} نمره)</span>
          </p>

          <!-- تستی -->
          <div v-if="questionOf(ref.questionId)!.type === 'multiple-choice'" class="mt-1.5 grid grid-cols-2 gap-1.5 pr-4 text-sm">
            <p
              v-for="(option, optIndex) in optionsOf(questionOf(ref.questionId)!)"
              :key="optIndex"
              :class="mode === 'with-answers' && isCorrectOption(questionOf(ref.questionId)!, optIndex) ? 'font-bold text-emerald-700' : ''"
            >
              {{ String.fromCharCode(1571 + optIndex) }}) {{ option }}
              <span v-if="mode === 'with-answers' && isCorrectOption(questionOf(ref.questionId)!, optIndex)">✓</span>
            </p>
          </div>

          <!-- صحیح/غلط -->
          <p v-else-if="questionOf(ref.questionId)!.type === 'true-false'" class="mt-1.5 pr-4 text-sm">
            صحیح ⬜ &nbsp;&nbsp; غلط ⬜
            <span v-if="mode === 'with-answers'" class="font-bold text-emerald-700">
              (پاسخ: {{ questionOf(ref.questionId)!.correctAnswer === 'true' ? 'صحیح' : 'غلط' }})
            </span>
          </p>

          <!-- جای‌خالی / تشریحی -->
          <div v-else class="mt-1.5 pr-4 text-sm">
            <div class="h-10 border-b border-dotted border-ink-300"></div>
            <p v-if="mode === 'with-answers' && questionOf(ref.questionId)!.correctAnswer" class="mt-1 text-11px font-medium text-emerald-700">
              پاسخ نمونه: {{ questionOf(ref.questionId)!.correctAnswer }}
            </p>
          </div>
        </template>
      </li>
    </ol>

    <p class="mt-6 text-10px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
}
</style>
