<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useTeachingPlansStore } from '../stores/teaching-plans'
import { useTeachersStore } from '../stores/teachers'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { LEVELS, getLevelById, gradeLabel } from '../config/levels.config'
import { buildBellSchedule, cloneDefaultShiftConfigs } from '../config/schedule-defaults.config'
import {
  ISSUE_SEVERITY_CLASSES,
  buildTeachingClasses,
  createEmptyTeachingPlan,
  defaultCurriculumForGrade,
} from '../config/teaching-plan.config'
import { WEEK_DAYS } from '../types'
import { TeachingPlanner } from '../utils/teaching-planner'
import { analyzePlan } from '../utils/teaching-analysis'
import { moveLesson, removeLesson, upsertLesson } from '../utils/teaching-plan-ops'
import { isQualified, slotKey } from '../utils/teaching-rules'
import { formatTeacherName } from '../utils/teacher-format'
import { printWithPageSize } from '../utils/print-page'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import TeachingGrid from '../components/teaching-plan/TeachingGrid.vue'
import LessonEditModal from '../components/teaching-plan/LessonEditModal.vue'
import TeacherWorkloadPanel from '../components/teaching-plan/TeacherWorkloadPanel.vue'
import CurriculumEditor from '../components/teaching-plan/CurriculumEditor.vue'
import PrintableTeachingPlan from '../components/teaching-plan/PrintableTeachingPlan.vue'
import type { DragPayload, GridItem, GridPeriod } from '../components/teaching-plan/teaching-grid.types'
import type { LevelId, ShiftId, Teacher, TeachingClass, TeachingPlan, TeachingSlot } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const plansStore = useTeachingPlansStore()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const plan = ref<TeachingPlan | null>(null)
const tab = ref<'setup' | 'class' | 'teacher' | 'report'>('setup')
const activeClassId = ref('')
const activeTeacherId = ref('')
const saveMessage = ref('')
const plannerWarnings = ref<string[]>([])
const issueFilter = ref<'all' | 'error' | 'warning'>('all')
const showAllDiffs = ref(false)

onMounted(async () => {
  await Promise.all([plansStore.loadFromDb(), teachersStore.loadFromDb()])
  if (props.id) {
    const existing = plansStore.byId(props.id)
    plan.value = existing ? (JSON.parse(JSON.stringify(existing)) as TeachingPlan) : null
    if (plan.value?.slots.length) tab.value = 'class'
  } else {
    plan.value = createEmptyTeachingPlan()
    plan.value.teacherIds = teachersStore.items.map((t) => t.id)
  }
  activeClassId.value = plan.value?.classes[0]?.id ?? ''
  activeTeacherId.value = plan.value?.teacherIds[0] ?? ''
  isLoading.value = false
})

// --- داده‌های مشتق --------------------------------------------------
const lessonPeriods = computed<GridPeriod[]>(() =>
  plan.value
    ? buildBellSchedule(plan.value.shiftConfig)
        .filter((p) => p.type === 'lesson')
        .map((p, index) => ({ index, start: p.start, end: p.end }))
    : [],
)

const periodTimes = computed(() => lessonPeriods.value.map((p) => ({ start: p.start, end: p.end })))
const range = computed(() => ({ from: plan.value?.effectiveFrom ?? '', to: plan.value?.effectiveTo ?? '' }))

const planTeachers = computed<Teacher[]>(() =>
  (plan.value?.teacherIds ?? []).map((id) => teachersStore.byId(id)).filter((t): t is Teacher => !!t),
)

const analysis = computed(() =>
  plan.value
    ? analyzePlan(plan.value, teachersStore.items, periodTimes.value)
    : { issues: [], flagged: new Map(), workloads: [], diffs: [] },
)

const hasSlots = computed(() => !!plan.value && plan.value.slots.length > 0)
const levelGrades = computed(() => (plan.value ? (getLevelById(plan.value.levelId)?.grades ?? []) : []))

