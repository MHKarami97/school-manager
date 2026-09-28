<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useQuestionsStore } from '../stores/questions'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, DIFFICULTIES, DIFFICULTY_LABELS, createEmptyQuestion } from '../config/question-bank.config'
import { LEVELS, gradeLabel } from '../config/levels.config'
import { coursesAllowedForGrade, parseTagsInput } from '../utils/question-bank-helpers'
import AppHeader from '../components/layout/AppHeader.vue'
import type { Question } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const questionsStore = useQuestionsStore()

const isLoading = ref(true)
const question = ref<Question | null>(null)
const tagsInput = ref('')
const saveMessage = ref('')

onMounted(async () => {
  await questionsStore.loadFromDb()
  if (props.id) {
    const existing = questionsStore.byId(props.id)
    question.value = existing ? (JSON.parse(JSON.stringify(existing)) as Question) : null
  } else {
    question.value = createEmptyQuestion()
  }
  tagsInput.value = question.value?.tags.join('، ') ?? ''
  isLoading.value = false
})

const allGrades = computed(() => Array.from(new Set(LEVELS.flatMap((l) => l.grades))).sort((a, b) => a - b))

/** فقط درس‌های مربوط به پایه/مقطع انتخاب‌شده. */
const availableCourses = computed(() => coursesAllowedForGrade(question.value?.grade ?? 1))

// وقتی پایه عوض می‌شود، اگر درس فعلی جزو درس‌های همان پایه نبود، پاکش کن.
watch(
  () => question.value?.grade,
  () => {
    if (!question.value) return
    if (!availableCourses.value.some((course) => course.id === question.value!.courseId)) {
      question.value.courseId = ''
    }
  },
)

function addOption(): void {
  if (!question.value) return
  question.value.options.push('')
}

function removeOption(index: number): void {
  if (!question.value) return
  question.value.options.splice(index, 1)
  if (Number(question.value.correctAnswer) === index) question.value.correctAnswer = '0'
}

async function handleSave(): Promise<void> {
  if (!question.value || !question.value.text.trim()) return
  question.value.tags = parseTagsInput(tagsInput.value)
  if (question.value.type === 'multiple-choice') {
    question.value.options = question.value.options.map((o) => o.trim()).filter(Boolean)
  } else {
    question.value.options = []
  }
  const isNew = !props.id
  await questionsStore.save(question.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/question-bank/${question.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!question.value || !props.id) return
  if (!confirm('این سوال حذف شود؟')) return
  await questionsStore.remove(question.value.id)
  router.push('/question-bank')
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>
    <div v-else-if="!question" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این سوال یافت نشد.</p>
      <RouterLink to="/question-bank" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به بانک سوال</RouterLink>
    </div>

    <div v-else class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ props.id ? 'ویرایش سوال' : 'سوال جدید' }}</h1>
        <RouterLink to="/question-bank" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
          بازگشت به بانک سوال
        </RouterLink>
      </div>

      <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">نوع سوال</p>
        <div class="mb-4 grid gap-2 sm:grid-cols-4">
          <button
            v-for="t in QUESTION_TYPES"
            :key="t"
            type="button"
            class="rounded-lg border-2 px-3 py-2 text-xs font-medium transition"
            :class="
              question.type === t
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300'
                : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
            "
            @click="question.type = t"
          >
            {{ QUESTION_TYPE_LABELS[t] }}
          </button>
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">متن سوال</label>
        <textarea
          v-model="question.text"
          rows="3"
          placeholder="متن کامل سوال را بنویس"
          class="mb-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        ></textarea>

        <!-- تستی -->
        <div v-if="question.type === 'multiple-choice'" class="mb-4">
          <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">گزینه‌ها (گزینه‌ی صحیح را انتخاب کن)</p>
          <div class="space-y-2">
            <div v-for="(option, index) in question.options" :key="index" class="flex items-center gap-2">
              <input type="radio" :value="String(index)" v-model="question.correctAnswer" class="h-4 w-4" />
              <input
                v-model="question.options[index]"
                type="text"
                :placeholder="`گزینه ${index + 1}`"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
              <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeOption(index)">حذف</button>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 rounded-lg border border-dashed border-ink-200 px-3 py-1.5 text-11px font-medium text-ink-500 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400"
            @click="addOption"
          >
            + افزودن گزینه
          </button>
        </div>

        <!-- صحیح/غلط -->
        <div v-else-if="question.type === 'true-false'" class="mb-4">
          <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">پاسخ صحیح</p>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 text-sm text-ink-700 dark:text-ink-200">
              <input type="radio" value="true" v-model="question.correctAnswer" /> صحیح
            </label>
            <label class="flex items-center gap-1.5 text-sm text-ink-700 dark:text-ink-200">
              <input type="radio" value="false" v-model="question.correctAnswer" /> غلط
            </label>
          </div>
        </div>

        <!-- جای‌خالی / تشریحی -->
        <div v-else class="mb-4">
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پاسخ نمونه/کلید (اختیاری)</label>
          <textarea
            v-model="question.correctAnswer"
            rows="2"
            placeholder="پاسخ نمونه برای مصحح"
            class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          ></textarea>
        </div>

        <!-- پایه/مقطع (راست) و درس (چپ) -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایه/مقطع</label>
            <select v-model.number="question.grade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <option v-for="grade in allGrades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس</label>
            <select v-model="question.courseId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <option value="" disabled>یک درس را انتخاب کن</option>
              <option v-for="course in availableCourses" :key="course.id" :value="course.id">{{ course.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">سطح دشواری</label>
            <select v-model="question.difficulty" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
              <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ DIFFICULTY_LABELS[d] }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">بارم پیشنهادی</label>
            <input v-model.number="question.suggestedScore" type="number" min="0" step="0.25" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تگ‌های موضوعی (با «,» یا «،» جدا کن)</label>
            <input v-model="tagsInput" type="text" placeholder="مثلاً: جبر، معادله" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
          </div>
        </div>
      </div>

      <div class="mb-8 flex flex-wrap items-center gap-3">
        <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">
          ذخیره
        </button>
        <button v-if="props.id" type="button" class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete">
          حذف سوال
        </button>
        <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
      </div>
    </div>
  </div>
</template>
