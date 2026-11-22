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
import { DEFAULT_CURRICULUM_QUESTIONS } from '../config/default-questions.config'
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

async function loadSampleQuestions(): Promise<void> {
  const existingTexts = new Set(questionsStore.items.map((q) => q.text))
  const newQuestions = DEFAULT_CURRICULUM_QUESTIONS.filter((q) => !existingTexts.has(q.text))
  if (!newQuestions.length) {
    alert('تمام سوالات نمونه کتاب‌های درسی از قبل در بانک سوالات شما موجود هستند.')
    return
  }
  await questionsStore.addBulk(newQuestions)
  alert(`${newQuestions.length} سوال نمونه درسی با موفقیت به بانک سوالات شما افزوده شد.`)
}

// --- بسته‌های استاندارد سوالات پایه‌های اول تا ششم (۳۵۰۰ سوال) ---
interface QuestionPackInfo {
  grade: number | 'all'
  title: string
  description: string
  subjectsCount: number
  questionsCount: number
  excelFile: string
  jsonFile: string
}

const isDownloadingPack = ref(false)
const packLoadingMessage = ref('')
const showPacksModal = ref(false)

const QUESTION_PACKS: QuestionPackInfo[] = [
  {
    grade: 1,
    title: 'پایه اول ابتدایی',
    description: '۴ درس (ریاضی، علوم، فارسی، قرآن)',
    subjectsCount: 4,
    questionsCount: 400,
    excelFile: 'grade-1-questions.xlsx',
    jsonFile: 'grade-1.json',
  },
  {
    grade: 2,
    title: 'پایه دوم ابتدایی',
    description: '۵ درس (ریاضی، علوم، فارسی، قرآن، هدیه‌های آسمان)',
    subjectsCount: 5,
    questionsCount: 500,
    excelFile: 'grade-2-questions.xlsx',
    jsonFile: 'grade-2.json',
  },
  {
    grade: 3,
    title: 'پایه سوم ابتدایی',
    description: '۶ درس (ریاضی، علوم، فارسی، قرآن، هدیه‌ها، مطالعات اجتماعی)',
    subjectsCount: 6,
    questionsCount: 600,
    excelFile: 'grade-3-questions.xlsx',
    jsonFile: 'grade-3.json',
  },
  {
    grade: 4,
    title: 'پایه چهارم ابتدایی',
    description: '۶ درس (ریاضی، علوم، فارسی، قرآن، هدیه‌ها، مطالعات اجتماعی)',
    subjectsCount: 6,
    questionsCount: 600,
    excelFile: 'grade-4-questions.xlsx',
    jsonFile: 'grade-4.json',
  },
  {
    grade: 5,
    title: 'پایه پنجم ابتدایی',
    description: '۶ درس (ریاضی، علوم، فارسی، قرآن، هدیه‌ها، مطالعات اجتماعی)',
    subjectsCount: 6,
    questionsCount: 600,
    excelFile: 'grade-5-questions.xlsx',
    jsonFile: 'grade-5.json',
  },
  {
    grade: 6,
    title: 'پایه ششم ابتدایی',
    description: '۸ درس (ریاضی، علوم، فارسی، قرآن، هدیه‌ها، مطالعات، تفکر و پژوهش، کار و فناوری)',
    subjectsCount: 8,
    questionsCount: 800,
    excelFile: 'grade-6-questions.xlsx',
    jsonFile: 'grade-6.json',
  },
  {
    grade: 'all',
    title: 'بسته جامع کل دوره ابتدایی (پایه‌های ۱ تا ۶)',
    description: '۳۵ درس/پایه با حداقل ۱۰۰ سوال برای هر درس (مجموعاً ۳,۵۰۰ سوال کاملاً استاندارد)',
    subjectsCount: 35,
    questionsCount: 3500,
    excelFile: 'elementary-all-grades-questions.xlsx',
    jsonFile: 'elementary-curriculum-questions.json',
  },
]

