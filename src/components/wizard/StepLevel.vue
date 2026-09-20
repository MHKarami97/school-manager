<script setup lang="ts">
import { useWizardStore } from '@/stores/wizard'
import { LEVELS } from '@/config/levels.config'
import type { LevelId } from '@/types'

const wizard = useWizardStore()

function choose(levelId: LevelId): void {
  wizard.setLevel(levelId)
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <button v-for="level in LEVELS" :key="level.id" type="button" class="rounded-2xl border-2 p-5 text-right transition" :class="wizard.levelId === level.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-ink-200 bg-white hover:border-brand-200 dark:border-ink-700 dark:bg-ink-900'" @click="choose(level.id)">
      <p class="text-base font-semibold text-ink-800 dark:text-ink-100">{{ level.name }}</p>
      <p class="mt-2 text-xs leading-6 text-ink-500 dark:text-ink-400">
        {{ level.schedulingMode === 'single-teacher' ? 'برنامه توسط هر معلم چیده می‌شود' : 'برنامه توسط کادر مدرسه با چند معلم تخصصی چیده می‌شود' }}
      </p>
    </button>
  </div>
</template>
