<script setup lang="ts">
import { ref } from 'vue'
import type { SeparationPair } from '../../types'

const pairs = defineModel<SeparationPair[]>({ required: true })

const props = defineProps<{
  participants: { id: string; name: string }[]
}>()

const studentAId = ref('')
const studentBId = ref('')

function nameOf(id: string): string {
  return props.participants.find((p) => p.id === id)?.name ?? '— (حذف‌شده)'
}

function addPair(): void {
  if (!studentAId.value || !studentBId.value || studentAId.value === studentBId.value) return
  const exists = pairs.value.some(
    (p) =>
      (p.studentAId === studentAId.value && p.studentBId === studentBId.value) ||
      (p.studentAId === studentBId.value && p.studentBId === studentAId.value),
  )
  if (exists) return
  pairs.value = [
    ...pairs.value,
    { id: crypto.randomUUID(), studentAId: studentAId.value, studentBId: studentBId.value },
  ]
  studentAId.value = ''
  studentBId.value = ''
}

function removePair(id: string): void {
  pairs.value = pairs.value.filter((p) => p.id !== id)
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">لیست دوستی / جفت‌های جداسازی</p>
    <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
      هر جفتی که اینجا اضافه کنی، در هیچ حالتی کنار هم (طبق سخت‌گیری انتخاب‌شده) ننشستند.
    </p>

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <select v-model="studentAId" class="min-w-140px flex-1 rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
        <option value="">نفر اول…</option>
        <option v-for="p in participants" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="studentBId" class="min-w-140px flex-1 rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
        <option value="">نفر دوم…</option>
        <option v-for="p in participants" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <button
        type="button"
        class="rounded-lg bg-ink-800 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 dark:bg-ink-700"
        :disabled="!studentAId || !studentBId || studentAId === studentBId"
        @click="addPair"
      >
        افزودن
      </button>
    </div>

    <div v-if="pairs.length" class="space-y-1.5">
      <div v-for="pair in pairs" :key="pair.id" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-xs dark:bg-ink-800">
        <span class="text-ink-700 dark:text-ink-200">{{ nameOf(pair.studentAId) }} ↔ {{ nameOf(pair.studentBId) }}</span>
        <button type="button" class="text-red-600 dark:text-red-400" @click="removePair(pair.id)">حذف</button>
      </div>
    </div>
    <p v-else class="text-11px text-ink-400 dark:text-ink-500">جفتی ثبت نشده است.</p>
  </div>
</template>
