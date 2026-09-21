<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWizardStore } from '@/stores/wizard'
import { useTeachersStore } from '@/stores/teachers'
import { useSchedulesStore } from '@/stores/schedules'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { BASE_COURSES } from '@/config/courses.config'
import { generateSchedule } from '@/utils/generate-schedule'
import { analyzeGradeScheduleFeasibility, firstGradeRuleExplanation } from '@/utils/schedule-feasibility'
import SchedulingRulesPanel from './SchedulingRulesPanel.vue'

const router = useRouter()
const wizard = useWizardStore()
const teachersStore = useTeachersStore()
const schedulesStore = useSchedulesStore()

onMounted(() => {
  teachersStore.loadFromDb()
  wizard.applyMandatoryRules()
})

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))
const activeShiftConfig = computed(() => wizard.shiftConfigs[wizard.shiftId])

const feasibilityResults = computed(() => {
  if (!wizard.levelId) return []
  return wizard.selectedGrades.map((grade) => analyzeGradeScheduleFeasibility(wizard.levelId as NonNullable<typeof wizard.levelId>, grade, activeShiftConfig.value))
})

const weeklyHoursByGrade = computed(() => {
  if (!wizard.levelId) return []
  return wizard.selectedGrades.map((grade) => {
    const curriculum = getCurriculumForGrade(wizard.levelId as NonNullable<typeof wizard.levelId>, grade)
    const courses = Object.entries(curriculum)
      .filter(([, hours]) => hours > 0)
      .map(([courseId, hours]) => ({
        courseId,
        name: BASE_COURSES.find((course) => course.id === courseId)?.name ?? courseId,
        hours,
      }))
    return { grade, courses, total: courses.reduce((sum, course) => sum + course.hours, 0) }
  })
})

const hasOverCapacity = computed(() => feasibilityResults.value.some((result) => result.isOverCapacity))
const hasUnderCapacity = computed(() => feasibilityResults.value.some((result) => result.isUnderCapacity))
const firstGradeExplanation = computed(() => {
  if (!wizard.levelId) return null
  return wizard.selectedGrades.map((grade) => firstGradeRuleExplanation(wizard.levelId as NonNullable<typeof wizard.levelId>, grade)).find(Boolean) ?? null
})

function applyRecommendedPeriods(): void {
  const needed = Math.max(...feasibilityResults.value.map((result) => result.recommendedPeriodsPerDay), activeShiftConfig.value.periodsCount)
  wizard.updateShiftConfig(wizard.shiftId, { periodsCount: needed })
}

const isGenerating = ref(false)
const warnings = ref<string[]>([])
const errorMessage = ref('')

async function handleGenerate(): Promise<void> {
  if (!wizard.levelId || hasOverCapacity.value) return
  isGenerating.value = true
  errorMessage.value = ''

  try {
    const { schedule, warnings: genWarnings } = generateSchedule({
      audience: wizard.audience ?? 'self',
      schoolName: wizard.schoolName,
      levelId: wizard.levelId,
      grades: wizard.selectedGrades,
      shiftId: wizard.shiftId,
      shiftConfig: activeShiftConfig.value,
      teacherSelections: wizard.teacherSelections,
      lockedSportCells: wizard.lockedSportCells,
      teachersPool: teachersStore.items,
      ruleToggles: wizard.ruleToggles,
    })

    warnings.value = genWarnings

    if (genWarnings.length) {
      errorMessage.value = 'موتور نتوانست تمام ساعات را با قوانین فعلی در ظرفیت موجود جای دهد. قوانین یا تعداد زنگ‌ها را بررسی و دوباره تلاش کنید.'
      return
    }

    const id = crypto.randomUUID()
    const now = Date.now()
    await schedulesStore.save({ id, createdAt: now, updatedAt: now, ...schedule })

    wizard.reset()
    router.push(`/schedules/${id}`)
  } catch (error) {
    errorMessage.value = 'ساخت برنامه با خطا مواجه شد. لطفاً مراحل قبل را بررسی کنید.'
    console.error(error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">خلاصه انتخاب‌های شما</p>
      <dl class="mt-3 grid gap-2 text-sm text-ink-600 sm:grid-cols-2 dark:text-ink-300">
        <div>
          <dt class="inline text-ink-400 dark:text-ink-500">مخاطب: </dt>
          <dd class="inline">{{ wizard.audience === 'self' ? 'خودم' : `مدرسه${wizard.schoolName ? ' - ' + wizard.schoolName : ''}` }}</dd>
        </div>
        <div>
          <dt class="inline text-ink-400 dark:text-ink-500">دوره: </dt>
          <dd class="inline">{{ level?.name }}</dd>
        </div>
        <div>
          <dt class="inline text-ink-400 dark:text-ink-500">پایه‌ها: </dt>
          <dd class="inline">{{ wizard.selectedGrades.map((g) => gradeLabel(g)).join('، ') }}</dd>
        </div>
        <div>
          <dt class="inline text-ink-400 dark:text-ink-500">شیفت: </dt>
          <dd class="inline">{{ activeShiftConfig.name }} ({{ activeShiftConfig.startTime }}–{{ activeShiftConfig.endTime }}) - {{ activeShiftConfig.periodsCount }} زنگ روزانه</dd>
        </div>
      </dl>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ساعات هفتگی موردنیاز دروس</p>
      <p class="mb-4 text-xs text-ink-500 dark:text-ink-400">مقادیر زیر از جدول رسمی ساعات درسی تنظیم‌شده برای هر پایه خوانده می‌شوند.</p>
      <div v-for="item in weeklyHoursByGrade" :key="item.grade" class="mb-4 last:mb-0">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-xs font-semibold text-ink-700 dark:text-ink-200">پایه {{ gradeLabel(item.grade) }}</p>
          <span class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">جمع: {{ item.total }} ساعت</span>
        </div>
        <div class="grid gap-1.5 sm:grid-cols-2">
          <div v-for="course in item.courses" :key="course.courseId" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
            <span class="text-ink-600 dark:text-ink-300">{{ course.name }}</span>
            <span class="font-medium text-ink-800 dark:text-ink-200">{{ course.hours }} ساعت</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="firstGradeExplanation" class="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
      {{ firstGradeExplanation }}
    </div>

    <div v-if="hasOverCapacity" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <p v-for="result in feasibilityResults.filter((r) => r.isOverCapacity)" :key="result.grade">{{ result.message }}</p>
      <button type="button" class="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white" @click="applyRecommendedPeriods">
        تنظیم خودکار تعداد زنگ لازم
      </button>
    </div>

    <div v-else-if="hasUnderCapacity" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <p v-for="result in feasibilityResults.filter((r) => r.isUnderCapacity)" :key="result.grade">{{ result.message }}</p>
      <p class="mt-2">برای پر کردن همه خانه‌ها باید فعالیت/درس تکمیلی تعریف کنید؛ موتور درس ساختگی اضافه نمی‌کند تا ساعات رسمی مخدوش نشود.</p>
    </div>

    <SchedulingRulesPanel />

    <div v-if="warnings.length" class="space-y-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <p v-for="(w, i) in warnings" :key="i">{{ w }}</p>
    </div>
    <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <button
      type="button"
      class="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="isGenerating || hasOverCapacity"
      @click="handleGenerate"
    >
      {{ isGenerating ? 'در حال ساخت برنامه…' : hasOverCapacity ? 'ظرفیت برنامه کافی نیست' : 'ساخت برنامه هفتگی' }}
    </button>
  </div>
</template>
