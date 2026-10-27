<script setup lang="ts">
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import { jalaliLabel } from '@/utils/attendance-date'
import type { FieldDef } from '@/data-manager/table-registry'
import RefPicker from './RefPicker.vue'

const model = defineModel<string | boolean>({ required: true })

defineProps<{ field: FieldDef; inputId: string; readonly: boolean }>()

function asText(value: string | boolean): string {
  return typeof value === 'string' ? value : ''
}

function onText(event: Event): void {
  model.value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
}

function onCheck(event: Event): void {
  model.value = (event.target as HTMLInputElement).checked
}

function onString(value: string): void {
  model.value = value
}
</script>

<template>
  <div>
    <label v-if="field.type === 'boolean'" class="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-800 dark:text-ink-200">
      <input :id="inputId" type="checkbox" class="h-5 w-5" :checked="model === true" :disabled="readonly" @change="onCheck" />
      {{ field.label }}
    </label>

    <template v-else>
      <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" :for="inputId">{{ field.label }}<span v-if="field.required" class="text-red-500"> *</span></label>

      <p v-if="readonly" class="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300" dir="auto">{{ asText(model) || '—' }}</p>

      <select v-else-if="field.type === 'select'" :id="inputId" :value="asText(model)" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="onText">
        <option v-if="!field.required || field.nullable" value="">—</option>
        <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>

      <textarea v-else-if="field.type === 'textarea'" :id="inputId" :value="asText(model)" rows="3" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @input="onText"></textarea>

      <div v-else-if="field.type === 'date'">
        <JalaliDatePicker :model-value="asText(model)" @update:model-value="onString" />
        <p class="mt-1 text-11px text-ink-400">{{ asText(model) ? `${jalaliLabel(asText(model))} (${asText(model)})` : 'بدون تاریخ' }}</p>
      </div>

      <input v-else-if="field.type === 'time'" :id="inputId" :value="asText(model)" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @input="onText" />

      <RefPicker v-else-if="field.type === 'ref' && field.ref" :id="inputId" :table="field.ref" :model-value="asText(model)" @update:model-value="onString" />

      <input v-else :id="inputId" :value="asText(model)" type="text" :inputmode="field.type === 'number' ? 'decimal' : undefined" :dir="field.type === 'number' || field.type === 'numlist' ? 'ltr' : undefined" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" :class="field.type === 'number' || field.type === 'numlist' ? 'text-left' : ''" @input="onText" />

      <p v-if="field.help" class="mt-1 text-11px text-ink-400 dark:text-ink-500">{{ field.help }}</p>
    </template>
  </div>
</template>