function courseName(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}
function courseColor(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.color ?? '#8892a6'
}
function teacherName(teacherId: string | null): string {
  const teacher = teacherId ? teachersStore.byId(teacherId) : undefined
  return teacher ? formatTeacherName(teacher) : 'بدون معلم'
}
function classLabel(classId: string): string {
  return plan.value?.classes.find((c) => c.id === classId)?.label ?? classId
}

// --- تنظیمات پایه --------------------------------------------------
function rebuildClasses(): void {
  const current = plan.value
  if (!current) return
  current.classes = buildTeachingClasses(current.grades, current.classCounts)
  const ids = new Set(current.classes.map((c) => c.id))
  current.slots = current.slots.filter((s) => ids.has(s.classId))
  if (!ids.has(activeClassId.value)) activeClassId.value = current.classes[0]?.id ?? ''
}

function changeLevel(levelId: LevelId): void {
  const current = plan.value
  if (!current || current.levelId === levelId) return
  if ((current.grades.length || current.slots.length) && !confirm('با تغییر مقطع، پایه‌ها و برنامه‌ی فعلی پاک می‌شود. ادامه می‌دهی؟')) return
  current.levelId = levelId
  current.grades = []
  current.classCounts = {}
  current.curriculum = {}
  current.classes = []
  current.slots = []
  current.generatedAt = null
}

function toggleGrade(grade: number): void {
  const current = plan.value
  if (!current) return
  if (current.grades.includes(grade)) {
    current.grades = current.grades.filter((g) => g !== grade)
    delete current.classCounts[grade]
    delete current.curriculum[grade]
  } else {
    current.grades = [...current.grades, grade].sort((a, b) => a - b)
    current.classCounts[grade] = 1
    current.curriculum[grade] = defaultCurriculumForGrade(current.levelId, grade)
  }
  rebuildClasses()
}

function stepClasses(grade: number, delta: number): void {
  const current = plan.value
  if (!current) return
  current.classCounts[grade] = Math.min(10, Math.max(1, (current.classCounts[grade] ?? 1) + delta))
  rebuildClasses()
}

function changeShift(shiftId: ShiftId): void {
  const current = plan.value
  if (!current) return
  current.shiftId = shiftId
  current.shiftConfig = cloneDefaultShiftConfigs()[shiftId]
}

function stepPeriods(delta: number): void {
  const current = plan.value
  if (!current) return
  current.shiftConfig.periodsCount = Math.min(10, Math.max(3, current.shiftConfig.periodsCount + delta))
  current.slots = current.slots.filter((s) => s.periodIndex < current.shiftConfig.periodsCount)
}

function toggleTeacher(teacherId: string): void {
  const current = plan.value
  if (!current) return
  current.teacherIds = current.teacherIds.includes(teacherId)
    ? current.teacherIds.filter((id) => id !== teacherId)
    : [...current.teacherIds, teacherId]
}

function selectAllTeachers(): void {
  if (plan.value) plan.value.teacherIds = teachersStore.items.map((t) => t.id)
}

/** چند درسِ سرفصل (در پایه‌های انتخاب‌شده) را این معلم می‌تواند تدریس کند؟ */
function usefulCourseCount(teacher: Teacher): number {
  const current = plan.value
  if (!current) return 0
  const matched = new Set<string>()
  for (const cls of current.classes) {
    for (const courseId of Object.keys(current.curriculum[cls.grade] ?? {})) {
      if (isQualified(teacher, courseId, cls.grade, current.levelId)) matched.add(courseId)
    }
  }
  return matched.size
}

// --- تولید برنامه --------------------------------------------------
const canGenerate = computed(() => !!plan.value && plan.value.classes.length > 0 && planTeachers.value.length > 0)

