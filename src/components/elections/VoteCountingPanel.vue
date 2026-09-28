<script setup lang="ts">
import type { Candidate } from '../../types'

const props = defineProps<{
  candidates: Candidate[]
}>()

const emit = defineEmits<{
  (e: 'increment', candidateId: string): void
  (e: 'decrement', candidateId: string): void
  (e: 'set-votes', candidateId: string, value: number): void
}>()

function onManualInput(candidateId: string, event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value)
  emit('set-votes', candidateId, Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="candidate in candidates"
      :key="candidate.id"
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
    >
      <img v-if="candidate.photoDataUrl" :src="candidate.photoDataUrl" alt="" class="h-12 w-12 shrink-0 rounded-full object-cover" />
      <div
        v-else
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-500 dark:bg-ink-800 dark:text-ink-400"
      >
        {{ candidate.name.slice(0, 1) || '؟' }}
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-ink-800 dark:text-ink-200">{{ candidate.name || 'بدون نام' }}</p>
        <p v-if="candidate.gradeOrClass" class="text-sm text-ink-400 dark:text-ink-500">{{ candidate.gradeOrClass }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          @click="emit('decrement', candidate.id)"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          :value="candidate.voteCount"
          class="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          @change="onManualInput(candidate.id, $event)"
        />
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          @click="emit('increment', candidate.id)"
        >
          +
        </button>
      </div>
    </div>

    <p
      v-if="!candidates.length"
      class="rounded-2xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500"
    >
      نامزدی برای شمارش ثبت نشده است.
    </p>
  </div>
</template>
