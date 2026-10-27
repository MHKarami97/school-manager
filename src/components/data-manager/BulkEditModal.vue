<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isFieldReadonly, toFormValues, type FormValues } from '@/data-manager/record-form'
import { tableDef, type FieldDef } from '@/data-manager/table-registry'
import { DataError, tableService } from '@/data-manager/table-service'
import FieldInput from './FieldInput.vue'

const props = defineProps<{ modelValue: boolean; table: string; keys: string[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'done', count: number): void
}>()

const def = computed(() => tableDef(props.table))
const editable = computed<FieldDef[]>(() => (def.value.fields ?? []).filter((field) => !isFieldReadonly(field, 'update')))
const fieldKey = ref('')
const values = ref<FormValues>({})
const errors = ref<string[]>([])
const isBusy = ref(false)

const field = computed(() => editable.value.find((item) => item.key === fieldKey.value))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    errors.value = []
    fieldKey.value = editable.value[0]?.key ?? ''
    values.value = toFormValues(def.value.fields ?? [], def.value.create())
  },
)

function close(): void {
  emit('update:modelValue', false)
}

async function apply(): Promise<void> {
  if (!field.value) return
  errors.value = []
  isBusy.value = true
  try {
    const count = await tableService.bulkUpdate(props.table, props.keys, { [field.value.key]: values.value[field.value.key] })
    emit('done', count)
    close()
  } catch (error) {
    errors.value = error instanceof DataError ? [error.message, ...error.details] : ['ویرایش انجام نشد.']
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <div class="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <p id="bulk-title" class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ویرایش گروهی «{{ def.label }}»</p>
        <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">مقدار یک فیلد برای {{ keys.length.toLocaleString('fa-IR') }} رکورد انتخاب‌شده یکسان می‌شود. اگر حتی یک رکورد نامعتبر شود، هیچ‌کدام تغییر نمی‌کنند.</p>

        <p v-if="!def.fields" class="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">ویرایش گروهی برای این جدول در دسترس نیست؛ هر رکورد را با JSON ویرایش کنید.</p>
        <template v-else>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bulk-field">فیلد</label>
          <select id="bulk-field" v-model="fieldKey" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11">
            <option v-for="item in editable" :key="item.key" :value="item.key">{{ item.label }}</option>
          </select>
          <FieldInput v-if="field" :key="field.key" v-model="values[field.key]" :field="field" input-id="bulk-value" :readonly="false" />
        </template>

        <ul v-if="errors.length" class="mt-3 space-y-1 text-xs text-red-600 dark:text-red-400" role="alert">
          <li v-for="message in errors" :key="message">{{ message }}</li>
        </ul>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="button" :disabled="isBusy || !field" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="apply">اعمال روی {{ keys.length.toLocaleString('fa-IR') }} رکورد</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
