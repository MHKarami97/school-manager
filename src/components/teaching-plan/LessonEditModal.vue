<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LevelId, Teacher, TeachingClass, TeachingSlot } from '../../types'
import { WEEK_DAYS } from '../../types'
import { BASE_COURSES } from '../../config/courses.config'
import { isQualified, isTeacherBlocked, isTeacherPresent } from '../../utils/teaching-rules'
import type { DateRange, PeriodTime } from '../../utils/teaching-rules'
import { formatTeacherName } from '../../utils/teacher-format'

const props = defineProps<{
  modelValue: boolean
  cls: TeachingClass | null
  dayIndex: number
  periodIndex: number
  lesson: TeachingSlot | null
  allSlots: TeachingSlot[]
  teachers: Teacher[]
  levelId: LevelId
  period: PeriodTime | null
  range: DateRange
  curriculumCourseIds: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', slot: TeachingSlot): void
  (e: 'delete'): void
}>()

const courseId = ref('')
const teacherId = ref<string | null>(null)
const isLocked = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    courseId.value = props.lesson?.courseId ?? props.curriculumCourseIds[0] ?? ''
    teacherId.value = props.lesson?.teacherId ?? null
    isLocked.value = props.lesson?.isLocked ?? false
  },
)

const courseOptions = computed(() => {
  const inCurriculum = BASE_COURSES.filter((c) => props.curriculumCourseIds.includes(c.id))
  const others = BASE_COURSES.filter((c) => !props.curriculumCourseIds.includes(c.id))
  return { inCurriculum, others }
})

type TeacherStatus = 'ok' | 'unqualified' | 'busy' | 'unavailable'

function statusOf(teacher: Teacher): TeacherStatus {
  if (!props.cls) return 'ok'
  const busy = props.allSlots.some(
    (s) =>
      s.teacherId === teacher.id &&
      s.dayIndex === props.dayIndex &&
      s.periodIndex === props.periodIndex &&
      s.classId !== props.cls!.id,
  )
  if (busy) return 'busy'
  if (props.period) {
    const absent = !isTeacherPresent(teacher, props.dayIndex, props.period)
    if (absent || isTeacherBlocked(teacher, props.dayIndex, props.period, props.range)) return 'unavailable'
  }
  if (!isQualified(teacher, courseId.value, props.cls.grade, props.levelId)) return 'unqualified'
  return 'ok'
}

const STATUS_LABELS: Record<TeacherStatus, string> = {
  ok: '✓',
  unqualified: '(غیرمجاز برای این درس/پایه)',
  busy: '(هم‌زمان در کلاس دیگر)',
  unavailable: '(حضور ندارد/ساعت غیرقابل‌تدریس)',
}

const teacherOptions = computed(() =>
  props.teachers
    .map((teacher) => ({ teacher, status: statusOf(teacher) }))
    .sort((a, b) => Number(b.status === 'ok') - Number(a.status === 'ok') || a.teacher.name.localeCompare(b.teacher.name, 'fa')),
)

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  if (!props.cls || !courseId.value) return
  emit('save', {
    classId: props.cls.id,
    dayIndex: props.dayIndex,
    periodIndex: props.periodIndex,
    courseId: courseId.value,
    teacherId: teacherId.value,
    isLocked: isLocked.value,
  })
  close()
}

function removeLesson(): void {
  emit('delete')
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && cls" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" @click.self="close">
      <div class="max-h-90vh w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ cls.label }}</p>
        <p class="mb-4 text-11px text-ink-400 dark:text-ink-500">{{ WEEK_DAYS[dayIndex] }} - زنگ {{ periodIndex + 1 }}</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس</label>
        <select v-model="courseId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="" disabled>یک درس را انتخاب کن</option>
          <optgroup label="دروس سرفصل این پایه">
            <option v-for="course in courseOptions.inCurriculum" :key="course.id" :value="course.id">{{ course.name }}</option>
          </optgroup>
          <optgroup label="سایر دروس">
            <option v-for="course in courseOptions.others" :key="course.id" :value="course.id">{{ course.name }}</option>
          </optgroup>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">معلم</label>
        <select v-model="teacherId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option :value="null">— بدون معلم —</option>
          <option v-for="option in teacherOptions" :key="option.teacher.id" :value="option.teacher.id">
            {{ formatTeacherName(option.teacher) }} {{ STATUS_LABELS[option.status] }}
          </option>
        </select>

        <label class="mb-4 flex items-start gap-2 text-xs text-ink-700 dark:text-ink-200">
          <input v-model="isLocked" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-ink-300" />
          <span>قفل کن (در «ساخت دوباره‌ی برنامه» جابه‌جا نمی‌شود)</span>
        </label>

        <div class="flex items-center justify-between gap-2">
          <button v-if="lesson" type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="removeLesson">حذف این ساعت</button>
          <span v-else></span>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40" :disabled="!courseId" @click="save">ذخیره</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