function generate(): void {
  const current = plan.value
  if (!current || !canGenerate.value) return
  const unlockedCount = current.slots.filter((s) => !s.isLocked).length
  if (unlockedCount && !confirm('برنامه‌ی فعلی (به جز خانه‌های قفل‌شده) دوباره ساخته و جایگزین شود؟')) return

  const result = new TeachingPlanner().run({
    levelId: current.levelId,
    classes: current.classes,
    curriculum: current.curriculum,
    periods: periodTimes.value,
    dayCount: WEEK_DAYS.length,
    teachers: planTeachers.value,
    lockedSlots: current.slots.filter((s) => s.isLocked),
    range: range.value,
  })
  current.slots = result.slots
  current.generatedAt = Date.now()
  plannerWarnings.value = result.warnings
  activeClassId.value = activeClassId.value || current.classes[0]?.id || ''
  tab.value = 'class'
}

// --- نمایش خانه‌ها در جدول --------------------------------------------------
function itemOf(slot: TeachingSlot, subtitle: string): GridItem {
  const key = slotKey(slot.classId, slot.dayIndex, slot.periodIndex)
  return {
    key,
    classId: slot.classId,
    title: courseName(slot.courseId),
    subtitle,
    color: courseColor(slot.courseId),
    locked: !!slot.isLocked,
    severity: analysis.value.flagged.get(key) ?? null,
    noTeacher: !slot.teacherId,
  }
}

function classItemsAt(dayIndex: number, periodIndex: number): GridItem[] {
  const slot = plan.value?.slots.find(
    (s) => s.classId === activeClassId.value && s.dayIndex === dayIndex && s.periodIndex === periodIndex,
  )
  return slot ? [itemOf(slot, teacherName(slot.teacherId))] : []
}

function teacherItemsAt(dayIndex: number, periodIndex: number): GridItem[] {
  return (plan.value?.slots ?? [])
    .filter((s) => s.teacherId === activeTeacherId.value && s.dayIndex === dayIndex && s.periodIndex === periodIndex)
    .map((s) => itemOf(s, classLabel(s.classId)))
}

function classHasIssue(classId: string): boolean {
  return analysis.value.issues.some((i) => i.classId === classId || i.slotKeys.some((k) => k.startsWith(`${classId}|`)))
}

function onMove(payload: DragPayload, dayIndex: number, periodIndex: number): void {
  if (!plan.value) return
  plan.value.slots = moveLesson(
    plan.value.slots,
    payload.classId,
    { dayIndex: payload.dayIndex, periodIndex: payload.periodIndex },
    { dayIndex, periodIndex },
  )
}

// --- ویرایش یک خانه --------------------------------------------------
const modalOpen = ref(false)
const modalClass = ref<TeachingClass | null>(null)
const modalDay = ref(0)
const modalPeriod = ref(0)

const modalSlot = computed(
  () =>
    plan.value?.slots.find(
      (s) => modalClass.value && s.classId === modalClass.value.id && s.dayIndex === modalDay.value && s.periodIndex === modalPeriod.value,
    ) ?? null,
)

function openModal(classId: string, dayIndex: number, periodIndex: number): void {
  const cls = plan.value?.classes.find((c) => c.id === classId)
  if (!cls) return
  modalClass.value = cls
  modalDay.value = dayIndex
  modalPeriod.value = periodIndex
  modalOpen.value = true
}

function onSaveLesson(slot: TeachingSlot): void {
  if (plan.value) plan.value.slots = upsertLesson(plan.value.slots, slot)
}

function onDeleteLesson(): void {
  if (plan.value && modalClass.value) {
    plan.value.slots = removeLesson(plan.value.slots, modalClass.value.id, { dayIndex: modalDay.value, periodIndex: modalPeriod.value })
  }
}

const modalCurriculumCourseIds = computed(() =>
  modalClass.value && plan.value ? Object.keys(plan.value.curriculum[modalClass.value.grade] ?? {}) : [],
)

// --- گزارش --------------------------------------------------
const visibleIssues = computed(() => analysis.value.issues.filter((i) => issueFilter.value === 'all' || i.severity === issueFilter.value))
const errorCount = computed(() => analysis.value.issues.filter((i) => i.severity === 'error').length)
const warningCount = computed(() => analysis.value.issues.filter((i) => i.severity === 'warning').length)
const visibleDiffs = computed(() => analysis.value.diffs.filter((d) => showAllDiffs.value || d.diff !== 0))

