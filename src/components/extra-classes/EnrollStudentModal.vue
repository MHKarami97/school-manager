<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExtraClass, Gender } from '../../types'
import { LEVELS, gradeLabel } from '../../config/levels.config'
import { useStudentsStore } from '../../stores/students'
import { useExtraClassesStore } from '../../stores/extra-classes'
import { useEnrollmentsStore } from '../../stores/enrollments'
import { findStudentTimeConflict, isClassFull } from '../../utils/extra-class-helpers'

const props = defineProps<{
  modelValue: boolean
  extraClass: ExtraClass | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'enrolled'): void
}>()

const studentsStore = useStudentsStore()
const extraClassesStore = useExtraClassesStore()
const enrollmentsStore = useEnrollmentsStore()

const searchText = ref('')
const selectedStudentId = ref<string | null>(null)
const isAddingStudent = ref(false)
const newFirstName = ref('')
const newLastName = ref('')
const newGender = ref<Gender>('male')
const newGrade = ref<number | null>(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      searchText.value = ''
      selectedStudentId.value = null
      isAddingStudent.value = false
      newFirstName.value = ''
      newLastName.value = ''
      newGrade.value = props.extraClass?.allowedGrades.length === 1 ? props.extraClass.allowedGrades[0] : null
    }
  },
)

/** پایه‌هایی که می‌توان برای دانش‌آموز تازه انتخاب کرد: فقط پایه‌های مجاز کلاس، یا همه‌ی پایه‌ها اگر محدودیتی نبود. */
const gradeOptions = computed(() => {
  if (props.extraClass?.allowedGrades.length) return props.extraClass.allowedGrades
  return LEVELS.flatMap((level) => level.grades)
})

function levelIdOfGrade(grade: number): (typeof LEVELS)[number]['id'] {
  return LEVELS.find((level) => level.grades.includes(grade))?.id ?? LEVELS[0].id
}

const candidateStudents = computed(() => {
  if (!props.extraClass) return []
  const query = searchText.value.trim()
  return studentsStore.items
    .filter((s) => !props.extraClass!.allowedGrades.length || props.extraClass!.allowedGrades.includes(s.grade))
    .filter((s) => !query || `${s.firstName} ${s.lastName}`.includes(query))
    .slice(0, 8)
})

function selectStudent(id: string): void {
  selectedStudentId.value = id
  isAddingStudent.value = false
}

async function addNewStudent(): Promise<void> {
  if (!newFirstName.value.trim() || !newLastName.value.trim() || newGrade.value === null) return
  const student = await studentsStore.addStudent({
    firstName: newFirstName.value,
    lastName: newLastName.value,
    gender: newGender.value,
    grade: newGrade.value,
    levelId: levelIdOfGrade(newGrade.value),
  })
  selectedStudentId.value = student.id
  isAddingStudent.value = false
  searchText.value = `${student.firstName} ${student.lastName}`
}

const conflict = computed(() => {
  if (!props.extraClass || !selectedStudentId.value) return null
  return findStudentTimeConflict(
    selectedStudentId.value,
    props.extraClass,
    extraClassesStore.items,
    enrollmentsStore.items,
  )
})

const alreadyEnrolled = computed(() => {
  if (!props.extraClass || !selectedStudentId.value) return false
  return enrollmentsStore.items.some(
    (e) => e.extraClassId === props.extraClass!.id && e.studentId === selectedStudentId.value && e.status === 'active',
  )
})

const classIsFull = computed(() => (props.extraClass ? isClassFull(props.extraClass, enrollmentsStore.items) : false))

function close(): void {
  emit('update:modelValue', false)
}

async function confirmEnroll(): Promise<void> {
  if (!props.extraClass || !selectedStudentId.value || conflict.value || alreadyEnrolled.value) return
  await enrollmentsStore.enrollStudent(props.extraClass.id, selectedStudentId.value, classIsFull.value)
  emit('enrolled')
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && extraClass"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="close"
    >
      <div class="max-h-90vh w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ثبت‌نام سریع در «{{ extraClass.title }}»</p>
        <p v-if="extraClass.allowedGrades.length" class="mb-3 text-sm text-ink-400 dark:text-ink-500">
          فقط پایه‌های {{ extraClass.allowedGrades.map((g) => gradeLabel(g)).join('، ') }}
        </p>

        <input
          v-model="searchText"
          type="text"
          placeholder="نام دانش‌آموز را تایپ کن"
          class="mb-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          @input="isAddingStudent = false"
        />

        <ul v-if="searchText.trim() && !isAddingStudent" class="mb-3 max-h-40 space-y-1 overflow-y-auto">
          <li
            v-for="student in candidateStudents"
            :key="student.id"
            class="cursor-pointer rounded-lg px-3 py-2 text-sm"
            :class="
              selectedStudentId === student.id
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300'
                : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800'
            "
            @click="selectStudent(student.id)"
          >
            {{ student.firstName }} {{ student.lastName }} - {{ gradeLabel(student.grade) }}
          </li>
          <li v-if="!candidateStudents.length" class="px-3 py-2 text-xs text-ink-400 dark:text-ink-500">
            دانش‌آموزی پیدا نشد.
          </li>
        </ul>

        <!-- دانش‌آموز در لیست نبود -> افزودن سریع -->
        <button
          v-if="!isAddingStudent"
          type="button"
          class="mb-3 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          @click="isAddingStudent = true; selectedStudentId = null"
        >
          دانش‌آموز پیدا نشد؟ اضافه کن
        </button>

        <div v-if="isAddingStudent" class="mb-3 space-y-2 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
          <div class="flex gap-2">
            <input
              v-model="newFirstName"
              type="text"
              placeholder="نام"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            />
            <input
              v-model="newLastName"
              type="text"
              placeholder="نام‌خانوادگی"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            />
          </div>
          <div class="flex gap-2">
            <select
              v-model="newGender"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              <option value="male">پسر</option>
              <option value="female">دختر</option>
            </select>
            <select
              v-model.number="newGrade"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              <option :value="null" disabled>پایه</option>
              <option v-for="grade in gradeOptions" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
            </select>
          </div>
          <button
            type="button"
            class="w-full rounded-lg bg-ink-800 px-3 py-2 text-xs font-medium text-white dark:bg-ink-700"
            @click="addNewStudent"
          >
            ثبت دانش‌آموز و انتخاب
          </button>
        </div>

        <div v-if="selectedStudentId" class="mb-3 space-y-2">
          <p v-if="alreadyEnrolled" class="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
            این دانش‌آموز از قبل در این کلاس ثبت‌نام دارد.
          </p>
          <p v-else-if="conflict" class="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
            این دانش‌آموز در کلاس «{{ conflict.title }}» با تداخل زمانی ثبت‌نام فعال دارد.
          </p>
          <p v-else-if="classIsFull" class="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
            ظرفیت این کلاس پر است؛ این دانش‌آموز در لیست انتظار ثبت می‌شود.
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">
            انصراف
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!selectedStudentId || !!conflict || alreadyEnrolled"
            @click="confirmEnroll"
          >
            {{ classIsFull ? 'افزودن به لیست انتظار' : 'ثبت‌نام' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
