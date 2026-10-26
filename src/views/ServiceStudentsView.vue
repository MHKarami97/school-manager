<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import ServiceStudentFormModal from '@/components/service/ServiceStudentFormModal.vue'
import ServiceStudentQuickAdd from '@/components/service/ServiceStudentQuickAdd.vue'
import { LEVELS, gradeLabel } from '@/config/levels.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { useClassroomsStore } from '@/stores/classrooms'
import { useServicePlansStore } from '@/stores/service-plans'
import { useServiceStudentsStore } from '@/stores/service-students'
import { useStudentsStore } from '@/stores/students'
import type { Student } from '@/types'
import { studentFullName, sortByName } from '@/utils/attendance-format'
import { formatAddress, normalizeRegion } from '@/utils/service-domain'

const studentsStore = useStudentsStore()
const classroomsStore = useClassroomsStore()
const serviceStudents = useServiceStudentsStore()
const plansStore = useServicePlansStore()
const { message, isError, show } = useFlashMessage(4000)

const allGrades = LEVELS.flatMap((level) => level.grades)
const isLoading = ref(true)
const gradeFilter = ref(0)
const listSearch = ref('')
const pickSearch = ref('')
const pickGrade = ref(allGrades[0])
const selectedIds = ref<string[]>([])
const editingId = ref('')
const isEditOpen = ref(false)

const enrolledSet = computed(() => new Set(serviceStudents.enrolledIds))

const regionSuggestions = computed(() => {
  const seen = new Map<string, string>()
  for (const profile of Object.values(serviceStudents.profiles)) {
    const region = profile.address.region.trim()
    if (region && !seen.has(normalizeRegion(region))) seen.set(normalizeRegion(region), region)
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'fa'))
})

const enrolledStudents = computed(() =>
  sortByName(
    serviceStudents.enrolledIds
      .map((id) => studentsStore.byId(id))
      .filter((student): student is Student => !!student)
      .filter((student) => (gradeFilter.value ? student.grade === gradeFilter.value : true))
      .filter((student) => (listSearch.value.trim() ? studentFullName(student).includes(listSearch.value.trim()) : true)),
    (student) => `${String(student.grade).padStart(2, '0')} ${studentFullName(student)}`,
  ),
)

const pickMatches = computed(() => {
  const query = pickSearch.value.trim()
  if (!query) return []
  return studentsStore.items.filter((student) => !enrolledSet.value.has(student.id) && studentFullName(student).includes(query)).slice(0, 12)
})

const gradeCandidates = computed(() => studentsStore.items.filter((student) => student.grade === pickGrade.value && !enrolledSet.value.has(student.id)))

watch(
  () => serviceStudents.enrolledIds.length,
  () => classroomsStore.loadProfiles(serviceStudents.enrolledIds),
)

onMounted(async () => {
  await Promise.all([studentsStore.loadFromDb(), serviceStudents.loadFromDb(), plansStore.loadPlans()])
  await classroomsStore.loadProfiles(serviceStudents.enrolledIds)
  isLoading.value = false
})

function toggleSelected(id: string): void {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id]
}

async function enroll(ids: string[]): Promise<void> {
  if (!ids.length) return
  for (const id of ids) await serviceStudents.setEnrolled(id, true)
  selectedIds.value = []
  pickSearch.value = ''
  show(`${ids.length.toLocaleString('fa-IR')} دانش‌آموز وارد سرویس شد.`)
}

async function unenroll(student: Student): Promise<void> {
  if (plansStore.assignments[student.id]) {
    show('این دانش‌آموز در طرح فعال به راننده تخصیص داده شده است؛ ابتدا از صفحه‌ی تخصیص خارج کنید.', true)
    return
  }
  if (!confirm(`«${studentFullName(student)}» از سرویس خارج شود؟ آدرس او نگه داشته می‌شود.`)) return
  await serviceStudents.setEnrolled(student.id, false)
}

function openEdit(id: string): void {
  editingId.value = id
  isEditOpen.value = true
}

function phoneOf(id: string): string {
  return classroomsStore.profiles[id]?.primaryParent.phone ?? ''
}