// --- ذخیره / حذف --------------------------------------------------
async function handleSave(): Promise<void> {
  if (!plan.value || !plan.value.title.trim()) return
  const isNew = !props.id
  await plansStore.save(plan.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/teaching-plans/${plan.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!plan.value || !props.id) return
  if (!confirm('این برنامه‌ی تدریس حذف شود؟')) return
  await plansStore.remove(plan.value.id)
  router.push('/teaching-plans')
}

// --- چاپ / PDF --------------------------------------------------
type PrintMode = 'class' | 'all-classes' | 'teacher' | 'all-teachers' | 'workload' | 'diffs'
const printMode = ref<PrintMode>('class')
const isPrinting = ref(false)

async function handlePrint(mode: PrintMode): Promise<void> {
  printMode.value = mode
  isPrinting.value = true
  await nextTick()
  printWithPageSize('A4 landscape')
  window.addEventListener('afterprint', () => { isPrinting.value = false }, { once: true })
}

const TAB_LABELS: { key: 'setup' | 'class' | 'teacher' | 'report'; label: string }[] = [
  { key: 'setup', label: 'تنظیمات و سرفصل' },
  { key: 'class', label: 'برنامه‌ی کلاس‌ها' },
  { key: 'teacher', label: 'برنامه‌ی معلمان' },
  { key: 'report', label: 'گزارش و هشدارها' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 print:min-h-0 print:bg-white print:pb-0 sm:pb-16 dark:bg-ink-950 print:dark:bg-white">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500 print:hidden">در حال بارگذاری...</div>
    <div v-else-if="!plan" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center print:hidden">
      <p class="text-ink-600 dark:text-ink-300">این برنامه یافت نشد.</p>
      <RouterLink to="/teaching-plans" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به فهرست برنامه‌ها</RouterLink>
    </div>

    <template v-else>
      <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 print:hidden">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ props.id ? 'ویرایش برنامه‌ی تدریس' : 'برنامه‌ی تدریس جدید' }}</h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {{ plan.classes.length }} کلاس - {{ planTeachers.length }} معلم - {{ plan.slots.length }} ساعت
              <template v-if="errorCount"> - <span class="text-red-600 dark:text-red-400">{{ errorCount }} خطا</span></template>
              <template v-if="warningCount"> - <span class="text-amber-600 dark:text-amber-400">{{ warningCount }} هشدار</span></template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/teaching-plans/teachers" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">محدودیت‌های معلمان</RouterLink>
            <RouterLink to="/teaching-plans" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">بازگشت به فهرست</RouterLink>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="item in TAB_LABELS"
            :key="item.key"
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="tab === item.key ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
            @click="tab = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- ===================== تنظیمات ===================== -->
        <div v-if="tab === 'setup'" class="space-y-4">
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات برنامه</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان</label>
                <input v-model="plan.title" type="text" placeholder="مثلاً: برنامه‌ی تدریس نیم‌سال اول - متوسطه اول" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">اعتبار از تاریخ (شمسی)</label>
                <JalaliDatePicker v-model="plan.effectiveFrom" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تا تاریخ (شمسی)</label>
                <JalaliDatePicker v-model="plan.effectiveTo" />
              </div>
            </div>
            <p class="mt-2 text-10px text-ink-400 dark:text-ink-500">بازه‌ی اعتبار تعیین می‌کند کدام «ساعت‌های غیرقابل‌تدریس» معلم‌ها (با بازه‌ی تاریخی) در این برنامه اعمال شوند.</p>

            <p class="mb-2 mt-4 text-xs font-medium text-ink-600 dark:text-ink-300">مقطع</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="level in LEVELS"
                :key="level.id"
                type="button"
                class="rounded-lg border-2 px-4 py-2 text-xs font-medium transition"
                :class="plan.levelId === level.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                @click="changeLevel(level.id)"
              >
                {{ level.name }}
              </button>
            </div>
            <p v-if="plan.levelId === 'elementary'" class="mt-2 rounded-lg bg-amber-50 p-2.5 text-11px leading-5 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
              در ابتدایی معمولاً معلم کلاس همه‌ی دروس را تدریس می‌کند؛ این ابزار بیشتر برای دروس تخصصی (ورزش، زبان، هنر و…) مفید است. دروس بدون معلم واجدشرایط با هشدار نشان داده می‌شوند.
            </p>

            <p class="mb-2 mt-4 text-xs font-medium text-ink-600 dark:text-ink-300">پایه‌ها و تعداد کلاس هر پایه</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <div v-for="grade in levelGrades" :key="grade" class="flex items-center justify-between rounded-xl border px-3 py-2" :class="plan.grades.includes(grade) ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/10' : 'border-ink-200 dark:border-ink-700'">
                <button type="button" class="text-xs font-medium" :class="plan.grades.includes(grade) ? 'text-brand-700 dark:text-brand-300' : 'text-ink-600 dark:text-ink-300'" @click="toggleGrade(grade)">
                  {{ gradeLabel(grade) }}
                </button>
                <div v-if="plan.grades.includes(grade)" class="flex items-center gap-1.5">
                  <button type="button" class="flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 disabled:opacity-40 dark:border-ink-700 dark:text-ink-300" :disabled="(plan.classCounts[grade] ?? 1) <= 1" @click="stepClasses(grade, -1)">−</button>
                  <span class="w-5 text-center text-xs font-semibold text-ink-800 dark:text-ink-200">{{ plan.classCounts[grade] ?? 1 }}</span>
                  <button type="button" class="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-white disabled:opacity-40" :disabled="(plan.classCounts[grade] ?? 1) >= 10" @click="stepClasses(grade, 1)">+</button>
                </div>
              </div>
            </div>

            <p class="mb-2 mt-4 text-xs font-medium text-ink-600 dark:text-ink-300">شیفت و تعداد زنگ‌ها</p>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="rounded-lg border-2 px-4 py-2 text-xs font-medium" :class="plan.shiftId === 'morning' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="changeShift('morning')">صبح</button>
              <button type="button" class="rounded-lg border-2 px-4 py-2 text-xs font-medium" :class="plan.shiftId === 'noon' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="changeShift('noon')">ظهر</button>
              <span class="text-11px text-ink-400 dark:text-ink-500">{{ plan.shiftConfig.startTime }} تا {{ plan.shiftConfig.endTime }}</span>
              <div class="mr-auto flex items-center gap-1.5">
                <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="stepPeriods(-1)">−</button>
                <span class="w-16 text-center text-xs font-semibold text-ink-800 dark:text-ink-200">{{ plan.shiftConfig.periodsCount }} زنگ</span>
                <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white" @click="stepPeriods(1)">+</button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">سرفصل - منبع الزام ساعت‌ها</p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">مقدار پیش‌فرض از سرفصل برنامه آمده؛ برای هر پایه قابل تغییر است و تولید برنامه دقیقاً بر اساس همین اعداد انجام می‌شود.</p>
            <CurriculumEditor v-model="plan.curriculum" :level-id="plan.levelId" :grades="plan.grades" />
          </div>

          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">معلمان شرکت‌کننده ({{ planTeachers.length }})</p>
              <button type="button" class="text-11px font-medium text-brand-600 dark:text-brand-400" @click="selectAllTeachers">انتخاب همه</button>
            </div>
            <div v-if="teachersStore.items.length" class="grid gap-1.5 sm:grid-cols-2">
              <label v-for="teacher in teachersStore.sortedByName" :key="teacher.id" class="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-1.5 text-xs dark:bg-ink-800">
                <input type="checkbox" class="h-4 w-4 rounded border-ink-300" :checked="plan.teacherIds.includes(teacher.id)" @change="toggleTeacher(teacher.id)" />
                <span class="text-ink-700 dark:text-ink-200">{{ formatTeacherName(teacher) }}</span>
                <span class="mr-auto text-10px" :class="usefulCourseCount(teacher) ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-400 dark:text-ink-500'">
                  {{ usefulCourseCount(teacher) }} درس مرتبط
                </span>
              </label>
            </div>
            <p v-else class="text-11px text-ink-400 dark:text-ink-500">
              معلمی ثبت نشده است. از «محدودیت‌های معلمان» معلم اضافه کن و درس‌هایش را مشخص کن.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canGenerate" @click="generate">
              {{ hasSlots ? 'ساخت دوباره‌ی برنامه' : 'ساخت برنامه' }}
            </button>
            <p v-if="!canGenerate" class="text-11px text-ink-400 dark:text-ink-500">حداقل یک پایه و یک معلم لازم است.</p>
          </div>

          <div v-if="plannerWarnings.length" class="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-11px text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
            <p class="mb-1 font-semibold">هشدارهای ساخت برنامه</p>
            <p v-for="(warning, index) in plannerWarnings" :key="index">{{ warning }}</p>
          </div>
        </div>

        <!-- ===================== برنامه‌ی کلاس‌ها ===================== -->
        <div v-else-if="tab === 'class'" class="space-y-3">
          <p v-if="!hasSlots" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400">
            هنوز برنامه‌ای ساخته نشده. از «تنظیمات و سرفصل» روی «ساخت برنامه» بزن.
          </p>
          <template v-else>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cls in plan.classes"
                :key="cls.id"
                type="button"
                class="relative rounded-lg px-3 py-1.5 text-xs font-medium transition"
                :class="activeClassId === cls.id ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
                @click="activeClassId = cls.id"
              >
                {{ cls.label }}
                <span v-if="classHasIssue(cls.id)" class="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              </button>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
              <TeachingGrid
                :periods="lessonPeriods"
                :items-at="classItemsAt"
                editable
                allow-empty-click
                @item-click="(item, d, p) => openModal(item.classId, d, p)"
                @empty-click="(d, p) => openModal(activeClassId, d, p)"
                @move="onMove"
              />
            </div>
            <p class="text-10px text-ink-400 dark:text-ink-500">درس را بکش و روی خانه‌ی دیگر رها کن (اگر پر باشد جابه‌جا می‌شوند). روی هر درس کلیک کن تا درس/معلم را عوض کنی یا قفلش کنی. 🔒 = قفل‌شده؛ کادر قرمز = خطا؛ کادر زرد = هشدار.</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('class')">PDF همین کلاس</button>
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('all-classes')">PDF همه‌ی کلاس‌ها</button>
            </div>
          </template>
        </div>

        <!-- ===================== برنامه‌ی معلمان ===================== -->
        <div v-else-if="tab === 'teacher'" class="space-y-3">
          <p v-if="!hasSlots" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400">
            هنوز برنامه‌ای ساخته نشده.
          </p>
          <template v-else>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="teacher in planTeachers"
                :key="teacher.id"
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                :class="activeTeacherId === teacher.id ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
                @click="activeTeacherId = teacher.id"
              >
                {{ formatTeacherName(teacher) }}
              </button>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
              <TeachingGrid
                :periods="lessonPeriods"
                :items-at="teacherItemsAt"
                editable
                @item-click="(item, d, p) => openModal(item.classId, d, p)"
                @move="onMove"
              />
            </div>
            <p class="text-10px text-ink-400 dark:text-ink-500">در این نما، درسِ هر کلاس را می‌کشی و به ساعت دیگری می‌بری. خانه‌های هم‌زمانِ یک معلم با کادر قرمز مشخص می‌شوند.</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('teacher')">PDF همین معلم</button>
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('all-teachers')">PDF همه‌ی معلمان</button>
            </div>
          </template>
        </div>

        <!-- ===================== گزارش ===================== -->
        <div v-else class="space-y-4">
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">خطاها و هشدارها</p>
              <div class="flex gap-1.5 text-11px">
                <button type="button" class="rounded-lg px-2.5 py-1" :class="issueFilter === 'all' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="issueFilter = 'all'">همه ({{ analysis.issues.length }})</button>
                <button type="button" class="rounded-lg px-2.5 py-1" :class="issueFilter === 'error' ? 'bg-red-600 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="issueFilter = 'error'">خطا ({{ errorCount }})</button>
                <button type="button" class="rounded-lg px-2.5 py-1" :class="issueFilter === 'warning' ? 'bg-amber-500 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="issueFilter = 'warning'">هشدار ({{ warningCount }})</button>
              </div>
            </div>
            <div v-if="visibleIssues.length" class="max-h-80 space-y-1.5 overflow-y-auto">
              <p v-for="issue in visibleIssues" :key="issue.id" class="rounded-lg border px-3 py-2 text-11px" :class="ISSUE_SEVERITY_CLASSES[issue.severity]">{{ issue.message }}</p>
            </div>
            <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-11px text-emerald-600 dark:border-ink-700 dark:text-emerald-400">
              {{ hasSlots ? 'مشکلی پیدا نشد.' : 'هنوز برنامه‌ای ساخته نشده.' }}
            </p>
          </div>

          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">کسری/اضافه‌ی ساعت نسبت به سرفصل</p>
              <label class="flex items-center gap-1.5 text-11px text-ink-500 dark:text-ink-400">
                <input v-model="showAllDiffs" type="checkbox" class="h-3.5 w-3.5 rounded border-ink-300" /> نمایش همه
              </label>
            </div>
            <div class="max-h-80 overflow-y-auto rounded-xl border border-ink-100 dark:border-ink-800">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-ink-50 text-right text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                    <th class="p-2">کلاس</th><th class="p-2">درس</th><th class="p-2">الزام</th><th class="p-2">چیده‌شده</th><th class="p-2">اختلاف</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in visibleDiffs" :key="row.classId + row.courseId" class="border-t border-ink-50 dark:border-ink-800">
                    <td class="p-2 text-ink-700 dark:text-ink-200">{{ classLabel(row.classId) }}</td>
                    <td class="p-2 text-ink-700 dark:text-ink-200">{{ courseName(row.courseId) }}</td>
                    <td class="p-2 text-ink-500 dark:text-ink-400">{{ row.required }}</td>
                    <td class="p-2 text-ink-500 dark:text-ink-400">{{ row.placed }}</td>
                    <td class="p-2 font-medium" :class="row.diff < 0 ? 'text-red-600 dark:text-red-400' : row.diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                      {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
                    </td>
                  </tr>
                  <tr v-if="!visibleDiffs.length">
                    <td colspan="5" class="p-4 text-center text-emerald-600 dark:text-emerald-400">همه‌ی دروس مطابق سرفصل چیده شده‌اند.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" :disabled="!hasSlots" @click="handlePrint('workload')">PDF ساعت تدریس معلمان</button>
            <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" :disabled="!hasSlots" @click="handlePrint('diffs')">PDF کسری/اضافه‌ی ساعت</button>
          </div>
        </div>

        <div class="mb-8 mt-6 flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">ذخیره برنامه</button>
          <button v-if="props.id" type="button" class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete">حذف برنامه</button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <TeacherWorkloadPanel v-if="hasSlots" :workloads="analysis.workloads" :teachers="teachersStore.items" :active-teacher-id="activeTeacherId" @select="(id) => { activeTeacherId = id; tab = 'teacher' }" />

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableTeachingPlan
          :plan="plan"
          :teachers="teachersStore.items"
          :periods="lessonPeriods"
          :analysis="analysis"
          :mode="printMode"
          :class-id="activeClassId"
          :teacher-id="activeTeacherId"
        />
      </div>
    </template>

    <LessonEditModal
      v-if="plan"
      v-model="modalOpen"
      :cls="modalClass"
      :day-index="modalDay"
      :period-index="modalPeriod"
      :lesson="modalSlot"
      :all-slots="plan.slots"
      :teachers="planTeachers"
      :level-id="plan.levelId"
      :period="periodTimes[modalPeriod] ?? null"
      :range="range"
      :curriculum-course-ids="modalCurriculumCourseIds"
      @save="onSaveLesson"
      @delete="onDeleteLesson"
    />
  </div>
</template>
