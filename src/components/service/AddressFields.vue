<script setup lang="ts">
import { PROVINCES } from '@/config/service.config'
import type { ServiceAddress } from '@/types'
import SuggestionInput from './SuggestionInput.vue'

type TextField = Exclude<keyof ServiceAddress, 'province'>

const address = defineModel<ServiceAddress>({ required: true })

withDefaults(defineProps<{ regionSuggestions?: string[]; idPrefix?: string }>(), {
  regionSuggestions: () => [],
  idPrefix: 'addr',
})

const FIELDS: { key: TextField; label: string }[] = [
  { key: 'city', label: 'شهر' },
  { key: 'region', label: 'منطقه / محله' },
  { key: 'street', label: 'خیابان' },
  { key: 'alley', label: 'کوچه' },
  { key: 'building', label: 'ساختمان / مجتمع' },
  { key: 'plaque', label: 'پلاک' },
  { key: 'unit', label: 'واحد' },
  { key: 'landmark', label: 'نشانه / توضیح محل' },
]

function update(key: keyof ServiceAddress, value: string): void {
  address.value = { ...address.value, [key]: value }
}

function onInput(key: keyof ServiceAddress, event: Event): void {
  update(key, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="grid gap-2 sm:grid-cols-2">
    <div>
      <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" :for="`${idPrefix}-province`">استان</label>
      <select :id="`${idPrefix}-province`" :value="address.province" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="onInput('province', $event)">
        <option value="">—</option>
        <option v-for="item in PROVINCES" :key="item" :value="item">{{ item }}</option>
      </select>
    </div>
    <div v-for="field in FIELDS" :key="field.key" :class="field.key === 'landmark' ? 'sm:col-span-2' : ''">
      <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" :for="`${idPrefix}-${field.key}`">{{ field.label }}</label>
      <SuggestionInput
        v-if="field.key === 'region'"
        :id="`${idPrefix}-region`"
        :model-value="address.region"
        :suggestions="regionSuggestions"
        @update:model-value="update('region', $event)"
      />
      <input v-else :id="`${idPrefix}-${field.key}`" :value="address[field.key]" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @input="onInput(field.key, $event)" />
      <p v-if="field.key === 'region'" class="mt-1 text-11px text-ink-400 dark:text-ink-500">
        اختیاری است؛ اگر خالی بماند، تخصیص خودکار از موقعیت روی نقشه استفاده می‌کند و اگر پر شود، هم‌منطقه‌ای‌ها را در یک ماشین می‌گذارد.
      </p>
    </div>
  </div>
</template>
