<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Classroom, TeacherGender } from '@/types'
import { LEVELS, gradeLabel } from '@/config/levels.config'
import { useTeachersStore } from '@/stores/teachers'
import { formatTeacherName } from '@/utils/teacher-format'

const props = defineProps<{ modelValue: boolean; classroom: Classroom | null }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: Classroom): void
}>()

const teachersStore = useTeachersStore()

const form = ref<Classroom | null>(null)
const isAddingTeacher = ref(false)
const newTeacherName = ref('')
const newTeacherGender = ref<TeacherGender | ''>('')
const teacherError = ref('')

const grades = computed(() => LEVELS.flatMap((level) => level.grades))
const canSave = computed(() => !!form.value && form.value.name.trim().length > 0)
const hasTeachers = computed(() => teachersStore.items.length > 0)

onMounted(() => teachersStore.loadFromDb())

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.classroom) return
    form.value = { ...props.classroom }
    newTeacherName.value = ''
    newTeacherGender.value = ''
    teacherError.value = ''
    await teachersStore.loadFromDb()
    isAddingTeacher.value = !hasTeachers.value
  },
)

function close(): void {
  emit('update:modelValue', false)
}

async function addTeacherQuickly(): Promise<void> {
  const name = newTeacherName.value.trim()
  if (!name || !form.value) {
    teacherError.value = 'نام معلم را وارد کنید.'
    return
  }
  try {
    const teacher = await teachersStore.addTeacher(name, [], newTeacherGender.value || null)
    form.value.teacherId = teacher.id
    newTeacherName.value = ''
    newTeacherGender.value = ''
    teacherError.value = ''
    isAddingTeacher.value = false
  } catch {
    teacherError.value = 'افزودن معلم انجام نشد.'
  }
}

function submit(): void {
  if (!form.value || !canSave.value) return
  emit('save', {
    ...form.value,
    name: form.value.name.trim(),
    academicYear: form.value.academicYear.trim(),
    shift: form.value.shift.trim(),
    teacherId: form.value.teacherId || null,
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && form" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" @click.self="close">
      <form class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="classroom-modal-title" @submit.prevent="submit">
        <p id="classroom-modal-title" class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">مشخصات کلاس</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="cls-name">نام کلاس</label>
        <input id="cls-name" v-model="form.name" type="text" required class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="cls-grade">پایه</label>
        <select id="cls-grade" v-model.number="form.grade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11">
          <option v-for="grade in grades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="cls-year">سال تحصیلی</label>
        <input id="cls-year" v-model="form.academicYear" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="cls-shift">شیفت (اختیاری)</label>
        <input id="cls-shift" v-model="form.shift" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

        <div class="mb-4">
          <div class="mb-1 flex items-center justify-between">
            <label class="text-xs font-medium text-ink-600 dark:text-ink-300" for="cls-teacher">معلم</label>
            <button
              v-if="hasTeachers"
              type="button"
              class="min-h-11 px-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              @click="isAddingTeacher = !isAddingTeacher"
            >
              {{ isAddingTeacher ? 'انتخاب از فهرست' : '+ معلم جدید' }}
            </button>
          </div>

          <select v-if="!isAddingTeacher" id="cls-teacher" v-model="form.teacherId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
            <option :value="null">بدون معلم مشخص</option>
            <option v-for="teacher in teachersStore.sortedByName" :key="teacher.id" :value="teacher.id">{{ formatTeacherName(teacher) }}</option>
          </select>

          <div v-else class="space-y-2">
            <p v-if="!hasTeachers" class="text-xs text-ink-500 dark:text-ink-400">هنوز معلمی ثبت نشده است؛ نام معلم را وارد کنید.</p>
            <input
              id="cls-teacher"
              v-model="newTeacherName"
              type="text"
              placeholder="نام و نام خانوادگی معلم"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"
              @keydown.enter.prevent="addTeacherQuickly"
            />
            <div class="flex gap-2">
              <select v-model="newTeacherGender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" aria-label="جنسیت معلم">
                <option value="">جنسیت (اختیاری)</option>
                <option value="male">آقا</option>
                <option value="female">خانم</option>
              </select>
              <button type="button" class="min-h-11 shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addTeacherQuickly">
                افزودن
              </button>
            </div>
            <p v-if="teacherError" class="text-xs text-red-600 dark:text-red-400" role="alert">{{ teacherError }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="submit" :disabled="!canSave" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">ذخیره</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
