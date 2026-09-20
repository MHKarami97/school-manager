<script setup lang="ts">
import { computed } from 'vue'
import { useWizardStore } from '@/stores/wizard'
import AppHeader from '@/components/layout/AppHeader.vue'
import StepAudience from '@/components/wizard/StepAudience.vue'
import StepLevel from '@/components/wizard/StepLevel.vue'
import StepGrades from '@/components/wizard/StepGrades.vue'
import StepShift from '@/components/wizard/StepShift.vue'
import StepTeachers from '@/components/wizard/StepTeachers.vue'
import StepReview from '@/components/wizard/StepReview.vue'

const wizard = useWizardStore()

const steps = [
  { component: StepAudience, title: 'مخاطب برنامه' },
  { component: StepLevel, title: 'دوره تحصیلی' },
  { component: StepGrades, title: 'انتخاب پایه' },
  { component: StepShift, title: 'شیفت و زمان‌بندی' },
  { component: StepTeachers, title: 'معلم‌ها' },
  { component: StepReview, title: 'بازبینی و ساخت برنامه' },
]

const currentStepIndex = computed(() => Math.min(Math.max(wizard.step, 1), steps.length) - 1)
const currentStep = computed(() => steps[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)

const canGoNext = computed(() => {
  switch (wizard.step) {
    case 1:
      return !!wizard.audience && (wizard.audience === 'self' || wizard.schoolName.trim().length > 0)
    case 2:
      return !!wizard.levelId
    case 3:
      return wizard.selectedGrades.length > 0
    default:
      return true
  }
})

function goNext(): void {
  if (!isLastStep.value) wizard.nextStep()
}

function goBack(): void {
  wizard.prevStep()
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />
    <div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <ol class="mb-8 flex items-center">
        <li v-for="(step, index) in steps" :key="step.title" class="flex flex-1 items-center">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition" :class="index <= currentStepIndex ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500'">
            {{ index + 1 }}
          </div>
          <div v-if="index < steps.length - 1" class="mx-1 h-0.5 flex-1 transition" :class="index < currentStepIndex ? 'bg-brand-600' : 'bg-ink-100 dark:bg-ink-800'"></div>
        </li>
      </ol>
      <h1 class="mb-6 text-xl font-bold text-ink-900 dark:text-ink-50">{{ currentStep.title }}</h1>
      <component :is="currentStep.component" />
      <div v-if="!isLastStep" class="mt-8 flex items-center justify-between">
        <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 transition disabled:opacity-40 dark:border-ink-700 dark:text-ink-300" :disabled="wizard.step === 1" @click="goBack">
          مرحله قبل
        </button>
        <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canGoNext" @click="goNext">
          مرحله بعد
        </button>
      </div>
      <div v-else class="mt-8">
        <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 transition dark:border-ink-700 dark:text-ink-300" @click="goBack">
          مرحله قبل
        </button>
      </div>
    </div>
  </div>
</template>
