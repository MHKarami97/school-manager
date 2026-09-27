<script setup lang="ts">
import { computed } from 'vue'
import { useSportWizardStore } from '@/stores/sport-wizard'
import { getLevelById, gradeLabel } from '@/config/levels.config'

const wizard = useSportWizardStore()

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))

function toggle(grade: number): void {
  const set = new Set(wizard.selectedGrades)
  if (set.has(grade)) set.delete(grade)
  else set.add(grade)
  wizard.setSelectedGrades(Array.from(set).sort((a, b) => a - b))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-3">
      <button
        v-for="grade in level?.grades ?? []"
        :key="grade"
        type="button"
        class="rounded-xl border-2 px-5 py-3 text-sm font-medium transition"
        :class="wizard.selectedGrades.includes(grade)
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
          : 'border-ink-200 bg-white text-ink-600 hover:border-brand-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
        @click="toggle(grade)"
      >
        {{ gradeLabel(grade) }}
      </button>
    </div>

    <div v-if="wizard.selectedGrades.length" class="space-y-3">
      <p class="text-xs font-medium text-ink-600 dark:text-ink-300">تعداد کلاس‌های هر پایه</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="grade in wizard.selectedGrades"
          :key="grade"
          class="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-2.5 dark:border-ink-700"
        >
          <span class="text-sm text-ink-700 dark:text-ink-200">{{ gradeLabel(grade) }}</span>
          <input
            type="number"
            min="1"
            max="10"
            :value="wizard.classesPerGrade[grade] ?? 1"
            class="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1 text-center text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            @change="wizard.setClassesForGrade(grade, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>
  </div>
</template>
