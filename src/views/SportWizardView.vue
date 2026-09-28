<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSportWizardStore } from '@/stores/sport-wizard'
import AppHeader from '@/components/layout/AppHeader.vue'
import SportStepLevel from '@/components/sport/SportStepLevel.vue'
import SportStepGrades from '@/components/sport/SportStepGrades.vue'
import SportStepShift from '@/components/sport/SportStepShift.vue'
import SportStepTeachers from '@/components/sport/SportStepTeachers.vue'
import SportStepFacilities from '@/components/sport/SportStepFacilities.vue'
import SportStepReview from '@/components/sport/SportStepReview.vue'

const wizard = useSportWizardStore()

const steps = [
  { component: SportStepLevel, title: 'انتخاب مقطع' },
  { component: SportStepGrades, title: 'پایه‌ها و تعداد کلاس‌ها' },
  { component: SportStepShift, title: 'شیفت و زمان‌بندی' },
  { component: SportStepTeachers, title: 'معلمان ورزش' },
  { component: SportStepFacilities, title: 'سالن و فضای ورزشی' },
  { component: SportStepReview, title: 'بررسی و ساخت برنامه' },
]

const currentStepIndex = computed(() => Math.min(Math.max(wizard.step, 1), steps.length) - 1)
const currentStep = computed(() => steps[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)

const progressPercent = computed(() => {
  if (steps.length === 1) return 0
  return (currentStepIndex.value / (steps.length - 1)) * 100
})

const canGoNext = computed(() => {
  switch (wizard.step) {
    case 1:
      return !!wizard.levelId
    case 2:
      return wizard.selectedGrades.length > 0
    case 4:
      return wizard.selectedTeacherIds.length > 0
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
function goToStep(index: number): void {
  if (index > currentStepIndex.value) return
  wizard.goToStep(index + 1)
}

function handleReset(): void {
  const confirmed = window.confirm('این کار پیشرفت فعلی ساخت برنامه ورزش را پاک می‌کند. ادامه می‌دهی؟')
  if (!confirmed) return
  wizard.reset()
}

onMounted(() => wizard.restore())
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />
    <div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <div class="mb-4 flex justify-end">
        <button
          type="button"
          class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
          @click="handleReset"
        >
          شروع دوباره
        </button>
      </div>

      <ol class="relative mb-10 flex justify-between px-1">
        <div class="pointer-events-none absolute top-3.5 right-4 left-4 h-0.5 -translate-y-1/2 bg-ink-100 dark:bg-ink-800 sm:top-4"></div>
        <div
          class="pointer-events-none absolute top-3.5 right-4 h-0.5 -translate-y-1/2 bg-brand-600 transition-all sm:top-4"
          :style="{ width: `calc((100% - 2rem) * ${progressPercent / 100})` }"
        ></div>
        <li v-for="(step, index) in steps" :key="step.title" class="relative z-10 flex flex-1 flex-col items-center">
          <button
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition sm:h-8 sm:w-8 sm:text-xs"
            :class="[
              index <= currentStepIndex ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500',
              index <= currentStepIndex ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed',
            ]"
            :disabled="index > currentStepIndex"
            :aria-label="step.title"
            :title="step.title"
            @click="goToStep(index)"
          >
            {{ index + 1 }}
          </button>
          <span
            class="mt-1.5 w-full text-center text-9px font-medium leading-tight text-ink-500 dark:text-ink-400 sm:text-sm"
            style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden"
          >
            {{ step.title }}
          </span>
        </li>
      </ol>

      <h1 class="mb-6 text-xl font-bold text-ink-900 dark:text-ink-200">{{ currentStep.title }}</h1>
      <component :is="currentStep.component" />

      <div v-if="!isLastStep" class="mt-8 flex items-center justify-between">
        <button
          type="button"
          class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 transition disabled:opacity-40 dark:border-ink-700 dark:text-ink-300"
          :disabled="wizard.step <= 1"
          @click="goBack"
        >
          قبلی
        </button>
        <button
          type="button"
          class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canGoNext"
          @click="goNext"
        >
          بعدی
        </button>
      </div>
      <div v-else class="mt-8">
        <button
          type="button"
          class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 transition dark:border-ink-700 dark:text-ink-300"
          @click="goBack"
        >
          قبلی
        </button>
      </div>
    </div>
  </div>
</template>
