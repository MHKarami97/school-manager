<script setup lang="ts">
import type { LessonPlan } from '@/types'
import { gradeLabel } from '@/config/levels.config'
import { LESSON_PLAN_STATUS_LABELS } from '@/config/lesson-plan.config'

const props = defineProps<{
  modelValue: boolean
  plan: LessonPlan | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close(): void {
  emit('update:modelValue', false)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && plan"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      @click.self="close"
    >
      <div
        class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-base font-bold text-ink-900 dark:text-ink-200">تاریخچه ویرایش‌ها</p>
            <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
              {{ plan.title || '—' }} · {{ gradeLabel(plan.grade) }}
            </p>
          </div>
          <button
            type="button"
            class="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            @click="close"
          >
            ✕
          </button>
        </div>

        <div
          v-if="!plan.history.length"
          class="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500"
        >
          هنوز ویرایشی روی این طرح درس ثبت نشده است.
        </div>

        <ol v-else class="space-y-3">
          <li
            v-for="entry in [...plan.history].reverse()"
            :key="entry.versionNumber"
            class="rounded-xl border border-ink-100 p-3 text-xs dark:border-ink-800"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="font-semibold text-ink-700 dark:text-ink-200">
                نسخه {{ entry.versionNumber }}
              </span>
              <span class="text-ink-400 dark:text-ink-500">{{ formatDate(entry.savedAt) }}</span>
            </div>
            <p class="text-ink-500 dark:text-ink-400">
              وضعیت در این نسخه: {{ LESSON_PLAN_STATUS_LABELS[entry.snapshot.status] }} ·
              {{ entry.snapshot.blocks.length }} بخش ثبت شده
            </p>
            <p v-if="entry.snapshot.objectives" class="mt-1 text-ink-600 dark:text-ink-300">
              اهداف: {{ entry.snapshot.objectives }}
            </p>
          </li>
        </ol>
      </div>
    </div>
  </Teleport>
</template>
