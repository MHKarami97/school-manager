<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useExamsStore } from '../stores/exams'
import { useQuestionsStore } from '../stores/questions'
import { useExamTemplatesStore } from '../stores/exam-templates'
import { useExamVersionsStore } from '../stores/exam-versions'
import { createEmptyExam, createEmptyExamTemplate } from '../config/question-bank.config'
import { BASE_COURSES } from '../config/courses.config'
import { LEVELS, gradeLabel } from '../config/levels.config'
import { filterQuestions } from '../utils/question-bank-helpers'
import { generateExamFromTemplate, generateExamVersions, totalScoreOfExam } from '../utils/exam-generator'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import ExamTemplateFormModal from '../components/question-bank/ExamTemplateFormModal.vue'
import PrintableExam from '../components/question-bank/PrintableExam.vue'
import type { Exam, ExamTemplate, ExamVersion } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const examsStore = useExamsStore()
const questionsStore = useQuestionsStore()
const templatesStore = useExamTemplatesStore()
const versionsStore = useExamVersionsStore()

const isLoading = ref(true)
const exam = ref<Exam | null>(null)
const saveMessage = ref('')

onMounted(async () => {
  await Promise.all([
    examsStore.loadFromDb(),
    questionsStore.loadFromDb(),
    templatesStore.loadFromDb(),
    versionsStore.loadFromDb(),
  ])
  if (props.id) {
    const existing = examsStore.byId(props.id)
    exam.value = existing ? (JSON.parse(JSON.stringify(existing)) as Exam) : null
  } else {
    exam.value = createEmptyExam()
  }
  isLoading.value = false
})

const allGrades = computed(() => Array.from(new Set(LEVELS.flatMap((l) => l.grades))).sort((a, b) => a - b))

// --- افزودن دستی از بانک سوال --------------------------------------------------
const bankSearch = ref('')
const bankDifficulty = ref('')
const bankTag = ref('')

const bankMatches = computed(() => {
  if (!exam.value) return []
  return filterQuestions(questionsStore.items, {
    courseId: exam.value.courseId || undefined,
    grade: exam.value.grade || undefined,
    difficulty: (bankDifficulty.value as never) || undefined,
    tag: bankTag.value || undefined,
    searchText: bankSearch.value,
  }).filter((q) => !exam.value!.questionRefs.some((ref) => ref.questionId === q.id))
})

function addQuestionToExam(questionId: string): void {
  if (!exam.value) return
  const question = questionsStore.byId(questionId)
  if (!question) return
  const order = exam.value.questionRefs.length
  exam.value.questionRefs.push({ questionId, score: question.suggestedScore, order })
}

function removeQuestionFromExam(questionId: string): void {
  if (!exam.value) return
  exam.value.questionRefs = exam.value.questionRefs
    .filter((ref) => ref.questionId !== questionId)
    .map((ref, index) => ({ ...ref, order: index }))
}

function questionOf(questionId: string) {
  return questionsStore.byId(questionId)
}

const orderedRefs = computed(() =>
  exam.value ? [...exam.value.questionRefs].sort((a, b) => a.order - b.order) : [],
)

// --- تولید نیمه‌خودکار از قالب --------------------------------------------------
const activeTemplate = ref<ExamTemplate | null>(null)
const isTemplateModalOpen = ref(false)
const templateWarnings = ref<string[]>([])

function openNewTemplate(): void {
  if (!exam.value) return
  const template = createEmptyExamTemplate()
  template.courseId = exam.value.courseId
  template.grade = exam.value.grade
  activeTemplate.value = template
  isTemplateModalOpen.value = true
}

function openNewQuestion(): void {
  router.push('/question-bank/new');
}

function openTemplate(template: ExamTemplate): void {
  activeTemplate.value = template
  isTemplateModalOpen.value = true
}

async function saveTemplate(template: ExamTemplate): Promise<void> {
  await templatesStore.save(template)
}

async function deleteTemplate(id: string): Promise<void> {
  await templatesStore.remove(id)
}

function generateFromTemplate(template: ExamTemplate): void {
  if (!exam.value) return
  const result = generateExamFromTemplate(template, questionsStore.items)
  const existingIds = new Set(exam.value.questionRefs.map((ref) => ref.questionId))
  const newRefs = result.questionRefs.filter((ref) => !existingIds.has(ref.questionId))
  const startOrder = exam.value.questionRefs.length
  exam.value.questionRefs.push(...newRefs.map((ref, index) => ({ ...ref, order: startOrder + index })))
  templateWarnings.value = result.warnings
}

