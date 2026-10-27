<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { applyFormValues, isFieldReadonly, toFormValues, type FormMode, type FormValues } from '@/data-manager/record-form'
import { clonePlain, type PlainRecord } from '@/data-manager/record-path'
import { tableDef } from '@/data-manager/table-registry'
import { DataError, tableService } from '@/data-manager/table-service'
import FieldInput from './FieldInput.vue'

const props = defineProps<{ modelValue: boolean; table: string; record: PlainRecord | null }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', warnings: string[]): void
}>()

const def = computed(() => tableDef(props.table))
const mode = computed<FormMode>(() => (props.record ? 'update' : 'create'))
const hasForm = computed(() => !!def.value.fields)

const tab = ref<'form' | 'json'>('form')
const base = ref<PlainRecord>({})
const values = ref<FormValues>({})
const jsonText = ref('')
const errors = ref<string[]>([])
const isBusy = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    base.value = props.record ? clonePlain(props.record) : def.value.create()
    values.value = def.value.fields ? toFormValues(def.value.fields, base.value) : {}
    jsonText.value = JSON.stringify(base.value, null, 2)
    tab.value = def.value.fields ? 'form' : 'json'
    errors.value = []
  },
)

function formToRecord(): PlainRecord | null {
  const applied = applyFormValues(def.value, base.value, values.value, mode.value)
  if (applied.errors.length) {
    errors.value = applied.errors
    return null
  }
  return applied.record
}

function jsonToRecord(): PlainRecord | null {
  try {
    const parsed: unknown = JSON.parse(jsonText.value)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not object')
    return parsed as PlainRecord
  } catch {
    errors.value = ['JSON معتبر نیست.']
    return null
  }
}

function switchTab(next: 'form' | 'json'): void {
  if (next === tab.value) return
  errors.value = []
  if (next === 'json') {
    const record = formToRecord()
    if (!record) return
    base.value = record
    jsonText.value = JSON.stringify(record, null, 2)
  } else {
    const record = jsonToRecord()
    if (!record) return
    base.value = record
    values.value = toFormValues(def.value.fields ?? [], record)
  }
  tab.value = next
}

function close(): void {
  emit('update:modelValue', false)
}

async function save(): Promise<void> {
  errors.value = []
  const record = tab.value === 'form' ? formToRecord() : jsonToRecord()
  if (!record) return
  if (mode.value === 'update' && props.record && record[def.value.keyPath] !== props.record[def.value.keyPath]) {
    errors.value = ['تغییر کلید رکورد مجاز نیست. برای این کار رکورد جدید بسازید و قدیمی را حذف کنید.']
    return
  }
  isBusy.value = true
  try {
    const result = await tableService.save(props.table, record, mode.value)
    emit('saved', result.warnings)
    close()
  } catch (error) {
    errors.value = error instanceof DataError ? [error.message, ...error.details] : ['ذخیره انجام نشد.']
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <div class="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="rec-title">
        <p id="rec-title" class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ mode === 'create' ? 'افزودن به' : 'ویرایش در' }} «{{ def.label }}»</p>

        <div v-if="hasForm" class="mb-3 flex gap-2" role="tablist">
          <button type="button" role="tab" :aria-selected="tab === 'form'" class="min-h-11 rounded-lg px-4 text-xs font-medium" :class="tab === 'form' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="switchTab('form')">فرم</button>
          <button type="button" role="tab" :aria-selected="tab === 'json'" class="min-h-11 rounded-lg px-4 text-xs font-medium" :class="tab === 'json' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="switchTab('json')">JSON (پیشرفته)</button>
        </div>

        <div v-if="tab === 'form' && def.fields" class="grid gap-3 sm:grid-cols-2">
          <FieldInput
            v-for="field in def.fields"
            :key="field.key"
            v-model="values[field.key]"
            :field="field"
            :input-id="`rec-${field.key}`"
            :readonly="isFieldReadonly(field, mode)"
            :class="field.type === 'textarea' ? 'sm:col-span-2' : ''"
          />
        </div>

        <div v-else>
          <p class="mb-2 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            ویرایش مستقیم JSON فقط برای کاربران آگاه است؛ ساختار نادرست می‌تواند بخشی از برنامه را از کار بیندازد. پیش از آن پشتیبان بگیرید.
            <template v-if="mode === 'update'"> کلید رکورد (<span dir="ltr">{{ def.keyPath }}</span>) را تغییر ندهید.</template>
          </p>
          <label class="sr-only" for="rec-json">JSON رکورد</label>
          <textarea id="rec-json" v-model="jsonText" rows="16" dir="ltr" spellcheck="false" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 font-mono text-xs"></textarea>
        </div>

        <ul v-if="errors.length" class="mt-3 space-y-1 text-xs text-red-600 dark:text-red-400" role="alert">
          <li v-for="message in errors" :key="message">{{ message }}</li>
        </ul>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="button" :disabled="isBusy" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="save">{{ isBusy ? 'در حال ذخیره...' : 'ذخیره' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
