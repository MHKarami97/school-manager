<script setup lang="ts">
import { computed } from 'vue'
import { useSportWizardStore } from '@/stores/sport-wizard'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import type { ShiftId } from '@/types'

const wizard = useSportWizardStore()

const activeConfig = computed(() => wizard.shiftConfigs[wizard.shiftId])
const bellSchedule = computed(() => buildBellSchedule(activeConfig.value))

function chooseShift(id: ShiftId): void {
  wizard.setShiftId(id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-xl border-2 p-4 text-right transition"
        :class="wizard.shiftId === 'morning'
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'"
        @click="chooseShift('morning')"
      >
        <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">شیفت صبح</p>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
          {{ wizard.shiftConfigs.morning.startTime }} - {{ wizard.shiftConfigs.morning.endTime }}
        </p>
      </button>
      <button
        type="button"
        class="rounded-xl border-2 p-4 text-right transition"
        :class="wizard.shiftId === 'noon'
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'"
        @click="chooseShift('noon')"
      >
        <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">شیفت ظهر</p>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
          {{ wizard.shiftConfigs.noon.startTime }} - {{ wizard.shiftConfigs.noon.endTime }}
        </p>
      </button>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">زنگ‌های این شیفت</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="p in bellSchedule"
          :key="`${p.type}-${p.index}-${p.start}`"
          class="rounded-lg px-2.5 py-1 text-xs"
          :class="p.type === 'lesson' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
        >
          {{ p.type === 'lesson' ? `زنگ ${p.index}` : 'تفریح' }} ({{ p.start }}-{{ p.end }})
        </span>
      </div>
    </div>
  </div>
</template>
