<script setup lang="ts">
import type { Question } from '../../types'
import { DIFFICULTY_BADGE_CLASSES, DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '../../config/question-bank.config'
import { gradeLabel } from '../../config/levels.config'
import { findCourse, BASE_COURSES } from '../../config/courses.config'

defineProps<{
  question: Question
  selectable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'toggle-select', id: string): void
}>()

function courseName(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
    <div class="mb-2 flex items-start justify-between gap-2">
      <label v-if="selectable" class="flex items-start gap-2">
        <input
          type="checkbox"
          :checked="selected"
          class="mt-1 h-4 w-4 rounded border-ink-300"
          @change="emit('toggle-select', question.id)"
        />
        <p class="text-sm text-ink-800 dark:text-ink-200">{{ question.text }}</p>
      </label>
      <p v-else class="text-sm text-ink-800 dark:text-ink-200">{{ question.text }}</p>
      <span class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium" :class="DIFFICULTY_BADGE_CLASSES[question.difficulty]">
        {{ DIFFICULTY_LABELS[question.difficulty] }}
      </span>
    </div>

    <div class="mb-2 flex flex-wrap gap-1.5 text-11px text-ink-400 dark:text-ink-500">
      <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ QUESTION_TYPE_LABELS[question.type] }}</span>
      <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ courseName(question.courseId) }}</span>
      <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ gradeLabel(question.grade) }}</span>
      <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">بارم {{ question.suggestedScore }}</span>
      <span v-for="tag in question.tags" :key="tag" class="rounded-lg bg-brand-50 px-2 py-1 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300">
        #{{ tag }}
      </span>
    </div>

    <div v-if="!selectable" class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
      <button type="button" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400" @click="emit('edit', question.id)">
        ویرایش
      </button>
      <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="emit('delete', question.id)">حذف</button>
    </div>
  </div>
</template>
