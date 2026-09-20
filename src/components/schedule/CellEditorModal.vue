<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CourseDefinition, Teacher } from '@/types'

const props = defineProps<{
  modelValue: boolean
  courseId: string | null
  teacherId: string | null
  courses: CourseDefinition[]
  teachers: Teacher[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', courseId: string | null, teacherId: string | null): void
}>()

const selectedCourseId = ref<string | null>(props.courseId)
const selectedTeacherId = ref<string | null>(props.teacherId)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedCourseId.value = props.courseId
      selectedTeacherId.value = props.teacherId
    }
  },
)

const availableTeachers = computed(() =>
  selectedCourseId.value ? props.teachers.filter((t) => t.courseIds.includes(selectedCourseId.value as string)) : props.teachers,
)

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  emit('apply', selectedCourseId.value, selectedTeacherId.value)
  close()
}

function clear(): void {
  emit('apply', null, null)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="close">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p class="mb-4 text-sm font-semibold text-ink-800">ویرایش این زنگ</p>

        <label class="mb-1 block text-xs font-medium text-ink-600">درس</label>
        <select v-model="selectedCourseId" class="mb-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
          <option :value="null">— خالی —</option>
          <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600">معلم</label>
        <select v-model="selectedTeacherId" class="mb-5 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
          <option :value="null">— بدون معلم —</option>
          <option v-for="t in availableTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>

        <div class="flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline" @click="clear">پاک کردن زنگ</button>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs" @click="close">انصراف</button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="save">ذخیره</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
