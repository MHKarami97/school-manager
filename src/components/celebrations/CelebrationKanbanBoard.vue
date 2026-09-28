<script setup lang="ts">
import { computed } from 'vue'
import type { CelebrationTask, CelebrationTaskStatus } from '../../types'
import { CELEBRATION_TASK_STATUSES, CELEBRATION_TASK_STATUS_LABELS } from '../../config/celebration.config'
import { isTaskOverdue, jalaaliDateLabel } from '../../utils/celebration-helpers'

const props = defineProps<{
  tasks: CelebrationTask[]
}>()

const emit = defineEmits<{
  (e: 'update-status', taskId: string, status: CelebrationTaskStatus): void
  (e: 'open-task', task: CelebrationTask): void
  (e: 'add-task', status: CelebrationTaskStatus): void
}>()

const columns = computed(() =>
  CELEBRATION_TASK_STATUSES.map((status) => ({
    status,
    label: CELEBRATION_TASK_STATUS_LABELS[status],
    tasks: props.tasks.filter((task) => task.status === status),
  })),
)

function onDragStart(event: DragEvent, taskId: string): void {
  event.dataTransfer?.setData('text/plain', taskId)
}

function onDrop(event: DragEvent, status: CelebrationTaskStatus): void {
  const taskId = event.dataTransfer?.getData('text/plain')
  if (!taskId) return
  emit('update-status', taskId, status)
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <div
      v-for="column in columns"
      :key="column.status"
      class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900"
      @dragover.prevent
      @drop="onDrop($event, column.status)"
    >
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-semibold text-ink-700 dark:text-ink-200">{{ column.label }}</p>
        <span class="rounded-full bg-ink-100 px-2 py-0.5 text-sm font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
          {{ column.tasks.length }}
        </span>
      </div>

      <div class="min-h-24 space-y-2">
        <div
          v-for="task in column.tasks"
          :key="task.id"
          draggable="true"
          class="cursor-pointer rounded-xl border p-2.5 text-xs transition"
          :class="
            isTaskOverdue(task)
              ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
              : 'border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-800'
          "
          @dragstart="onDragStart($event, task.id)"
          @click="emit('open-task', task)"
        >
          <p class="font-medium text-ink-800 dark:text-ink-200">{{ task.title }}</p>
          <p class="mt-1 text-ink-500 dark:text-ink-400">{{ task.assignee || 'بدون مسئول' }}</p>
          <p
            class="mt-1 flex items-center justify-between text-10px"
            :class="isTaskOverdue(task) ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink-400 dark:text-ink-500'"
          >
            <span>{{ jalaaliDateLabel(task.dueDate) }}</span>
            <span v-if="isTaskOverdue(task)">عقب‌افتاده</span>
          </p>
        </div>
        <p
          v-if="!column.tasks.length"
          class="rounded-xl border border-dashed border-ink-200 p-3 text-center text-sm text-ink-400 dark:border-ink-700 dark:text-ink-500"
        >
          کاری در این بخش نیست.
        </p>
      </div>

      <button
        type="button"
        class="mt-3 w-full rounded-lg border border-dashed border-ink-200 py-1.5 text-sm font-medium text-ink-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400"
        @click="emit('add-task', column.status)"
      >
        + افزودن کار
      </button>
    </div>
  </div>
</template>