async function loadCurriculumPack(pack: QuestionPackInfo): Promise<void> {
  isDownloadingPack.value = true
  packLoadingMessage.value = `در حال بارگذاری ${pack.title}...`
  try {
    const res = await fetch(`/data/questions/${pack.jsonFile}`)
    if (!res.ok) throw new Error('Failed to fetch question pack')
    const packQuestions: Question[] = await res.json()
    const existingTexts = new Set(questionsStore.items.map((q) => q.text))
    const toAdd = packQuestions.filter((q) => !existingTexts.has(q.text))
    if (!toAdd.length) {
      alert(`تمام سوالات بسته «${pack.title}» از قبل در بانک سوالات شما موجود هستند.`)
      packLoadingMessage.value = 'همه سوالات این بسته از قبل موجود هستند.'
      return
    }
    await questionsStore.addBulk(toAdd)
    packLoadingMessage.value = `${toAdd.length} سوال با موفقیت به بانک سوالات شما افزوده شد.`
    alert(`${toAdd.length} سوال استاندارد از بسته «${pack.title}» به بانک سوالات افزوده شد.`)
  } catch (err) {
    console.error(err)
    packLoadingMessage.value = 'خطا در بارگذاری سوالات بسته درسی.'
  } finally {
    isDownloadingPack.value = false
  }
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
          <button
            type="button"
            class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
            @click="loadSampleQuestions"
          >
            + بارگذاری سوالات نمونه درسی
          </button>
          <button
            type="button"
            class="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
            @click="showPacksModal = !showPacksModal"
          >
            📦 بسته‌های آماده پایه‌های ۱ تا ۶ (۳,۵۰۰ سوال)
          </button>
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelected" />
        </div>
        <p class="mt-2 text-11px text-ink-400 dark:text-ink-500">
          خروجی و ورودی با فرمت xlsx است و متن فارسی همیشه سالم باز می‌شود.
        </p>
        <p v-if="importMessage" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{{ importMessage }}</p>
      </div>

      <!-- پنل بسته‌های آماده سوالات استاندارد ابتدایی -->
      <div v-if="showPacksModal" class="mb-6 rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-sm dark:border-purple-800/60 dark:bg-ink-900">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3 dark:border-ink-800">
          <div>
            <h2 class="text-base font-bold text-ink-900 dark:text-ink-100">
              📚 بسته‌های سوالات درسی پایه‌های اول تا ششم (حداقل ۱۰۰ سوال برای هر درس)
            </h2>
            <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
              مجموعاً ۳,۵۰۰ سوال ۴گزینه‌ای استاندارد، به همراه پاسخ صحیح، بارم و سطح دشواری منطبق بر کتاب‌های درسی.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg bg-ink-100 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
            @click="showPacksModal = false"
          >
            بستن
          </button>
        </div>

        <div v-if="packLoadingMessage" class="mb-4 rounded-xl bg-purple-50 p-3 text-xs font-medium text-purple-800 dark:bg-purple-950/50 dark:text-purple-200">
          ⏳ {{ packLoadingMessage }}
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="pack in QUESTION_PACKS"
            :key="pack.excelFile"
            class="flex flex-col justify-between rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 transition-all hover:border-purple-300 dark:border-ink-800 dark:bg-ink-950/40"
            :class="{ 'border-purple-300 bg-purple-50/30 sm:col-span-2 lg:col-span-3 dark:border-purple-700': pack.grade === 'all' }"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-bold text-ink-900 dark:text-ink-100">{{ pack.title }}</span>
                <span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-10px font-bold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                  {{ pack.questionsCount }} سوال
                </span>
              </div>
              <p class="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{{ pack.description }}</p>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
              <a
                :href="`/downloads/questions/${pack.excelFile}`"
                :download="pack.excelFile"
                class="inline-flex items-center gap-1 rounded-lg border border-ink-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 shadow-sm hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                📥 دریافت اکسل
              </a>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                :disabled="isDownloadingPack"
                @click="loadCurriculumPack(pack)"
              >
                + بارگذاری مستقیم در سامانه
              </button>
            </div>
          </div>
        </div>
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
