<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Teacher, TeacherAvailabilitySlot, TeacherBlockedSlot } from '../../types'
import { WEEK_DAYS } from '../../types'
import { BASE_COURSES } from '../../config/courses.config'
import { LEVELS, gradeLabel } from '../../config/levels.config'
import { createEmptyBlockedSlot } from '../../config/teaching-plan.config'
import { cloneDefaultShiftConfigs } from '../../config/schedule-defaults.config'
import JalaliDatePicker from '../lessonPlan/JalaliDatePicker.vue'

const props = defineProps<{
  teacher: Teacher
}>()

const emit = defineEmits<{
  (e: 'save', teacher: Teacher): void
}>()

const draft = ref<Teacher>(JSON.parse(JSON.stringify(props.teacher)) as Teacher)
const courseSearch = ref('')
const newBlocked = ref<TeacherBlockedSlot>(createEmptyBlockedSlot())
const savedMessage = ref('')

const defaultShift = cloneDefaultShiftConfigs().morning

watch(
  () => props.teacher,
  (value) => {
    draft.value = JSON.parse(JSON.stringify(value)) as Teacher
  },
)

const visibleCourses = computed(() => {
  const query = courseSearch.value.trim()
  return BASE_COURSES.filter((course) => !query || course.name.includes(query) || draft.value.courseIds.includes(course.id))
})

function toggleCourse(courseId: string): void {
  const set = new Set(draft.value.courseIds)
  if (set.has(courseId)) set.delete(courseId)
  else set.add(courseId)
  draft.value.courseIds = Array.from(set)
}

function toggleGrade(grade: number): void {
  const set = new Set(draft.value.allowedGrades ?? [])
  if (set.has(grade)) set.delete(grade)
  else set.add(grade)
  draft.value.allowedGrades = Array.from(set).sort((a, b) => a - b)
}

// --- روزهای حضور (availability موجود پروژه؛ خالی = همه‌ی روزها) --------------------
function slotOf(dayIndex: number): TeacherAvailabilitySlot | undefined {
  return draft.value.availability?.find((a) => a.dayIndex === dayIndex)
}

function toggleDay(dayIndex: number): void {
  const current = draft.value.availability ?? []
  draft.value.availability = slotOf(dayIndex)
    ? current.filter((a) => a.dayIndex !== dayIndex)
    : [...current, { dayIndex, startTime: defaultShift.startTime, endTime: defaultShift.endTime }]
}

function updateDayTime(dayIndex: number, patch: Partial<TeacherAvailabilitySlot>): void {
  draft.value.availability = (draft.value.availability ?? []).map((a) => (a.dayIndex === dayIndex ? { ...a, ...patch } : a))
}

// --- ساعت‌های غیرقابل‌تدریس --------------------------------------------------
function addBlocked(): void {
  if (!newBlocked.value.startTime || !newBlocked.value.endTime) return
  draft.value.blockedSlots = [...(draft.value.blockedSlots ?? []), { ...newBlocked.value }]
  newBlocked.value = createEmptyBlockedSlot()
}

function removeBlocked(id: string): void {
  draft.value.blockedSlots = (draft.value.blockedSlots ?? []).filter((b) => b.id !== id)
}

function positiveOrUndefined(value: unknown): number | undefined {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : undefined
}

function save(): void {
  const result: Teacher = { ...draft.value }
  result.maxDailyHours = positiveOrUndefined(draft.value.maxDailyHours)
  result.maxWeeklyHours = positiveOrUndefined(draft.value.maxWeeklyHours)
  if (!result.allowedGrades?.length) result.allowedGrades = undefined
  emit('save', result)
  savedMessage.value = 'ذخیره شد.'
  window.setTimeout(() => { savedMessage.value = '' }, 2000)
}
</script>

