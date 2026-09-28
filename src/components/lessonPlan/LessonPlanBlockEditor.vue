<script setup lang="ts">
import { computed } from 'vue'
import type { LessonPlanBlock } from '@/types'
import { createEmptyLessonPlanBlock, totalEstimatedMinutes } from '@/config/lesson-plan.config'

const blocks = defineModel<LessonPlanBlock[]>({ required: true })

const total = computed(() => totalEstimatedMinutes(blocks.value))

function addBlock(): void {
  blocks.value = [...blocks.value, createEmptyLessonPlanBlock()]
}

function removeBlock(id: string): void {
  blocks.value = blocks.value.filter((b) => b.id !== id)
}

function updateBlock(id: string, patch: Partial<LessonPlanBlock>): void {
  blocks.value = blocks.value.map((b) => (b.id === id ? { ...b, ...patch } : b))
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold text-ink-700 dark:text-ink-200">بخش‌های زمان‌بندی‌شده جلسه</p>
      <span class="text-sm text-ink-400 dark:text-ink-500">مجموع: {{ total }} دقیقه</span>
    </div>

    <div
      v-for="block in blocks"
      :key="block.id"
      class="rounded-xl border border-ink-100 p-3 dark:border-ink-800"
    >
      <div class="grid gap-2 sm:grid-cols-[1fr_100px_auto]">
        <input
          :value="block.title"
          type="text"
          placeholder="عنوان بخش (مثلاً: مقدمه و آمادگی)"
          class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          @input="updateBlock(block.id, { title: ($event.target as HTMLInputElement).value })"
        />
        <input
          :value="block.estimatedMinutes"
          type="number"
          min="1"
          max="120"
          placeholder="دقیقه"
          class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          @input="
            updateBlock(block.id, {
              estimatedMinutes: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
        <button
          type="button"
          class="rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 dark:border-red-900/30 dark:text-red-400"
          @click="removeBlock(block.id)"
        >
          حذف
        </button>
      </div>
      <textarea
        :value="block.description"
        rows="2"
        placeholder="توضیح کوتاه این بخش از جلسه"
        class="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        @input="updateBlock(block.id, { description: ($event.target as HTMLTextAreaElement).value })"
      ></textarea>
    </div>

    <button
      type="button"
      class="w-full rounded-lg border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-500 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400"
      @click="addBlock"
    >
      + افزودن بخش جدید
    </button>
  </div>
</template>
