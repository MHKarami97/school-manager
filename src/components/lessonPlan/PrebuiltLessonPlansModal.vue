<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLessonPlansStore } from '@/stores/lesson-plans'
import { useTeachersStore } from '@/stores/teachers'
import { LEVELS, gradeLabel } from '@/config/levels.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { totalEstimatedMinutes } from '@/config/lesson-plan.config'
import { coursesAllowedForGrade } from '@/utils/question-bank-helpers'
import {
  fetchAllPrebuiltLessonPlans,
  filterPrebuiltPlans,
  type PrebuiltPlanFilter,
} from '@/utils/prebuilt-lesson-plans'
import type { LessonPlan, LevelId } from '@/types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** اگر در صفحه ادیتور باشیم، درس و پایه جاری را دریافت می‌کند تا پیش‌فیلتر شود */
    initialGrade?: number
    initialCourseId?: string
    /** حالت انتخاب مستقیم برای ادیتور (به جای ناوبری) */
    mode?: 'browse' | 'select'
  }>(),
  {
    mode: 'browse',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', plan: LessonPlan): void
}>()

const router = useRouter()
const lessonPlansStore = useLessonPlansStore()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const allPlans = ref<LessonPlan[]>([])
const selectedLevelId = ref<LevelId | ''>('')
const selectedGrade = ref<number | ''>('')
const selectedCourseId = ref<string>('')
const searchText = ref('')
const expandedPlanId = ref<string | null>(null)
const importMessage = ref('')

onMounted(async () => {
  isLoading.value = true
  allPlans.value = await fetchAllPrebuiltLessonPlans()
  if (props.initialGrade) {
    selectedGrade.value = props.initialGrade
    const level = LEVELS.find((l) => l.grades.includes(props.initialGrade!))
    if (level) selectedLevelId.value = level.id
  }
  if (props.initialCourseId) {
    selectedCourseId.value = props.initialCourseId
  }
  isLoading.value = false
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.initialGrade) {
        selectedGrade.value = props.initialGrade
        const level = LEVELS.find((l) => l.grades.includes(props.initialGrade!))
        if (level) selectedLevelId.value = level.id
      }
      if (props.initialCourseId) {
        selectedCourseId.value = props.initialCourseId
      }
    }
  },
)

const gradesForLevel = computed(() => {
  if (!selectedLevelId.value) return []
  return LEVELS.find((l) => l.id === selectedLevelId.value)?.grades ?? []
})

watch(selectedLevelId, (newLevel) => {
  if (newLevel) {
    const grades = LEVELS.find((l) => l.id === newLevel)?.grades ?? []
    if (selectedGrade.value && !grades.includes(selectedGrade.value)) {
      selectedGrade.value = ''
    }
  } else {
    selectedGrade.value = ''
  }
})

/** درس‌های مجاز و تعریف‌شده برای پایه/مقطع انتخاب‌شده (مثلاً در پایه ۵ زیست‌شناسی نشان داده نمی‌شود) */
const availableCoursesForSelectedGrade = computed(() => {
  if (selectedGrade.value) {
    return coursesAllowedForGrade(Number(selectedGrade.value))
  }
  if (selectedLevelId.value) {
    const levelGrades = LEVELS.find((l) => l.id === selectedLevelId.value)?.grades ?? []
    const allAllowed = new Set<string>()
    for (const g of levelGrades) {
      for (const c of coursesAllowedForGrade(g)) {
        allAllowed.add(c.id)
      }
    }
    return BASE_COURSES.filter((c) => allAllowed.has(c.id))
  }
  return BASE_COURSES
})

// وقتی پایه تغییر می‌کند، اگر درس انتخابی قبلی جزو دروس مجاز پایه جدید نبود، فیلتر درس را ریست کن
watch(selectedGrade, (newGrade) => {
  if (newGrade) {
    const allowed = coursesAllowedForGrade(Number(newGrade))
    if (selectedCourseId.value && !allowed.some((c) => c.id === selectedCourseId.value)) {
      selectedCourseId.value = ''
    }
  }
})

const filteredPlans = computed(() => {
  const filters: PrebuiltPlanFilter = {
    levelId: selectedLevelId.value,
    grade: selectedGrade.value,
    courseId: selectedCourseId.value,
    searchText: searchText.value,
  }
  return filterPrebuiltPlans(allPlans.value, filters)
})

function courseNameOf(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}