<template>
  <div class="space-y-5 border-t border-ink-100 pt-4 dark:border-ink-800">
    <div>
      <p class="mb-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200">دروسی که تدریس می‌کند</p>
      <input v-model="courseSearch" type="text" placeholder="جست‌وجوی درس..." class="mb-2 w-full max-w-xs rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
      <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        <button
          v-for="course in visibleCourses"
          :key="course.id"
          type="button"
          class="rounded-lg border px-2.5 py-1 text-11px font-medium transition"
          :class="draft.courseIds.includes(course.id) ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
          @click="toggleCourse(course.id)"
        >
          {{ course.name }}
        </button>
      </div>
    </div>

    <div>
      <p class="mb-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200">پایه‌های مجاز <span class="font-normal text-ink-400">(هیچ‌کدام = همه‌ی پایه‌ها)</span></p>
      <div v-for="level in LEVELS" :key="level.id" class="mb-2">
        <p class="mb-1 text-10px text-ink-400 dark:text-ink-500">{{ level.name }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="grade in level.grades"
            :key="grade"
            type="button"
            class="rounded-lg border px-2.5 py-1 text-11px font-medium transition"
            :class="(draft.allowedGrades ?? []).includes(grade) ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
            @click="toggleGrade(grade)"
          >
            {{ gradeLabel(grade) }}
          </button>
        </div>
      </div>
    </div>

    <div>
      <p class="mb-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200">روزهای حضور <span class="font-normal text-ink-400">(هیچ روزی = همه‌ی روزها)</span></p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(day, dayIndex) in WEEK_DAYS"
          :key="day"
          class="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
          :class="slotOf(dayIndex) ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/10' : 'border-ink-200 dark:border-ink-700'"
        >
          <button type="button" class="text-xs font-medium" :class="slotOf(dayIndex) ? 'text-brand-700 dark:text-brand-300' : 'text-ink-500 dark:text-ink-400'" @click="toggleDay(dayIndex)">{{ day }}</button>
          <template v-if="slotOf(dayIndex)">
            <input type="time" :value="slotOf(dayIndex)?.startTime" class="w-24 rounded border border-ink-200 bg-white px-1 text-11px dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @change="updateDayTime(dayIndex, { startTime: ($event.target as HTMLInputElement).value })" />
            <span class="text-ink-400">-</span>
            <input type="time" :value="slotOf(dayIndex)?.endTime" class="w-24 rounded border border-ink-200 bg-white px-1 text-11px dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @change="updateDayTime(dayIndex, { endTime: ($event.target as HTMLInputElement).value })" />
          </template>
        </div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">حداکثر ساعت تدریس روزانه</label>
        <input v-model.number="draft.maxDailyHours" type="number" min="1" max="12" placeholder="بدون سقف" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">حداکثر ساعت تدریس هفتگی</label>
        <input v-model.number="draft.maxWeeklyHours" type="number" min="1" max="60" placeholder="بدون سقف" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
      </div>
    </div>

    <div>
      <p class="mb-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200">ساعات غیرقابل‌تدریس <span class="font-normal text-ink-400">(مثلاً جلسه‌ی اداری)</span></p>
      <div v-if="draft.blockedSlots?.length" class="mb-2 space-y-1.5">
        <div v-for="blocked in draft.blockedSlots" :key="blocked.id" class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-1.5 text-xs dark:bg-ink-800">
          <span class="text-ink-700 dark:text-ink-200">
            {{ WEEK_DAYS[blocked.dayIndex] }} {{ blocked.startTime }} تا {{ blocked.endTime }}
            <template v-if="blocked.reason"> - {{ blocked.reason }}</template>
            <template v-if="blocked.fromDate || blocked.toDate"> (بازه‌ی تاریخی محدود)</template>
          </span>
          <button type="button" class="text-red-600 dark:text-red-400" @click="removeBlocked(blocked.id)">حذف</button>
        </div>
      </div>
      <div class="grid gap-2 rounded-xl border border-dashed border-ink-200 p-3 sm:grid-cols-3 dark:border-ink-700">
        <select v-model.number="newBlocked.dayIndex" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option v-for="(day, dayIndex) in WEEK_DAYS" :key="day" :value="dayIndex">{{ day }}</option>
        </select>
        <input v-model="newBlocked.startTime" type="time" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
        <input v-model="newBlocked.endTime" type="time" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
        <input v-model="newBlocked.reason" type="text" placeholder="علت (اختیاری)" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs sm:col-span-3 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
        <div>
          <p class="mb-1 text-10px text-ink-400 dark:text-ink-500">از تاریخ (اختیاری، شمسی)</p>
          <JalaliDatePicker v-model="newBlocked.fromDate" />
        </div>
        <div>
          <p class="mb-1 text-10px text-ink-400 dark:text-ink-500">تا تاریخ (اختیاری، شمسی)</p>
          <JalaliDatePicker v-model="newBlocked.toDate" />
        </div>
        <button type="button" class="self-end rounded-lg bg-ink-800 px-3 py-2 text-xs font-medium text-white dark:bg-ink-700" @click="addBlocked">افزودن</button>
      </div>
      <p class="mt-1 text-10px text-ink-400 dark:text-ink-500">اگر بازه‌ی تاریخی خالی باشد همیشه اعمال می‌شود؛ وگرنه فقط برای برنامه‌هایی که بازه‌ی اعتبارشان با آن هم‌پوشانی دارد.</p>
    </div>

    <div class="flex items-center gap-3">
      <button type="button" class="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700" @click="save">ذخیره محدودیت‌ها</button>
      <span v-if="savedMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ savedMessage }}</span>
    </div>
  </div>
</template>
