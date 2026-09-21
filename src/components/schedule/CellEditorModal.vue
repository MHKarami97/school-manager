<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CourseDefinition, Teacher } from '@/types'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{
  modelValue: boolean
  courseId: string | null
  teacherId: string | null
  secondaryCourseId?: string | null
  secondaryTeacherId?: string | null
  courses: CourseDefinition[]
  teachers: Teacher[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', courseId: string | null, teacherId: string | null, secondaryCourseId: string | null, secondaryTeacherId: string | null): void
}>()

const selectedCourseId = ref<string | null>(props.courseId)
const selectedTeacherId = ref<string | null>(props.teacherId)
const isCombo = ref(!!props.secondaryCourseId)
const selectedSecondaryCourseId = ref<string | null>(props.secondaryCourseId ?? null)
const selectedSecondaryTeacherId = ref<string | null>(props.secondaryTeacherId ?? null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedCourseId.value = props.courseId
      selectedTeacherId.value = props.teacherId
      isCombo.value = !!props.secondaryCourseId
      selectedSecondaryCourseId.value = props.secondaryCourseId ?? null
      selectedSecondaryTeacherId.value = props.secondaryTeacherId ?? null
    }
  },
)

const availableTeachers = computed(() =>
  selectedCourseId.value ? props.teachers.filter((t) => t.courseIds.includes(selectedCourseId.value as string)) : props.teachers,
)

const availableSecondaryTeachers = computed(() =>
  selectedSecondaryCourseId.value
    ? props.teachers.filter((t) => t.courseIds.includes(selectedSecondaryCourseId.value as string))
    : props.teachers,
)

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  emit(
    'apply',
    selectedCourseId.value,
    selectedTeacherId.value,
    isCombo.value ? selectedSecondaryCourseId.value : null,
    isCombo.value ? selectedSecondaryTeacherId.value : null,
  )
  close()
}

function clear(): void {
  emit('apply', null, null, null, null)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="close">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">ویرایش این زنگ</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس</label>
        <select v-model="selectedCourseId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option :value="null">- خالی -</option>
          <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">معلم</label>
        <select v-model="selectedTeacherId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option :value="null">- بدون معلم -</option>
          <option v-for="t in availableTeachers" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
        </select>

        <label class="mb-3 flex items-center gap-2 text-xs font-medium text-ink-600 dark:text-ink-300">
          <input v-model="isCombo" type="checkbox" class="h-4 w-4 rounded border-ink-300" />
          زنگ ترکیبی (تک‌زنگ) - دو درس مشترک در همین زنگ
        </label>

        <template v-if="isCombo">
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس دوم</label>
          <select v-model="selectedSecondaryCourseId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
            <option :value="null">- خالی -</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>

          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">معلم درس دوم</label>
          <select v-model="selectedSecondaryTeacherId" class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
            <option :value="null">- بدون معلم -</option>
            <option v-for="t in availableSecondaryTeachers" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
          </select>
        </template>

        <div class="mt-2 flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="clear">پاک کردن زنگ</button>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="save">ذخیره</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
