<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CelebrationTask, CelebrationTaskStatus } from '../../types'
import { CELEBRATION_TASK_STATUSES, CELEBRATION_TASK_STATUS_LABELS } from '../../config/celebration.config'
import JalaliDatePicker from '../lessonPlan/JalaliDatePicker.vue'

const props = defineProps<{
  modelValue: boolean
  task: CelebrationTask | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', task: CelebrationTask): void
  (e: 'delete', taskId: string): void
}>()

const title = ref('')
const assignee = ref('')
const dueDate = ref('')
const status = ref<CelebrationTaskStatus>('todo')

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.task) {
      title.value = props.task.title
      assignee.value = props.task.assignee
      dueDate.value = props.task.dueDate
      status.value = props.task.status
    }
  },
)

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  if (!props.task || !title.value.trim()) return
  emit('save', {
    ...props.task,
    title: title.value.trim(),
    assignee: assignee.value.trim(),
    dueDate: dueDate.value,
    status: status.value,
  })
  close()
}

function removeTask(): void {
  if (!props.task) return
  emit('delete', props.task.id)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && task"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="close"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">ویرایش کار جشن</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان کار</label>
        <input
          v-model="title"
          type="text"
          placeholder="مثلاً: هماهنگی صحنه و صدا"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مسئول کار</label>
        <input
          v-model="assignee"
          type="text"
          placeholder="نام مسئول انجام کار"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">سررسید (شمسی)</label>
        <div class="mb-3">
          <JalaliDatePicker v-model="dueDate" />
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">وضعیت</label>
        <select
          v-model="status"
          class="mb-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option v-for="s in CELEBRATION_TASK_STATUSES" :key="s" :value="s">
            {{ CELEBRATION_TASK_STATUS_LABELS[s] }}
          </option>
        </select>

        <div class="flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="removeTask">
            حذف کار
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200"
              @click="close"
            >
              انصراف
            </button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="save">
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
