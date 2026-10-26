<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import { FOLLOW_UP_LABELS, FOLLOW_UP_STATUSES } from '@/config/attendance.config'
import { useActiveTeacher } from '@/composables/use-active-teacher'
import { useAttendancePrint } from '@/composables/use-attendance-print'
import { useFlashMessage } from '@/composables/use-flash-message'
import { attendanceReportService, type AbsenteeRow } from '@/services/attendance-reports'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import { useTeachersStore } from '@/stores/teachers'
import type { FollowUpStatus } from '@/types'
import { jalaliLabelWithWeekday, todayIso } from '@/utils/attendance-date'
import { labelledPhonesOf, toTelHref } from '@/utils/attendance-domain'
import { sortByName, studentFullName } from '@/utils/attendance-format'
import { buildAbsenteesPayload } from '@/utils/attendance-print'

const classroomsStore = useClassroomsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const { activeTeacherId, activeTeacherName } = useActiveTeacher()
const { message, isError, show } = useFlashMessage()
const printer = useAttendancePrint()

const date = ref(todayIso())
const scopeId = ref('')
const rows = ref<AbsenteeRow[]>([])
const notes = ref<Record<string, string>>({})
const isLoading = ref(true)
let loadToken = 0

const classrooms = computed(() => classroomsStore.visibleFor(activeTeacherId.value))
const scopedIds = computed(() => (scopeId.value ? [scopeId.value] : classrooms.value.map((classroom) => classroom.id)))

function nameOf(studentId: string): string {
  return studentFullName(studentsStore.byId(studentId))
}

function classNameOf(classroomId: string): string {
  return classroomsStore.byId(classroomId)?.name ?? ''
}

const sortedRows = computed(() =>
  sortByName(rows.value, (row) => `${classNameOf(row.record.classroomId)} ${nameOf(row.record.studentId)}`),
)

async function load(): Promise<void> {
  const token = ++loadToken
  isLoading.value = true
  const result = await attendanceReportService.absenteesForDay(scopedIds.value, date.value)
  await classroomsStore.loadProfiles(result.map((row) => row.record.studentId))
  if (token !== loadToken) return
  rows.value = result
  notes.value = Object.fromEntries(result.map((row) => [row.record.id, row.followUp?.note ?? '']))
  isLoading.value = false
}

onMounted(async () => {
  await Promise.all([classroomsStore.loadFromDb(), studentsStore.loadFromDb(), teachersStore.loadFromDb()])
  await load()
})

watch([date, scopeId, activeTeacherId], load)

function statusOf(row: AbsenteeRow): FollowUpStatus {
  return row.followUp?.status ?? 'none'
}

async function setFollowUp(row: AbsenteeRow, status: FollowUpStatus): Promise<void> {
  row.followUp = await attendanceReportService.saveFollowUp(row.record, status, notes.value[row.record.id] ?? '')
  show('وضعیت پیگیری ذخیره شد.')
}

async function saveNote(row: AbsenteeRow): Promise<void> {
  row.followUp = await attendanceReportService.saveFollowUp(row.record, statusOf(row), notes.value[row.record.id] ?? '')
  show('یادداشت ذخیره شد.')
}

async function printList(): Promise<void> {
  await printer.print(
    buildAbsenteesPayload(
      'لیست غایبین',
      { from: date.value, to: date.value },
      activeTeacherName.value,
      sortedRows.value,
      classNameOf,
      nameOf,
      (studentId) => classroomsStore.profiles[studentId],
    ),
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
      <div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">لیست غایبین و تماس با اولیا</h1>
          <RouterLink to="/attendance" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">کلاس‌ها</RouterLink>
        </div>

        <div class="mb-4 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 dark:border-ink-800 dark:bg-ink-900">
          <div>
            <p class="mb-1 text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ</p>
            <JalaliDatePicker v-model="date" />
            <p class="mt-1 text-11px text-ink-400">{{ jalaliLabelWithWeekday(date) }}</p>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="scope">کلاس</label>
            <select id="scope" v-model="scopeId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option value="">همه‌ی کلاس‌ها ({{ classrooms.length.toLocaleString('fa-IR') }})</option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">{{ classroom.name }}</option>
            </select>
          </div>
        </div>

        <div class="mb-3 flex items-center gap-3">
          <button type="button" class="min-h-11 rounded-xl border border-ink-200 px-4 text-xs font-medium disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" :disabled="!rows.length" @click="printList">PDF لیست غایبین</button>
          <span v-if="message" role="status" class="text-xs" :class="isError ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</span>
        </div>

        <p v-if="isLoading" class="p-8 text-center text-ink-400">در حال بارگذاری...</p>
        <p v-else-if="!sortedRows.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">در این تاریخ غایبی ثبت نشده است.</p>
        <ul v-else class="space-y-3">
          <li v-for="row in sortedRows" :key="row.record.id" class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ nameOf(row.record.studentId) }}</p>
              <span class="text-11px text-ink-400">{{ classNameOf(row.record.classroomId) }}</span>
            </div>

            <div class="mb-3 flex flex-wrap gap-2">
              <a
                v-for="contact in labelledPhonesOf(classroomsStore.profiles[row.record.studentId])"
                :key="contact.phone"
                :href="toTelHref(contact.phone)"
                class="flex min-h-11 items-center gap-2 rounded-lg bg-brand-50 px-4 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              >
                <span aria-hidden="true">☎</span>
                <span dir="ltr">{{ contact.phone }}</span>
                <span class="text-11px">({{ contact.relation }})</span>
              </a>
              <span v-if="!labelledPhonesOf(classroomsStore.profiles[row.record.studentId]).length" class="text-xs text-amber-600 dark:text-amber-400">⚠ شماره‌ی والدین ثبت نشده است.</span>
            </div>

            <div class="mb-2 grid grid-cols-3 gap-1.5" role="group" :aria-label="`وضعیت پیگیری ${nameOf(row.record.studentId)}`">
              <button
                v-for="status in FOLLOW_UP_STATUSES"
                :key="status"
                type="button"
                class="min-h-11 rounded-lg border px-1 text-11px font-medium"
                :class="statusOf(row) === status ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-ink-200 text-ink-500 dark:border-ink-700 dark:text-ink-400'"
                :aria-pressed="statusOf(row) === status"
                @click="setFollowUp(row, status)"
              >
                {{ FOLLOW_UP_LABELS[status] }}
              </button>
            </div>

            <div class="flex gap-2">
              <label class="sr-only" :for="`note-${row.record.id}`">یادداشت</label>
              <input :id="`note-${row.record.id}`" v-model="notes[row.record.id]" type="text" placeholder="یادداشت..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 flex-1" @keyup.enter="saveNote(row)" />
              <button type="button" class="min-h-11 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="saveNote(row)">ذخیره</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="printer.isPrinting.value && printer.payload.value && printer.component.value" id="print-root" class="hidden print:block">
      <component :is="printer.component.value" :payload="printer.payload.value" />
    </div>
  </div>
</template>
