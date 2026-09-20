<script setup lang="ts">
import { computed } from 'vue'
import { useWizardStore } from '@/stores/wizard'
import { getLevelById, gradeLabel } from '@/config/levels.config'

const wizard = useWizardStore()
const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))

function toggle(grade: number): void {
  const set = new Set(wizard.selectedGrades)
  if (set.has(grade)) set.delete(grade)
  else set.add(grade)
  wizard.setSelectedGrades(Array.from(set).sort((a, b) => a - b))
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-3">
      <button
        v-for="grade in level?.grades ?? []"
        :key="grade"
        type="button"
        class="rounded-xl border-2 px-5 py-3 text-sm font-medium transition"
        :class="wizard.selectedGrades.includes(grade) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-200'"
        @click="toggle(grade)"
      >
        پایه {{ gradeLabel(grade) }}
      </button>
    </div>
    <p class="mt-4 text-xs text-ink-400">می‌توانید بیش از یک پایه را انتخاب کنید.</p>
  </div>
</template>
