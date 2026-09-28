<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useLessonPlansStore } from '@/stores/lesson-plans'
import { useTeachersStore } from '@/stores/teachers'
import { LEVELS, getLevelById, gradeLabel } from '@/config/levels.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { LESSON_PLAN_STATUSES, LESSON_PLAN_STATUS_LABELS } from '@/config/lesson-plan.config'
import { formatTeacherName } from '@/utils/teacher-format'
import { printPage } from '@/utils/export'
import AppHeader from '@/components/layout/AppHeader.vue'
import LessonPlanBlockEditor from '@/components/lessonPlan/LessonPlanBlockEditor.vue'
import LessonPlanHistoryModal from '@/components/lessonPlan/LessonPlanHistoryModal.vue'
import PrintableLessonPlan from '@/components/lessonPlan/PrintableLessonPlan.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import type { LessonPlan, LevelId } from '@/types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const lessonPlansStore = useLessonPlansStore()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const plan = ref<LessonPlan | null>(null)
const saveMessage = ref('')
const isHistoryOpen = ref(false)
const isPrinting = ref(false)

onMounted(async () => {
  await Promise.all([lessonPlansStore.loadFromDb(), teachersStore.loadFromDb()])

  if (props.id) {
    const existing = lessonPlansStore.byId(props.id)
    plan.value = existing ? JSON.parse(JSON.stringify(existing)) : null
  } else {
    plan.value = {
      id: crypto.randomUUID(),
      title: '',
      teacherId: teachersStore.items[0]?.id ?? '',
      courseId: BASE_COURSES[0].id,
      grade: LEVELS[0].grades[0],
      levelId: LEVELS[0].id,
      sessionDate: '',
      weekNumber: 1,
      objectives: '',
      teachingMethod: '',
      resources: '',
      assessment: '',
      blocks: [],
      status: 'draft',
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  isLoading.value = false
})

const gradesForLevel = computed(() => {
  if (!plan.value) return []
  return getLevelById(plan.value.levelId)?.grades ?? []
})

// وقتی مقطع تغییر می‌کند، پایه‌ی انتخاب‌شده باید متعلق به همان مقطع باشد
watch(
  () => plan.value?.levelId,
  (levelId) => {
    if (!plan.value || !levelId) return
    const grades = getLevelById(levelId as LevelId)?.grades ?? []
    if (!grades.includes(plan.value.grade)) {
      plan.value.grade = grades[0] ?? plan.value.grade
    }
  },
)

const selectedTeacher = computed(() =>
  plan.value ? teachersStore.byId(plan.value.teacherId) ?? null : null,
)
const selectedCourse = computed(() =>
  plan.value ? findCourse(BASE_COURSES, plan.value.courseId) ?? null : null,
)

// --- افزودن سریع معلم، وقتی لیست معلم‌ها خالی است یا معلم جدیدی لازم است ---
const isAddingTeacher = ref(false)
const newTeacherName = ref('')

async function addTeacherQuickly(): Promise<void> {
  const name = newTeacherName.value.trim()
  if (!name || !plan.value) return
  const teacher = await teachersStore.addTeacher(name, [plan.value.courseId])
  plan.value.teacherId = teacher.id
  newTeacherName.value = ''
  isAddingTeacher.value = false
}

async function handleSave(): Promise<void> {
  if (!plan.value) return
  await lessonPlansStore.save(plan.value)
  saveMessage.value = 'طرح درس ذخیره شد.'
  router.push('/lesson-plans')
}

async function handleDuplicate(): Promise<void> {
  if (!plan.value) return
  await lessonPlansStore.save(plan.value)
  const duplicated = await lessonPlansStore.duplicateAsTemplate(plan.value.id)
  if (duplicated) router.push(`/lesson-plans/${duplicated.id}`)
}

async function handleDelete(): Promise<void> {
  if (!plan.value || !props.id) return
  if (!confirm('این طرح درس حذف شود؟')) return
  await lessonPlansStore.remove(plan.value.id)
  router.push('/lesson-plans')
}

async function handlePrint(): Promise<void> {
  isPrinting.value = true
  await nextTick()
  printPage()
  window.addEventListener('afterprint', () => (isPrinting.value = false), { once: true })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16">
    <div class="print:hidden"><AppHeader /></div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>

    <div v-else-if="!plan" class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">طرح درس یافت نشد.</p>
      <RouterLink to="/lesson-plans" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
        بازگشت به لیست
      </RouterLink>
    </div>

    <div v-else class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">
              {{ props.id ? 'ویرایش طرح درس' : 'طرح درس جدید' }}
            </h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
              نسخه‌های قبلی این طرح به‌صورت خودکار در تاریخچه ذخیره می‌شوند.
            </p>
          </div>
          <RouterLink to="/lesson-plans" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به لیست
          </RouterLink>
        </div>

        <!-- بخش ۱: اطلاعات جلسه -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات جلسه</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان طرح درس</label>
              <input
                v-model="plan.title"
                type="text"
                placeholder="مثال: جمع و تفریق کسرها"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">وضعیت</label>
              <select
                v-model="plan.status"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="s in LESSON_PLAN_STATUSES" :key="s" :value="s">
                  {{ LESSON_PLAN_STATUS_LABELS[s] }}
                </option>
              </select>
            </div>

            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="block text-xs font-medium text-ink-600 dark:text-ink-300">معلم</label>
                <button
                  type="button"
                  class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  @click="isAddingTeacher = !isAddingTeacher"
                >
                  {{ isAddingTeacher ? 'انصراف' : '+ معلم جدید' }}
                </button>
              </div>

              <select
                v-if="!isAddingTeacher"
                v-model="plan.teacherId"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option value="" disabled>
                  {{ teachersStore.items.length ? '-- انتخاب معلم --' : 'معلمی ثبت نشده — از دکمه «+ معلم جدید» استفاده کن' }}
                </option>
                <option v-for="t in teachersStore.sortedByName" :key="t.id" :value="t.id">
                  {{ formatTeacherName(t) }}
                </option>
              </select>

              <div v-else class="flex gap-2">
                <input
                  v-model="newTeacherName"
                  type="text"
                  placeholder="نام معلم جدید"
                  class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
                  @keyup.enter="addTeacherQuickly"
                />
                <button
                  type="button"
                  class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white dark:bg-ink-700"
                  @click="addTeacherQuickly"
                >
                  افزودن
                </button>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس</label>
              <select
                v-model="plan.courseId"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="c in BASE_COURSES" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مقطع</label>
              <select
                v-model="plan.levelId"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="l in LEVELS" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایه</label>
              <select
                v-model.number="plan.grade"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="g in gradesForLevel" :key="g" :value="g">{{ gradeLabel(g) }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ جلسه (شمسی)</label>
              <JalaliDatePicker v-model="plan.sessionDate" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">هفته تقویم آموزشی</label>
              <input
                v-model.number="plan.weekNumber"
                type="number"
                min="1"
                max="40"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
          </div>
        </div>

        <!-- بخش ۲: محتوای آموزشی -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">محتوای آموزشی</p>
          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">اهداف آموزشی</label>
              <textarea
                v-model="plan.objectives"
                rows="2"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              ></textarea>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">روش تدریس</label>
              <textarea
                v-model="plan.teachingMethod"
                rows="2"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              ></textarea>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">منابع و وسایل کمک‌آموزشی</label>
              <textarea
                v-model="plan.resources"
                rows="2"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              ></textarea>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تکلیف و ارزشیابی</label>
              <textarea
                v-model="plan.assessment"
                rows="2"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- بخش ۳: زمان‌بندی جلسه -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <LessonPlanBlockEditor v-model="plan.blocks" />
        </div>

        <!-- اقدامات -->
        <div class="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            @click="handleSave"
          >
            ذخیره طرح درس
          </button>
          <button
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            @click="handleDuplicate"
          >
            کپی برای جلسه بعد
          </button>
          <button
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            @click="handlePrint"
          >
            خروجی PDF
          </button>
          <button
            v-if="props.id"
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            @click="isHistoryOpen = true"
          >
            مشاهده تاریخچه ({{ plan.history.length }})
          </button>
          <button
            v-if="props.id"
            type="button"
            class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400"
            @click="handleDelete"
          >
            حذف
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <!-- خروجی چاپی -->
      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableLessonPlan :plan="plan" :teacher="selectedTeacher" :course="selectedCourse" />
      </div>
    </div>

    <LessonPlanHistoryModal v-model="isHistoryOpen" :plan="plan" />
  </div>
</template>