function addressText(id: string): string {
  const profile = serviceStudents.profiles[id]
  return profile ? formatAddress(profile.address) : ''
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">دانش‌آموزان سرویس</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ serviceStudents.enrolledIds.length.toLocaleString('fa-IR') }} دانش‌آموز دارای سرویس</p>
        </div>
        <RouterLink to="/service/drivers" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">رانندگان</RouterLink>
      </div>

      <p v-if="message" role="status" class="mb-3 text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>

      <div class="space-y-4">
        <ServiceStudentQuickAdd :region-suggestions="regionSuggestions" @created="show('دانش‌آموزان وارد سرویس شدند.')" />

        <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">افزودن از دانش‌آموزان موجود</p>
          <label class="sr-only" for="pick-search">جستجوی دانش‌آموز</label>
          <input id="pick-search" v-model="pickSearch" type="search" placeholder="نام یا نام خانوادگی..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          <ul v-if="pickMatches.length" class="mt-2 max-h-64 space-y-1 overflow-y-auto">
            <li v-for="student in pickMatches" :key="student.id">
              <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800">
                <input type="checkbox" class="h-5 w-5" :checked="selectedIds.includes(student.id)" @change="toggleSelected(student.id)" />
                {{ studentFullName(student) }}
                <span class="text-11px text-ink-400">{{ gradeLabel(student.grade) }}</span>
              </label>
            </li>
          </ul>
          <p v-else-if="pickSearch.trim()" class="mt-2 text-xs text-ink-400">دانش‌آموزی پیدا نشد؛ از بخش «ساخت دانش‌آموز جدید» استفاده کنید.</p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" :disabled="!selectedIds.length" class="min-h-11 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white disabled:opacity-40 dark:bg-ink-700" @click="enroll(selectedIds)">افزودن انتخاب‌شده‌ها ({{ selectedIds.length.toLocaleString('fa-IR') }})</button>
            <select v-model.number="pickGrade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-32" aria-label="پایه">
              <option v-for="grade in allGrades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option>
            </select>
            <button type="button" :disabled="!gradeCandidates.length" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" @click="enroll(gradeCandidates.map((student) => student.id))">افزودن همه‌ی این پایه ({{ gradeCandidates.length.toLocaleString('fa-IR') }})</button>
          </div>
        </div>

        <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 grid gap-2 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="list-grade">پایه</label>
              <select id="list-grade" v-model.number="gradeFilter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option :value="0">همه‌ی پایه‌ها</option><option v-for="grade in allGrades" :key="grade" :value="grade">{{ gradeLabel(grade) }}</option></select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="list-search">جستجو</label>
              <input id="list-search" v-model="listSearch" type="search" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
            </div>
          </div>

          <p v-if="isLoading" class="p-6 text-center text-ink-400">در حال بارگذاری...</p>
          <p v-else-if="!enrolledStudents.length" class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400 dark:border-ink-700">هنوز دانش‌آموزی در سرویس نیست.</p>
          <ul v-else class="space-y-2">
            <li v-for="student in enrolledStudents" :key="student.id" class="rounded-xl bg-ink-50 p-3 dark:bg-ink-800">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-ink-800 dark:text-ink-200">{{ studentFullName(student) }} <span class="text-11px font-normal text-ink-400">{{ gradeLabel(student.grade) }}</span></p>
                  <p class="mt-1 flex flex-wrap gap-x-3 text-11px text-ink-500 dark:text-ink-400">
                    <span :class="phoneOf(student.id) ? '' : 'text-amber-600 dark:text-amber-400'" dir="ltr">☎ {{ phoneOf(student.id) || 'بدون شماره' }}</span>
                    <span v-if="serviceStudents.profiles[student.id]?.location">📍 دارای موقعیت</span>
                    <span v-if="serviceStudents.profiles[student.id]?.address.region">منطقه {{ serviceStudents.profiles[student.id]?.address.region }}</span>
                  </p>
                  <p v-if="addressText(student.id)" class="mt-1 text-11px text-ink-500 dark:text-ink-400">{{ addressText(student.id) }}</p>
                </div>
                <div class="flex shrink-0 gap-1">
                  <button type="button" class="min-h-11 px-2 text-xs text-brand-600 dark:text-brand-400" @click="openEdit(student.id)">ویرایش</button>
                  <button type="button" class="min-h-11 px-2 text-xs text-red-600 dark:text-red-400" @click="unenroll(student)">حذف</button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <ServiceStudentFormModal v-model="isEditOpen" :student-id="editingId" :student-name="studentFullName(studentsStore.byId(editingId))" :region-suggestions="regionSuggestions" @saved="show('ذخیره شد.')" />
  </div>
</template>
