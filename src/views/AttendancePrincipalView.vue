<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, onBeforeRouteLeave } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import AbsentToggleRow from '@/components/attendance/AbsentToggleRow.vue'
import { DEFAULT_PRINCIPAL_LABEL, PRINCIPAL_LABEL_STORAGE_KEY } from '@/config/attendance.config'
import { gradeLabel } from '@/config/levels.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { useAttendancePrincipalStore } from '@/stores/attendance-principal'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import type { Classroom, Student } from '@/types'
import { jalaliLabelWithWeekday, todayIso } from '@/utils/attendance-date'
import { AttendanceDomainError, recordKey } from '@/utils/attendance-domain'
import { sortByName, studentFullName } from '@/utils/attendance-format'

interface SearchHit {
  classroom: Classroom
  student: Student
}

const SEARCH_LIMIT = 60

const principal = useAttendancePrincipalStore()
const classroomsStore = useClassroomsStore()
const studentsStore = useStudentsStore()
const { message, isError, show } = useFlashMessage()

const date = ref(todayIso())
const searchText = ref('')
const gradeFilter = ref(0)
const classFilter = ref('')
const openClassIds = ref<string[]>([])
const isLoading = ref(true)
const actorLabel = ref(localStorage.getItem(PRINCIPAL_LABEL_STORAGE_KEY) ?? DEFAULT_PRINCIPAL_LABEL)

watch(actorLabel, (value) => localStorage.setItem(PRINCIPAL_LABEL_STORAGE_KEY, value))

const allClassrooms = computed(() => classroomsStore.items)
const grades = computed(() => Array.from(new Set(allClassrooms.value.map((item) => item.grade))).sort((a, b) => a - b))
const classOptions = computed(() => allClassrooms.value.filter((item) => !gradeFilter.value || item.grade === gradeFilter.value))
const dirtySet = computed(() => new Set(principal.dirtyKeys))
const query = computed(() => searchText.value.trim())

const visibleClassrooms = computed(() =>
  allClassrooms.value
    .filter((item) => (gradeFilter.value ? item.grade === gradeFilter.value : true))
    .filter((item) => (classFilter.value ? item.id === classFilter.value : true)),
)

const classesByGrade = computed(() =>
  grades.value
    .map((grade) => ({
      grade,
      classes: sortByName(
        visibleClassrooms.value.filter((item) => item.grade === grade),
        (item) => item.name,
      ),
    }))
    .filter((group) => group.classes.length > 0),
)

const assignedIds = computed(() => new Set(Object.values(principal.membersByClass).flat()))
const unassignedCount = computed(() => studentsStore.items.filter((student) => !assignedIds.value.has(student.id)).length)

const hits = computed<SearchHit[]>(() => {
  if (!query.value) return []
  const result: SearchHit[] = []
  for (const classroom of visibleClassrooms.value) {
    for (const studentId of principal.membersByClass[classroom.id] ?? []) {
      const student = studentsStore.byId(studentId)
      if (student && studentFullName(student).includes(query.value)) result.push({ classroom, student })
      if (result.length >= SEARCH_LIMIT) return result
    }
  }
  return result
})

function membersOf(classroom: Classroom): Student[] {
  return sortByName(
    (principal.membersByClass[classroom.id] ?? [])
      .map((id) => studentsStore.byId(id))
      .filter((student): student is Student => !!student),
    studentFullName,
  )
}

function absentCountOf(classroom: Classroom): number {
  return (principal.membersByClass[classroom.id] ?? []).filter(
    (id) => principal.statusOf(classroom.id, id) === 'absent',
  ).length
}

function absentCountOfGrade(classes: Classroom[]): number {
  return classes.reduce((sum, item) => sum + absentCountOf(item), 0)
}

function studentCountOfGrade(classes: Classroom[]): number {
  return classes.reduce((sum, item) => sum + (principal.membersByClass[item.id]?.length ?? 0), 0)
}

function isDirtyRow(classroomId: string, studentId: string): boolean {
  return dirtySet.value.has(recordKey(classroomId, studentId, principal.date))
}

