<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, onBeforeRouteLeave } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import AbsentToggleRow from '@/components/attendance/AbsentToggleRow.vue'
import AttendanceRow from '@/components/attendance/AttendanceRow.vue'
import AttendanceSummaryBar from '@/components/attendance/AttendanceSummaryBar.vue'
import AuditPanel from '@/components/attendance/AuditPanel.vue'
import ClassroomStudentsPanel from '@/components/attendance/ClassroomStudentsPanel.vue'
import ExitModal from '@/components/attendance/ExitModal.vue'
import { gradeLabel } from '@/config/levels.config'
import { useActiveTeacher } from '@/composables/use-active-teacher'
import { useAttendancePrint } from '@/composables/use-attendance-print'
import { useFlashMessage } from '@/composables/use-flash-message'
import { attendanceReportService } from '@/services/attendance-reports'
import { ManualInputStrategy } from '@/services/attendance-input'
import { useAttendanceSheetStore } from '@/stores/attendance-sheet'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import { useTeachersStore } from '@/stores/teachers'
import type { AttendanceStatus, ExitInfo } from '@/types'
import { addDays, jalaliLabelWithWeekday, todayIso } from '@/utils/attendance-date'
import {
  AttendanceDomainError,
  emptyDraft,
  isDraftChanged,
  tallyAll,
  tallyByStudent,
} from '@/utils/attendance-domain'
import { sortByName, studentFullName } from '@/utils/attendance-format'
import { buildAbsenteesPayload, buildSummaryPayload } from '@/utils/attendance-print'

const props = defineProps<{ id: string }>()

const classroomsStore = useClassroomsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const sheet = useAttendanceSheetStore()
const { teacherNameOf } = useActiveTeacher()
const { message, isError, show } = useFlashMessage()
const printer = useAttendancePrint()

const manualInput = new ManualInputStrategy()
const isLoading = ref(true)
const tab = ref<'sheet' | 'students'>('sheet')
const absentOnly = ref(false)
const expandedIds = ref<string[]>([])
const exitStudentId = ref('')
const isExitOpen = ref(false)
const exitError = ref('')

const classroom = computed(() => classroomsStore.byId(props.id))
const actor = computed(() => teacherNameOf(classroom.value?.teacherId ?? null) || 'این دستگاه')
const canSave = computed(() => sheet.isDirty || (absentOnly.value && sheet.summary.unrecorded > 0))

const rows = computed(() =>
  sortByName(
    sheet.memberIds.map((id) => ({ id, name: studentFullName(studentsStore.byId(id)) })),
    (row) => row.name,
  ),
)

function nameOf(studentId: string): string {
  return studentFullName(studentsStore.byId(studentId))
}

function draftOf(studentId: string) {
  return sheet.drafts[studentId] ?? emptyDraft()
}

function rowDirty(studentId: string): boolean {
  return isDraftChanged(draftOf(studentId), sheet.records[studentId])
}

function canExit(studentId: string): boolean {
  const record = sheet.records[studentId]
  if (!record || (record.status !== 'present' && record.status !== 'late')) return false
  return !rowDirty(studentId)
}

function showToggleRow(studentId: string): boolean {
  return absentOnly.value && !expandedIds.value.includes(studentId)
}

function expand(studentId: string): void {
  expandedIds.value = [...expandedIds.value, studentId]
}

const beforeUnload = (event: BeforeUnloadEvent): void => {
  if (!sheet.isDirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  await Promise.all([classroomsStore.loadFromDb(), studentsStore.loadFromDb(), teachersStore.loadFromDb()])
  if (classroom.value) {
    await classroomsStore.loadMembers(props.id)
    await sheet.open(props.id, todayIso())
    await manualInput.start(sheet.asSink())
  }
  isLoading.value = false
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  manualInput.stop()
})

onBeforeRouteLeave(() => {
  if (!sheet.isDirty) return true
  return confirm('تغییرات ذخیره‌نشده از بین می‌رود. خارج می‌شوید؟')
})

function confirmDiscard(): boolean {
  return !sheet.isDirty || confirm('تغییرات ذخیره‌نشده از بین می‌رود. ادامه می‌دهید؟')
}

async function changeDate(date: string): Promise<void> {
  if (!date || date === sheet.date || !confirmDiscard()) return
  expandedIds.value = []
  await sheet.open(props.id, date)
}

async function shiftDay(delta: number): Promise<void> {
  await changeDate(addDays(sheet.date, delta))
}

