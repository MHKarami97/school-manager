<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Student, StudentGroup } from '../../types'
import { gradeLabel } from '../../config/levels.config'
import { useStudentsStore } from '../../stores/students'
import { useStudentGroupsStore } from '../../stores/student-groups'

const participantIds = defineModel<string[]>({ required: true })

const studentsStore = useStudentsStore()
const groupsStore = useStudentGroupsStore()

onMounted(async () => {
  await Promise.all([studentsStore.loadFromDb(), groupsStore.loadFromDb()])
})

const searchText = ref('')
const showList = ref(false)

const grades = computed(() =>
  Array.from(new Set(studentsStore.items.map((s) => s.grade))).sort((a, b) => a - b),
)

const groups = computed(() =>
  [...groupsStore.items].sort((a, b) => a.grade - b.grade || a.title.localeCompare(b.title, 'fa')),
)

const matches = computed(() => {
  const query = searchText.value.trim()
  if (!query) return []
  const selected = new Set(participantIds.value)
  return studentsStore.items
    .filter((s) => !selected.has(s.id) && `${s.firstName} ${s.lastName}`.includes(query))
    .slice(0, 8)
})

const selectedStudents = computed(() =>
  participantIds.value.map((id) => studentsStore.byId(id)).filter((s): s is Student => !!s),
)

function addIds(ids: string[]): void {
  participantIds.value = Array.from(new Set([...participantIds.value, ...ids]))
}

function addGrade(grade: number): void {
  addIds(studentsStore.items.filter((s) => s.grade === grade).map((s) => s.id))
}

function addGroup(group: StudentGroup): void {
  addIds(group.studentIds)
}

function addStudent(id: string): void {
  addIds([id])
  searchText.value = ''
}

function removeStudent(id: string): void {
  participantIds.value = participantIds.value.filter((value) => value !== id)
}

function clearAll(): void {
  if (!confirm('کل فهرست شرکت‌کنندگان پاک شود؟')) return
  participantIds.value = []
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">شرکت‌کنندگان آزمون</p>
      <span class="rounded-lg bg-ink-50 px-2 py-1 text-11px text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        {{ selectedStudents.length }} نفر
      </span>
    </div>

    <p v-if="!studentsStore.items.length" class="mb-3 rounded-xl border border-dashed border-ink-200 p-3 text-11px text-ink-400 dark:border-ink-700 dark:text-ink-500">
      هنوز دانش‌آموزی ثبت نشده است. از بخش «دانش‌آموزان» اضافه کن.
    </p>

    <div v-if="grades.length" class="mb-3">
      <p class="mb-1.5 text-11px font-medium text-ink-500 dark:text-ink-400">افزودن همه‌ی دانش‌آموزان یک پایه</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="grade in grades"
          :key="grade"
          type="button"
          class="rounded-lg border border-ink-200 px-2.5 py-1 text-11px font-medium text-ink-700 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-200"
          @click="addGrade(grade)"
        >
          + {{ gradeLabel(grade) }}
        </button>
      </div>
    </div>

    <div v-if="groups.length" class="mb-3">
      <p class="mb-1.5 text-11px font-medium text-ink-500 dark:text-ink-400">افزودن یک کلاس (گروه‌بندی ذخیره‌شده)</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="group in groups"
          :key="group.id"
          type="button"
          class="rounded-lg border border-ink-200 px-2.5 py-1 text-11px font-medium text-ink-700 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-200"
          @click="addGroup(group)"
        >
          + {{ group.title }} ({{ group.studentIds.length }})
        </button>
      </div>
    </div>

    <div class="relative mb-3">
      <input
        v-model="searchText"
        type="text"
        placeholder="افزودن یک دانش‌آموز با جست‌وجوی نام..."
        class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
      />
      <ul v-if="matches.length" class="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg dark:border-ink-700 dark:bg-ink-800">
        <li
          v-for="student in matches"
          :key="student.id"
          class="cursor-pointer px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 dark:text-ink-200 dark:hover:bg-ink-700"
          @mousedown.prevent="addStudent(student.id)"
        >
          {{ student.firstName }} {{ student.lastName }} — {{ gradeLabel(student.grade) }}
        </li>
      </ul>
    </div>

    <div v-if="selectedStudents.length" class="flex items-center gap-3">
      <button type="button" class="text-11px font-medium text-brand-600 dark:text-brand-400" @click="showList = !showList">
        {{ showList ? 'پنهان‌کردن فهرست' : 'نمایش فهرست شرکت‌کنندگان' }}
      </button>
      <button type="button" class="mr-auto text-11px text-red-600 dark:text-red-400" @click="clearAll">پاک‌کردن همه</button>
    </div>

    <div v-if="showList" class="mt-2 grid max-h-64 gap-1.5 overflow-y-auto sm:grid-cols-2">
      <div
        v-for="student in selectedStudents"
        :key="student.id"
        class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-xs dark:bg-ink-800"
      >
        <span class="text-ink-700 dark:text-ink-200">{{ student.firstName }} {{ student.lastName }}</span>
        <button type="button" class="text-red-600 dark:text-red-400" @click="removeStudent(student.id)">حذف</button>
      </div>
    </div>
  </div>
</template>
