<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ExitInfo } from '@/types'
import { EXIT_REASONS } from '@/config/attendance.config'
import { jalaliLabelWithWeekday, nowTime } from '@/utils/attendance-date'

const props = defineProps<{
  modelValue: boolean
  studentName: string
  date: string
  arrivalTime: string
  initial: ExitInfo | null
  errorMessage: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: ExitInfo): void
  (e: 'remove'): void
}>()

const time = ref('')
const reason = ref('')
const receiver = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    time.value = props.initial?.time ?? nowTime()
    reason.value = props.initial?.reason ?? ''
    receiver.value = props.initial?.receiver ?? ''
  },
)

function close(): void {
  emit('update:modelValue', false)
}

function submit(): void {
  emit('save', { time: time.value, reason: reason.value, receiver: receiver.value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" @click.self="close">
      <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
        <p id="exit-modal-title" class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ثبت خروج - {{ studentName }}</p>
        <p class="mb-4 text-xs text-ink-500 dark:text-ink-400">
          {{ jalaliLabelWithWeekday(date) }}<template v-if="arrivalTime"> - ورود: {{ arrivalTime }}</template>
        </p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="exit-time">ساعت خروج</label>
        <input id="exit-time" v-model="time" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="exit-reason">دلیل خروج</label>
        <div class="mb-2 flex flex-wrap gap-1.5">
          <button
            v-for="item in EXIT_REASONS"
            :key="item"
            type="button"
            class="min-h-11 rounded-lg border px-3 text-xs font-medium"
            :class="reason === item ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
            @click="reason = item"
          >
            {{ item }}
          </button>
        </div>
        <input id="exit-reason" v-model="reason" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="exit-receiver">نام تحویل‌گیرنده (اختیاری)</label>
        <input id="exit-receiver" v-model="receiver" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <p v-if="errorMessage" class="mb-3 text-xs text-red-600 dark:text-red-400" role="alert">{{ errorMessage }}</p>

        <div class="flex items-center justify-between gap-2">
          <button v-if="initial" type="button" class="min-h-11 text-xs text-red-600 hover:underline dark:text-red-400" @click="emit('remove')">حذف خروج</button>
          <span v-else></span>
          <div class="flex gap-2">
            <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
            <button type="button" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700" @click="submit">ثبت</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