function switchTab(next: 'sheet' | 'students'): void {
  tab.value = next
  if (next === 'sheet') sheet.syncMembers(classroomsStore.memberIds[props.id] ?? [])
}

function onStatus(studentId: string, status: AttendanceStatus): void {
  if (status === 'present') void manualInput.select(studentId)
  else sheet.setStatus(studentId, status)
}

async function save(): Promise<void> {
  const fill = absentOnly.value
  if (fill && sheet.summary.unrecorded > 0) {
    const count = sheet.summary.unrecorded.toLocaleString('fa-IR')
    if (!confirm(`${count} نفر که وضعیتی ندارند به‌عنوان «حاضر» ثبت می‌شوند. ادامه می‌دهید؟`)) return
  }
  try {
    const count = await sheet.save(actor.value, fill)
    show(count ? `${count.toLocaleString('fa-IR')} مورد ذخیره شد.` : 'تغییری برای ذخیره نبود.')
  } catch (error) {
    show(error instanceof AttendanceDomainError ? error.message : 'ذخیره انجام نشد.', true)
  }
}

function openExit(studentId: string): void {
  exitStudentId.value = studentId
  exitError.value = ''
  isExitOpen.value = true
}

async function saveExit(exit: ExitInfo): Promise<void> {
  try {
    await sheet.setExit(exitStudentId.value, exit, actor.value)
    isExitOpen.value = false
    show('خروج ثبت شد.')
  } catch (error) {
    exitError.value = error instanceof AttendanceDomainError ? error.message : 'ثبت خروج انجام نشد.'
  }
}

async function removeExit(): Promise<void> {
  await sheet.removeExit(exitStudentId.value, actor.value)
  isExitOpen.value = false
  show('خروج حذف شد.')
}

async function printSummary(): Promise<void> {
  if (!classroom.value) return
  if (sheet.isDirty && !confirm('فقط داده‌های ذخیره‌شده چاپ می‌شود. ادامه می‌دهید؟')) return
  const range = { from: sheet.date, to: sheet.date }
  const records = await attendanceReportService.classRecords(props.id, range)
  await printer.print(
    buildSummaryPayload(
      classroom.value,
      teacherNameOf(classroom.value.teacherId),
      range,
      tallyByStudent(records),
      tallyAll(records),
      nameOf,
      sheet.memberIds,
    ),
  )
}