function toggleClass(classroomId: string): void {
  openClassIds.value = openClassIds.value.includes(classroomId)
    ? openClassIds.value.filter((id) => id !== classroomId)
    : [...openClassIds.value, classroomId]
}

async function load(nextDate: string): Promise<void> {
  isLoading.value = true
  await principal.open(nextDate, allClassrooms.value)
  isLoading.value = false
}

async function changeDate(nextDate: string): Promise<void> {
  if (!nextDate || nextDate === principal.date) return
  if (principal.isDirty && !confirm('تغییرات ذخیره‌نشده از بین می‌رود. ادامه می‌دهید؟')) return
  date.value = nextDate
  await load(nextDate)
}

async function save(): Promise<void> {
  try {
    const count = await principal.save(actorLabel.value.trim() || DEFAULT_PRINCIPAL_LABEL)
    show(count ? `${count.toLocaleString('fa-IR')} مورد ذخیره شد.` : 'تغییری برای ذخیره نبود.')
  } catch (error) {
    show(error instanceof AttendanceDomainError ? error.message : 'ذخیره انجام نشد.', true)
  }
}

const beforeUnload = (event: BeforeUnloadEvent): void => {
  if (!principal.isDirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  await Promise.all([classroomsStore.loadFromDb(), studentsStore.loadFromDb()])
  await load(date.value)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

onBeforeRouteLeave(() => {
  if (!principal.isDirty) return true
  return confirm('تغییرات ذخیره‌نشده از بین می‌رود. خارج می‌شوید؟')
})
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">پنل مدیر مدرسه</h1>
          <p class="text-xs text-ink-500 dark:text-ink-400">غایبین روز را برای همه‌ی پایه‌ها و کلاس‌ها تعیین کنید.</p>
        </div>
        <RouterLink to="/attendance" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">کلاس‌ها</RouterLink>
      </div>

      <div class="mb-3 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 dark:border-ink-800 dark:bg-ink-900">
        <div>
          <p class="mb-1 text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ</p>
          <JalaliDatePicker :model-value="date" @update:model-value="changeDate" />
          <p class="mt-1 text-11px text-ink-400">{{ jalaliLabelWithWeekday(date) }}</p>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="principal-label">ثبت‌کننده (در تاریخچه ذخیره می‌شود)</label>
          <input id="principal-label" v-model="actorLabel" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="principal-search">جستجوی دانش‌آموز</label>
          <input id="principal-search" v-model="searchText" type="search" placeholder="نام یا نام خانوادگی..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="principal-grade">پایه</label>
          <select id="principal-grade" v-model.number="gradeFilter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="classFilter = ''">
            <option :value="0">همه‌ی پایه‌ها</option>
            <option v-for="grade in grades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="principal-class">کلاس</label>
          <select id="principal-class" v-model="classFilter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
            <option value="">همه‌ی کلاس‌ها</option>
            <option v-for="item in classOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
      </div>

      <p v-if="isLoading" class="p-8 text-center text-ink-400">در حال بارگذاری...</p>
      <p v-else-if="!allClassrooms.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">
        ابتدا از صفحه‌ی «کلاس‌ها» کلاس تعریف کنید و دانش‌آموزان را به آن‌ها اضافه کنید.
      </p>

      <template v-else-if="query">
        <p class="mb-2 text-xs text-ink-500 dark:text-ink-400">
          {{ hits.length.toLocaleString('fa-IR') }} نتیجه
          <template v-if="hits.length >= SEARCH_LIMIT"> (فقط اولین {{ SEARCH_LIMIT.toLocaleString('fa-IR') }} مورد؛ جستجو را دقیق‌تر کنید)</template>
        </p>
        <ul class="space-y-2">
          <AbsentToggleRow
            v-for="(hit, index) in hits"
            :key="hit.classroom.id + hit.student.id"
            :name="`${studentFullName(hit.student)} - ${hit.classroom.name}`"
            :index="index"
            :status="principal.statusOf(hit.classroom.id, hit.student.id)"
            :is-dirty="isDirtyRow(hit.classroom.id, hit.student.id)"
            :show-details="false"
            @toggle="principal.toggleAbsent(hit.classroom.id, hit.student.id)"
          />
        </ul>
      </template>

      <template v-else>
        <section v-for="group in classesByGrade" :key="group.grade" class="mb-5">
          <h2 class="mb-2 flex items-center justify-between text-sm font-bold text-ink-800 dark:text-ink-200">
            <span>پایه‌ی {{ gradeLabel(group.grade) }}</span>
            <span class="text-11px font-medium text-ink-500 dark:text-ink-400">
              {{ studentCountOfGrade(group.classes).toLocaleString('fa-IR') }} دانش‌آموز —
              <span class="text-red-600 dark:text-red-400">✕ {{ absentCountOfGrade(group.classes).toLocaleString('fa-IR') }} غایب</span>
            </span>
          </h2>

          <div v-for="classroom in group.classes" :key="classroom.id" class="mb-2 overflow-hidden rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
            <div class="flex items-center justify-between gap-2 p-2 ps-4">
              <button type="button" class="flex min-h-11 flex-1 items-center justify-between gap-2 text-right" :aria-expanded="openClassIds.includes(classroom.id)" @click="toggleClass(classroom.id)">
                <span class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ classroom.name }}</span>
                <span class="text-11px text-ink-500 dark:text-ink-400">
                  {{ (principal.membersByClass[classroom.id]?.length ?? 0).toLocaleString('fa-IR') }} نفر - ✕ {{ absentCountOf(classroom).toLocaleString('fa-IR') }}
                  <span aria-hidden="true">{{ openClassIds.includes(classroom.id) ? '▴' : '▾' }}</span>
                </span>
              </button>
              <button type="button" class="min-h-11 shrink-0 rounded-lg border border-emerald-300 px-3 text-11px font-medium text-emerald-800 dark:border-emerald-700 dark:text-emerald-300" @click="principal.markRestPresent(classroom.id)">
                ✓ بقیه حاضر
              </button>
            </div>
            <ul v-if="openClassIds.includes(classroom.id)" class="space-y-2 border-t border-ink-50 p-2 dark:border-ink-800">
              <AbsentToggleRow
                v-for="(student, index) in membersOf(classroom)"
                :key="student.id"
                :name="studentFullName(student)"
                :index="index"
                :status="principal.statusOf(classroom.id, student.id)"
                :is-dirty="isDirtyRow(classroom.id, student.id)"
                :show-details="false"
                @toggle="principal.toggleAbsent(classroom.id, student.id)"
              />
              <li v-if="!membersOf(classroom).length" class="p-3 text-center text-xs text-ink-400">این کلاس دانش‌آموزی ندارد.</li>
            </ul>
          </div>
        </section>

        <p v-if="unassignedCount" class="rounded-xl border border-dashed border-amber-300 p-3 text-xs leading-6 text-amber-800 dark:border-amber-500/40 dark:text-amber-300">
          ⚠ {{ unassignedCount.toLocaleString('fa-IR') }} دانش‌آموز هنوز به هیچ کلاسی اضافه نشده‌اند و در این فهرست دیده نمی‌شوند. حضور و غیاب به کلاس وابسته است؛ از صفحه‌ی هر کلاس، تب «دانش‌آموزان کلاس»، آن‌ها را اضافه کنید.
        </p>
      </template>
    </div>

    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 px-4 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
      <div class="mx-auto flex max-w-3xl items-center gap-3">
        <button type="button" class="min-h-11 flex-1 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:flex-none" :disabled="principal.isSaving || !principal.isDirty" @click="save">
          {{ principal.isSaving ? 'در حال ذخیره...' : 'ذخیره' }}
        </button>
        <button type="button" class="min-h-11 rounded-xl border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" :disabled="!principal.isDirty" @click="principal.discardChanges()">لغو</button>
        <span v-if="principal.isDirty" class="text-xs text-brand-600 dark:text-brand-400">{{ principal.dirtyKeys.length.toLocaleString('fa-IR') }} تغییر ذخیره‌نشده</span>
        <span v-if="message" role="status" class="text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</span>
      </div>
    </div>
  </div>
</template>
