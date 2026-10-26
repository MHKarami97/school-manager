<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Student } from '@/types'
import { gradeLabel } from '@/config/levels.config'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import { studentFullName, sortByName } from '@/utils/attendance-format'
import StudentProfileModal from './StudentProfileModal.vue'
import StudentQuickAdd from './StudentQuickAdd.vue'

const props = defineProps<{ classroomId: string; grade: number }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const classroomsStore = useClassroomsStore()
const studentsStore = useStudentsStore()

const searchText = ref('')
const selectedIds = ref<string[]>([])
const profileStudentId = ref('')
const isProfileOpen = ref(false)
const message = ref('')

const memberIds = computed(() => classroomsStore.memberIds[props.classroomId] ?? [])
const memberSet = computed(() => new Set(memberIds.value))

const members = computed(() =>
  sortByName(
    memberIds.value.map((id) => studentsStore.byId(id)).filter((student): student is Student => !!student),
    studentFullName,
  ),
)

const matches = computed(() => {
  const query = searchText.value.trim()
  if (!query) return []
  return studentsStore.items
    .filter((student) => !memberSet.value.has(student.id) && studentFullName(student).includes(query))
    .slice(0, 12)
})

const gradeCandidates = computed(() =>
  studentsStore.items.filter((student) => student.grade === props.grade && !memberSet.value.has(student.id)),
)

function toggleSelected(id: string): void {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

async function addIds(ids: string[]): Promise<void> {
  if (!ids.length) return
  const added = await classroomsStore.addStudents(props.classroomId, ids)
  message.value = added ? `${added.toLocaleString('fa-IR')} دانش‌آموز اضافه شد.` : 'همه‌ی این دانش‌آموزان قبلاً در کلاس بودند.'
  selectedIds.value = []
  searchText.value = ''
  emit('changed')
}

async function onCreated(ids: string[]): Promise<void> {
  await classroomsStore.addStudents(props.classroomId, ids)
  emit('changed')
}

async function removeStudent(id: string): Promise<void> {
  if (!confirm('این دانش‌آموز از کلاس حذف شود؟ سوابق حضور و غیاب قبلی او باقی می‌ماند.')) return
  await classroomsStore.removeStudent(props.classroomId, id)
  emit('changed')
}

function openProfile(id: string): void {
  profileStudentId.value = id
  isProfileOpen.value = true
}

function hasPhone(id: string): boolean {
  return !!classroomsStore.profiles[id]?.primaryParent.phone
}
</script>

<template>
  <section class="space-y-4">
    <StudentQuickAdd :grade="grade" @created="onCreated" />

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">افزودن از دانش‌آموزان موجود</p>
      <label class="sr-only" for="student-search">جستجوی دانش‌آموز</label>
      <input id="student-search" v-model="searchText" type="search" placeholder="نام یا نام خانوادگی..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />

      <ul v-if="matches.length" class="mt-2 max-h-64 space-y-1 overflow-y-auto">
        <li v-for="student in matches" :key="student.id">
          <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800">
            <input type="checkbox" class="h-5 w-5" :checked="selectedIds.includes(student.id)" @change="toggleSelected(student.id)" />
            {{ studentFullName(student) }}
            <span class="text-11px text-ink-400">{{ gradeLabel(student.grade) }}</span>
          </label>
        </li>
      </ul>
      <p v-else-if="searchText.trim()" class="mt-2 text-xs text-ink-400">دانش‌آموزی پیدا نشد؛ از بخش «ساخت دانش‌آموز جدید» بالا استفاده کنید.</p>

      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" :disabled="!selectedIds.length" class="min-h-11 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white disabled:opacity-40 dark:bg-ink-700" @click="addIds(selectedIds)">
          افزودن انتخاب‌شده‌ها ({{ selectedIds.length.toLocaleString('fa-IR') }})
        </button>
        <button type="button" :disabled="!gradeCandidates.length" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" @click="addIds(gradeCandidates.map((student) => student.id))">
          افزودن همه‌ی پایه‌ی {{ gradeLabel(grade) }} ({{ gradeCandidates.length.toLocaleString('fa-IR') }})
        </button>
      </div>
      <p v-if="message" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400" role="status">{{ message }}</p>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">دانش‌آموزان کلاس ({{ members.length.toLocaleString('fa-IR') }})</p>
      <ul v-if="members.length" class="space-y-1.5">
        <li v-for="student in members" :key="student.id" class="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-1.5 text-sm dark:bg-ink-800">
          <span class="min-w-0 truncate text-ink-800 dark:text-ink-200">
            {{ studentFullName(student) }}
            <span v-if="!hasPhone(student.id)" class="mr-1 text-11px text-amber-600 dark:text-amber-400">⚠ بدون شماره‌ی والدین</span>
          </span>
          <span class="flex shrink-0 gap-1">
            <button type="button" class="min-h-11 px-2 text-xs text-brand-600 dark:text-brand-400" @click="openProfile(student.id)">اطلاعات تماس</button>
            <button type="button" class="min-h-11 px-2 text-xs text-red-600 dark:text-red-400" @click="removeStudent(student.id)">حذف</button>
          </span>
        </li>
      </ul>
      <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400 dark:border-ink-700">هنوز دانش‌آموزی به این کلاس اضافه نشده است.</p>
    </div>

    <StudentProfileModal v-model="isProfileOpen" :student-id="profileStudentId" :student-name="studentFullName(studentsStore.byId(profileStudentId))" @saved="emit('changed')" />
  </section>
</template>