function toggleExpand(id: string): void {
  expandedPlanId.value = expandedPlanId.value === id ? null : id
}

async function usePlan(plan: LessonPlan): Promise<void> {
  if (props.mode === 'select') {
    emit('select', plan)
    emit('update:modelValue', false)
    return
  }

  // در حالت مرور، یک کپی در دیتابیس ثبت و کاربر را به ادیتور هدایت می‌کنیم
  const now = Date.now()
  const cloned: LessonPlan = {
    ...JSON.parse(JSON.stringify(plan)),
    id: crypto.randomUUID(),
    teacherId: teachersStore.items[0]?.id ?? '',
    status: 'draft',
    history: [],
    createdAt: now,
    updatedAt: now,
  }

  await lessonPlansStore.save(cloned)
  emit('update:modelValue', false)
  router.push(`/lesson-plans/${cloned.id}`)
}

async function importAllGradePlans(): Promise<void> {
  if (!selectedGrade.value) return
  const toImport = allPlans.value.filter((p) => p.grade === selectedGrade.value)
  if (!toImport.length) return

  const teacherId = teachersStore.items[0]?.id ?? ''
  const now = Date.now()
  for (const item of toImport) {
    const cloned: LessonPlan = {
      ...JSON.parse(JSON.stringify(item)),
      id: crypto.randomUUID(),
      teacherId,
      status: 'draft',
      history: [],
      createdAt: now,
      updatedAt: now,
    }
    await lessonPlansStore.save(cloned)
  }

  importMessage.value = `${toImport.length} طرح درس پایه ${gradeLabel(Number(selectedGrade.value))} با موفقیت به حساب شما اضافه شد.`
  setTimeout(() => (importMessage.value = ''), 4000)
}

function clearAllFilters(): void {
  selectedLevelId.value = ''
  selectedGrade.value = ''
  selectedCourseId.value = ''
  searchText.value = ''
}

