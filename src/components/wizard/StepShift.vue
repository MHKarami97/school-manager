<script setup lang="ts">
import { computed } from 'vue'
import { useWizardStore } from '@/stores/wizard'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import type { ShiftId, ShiftTimeConfig } from '@/types'

const wizard = useWizardStore()

const activeConfig = computed<ShiftTimeConfig>(() => wizard.shiftConfigs[wizard.shiftId])
const bellSchedule = computed(() => buildBellSchedule(activeConfig.value))

function chooseShift(id: ShiftId): void {
  wizard.setShiftId(id)
}

function updateNumberField(key: keyof ShiftTimeConfig, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  wizard.updateShiftConfig(wizard.shiftId, { [key]: value } as Partial<ShiftTimeConfig>)
}

function updateTextField(key: keyof ShiftTimeConfig, event: Event): void {
  const value = (event.target as HTMLInputElement).value
  wizard.updateShiftConfig(wizard.shiftId, { [key]: value } as Partial<ShiftTimeConfig>)
}

function updateCheckboxField(key: keyof ShiftTimeConfig, event: Event): void {
  const value = (event.target as HTMLInputElement).checked
  wizard.updateShiftConfig(wizard.shiftId, { [key]: value } as Partial<ShiftTimeConfig>)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-xl border-2 p-4 text-right transition"
        :class="wizard.shiftId === 'morning' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white'"
        @click="chooseShift('morning')"
      >
        <p class="text-sm font-semibold text-ink-800">شیفت صبح</p>
        <p class="mt-1 text-xs text-ink-500">{{ wizard.shiftConfigs.morning.startTime }} تا {{ wizard.shiftConfigs.morning.endTime }}</p>
      </button>
      <button
        type="button"
        class="rounded-xl border-2 p-4 text-right transition"
        :class="wizard.shiftId === 'noon' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white'"
        @click="chooseShift('noon')"
      >
        <p class="text-sm font-semibold text-ink-800">شیفت ظهر</p>
        <p class="mt-1 text-xs text-ink-500">{{ wizard.shiftConfigs.noon.startTime }} تا {{ wizard.shiftConfigs.noon.endTime }}</p>
      </button>
    </div>

    <div class="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600">ساعت شروع</label>
        <input
          type="time"
          :value="activeConfig.startTime"
          class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
          @change="updateTextField('startTime', $event)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600">ساعت پایان (تقریبی)</label>
        <input
          type="time"
          :value="activeConfig.endTime"
          class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
          @change="updateTextField('endTime', $event)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600">طول هر زنگ (دقیقه)</label>
        <input
          type="number"
          min="20"
          max="90"
          :value="activeConfig.lessonDurationMinutes"
          class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
          @change="updateNumberField('lessonDurationMinutes', $event)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600">طول زنگ تفریح (دقیقه)</label>
        <input
          type="number"
          min="5"
          max="30"
          :value="activeConfig.breakDurationMinutes"
          class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
          @change="updateNumberField('breakDurationMinutes', $event)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600">تعداد زنگ‌های درسی در روز</label>
        <input
          type="number"
          min="4"
          max="10"
          :value="activeConfig.periodsCount"
          class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
          @change="updateNumberField('periodsCount', $event)"
        />
      </div>
      <div class="flex items-center gap-2 self-end">
        <input
          id="lunch"
          type="checkbox"
          :checked="activeConfig.hasLunchBreak"
          class="h-4 w-4 rounded border-ink-300"
          @change="updateCheckboxField('hasLunchBreak', $event)"
        />
        <label for="lunch" class="text-xs font-medium text-ink-600">این شیفت زنگ تفریح ناهار دارد</label>
      </div>

      <template v-if="activeConfig.hasLunchBreak">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600">طول زنگ ناهار (دقیقه)</label>
          <input
            type="number"
            min="20"
            max="90"
            :value="activeConfig.lunchDurationMinutes"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            @change="updateNumberField('lunchDurationMinutes', $event)"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600">زنگ ناهار بعد از کدام زنگ باشد؟</label>
          <input
            type="number"
            min="1"
            :max="activeConfig.periodsCount"
            :value="activeConfig.lunchAfterPeriod"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            @change="updateNumberField('lunchAfterPeriod', $event)"
          />
        </div>
      </template>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5">
      <p class="mb-3 text-sm font-semibold text-ink-800">پیش‌نمایش زنگ‌ها</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="p in bellSchedule"
          :key="`${p.type}-${p.index}-${p.start}`"
          class="rounded-lg px-2.5 py-1 text-xs"
          :class="p.type === 'lesson' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'"
        >
          {{ p.type === 'lesson' ? `زنگ ${p.index}` : 'تفریح' }} · {{ p.start }}–{{ p.end }}
        </span>
      </div>
    </div>
  </div>
</template>