async function printAbsentees(): Promise<void> {
  if (!classroom.value) return
  if (sheet.isDirty && !confirm('فقط داده‌های ذخیره‌شده چاپ می‌شود. ادامه می‌دهید؟')) return
  const range = { from: sheet.date, to: sheet.date }
  const absentees = await attendanceReportService.absenteesForDay([props.id], sheet.date)
  await classroomsStore.loadProfiles(absentees.map((row) => row.record.studentId))
  await printer.print(
    buildAbsenteesPayload(
      `لیست غایبین کلاس ${classroom.value.name}`,
      range,
      teacherNameOf(classroom.value.teacherId),
      absentees,
      () => classroom.value?.name ?? '',
      nameOf,
      (studentId) => classroomsStore.profiles[studentId],
    ),
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
      <div v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</div>
      <div v-else-if="!classroom" class="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <p class="text-ink-600 dark:text-ink-300">کلاس پیدا نشد.</p>
        <RouterLink to="/attendance" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به کلاس‌ها</RouterLink>
      </div>

      <div v-else class="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ classroom.name }}</h1>
            <p class="text-xs text-ink-500 dark:text-ink-400">{{ gradeLabel(classroom.grade) }}</p>
          </div>
          <RouterLink to="/attendance" class="flex min-h-11 items-center text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400">کلاس‌ها</RouterLink>
        </div>

        <div class="mb-4 flex gap-2" role="tablist">
          <button type="button" role="tab" :aria-selected="tab === 'sheet'" class="min-h-11 rounded-lg px-4 text-sm font-medium" :class="tab === 'sheet' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'" @click="switchTab('sheet')">حضور و غیاب</button>
          <button type="button" role="tab" :aria-selected="tab === 'students'" class="min-h-11 rounded-lg px-4 text-sm font-medium" :class="tab === 'students' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'" @click="switchTab('students')">دانش‌آموزان کلاس</button>
        </div>

        <template v-if="tab === 'sheet'">
          <div class="mb-3 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ jalaliLabelWithWeekday(sheet.date) }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="shiftDay(-1)">روز قبل</button>
              <div class="min-w-40 flex-1"><JalaliDatePicker :model-value="sheet.date" @update:model-value="changeDate" /></div>
              <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="shiftDay(1)">روز بعد</button>
              <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="changeDate(todayIso())">امروز</button>
            </div>
          </div>

          <label class="mb-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 text-sm font-medium text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200">
            <input v-model="absentOnly" type="checkbox" class="h-5 w-5" />
            حالت «فقط غایبین را مشخص می‌کنم»
          </label>
          <p v-if="absentOnly" class="mb-3 rounded-xl bg-brand-50 p-3 text-xs leading-6 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
            فقط روی «غایب» بزنید. هنگام ذخیره، بقیه‌ی دانش‌آموزانِ بدون وضعیت «حاضر» ثبت می‌شوند. برای تأخیر، موجه یا خروج، «تأخیر/موجه/خروج» را بزنید.
          </p>

          <AttendanceSummaryBar :summary="sheet.summary" class="mb-3" />

          <div class="mb-3 flex flex-wrap items-center gap-2">
            <button v-if="!absentOnly" type="button" class="min-h-11 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-xs font-medium text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" @click="sheet.markAllUnrecordedPresent()">✓ همه حاضر (ثبت‌نشده‌ها)</button>
            <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" :disabled="!sheet.isDirty" @click="sheet.discardChanges()">لغو تغییرات</button>
          </div>

          <p v-if="!rows.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">ابتدا از تب «دانش‌آموزان کلاس» دانش‌آموز اضافه کنید.</p>
          <ul v-else class="space-y-2">
            <template v-for="(row, index) in rows" :key="row.id">
              <AbsentToggleRow
                v-if="showToggleRow(row.id)"
                :name="row.name"
                :index="index"
                :status="draftOf(row.id).status"
                :is-dirty="rowDirty(row.id)"
                @toggle="sheet.toggleAbsent(row.id)"
                @details="expand(row.id)"
              />
              <AttendanceRow
                v-else
                :name="row.name"
                :index="index"
                :draft="draftOf(row.id)"
                :record="sheet.records[row.id]"
                :is-dirty="rowDirty(row.id)"
                :can-exit="canExit(row.id)"
                @status="onStatus(row.id, $event)"
                @arrival="sheet.draftOf(row.id).arrivalTime = $event"
                @reason="sheet.draftOf(row.id).excuseReason = $event"
                @exit="openExit(row.id)"
              />
            </template>
          </ul>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" class="min-h-11 rounded-xl border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="printSummary">PDF نتیجه‌ی کلاس</button>
            <button type="button" class="min-h-11 rounded-xl border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="printAbsentees">PDF لیست غایبین</button>
            <RouterLink to="/attendance/absentees" class="flex min-h-11 items-center text-xs text-brand-600 hover:underline dark:text-brand-400">تماس با اولیا</RouterLink>
          </div>

          <details class="mt-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <summary class="min-h-11 cursor-pointer text-sm font-semibold text-ink-800 dark:text-ink-200">تاریخچه‌ی تغییرات این روز</summary>
            <div class="mt-2"><AuditPanel :entries="sheet.audit" :name-of="nameOf" /></div>
          </details>

          <div class="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 px-4 py-2 backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0 dark:border-ink-800 dark:bg-ink-900/95">
            <div class="mx-auto flex max-w-3xl items-center gap-3">
              <button type="button" class="min-h-11 flex-1 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:flex-none" :disabled="sheet.isSaving || !canSave" @click="save">
                {{ sheet.isSaving ? 'در حال ذخیره...' : 'ذخیره' }}
              </button>
              <span v-if="sheet.isDirty" class="text-xs text-brand-600 dark:text-brand-400">تغییرات ذخیره‌نشده</span>
              <span v-if="message" role="status" class="text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</span>
            </div>
          </div>
        </template>

        <ClassroomStudentsPanel v-else :classroom-id="id" :grade="classroom.grade" />
      </div>
    </div>

    <ExitModal
      v-model="isExitOpen"
      :student-name="nameOf(exitStudentId)"
      :date="sheet.date"
      :arrival-time="sheet.records[exitStudentId]?.arrivalTime ?? ''"
      :initial="sheet.records[exitStudentId]?.exit ?? null"
      :error-message="exitError"
      @save="saveExit"
      @remove="removeExit"
    />

    <div v-if="printer.isPrinting.value && printer.payload.value && printer.component.value" id="print-root" class="hidden print:block">
      <component :is="printer.component.value" :payload="printer.payload.value" />
    </div>
  </div>
</template>