function closeModal(): void {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs overflow-hidden"
      @click.self="closeModal"
    >
      <div
        class="flex h-full sm:h-[92vh] sm:max-h-[880px] w-full max-w-4xl flex-col bg-white text-ink-800 shadow-2xl sm:rounded-3xl border-0 sm:border border-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-100 overflow-hidden min-h-0"
      >
        <!-- هدر مودال -->
        <div class="flex shrink-0 items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-ink-800">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <span class="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-lg sm:text-xl text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              📚
            </span>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-ink-900 dark:text-white">
                بانک جامع طرح درس‌های آماده مدارس
              </h2>
              <p class="hidden sm:block mt-0.5 text-xs text-ink-500 dark:text-neutral-300">
                شامل ۳۴۰+ طرح درس استاندارد کشوری برای تمامی پایه‌ها (۱ تا ۱۲) و تمام دروس و فصول
              </p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
            @click="closeModal"
          >
            ✕
          </button>
        </div>

        <!-- فیلترها و انتخاب مقطع / پایه / درس -->
        <div class="shrink-0 border-b border-ink-100 bg-ink-50/50 p-3 sm:p-4 dark:border-ink-800 dark:bg-ink-950/40 space-y-2 sm:space-y-3">
          <!-- کادر جست‌وجوی کلی در متن طرح درس -->
          <div class="relative">
            <input
              v-model="searchText"
              type="text"
              placeholder="جست‌وجو در عنوان، فصل، اهداف یا روش تدریس..."
              class="w-full rounded-xl border border-ink-200 bg-white px-3 py-1.5 sm:py-2 pl-8 text-xs text-ink-800 placeholder:text-ink-400 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:placeholder:text-neutral-400"
            />
            <button
              v-if="searchText"
              type="button"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-700 dark:text-neutral-400 dark:hover:text-white"
              @click="searchText = ''"
            >
              ✕
            </button>
          </div>

          <!-- ۳ دراپ‌داون: در موبایل مقطع و پایه کنار هم (۲ ستون)، درس سطر بعدی؛ در دسکتاپ هر ۳ در یک ردیف -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <!-- دراپ‌داون ۱: مقطع تحصیلی -->
            <div>
              <label class="mb-1 block text-xs font-bold text-ink-800 dark:text-white">
                ۱. مقطع
              </label>
              <select
                v-model="selectedLevelId"
                class="w-full rounded-xl border border-ink-200 bg-white px-2.5 py-1.5 sm:py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
              >
                <option value="" class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white">همه مقاطع</option>
                <option v-for="l in LEVELS" :key="l.id" :value="l.id" class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white">
                  {{ l.name }}
                </option>
              </select>
            </div>

            <!-- دراپ‌داون ۲: پایه تحصیلی -->
            <div>
              <label class="mb-1 block text-xs font-bold text-ink-800 dark:text-white">
                ۲. پایه
              </label>
              <select
                v-model="selectedGrade"
                class="w-full rounded-xl border border-ink-200 bg-white px-2.5 py-1.5 sm:py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
              >
                <option value="" class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white">همه پایه‌ها</option>
                <option
                  v-for="g in (selectedLevelId ? gradesForLevel : Array.from({ length: 12 }, (_, i) => i + 1))"
                  :key="g"
                  :value="g"
                  class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white"
                >
                  {{ gradeLabel(g) }}
                </option>
              </select>
            </div>

            <!-- دراپ‌داون ۳: درس مورد نظر (فقط دروس مصوب همان پایه) -->
            <div class="col-span-2 sm:col-span-1">
              <div class="mb-1 flex items-center justify-between text-xs font-bold text-ink-800 dark:text-white">
                <span>۳. درس</span>
                <button
                  v-if="selectedCourseId"
                  type="button"
                  class="text-[10px] font-normal text-red-600 hover:underline dark:text-red-400"
                  @click="selectedCourseId = ''"
                >
                  حذف فیلتر درس
                </button>
              </div>
              <select
                v-model="selectedCourseId"
                class="w-full rounded-xl border border-ink-200 bg-white px-2.5 py-1.5 sm:py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
              >
                <option value="" class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white">
                  {{ selectedGrade ? `همه درس‌های ${gradeLabel(Number(selectedGrade))}` : 'همه درس‌ها' }}
                </option>
                <option
                  v-for="c in availableCoursesForSelectedGrade"
                  :key="c.id"
                  :value="c.id"
                  class="bg-white text-ink-900 dark:bg-ink-900 dark:text-white"
                >
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- پیام بارگذاری گروهی -->
        <div v-if="importMessage" class="shrink-0 bg-emerald-50 px-4 py-2 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {{ importMessage }}
        </div>

        <!-- نوار خلاصه و دکمه بارگذاری دسته‌ای -->
        <div class="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-2 sm:px-6 sm:py-2.5 text-xs text-ink-500 dark:border-ink-800 dark:text-neutral-300">
          <div class="flex items-center gap-2">
            <span>نمایش <strong>{{ filteredPlans.length }}</strong> طرح درس</span>
            <button
              v-if="selectedLevelId || selectedGrade || selectedCourseId || searchText"
              type="button"
              class="text-[11px] text-ink-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
              @click="clearAllFilters"
            >
              پاک کردن فیلترها
            </button>
          </div>
          <button
            v-if="selectedGrade"
            type="button"
            class="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
            @click="importAllGradePlans"
          >
            📥 افزودن تمام طرح درس‌های {{ gradeLabel(Number(selectedGrade)) }}
          </button>
        </div>

        <!-- لیست طرح درس‌ها (دارای min-h-0 برای فعال بودن کامل اسکرول در فلکس‌باکس روی موبایل) -->
        <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
          <div v-if="isLoading" class="py-16 text-center text-sm text-ink-400 dark:text-neutral-400">
            در حال بارگذاری بانک طرح درس‌ها...
          </div>

          <div v-else-if="!filteredPlans.length" class="py-16 text-center">
            <p class="text-sm font-medium text-ink-600 dark:text-neutral-200">هیچ طرح درسی مطابق با این فیلترها یافت نشد.</p>
            <p class="mt-1 text-xs text-ink-400 dark:text-neutral-400">می‌توانید فیلترها را حذف کنید تا طرح درس‌های سایر پایه‌ها نمایش داده شوند.</p>
            <button
              type="button"
              class="mt-3 rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 dark:border-ink-700 dark:text-neutral-200"
              @click="clearAllFilters"
            >
              حذف فیلترها
            </button>
          </div>

          <div v-else class="space-y-3 sm:space-y-4">
            <div
              v-for="plan in filteredPlans"
              :key="plan.id"
              class="rounded-2xl border border-ink-100 bg-white p-3.5 sm:p-4 transition hover:border-brand-300 dark:border-ink-800 dark:bg-ink-800/40 dark:hover:border-brand-500"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span class="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {{ courseNameOf(plan.courseId) }}
                    </span>
                    <span class="rounded-lg bg-ink-100 px-2 py-0.5 text-xs text-ink-700 dark:bg-ink-700 dark:text-neutral-200">
                      {{ gradeLabel(plan.grade) }}
                    </span>
                    <span v-if="plan.chapter" class="rounded-lg bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {{ plan.chapter }}
                    </span>
                    <span class="text-[11px] sm:text-xs text-ink-400 dark:text-neutral-400">
                      ⏱️ {{ totalEstimatedMinutes(plan.blocks) }} دقیقه
                    </span>
                  </div>
                  <h3 class="mt-2 text-sm sm:text-base font-bold text-ink-900 dark:text-white">
                    {{ plan.title }}
                  </h3>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-neutral-200 dark:hover:bg-ink-800"
                    @click="toggleExpand(plan.id)"
                  >
                    {{ expandedPlanId === plan.id ? 'بستن پیش‌نمایش' : 'مشاهده جزئیات' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-brand-600 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700"
                    @click="usePlan(plan)"
                  >
                    {{ mode === 'select' ? '✓ انتخاب و اعمال در فرم' : '📋 استفاده و ویرایش' }}
                  </button>
                </div>
              </div>

              <!-- خلاصه اهداف و روش تدریس -->
              <div class="mt-2.5 sm:mt-3 grid gap-1.5 sm:gap-2 text-xs sm:grid-cols-2">
                <div class="rounded-xl bg-ink-50/70 p-2 sm:p-2.5 dark:bg-ink-800/80">
                  <span class="font-semibold text-ink-700 dark:text-neutral-200">روش تدریس: </span>
                  <span class="text-ink-600 dark:text-neutral-300">{{ plan.teachingMethod }}</span>
                </div>
                <div class="rounded-xl bg-ink-50/70 p-2 sm:p-2.5 dark:bg-ink-800/80">
                  <span class="font-semibold text-ink-700 dark:text-neutral-200">وسایل و منابع: </span>
                  <span class="text-ink-600 dark:text-neutral-300 truncate block">{{ plan.resources }}</span>
                </div>
              </div>

              <!-- پنل جزئیات کامل و گام‌های جلسه هنگام باز شدن -->
              <div v-if="expandedPlanId === plan.id" class="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3 border-t border-ink-100 pt-3 text-xs dark:border-ink-800">
                <div>
                  <p class="font-bold text-ink-800 dark:text-white">اهداف تفصیلی جلسه:</p>
                  <div class="mt-1 whitespace-pre-line rounded-xl bg-ink-50/60 p-2.5 sm:p-3 text-ink-700 leading-relaxed dark:bg-ink-800/80 dark:text-neutral-200">
                    {{ plan.objectives }}
                  </div>
                </div>

                <div>
                  <p class="font-bold text-ink-800 dark:text-white">مراحل زمان‌بندی‌شده جلسه ({{ plan.blocks.length }} گام):</p>
                  <div class="mt-1 space-y-1.5">
                    <div
                      v-for="(block, bIdx) in plan.blocks"
                      :key="block.id"
                      class="flex items-start gap-2 sm:gap-2.5 rounded-xl border border-ink-100 bg-white p-2 sm:p-2.5 dark:border-ink-800 dark:bg-ink-800/50"
                    >
                      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                        {{ bIdx + 1 }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="font-semibold text-ink-800 dark:text-white">{{ block.title }}</span>
                          <span class="text-[11px] font-medium text-ink-400 dark:text-neutral-400">{{ block.estimatedMinutes }} دقیقه</span>
                        </div>
                        <p class="mt-0.5 text-ink-600 dark:text-neutral-300">{{ block.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p class="font-bold text-ink-800 dark:text-white">ارزشیابی و تکالیف:</p>
                  <div class="mt-1 whitespace-pre-line rounded-xl bg-ink-50/60 p-2.5 sm:p-3 text-ink-700 leading-relaxed dark:bg-ink-800/80 dark:text-neutral-200">
                    {{ plan.assessment }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- فوتر مودال -->
        <div class="shrink-0 flex items-center justify-end border-t border-ink-100 px-4 py-2.5 sm:px-6 sm:py-3 dark:border-ink-800">
          <button
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-1.5 sm:py-2 text-xs font-semibold text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-neutral-200 dark:hover:bg-ink-800"
            @click="closeModal"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
