<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useQuestionsStore } from '../stores/questions'
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../config/question-bank.config'
import { BASE_COURSES } from '../config/courses.config'
import { LEVELS } from '../config/levels.config'
import { allTagsOf, filterQuestions } from '../utils/question-bank-helpers'
import {
  downloadQuestionBankTemplate,
  exportQuestionsToExcel,
  parseQuestionBankFile,
} from '../utils/question-bank-import-export'
import AppHeader from '../components/layout/AppHeader.vue'
import QuestionCard from '../components/question-bank/QuestionCard.vue'
import type { DifficultyLevel } from '../types'

const questionsStore = useQuestionsStore()
const router = useRouter()
onMounted(() => questionsStore.loadFromDb())

function editQuestion(id: string): void {
  router.push(`/question-bank/${id}`)
}

const searchText = ref('')
const courseFilter = ref('')
const gradeFilter = ref<number | ''>('')
const difficultyFilter = ref<DifficultyLevel | ''>('')
const tagFilter = ref('')

const allGrades = computed(() => Array.from(new Set(LEVELS.flatMap((l) => l.grades))).sort((a, b) => a - b))
const availableTags = computed(() => allTagsOf(questionsStore.items))

const filteredQuestions = computed(() =>
  filterQuestions(questionsStore.items, {
    searchText: searchText.value,
    courseId: courseFilter.value || undefined,
    grade: gradeFilter.value || undefined,
    difficulty: difficultyFilter.value || undefined,
    tag: tagFilter.value || undefined,
  }),
)

async function deleteQuestion(id: string): Promise<void> {
  if (!confirm('این سوال حذف شود؟')) return
  await questionsStore.remove(id)
}

// --- Import/Export اکسل --------------------------------------------------
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const importMessage = ref('')

function triggerFileDialog(): void {
  fileInputRef.value?.click()
}

async function handleFileSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isImporting.value = true
  importMessage.value = ''
  try {
    const rows = await parseQuestionBankFile(file)
    if (!rows.length) {
      importMessage.value = 'هیچ سوال معتبری در فایل پیدا نشد.'
      return
    }
    const now = Date.now()
    const questions = rows.map((row) => ({
      id: crypto.randomUUID(),
      ...row,
      createdAt: now,
      updatedAt: now,
    }))
    await questionsStore.addBulk(questions)
    importMessage.value = `${rows.length} سوال با موفقیت وارد شد.`
  } catch (error) {
    console.error(error)
    importMessage.value = 'خطا در خواندن فایل اکسل. مطمئن شو از قالب استاندارد استفاده کرده‌ای.'
  } finally {
    isImporting.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function exportVisible(): void {
  if (!filteredQuestions.value.length) return
  exportQuestionsToExcel(filteredQuestions.value, 'بانک-سوال')
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">بانک سوال</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ questionsStore.items.length }} سوال ثبت‌شده</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/exams" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            آزمون‌ها
          </RouterLink>
          <RouterLink to="/question-bank/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
            + سوال جدید
          </RouterLink>
        </div>
      </div>

      <div class="mb-6 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">Import / Export اکسل بانک سوال</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="downloadQuestionBankTemplate">
            دریافت قالب اکسل
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            :disabled="isImporting"
            @click="triggerFileDialog"
          >
            {{ isImporting ? 'در حال وارد کردن...' : 'وارد کردن از اکسل' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 disabled:opacity-50 dark:border-ink-700 dark:text-ink-200"
            :disabled="!filteredQuestions.length"
            @click="exportVisible"
          >
            خروجی اکسل (فهرست فیلترشده)
          </button>
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelected" />
        </div>
        <p class="mt-2 text-11px text-ink-400 dark:text-ink-500">
          خروجی و ورودی با فرمت xlsx است و متن فارسی همیشه سالم باز می‌شود.
        </p>
        <p v-if="importMessage" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{{ importMessage }}</p>
      </div>

      <div class="mb-4 grid gap-2 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-5 dark:border-ink-800 dark:bg-ink-900">
        <input
          v-model="searchText"
          type="text"
          placeholder="جست‌وجو در متن سوال..."
          class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 sm:col-span-2 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />
        <select v-model="courseFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="">همه درس‌ها</option>
          <option v-for="course in BASE_COURSES" :key="course.id" :value="course.id">{{ course.name }}</option>
        </select>
        <select v-model.number="gradeFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="">همه پایه‌ها</option>
          <option v-for="grade in allGrades" :key="grade" :value="grade">{{ grade }}</option>
        </select>
        <select v-model="difficultyFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="">همه سطوح</option>
          <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ DIFFICULTY_LABELS[d] }}</option>
        </select>
        <select v-if="availableTags.length" v-model="tagFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 sm:col-span-5 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="">همه تگ‌ها</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">#{{ tag }}</option>
        </select>
      </div>

      <div v-if="!filteredQuestions.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">سوالی با این فیلترها پیدا نشد.</p>
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <QuestionCard
          v-for="question in filteredQuestions"
          :key="question.id"
          :question="question"
          @edit="editQuestion"
          @delete="deleteQuestion"
        />
      </div>
    </div>
  </div>
</template>
