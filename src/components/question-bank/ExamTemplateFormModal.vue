<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ExamTemplate, ExamTemplateRule } from '../../types'
import { DIFFICULTIES, DIFFICULTY_LABELS, createEmptyExamTemplateRule } from '../../config/question-bank.config'

const props = defineProps<{
  modelValue: boolean
  template: ExamTemplate | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', template: ExamTemplate): void
  (e: 'delete', templateId: string): void
}>()

const title = ref('')
const rules = ref<ExamTemplateRule[]>([])

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.template) {
      title.value = props.template.title
      rules.value = JSON.parse(JSON.stringify(props.template.rules))
    }
  },
)

function addRule(): void {
  rules.value.push(createEmptyExamTemplateRule())
}

function removeRule(id: string): void {
  rules.value = rules.value.filter((rule) => rule.id !== id)
}

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  if (!props.template || !title.value.trim() || !rules.value.length) return
  emit('save', { ...props.template, title: title.value.trim(), rules: rules.value })
  close()
}

function removeTemplate(): void {
  if (!props.template) return
  emit('delete', props.template.id)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && template"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="close"
    >
      <div class="max-h-90vh w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">قالب تولید خودکار آزمون</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان قالب</label>
        <input
          v-model="title"
          type="text"
          placeholder="مثلاً: آزمون میان‌ترم ریاضی هفتم"
          class="mb-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />

        <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">قوانین انتخاب سوال</p>
        <div class="mb-3 space-y-2">
          <div v-for="rule in rules" :key="rule.id" class="flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 p-2.5 dark:border-ink-800">
            <select
              v-model="rule.difficulty"
              class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ DIFFICULTY_LABELS[d] }}</option>
            </select>
            <input
              v-model.number="rule.count"
              type="number"
              min="1"
              class="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            />
            <span class="text-11px text-ink-400 dark:text-ink-500">سوال</span>
            <input
              v-model="rule.tag"
              type="text"
              placeholder="تگ (اختیاری)"
              class="min-w-100px flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            />
            <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeRule(rule.id)">حذف</button>
          </div>
        </div>
        <button
          type="button"
          class="mb-4 w-full rounded-lg border border-dashed border-ink-200 py-2 text-11px font-medium text-ink-500 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400"
          @click="addRule"
        >
          + افزودن قانون
        </button>

        <div class="flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="removeTemplate">
            حذف قالب
          </button>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">
              انصراف
            </button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="save">
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