// --- ذخیره/حذف آزمون --------------------------------------------------
async function handleSave(): Promise<void> {
  if (!exam.value || !exam.value.title.trim() || !exam.value.questionRefs.length) return
  const isNew = !props.id
  await examsStore.save(exam.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/exams/${exam.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!exam.value || !props.id) return
  if (!confirm('این آزمون حذف شود؟')) return
  await examsStore.remove(exam.value.id)
  router.push('/exams')
}

// --- نسخه‌های شخصی‌سازی‌شده (ضد تقلب) --------------------------------------------------
const versionCount = ref(2)
const savedVersions = computed(() => (exam.value ? versionsStore.byExam(exam.value.id) : []))
const activeVersionId = ref<string | null>(null)
const activeVersion = computed<ExamVersion | null>(
  () => savedVersions.value.find((v) => v.id === activeVersionId.value) ?? null,
)

async function generateVersions(): Promise<void> {
  if (!exam.value || !props.id) return
  const versions = generateExamVersions(exam.value, versionCount.value, questionsStore.items)
  await versionsStore.saveMany(versions)
  activeVersionId.value = versions[0]?.id ?? null
}

// --- پیش‌نمایش و چاپ --------------------------------------------------
const printMode = ref<'with-answers' | 'without-answers'>('without-answers')

function handlePrint(mode: 'with-answers' | 'without-answers'): void {
  printMode.value = mode
  printPage()
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>
    <div v-else-if="!exam" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این آزمون یافت نشد.</p>
      <RouterLink to="/exams" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به فهرست آزمون‌ها</RouterLink>
    </div>

    <div v-else class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ props.id ? 'ویرایش آزمون' : 'آزمون جدید' }}</h1>
          <RouterLink to="/exams" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به فهرست آزمون‌ها
          </RouterLink>
        </div>

        <!-- اطلاعات آزمون -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات آزمون</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان آزمون</label>
              <input v-model="exam.title" type="text" placeholder="مثلاً: آزمون میان‌ترم ریاضی هفتم" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس</label>
              <select v-model="exam.courseId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option value="" disabled>یک درس را انتخاب کن</option>
                <option v-for="course in BASE_COURSES" :key="course.id" :value="course.id">{{ course.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایه</label>
              <select v-model.number="exam.grade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option v-for="grade in allGrades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ آزمون (شمسی)</label>
              <JalaliDatePicker v-model="exam.date" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مدت زمان (دقیقه)</label>
              <input v-model.number="exam.durationMinutes" type="number" min="10" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
            </div>
          </div>
        </div>

        <!-- تولید نیمه‌خودکار از قالب -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">تولید نیمه‌خودکار از قالب</p>
            <button type="button" class="text-11px font-medium text-brand-600 hover:underline dark:text-brand-400" @click="openNewTemplate">
              + قالب جدید
            </button>
          </div>
          <div v-if="templatesStore.items.length" class="flex flex-wrap gap-2">
            <div v-for="template in templatesStore.items" :key="template.id" class="flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-11px dark:border-ink-700">
              <button type="button" class="font-medium text-ink-700 dark:text-ink-200" @click="openTemplate(template)">{{ template.title }}</button>
              <button type="button" class="text-brand-600 dark:text-brand-400" @click="generateFromTemplate(template)">تولید</button>
            </div>
          </div>
          <p v-else class="text-11px text-ink-400 dark:text-ink-500">هنوز قالبی نساخته‌ای.</p>
          <div v-if="templateWarnings.length" class="mt-3 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-11px text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
            <p v-for="(w, i) in templateWarnings" :key="i">{{ w }}</p>
          </div>
        </div>

        <!-- افزودن دستی از بانک سوال -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">افزودن دستی از بانک سوال</p>
            <button type="button" class="text-11px font-medium text-brand-600 hover:underline dark:text-brand-400" @click="openNewQuestion">
              + سوال جدید
            </button>
          </div>
          <input v-model="bankSearch" type="text" placeholder="جست‌وجو در بانک سوال..." class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
          <div class="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
            <div v-for="question in bankMatches.slice(0, 20)" :key="question.id" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
              <span class="truncate text-ink-700 dark:text-ink-200">{{ question.text }}</span>
              <button type="button" class="shrink-0 text-brand-600 dark:text-brand-400" @click="addQuestionToExam(question.id)">+ افزودن</button>
            </div>
            <p v-if="!bankMatches.length" class="text-11px text-ink-400 sm:col-span-2 dark:text-ink-500">سوالی پیدا نشد.</p>
          </div>
        </div>

        <!-- سوالات انتخاب‌شده -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">سوالات آزمون</p>
            <span class="text-11px text-ink-400 dark:text-ink-500">{{ orderedRefs.length }} سوال - جمع بارم {{ totalScoreOfExam(exam) }}</span>
          </div>
          <div v-if="orderedRefs.length" class="space-y-2">
            <div v-for="(ref, index) in orderedRefs" :key="ref.questionId" class="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
              <span class="truncate text-ink-700 dark:text-ink-200">{{ index + 1 }}. {{ questionOf(ref.questionId)?.text ?? '—' }}</span>
              <div class="flex shrink-0 items-center gap-2">
                <input v-model.number="ref.score" type="number" min="0" step="0.25" class="w-14 rounded border border-ink-200 bg-white px-1 py-0.5 text-center dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200" />
                <button type="button" class="text-red-600 dark:text-red-400" @click="removeQuestionFromExam(ref.questionId)">حذف</button>
              </div>
            </div>
          </div>
          <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-11px text-ink-400 dark:border-ink-700 dark:text-ink-500">
            هنوز سوالی به این آزمون اضافه نکرده‌ای.
          </p>
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">
            ذخیره آزمون
          </button>
          <button v-if="props.id" type="button" class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete">
            حذف آزمون
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>

        <!-- نسخه‌های شخصی‌سازی‌شده -->
        <div v-if="props.id" class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">نسخه‌های شخصی‌سازی‌شده (ضد تقلب)</p>
          <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
            هر نسخه ترتیب سوالات و گزینه‌های تستی را جابه‌جا می‌کند تا هر کلاس/دانش‌آموز نسخه‌ی متفاوتی داشته باشد.
          </p>
          <div class="mb-3 flex items-center gap-2">
            <input v-model.number="versionCount" type="number" min="1" max="10" class="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
            <button type="button" class="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-medium text-white dark:bg-ink-700" @click="generateVersions">
              ساخت نسخه‌های جدید
            </button>
          </div>
          <div v-if="savedVersions.length" class="flex flex-wrap gap-2">
            <button
              v-for="version in savedVersions"
              :key="version.id"
              type="button"
              class="rounded-full border px-3 py-1.5 text-11px font-medium transition"
              :class="activeVersionId === version.id ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
              @click="activeVersionId = version.id"
            >
              {{ version.label }}
            </button>
            <button
              v-if="activeVersionId"
              type="button"
              class="rounded-full border border-ink-200 px-3 py-1.5 text-11px text-ink-500 dark:border-ink-700 dark:text-ink-400"
              @click="activeVersionId = null"
            >
              نسخه‌ی اصلی
            </button>
          </div>
        </div>

        <!-- دکمه‌های چاپ -->
        <div class="mb-4 flex flex-wrap gap-3">
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="handlePrint('without-answers')">
            چاپ بدون کلید پاسخ
          </button>
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="handlePrint('with-answers')">
            چاپ با کلید پاسخ
          </button>
        </div>
      </div>

      <!-- پیش‌نمایش همیشه روی صفحه، و همان چیزی که چاپ می‌شود -->
      <div class="rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900 print:border-0 print:bg-white">
        <p class="border-b border-ink-100 p-3 text-11px font-medium text-ink-400 print:hidden dark:border-ink-800 dark:text-ink-500">
          پیش‌نمایش آزمون (همین چیزی که چاپ می‌شود)
        </p>
        <PrintableExam :exam="exam" :questions="questionsStore.items" :mode="printMode" :version="activeVersion" />
      </div>
    </div>

    <ExamTemplateFormModal v-model="isTemplateModalOpen" :template="activeTemplate" @save="saveTemplate" @delete="deleteTemplate" />
  </div>
</template>
