<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSportWizardStore } from '@/stores/sport-wizard'
import { useTeachersStore } from '@/stores/teachers'
import { useSportFacilitiesStore } from '@/stores/sport-facilities'
import { useSportPlansStore } from '@/stores/sport-plans'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { SportSchedulerEngine } from '@/utils/sport-scheduler'
import type { SportClassDefinition, SportPlan } from '@/types'

const wizard = useSportWizardStore()
const teachersStore = useTeachersStore()
const facilitiesStore = useSportFacilitiesStore()
const sportPlansStore = useSportPlansStore()
const router = useRouter()

onMounted(async () => {
  await Promise.all([teachersStore.loadFromDb(), facilitiesStore.loadFromDb()])
})

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))
const activeShiftConfig = computed(() => wizard.shiftConfigs[wizard.shiftId])

const classes = computed<SportClassDefinition[]>(() => {
  const list: SportClassDefinition[] = []
  for (const grade of wizard.selectedGrades) {
    const count = wizard.classesPerGrade[grade] ?? 1
    for (let i = 0; i < count; i += 1) {
      list.push({ id: `${grade}-${i}`, grade, label: `${gradeLabel(grade)} - ${i + 1}` })
    }
  }
  return list
})

const periodsPerWeekByClass = ref<Record<string, number>>({})

function defaultPeriodsFor(grade: number): number {
  if (!wizard.levelId) return 2
  const hours = getCurriculumForGrade(wizard.levelId, grade).sport ?? 2
  return Math.max(1, Math.round(hours))
}

onMounted(() => {
  const initial: Record<string, number> = {}
  for (const klass of classes.value) {
    initial[klass.id] = defaultPeriodsFor(klass.grade)
  }
  periodsPerWeekByClass.value = initial
})

const selectedTeachers = computed(() => teachersStore.items.filter((t) => wizard.selectedTeacherIds.includes(t.id)))
const selectedFacilities = computed(() => facilitiesStore.items.filter((f) => wizard.selectedFacilityIds.includes(f.id)))

function toggleNoConsecutive(): void {
  wizard.setNoConsecutiveSportPeriods(!wizard.noConsecutiveSportPeriods)
}

const isGenerating = ref(false)
const warnings = ref<string[]>([])
const errorMessage = ref('')

async function handleGenerate(): Promise<void> {
  if (!wizard.levelId) return
  isGenerating.value = true
  errorMessage.value = ''
  warnings.value = []
  try {
    const engine = new SportSchedulerEngine()
    const result = engine.run({
      levelId: wizard.levelId,
      classes: classes.value,
      periodsPerWeekByClass: periodsPerWeekByClass.value,
      shiftConfig: activeShiftConfig.value,
      teachers: selectedTeachers.value,
      facilities: selectedFacilities.value,
      noConsecutiveSportPeriods: wizard.noConsecutiveSportPeriods,
    })
    warnings.value = result.warnings
    const now = Date.now()
    const plan: SportPlan = {
      id: crypto.randomUUID(),
      title: `${level.value?.name ?? ''} - ${wizard.selectedGrades.map((g) => gradeLabel(g)).join('،')}`,
      levelId: wizard.levelId,
      grades: wizard.selectedGrades,
      classes: classes.value,
      periodsPerWeekByClass: periodsPerWeekByClass.value,
      shiftId: wizard.shiftId,
      shiftConfig: activeShiftConfig.value,
      slots: result.slots,
      teachers: selectedTeachers.value,
      facilities: selectedFacilities.value,
      createdAt: now,
      updatedAt: now,
    }
    await sportPlansStore.save(plan)
    wizard.reset()
    router.push(`/sport/${plan.id}`)
  } catch (error) {
    errorMessage.value = 'خطایی در ساخت برنامه ورزش رخ داد. دوباره تلاش کن.'
    console.error(error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">خلاصه</p>
      <dl class="mt-3 grid gap-2 text-sm text-ink-600 sm:grid-cols-2 dark:text-ink-300">
        <div><dt class="inline text-ink-400 dark:text-ink-500">پایه: </dt><dd class="inline">{{ level?.name }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">پایه‌ها: </dt><dd class="inline">{{ wizard.selectedGrades.map((g) => gradeLabel(g)).join('،') }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">تعداد کلاس‌ها: </dt><dd class="inline">{{ classes.length }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">معلم‌های انتخاب‌شده: </dt><dd class="inline">{{ selectedTeachers.length }}</dd></div>
      </dl>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">تعداد زنگ ورزش هفتگی هر کلاس</p>
      <p class="mb-4 text-xs text-ink-500 dark:text-ink-400">در صورت نیاز می‌توانی این عدد را برای هر کلاس تغییر بدهی.</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="klass in classes"
          :key="klass.id"
          class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800"
        >
          <span class="text-ink-600 dark:text-ink-300">{{ klass.label }}</span>
          <input
            type="number"
            min="1"
            max="10"
            :value="periodsPerWeekByClass[klass.id]"
            class="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1 text-center dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
            @change="periodsPerWeekByClass[klass.id] = Number(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- عدم تکرار زنگ ورزش یک کلاس در یک روز -->
    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <label class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">عدم تکرار زنگ ورزش یک کلاس در یک روز</p>
          <p class="mt-1 text-11px leading-5 text-ink-400 dark:text-ink-500">
            با فعال‌بودن این گزینه، زنگ‌های ورزش هر کلاس در روزهای متفاوت پخش می‌شوند (نه پشت‌سرهم و نه در یک روز).
            در حالت خاموش، ممکن است چند زنگ ورزش یک کلاس در یک روز (حتی پشت‌سرهم) قرار بگیرد.
          </p>
        </div>
        <button
          type="button"
          class="relative h-6 w-11 shrink-0 rounded-full transition"
          :class="wizard.noConsecutiveSportPeriods ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'"
          role="switch"
          :aria-checked="wizard.noConsecutiveSportPeriods"
          @click="toggleNoConsecutive"
        >
          <span
            class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
            :style="{ right: wizard.noConsecutiveSportPeriods ? '2px' : '22px' }"
          ></span>
        </button>
      </label>
    </div>

    <div
      v-if="!selectedTeachers.length"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300"
    >
      حداقل یک معلم ورزش باید انتخاب شده باشد تا برنامه ساخته شود.
    </div>

    <div
      v-if="warnings.length"
      class="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300"
    >
      <p v-for="(w, i) in warnings" :key="i">{{ w }}</p>
    </div>
    <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <button
      type="button"
      class="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="isGenerating || !selectedTeachers.length"
      @click="handleGenerate"
    >
      {{ isGenerating ? 'در حال ساخت برنامه...' : 'ساخت برنامه ورزش' }}
    </button>
  </div>
</template>
