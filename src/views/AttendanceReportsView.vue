<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import BarList from '@/components/attendance/BarList.vue'
import StatusBadge from '@/components/attendance/StatusBadge.vue'
import { useActiveTeacher } from '@/composables/use-active-teacher'
import { useAttendancePrint } from '@/composables/use-attendance-print'
import {
  attendanceReportService,
  type ClassReport,
  type OverviewRow,
  type StudentReport,
} from '@/services/attendance-reports'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import { useTeachersStore } from '@/stores/teachers'
import type { BarItem, DateRange, TrendGranularity } from '@/types'
import {
  jalaliLabel,
  monthRangeOf,
  previousMonthRangeOf,
  todayIso,
  weekRangeOf,
} from '@/utils/attendance-date'
import {
  attendanceRate,
  emptyTally,
  formatRate,
  labelledPhonesOf,
  recordedCount,
  tallyByStudent,
  toTelHref,
  type Tally,
} from '@/utils/attendance-domain'
import { sortByName, studentFullName } from '@/utils/attendance-format'
import { buildStudentPayload, buildSummaryPayload, recordDetailText } from '@/utils/attendance-print'
import { JALAALI_WEEKDAY_NAMES } from '@/utils/jalaali'

type ReportTab = 'class' | 'student' | 'overview'
type Preset = 'week' | 'month' | 'prev-month' | 'custom'

const REPORT_TABS: { key: ReportTab; label: string }[] = [
  { key: 'class', label: 'گزارش کلاس' },
  { key: 'student', label: 'گزارش دانش‌آموز' },
  { key: 'overview', label: 'مقایسه‌ی کلاس‌ها' },
]

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'week', label: 'این هفته' },
  { key: 'month', label: 'این ماه' },
  { key: 'prev-month', label: 'ماه قبل' },
  { key: 'custom', label: 'بازه‌ی دلخواه' },
]

const GRANULARITIES: { key: TrendGranularity; label: string }[] = [
  { key: 'day', label: 'روزانه' },
  { key: 'week', label: 'هفتگی' },
  { key: 'month', label: 'ماهانه' },
]

const classroomsStore = useClassroomsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const { activeTeacherId, teacherNameOf } = useActiveTeacher()
const printer = useAttendancePrint()

const tab = ref<ReportTab>('class')
const preset = ref<Preset>('month')
const initialRange = monthRangeOf(todayIso())
const from = ref(initialRange.from)
const to = ref(initialRange.to)
const granularity = ref<TrendGranularity>('day')
const classId = ref('')
const studentId = ref('')
const memberIds = ref<string[]>([])
const classReport = ref<ClassReport | null>(null)
const studentReport = ref<StudentReport | null>(null)
const overviewRows = ref<OverviewRow[]>([])
const isLoading = ref(true)
let token = 0

const classrooms = computed(() => classroomsStore.visibleFor(activeTeacherId.value))
const classroom = computed(() => classroomsStore.byId(classId.value))
const range = computed<DateRange>(() => ({ from: from.value, to: to.value }))
const isRangeValid = computed(() => from.value !== '' && to.value !== '' && from.value <= to.value)

function nameOf(id: string): string {
  return studentFullName(studentsStore.byId(id))
}

const studentOptions = computed(() =>
  sortByName(
    memberIds.value.map((id) => ({ id, name: nameOf(id) })),
    (item) => item.name,
  ),
)

function applyPreset(next: Preset): void {
  preset.value = next
  if (next === 'custom') return
  const today = todayIso()
  const value = next === 'week' ? weekRangeOf(today) : next === 'month' ? monthRangeOf(today) : previousMonthRangeOf(today)
  from.value = value.from
  to.value = value.to
}

async function refresh(): Promise<void> {
  const current = ++token
  if (!isRangeValid.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  if (tab.value === 'overview') {
    const rows = await attendanceReportService.overview(classrooms.value, range.value)
    if (current === token) overviewRows.value = rows
  } else if (classId.value) {
    const ids = await classroomsStore.loadMembers(classId.value)
    if (current !== token) return
    memberIds.value = ids
    if (tab.value === 'class') {
      classReport.value = await attendanceReportService.classReport(classId.value, range.value, granularity.value)
    } else {
      if (!ids.includes(studentId.value)) studentId.value = ids[0] ?? ''
      studentReport.value = studentId.value
        ? await attendanceReportService.studentReport(studentId.value, range.value)
        : null
    }
  }
  if (current === token) isLoading.value = false
}

onMounted(async () => {
  await Promise.all([classroomsStore.loadFromDb(), studentsStore.loadFromDb(), teachersStore.loadFromDb()])
  classId.value = classrooms.value[0]?.id ?? ''
  await refresh()
})

watch(activeTeacherId, () => {
  classId.value = classrooms.value[0]?.id ?? ''
})
watch([tab, classId, studentId, from, to, granularity, activeTeacherId], refresh)

const rateItems = computed<BarItem[]>(() =>
  overviewRows.value
    .map((row) => ({ row, rate: attendanceRate(row.total) }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
    .map(({ row, rate }) => ({
      label: row.classroom.name,
      value: rate === null ? 0 : Math.round(rate * 100),
      display: formatRate(rate),
    })),
)

const trendItems = computed<BarItem[]>(() =>
  (classReport.value?.trend ?? []).map((point) => ({
    label: point.label,
    value: point.absent,
    display: point.absent.toLocaleString('fa-IR'),
  })),
)

const weekdayItems = computed<BarItem[]>(() =>
  ((tab.value === 'class' ? classReport.value?.weekday : studentReport.value?.weekday) ?? []).map((stat) => ({
    label: JALAALI_WEEKDAY_NAMES[stat.index],
    value: stat.absent,
    display: `${stat.absent.toLocaleString('fa-IR')}/${stat.recorded.toLocaleString('fa-IR')}`,
  })),
)

const topItems = computed<BarItem[]>(() =>
  (classReport.value?.topAbsentees ?? []).map((row) => ({ label: nameOf(row.studentId), value: row.tally.absent })),
)

const monthlyItems = computed<BarItem[]>(() =>
  (studentReport.value?.monthly ?? []).map((point) => ({
    label: point.label,
    value: point.absent,
    display: `${point.absent.toLocaleString('fa-IR')}/${point.recorded.toLocaleString('fa-IR')}`,
  })),
)

const classTableRows = computed(() => {
  const tallies = classReport.value?.byStudent ?? new Map<string, Tally>()
  return memberIds.value
    .map((id) => ({ id, name: nameOf(id), tally: tallies.get(id) ?? emptyTally() }))
    .sort((a, b) => b.tally.absent - a.tally.absent || a.name.localeCompare(b.name, 'fa'))
})

const activeTally = computed<Tally | null>(() =>
  tab.value === 'class' ? (classReport.value?.total ?? null) : (studentReport.value?.total ?? null),
)

const contacts = computed(() => labelledPhonesOf(classroomsStore.profiles[studentId.value]))

async function printReport(): Promise<void> {
  if (tab.value === 'class' && classroom.value && classReport.value) {
    await printer.print(
      buildSummaryPayload(
        classroom.value,
        teacherNameOf(classroom.value.teacherId),
        range.value,
        tallyByStudent(classReport.value.records),
        classReport.value.total,
        nameOf,
        memberIds.value,
      ),
    )
  } else if (tab.value === 'student' && studentReport.value) {
    await printer.print(
      buildStudentPayload(nameOf(studentId.value), range.value, studentReport.value.records, studentReport.value.total),
    )
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
      <div class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">گزارش‌های حضور و غیاب</h1>
          <RouterLink to="/attendance" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">کلاس‌ها</RouterLink>
        </div>

        <div class="mb-4 flex flex-wrap gap-2" role="tablist">
          <button
            v-for="item in REPORT_TABS"
            :key="item.key"
            type="button"
            role="tab"
            :aria-selected="tab === item.key"
            class="min-h-11 rounded-lg px-4 text-sm font-medium"
            :class="tab === item.key ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
            @click="tab = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="mb-4 space-y-3 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div v-if="tab !== 'overview'" class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="rep-class">کلاس</label>
              <select id="rep-class" v-model="classId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
                <option v-for="item in classrooms" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </div>
            <div v-if="tab === 'student'">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="rep-student">دانش‌آموز</label>
              <select id="rep-student" v-model="studentId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
                <option v-for="item in studentOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </div>
            <div v-else>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="rep-gran">دوره‌ی روند</label>
              <select id="rep-gran" v-model="granularity" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
                <option v-for="item in GRANULARITIES" :key="item.key" :value="item.key">{{ item.label }}</option>
              </select>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in PRESETS"
              :key="item.key"
              type="button"
              class="min-h-11 rounded-lg border px-3 text-xs font-medium"
              :class="preset === item.key ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
              @click="applyPreset(item.key)"
            >
              {{ item.label }}
            </button>
          </div>

          <div v-if="preset === 'custom'" class="grid gap-3 sm:grid-cols-2">
            <div><p class="mb-1 text-xs text-ink-600 dark:text-ink-300">از تاریخ</p><JalaliDatePicker v-model="from" /></div>
            <div><p class="mb-1 text-xs text-ink-600 dark:text-ink-300">تا تاریخ</p><JalaliDatePicker v-model="to" /></div>
          </div>
          <p v-else class="text-xs text-ink-500 dark:text-ink-400">از {{ jalaliLabel(from) }} تا {{ jalaliLabel(to) }}</p>
          <p v-if="!isRangeValid" class="text-xs text-red-600 dark:text-red-400" role="alert">بازه‌ی تاریخ معتبر نیست.</p>
        </div>

        <p v-if="isLoading" class="p-8 text-center text-ink-400">در حال محاسبه...</p>

        <template v-else-if="tab === 'overview'">
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">نرخ حضور کلاس‌ها</p>
            <BarList :items="rateItems" bar-class="bg-emerald-500" />
          </div>
          <div class="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
            <table class="w-full min-w-[32rem] text-xs">
              <thead class="bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                <tr><th class="p-2 text-right">کلاس</th><th class="p-2">روز ثبت‌شده</th><th class="p-2">غایب</th><th class="p-2">تأخیر</th><th class="p-2">خروج</th><th class="p-2">نرخ حضور</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in overviewRows" :key="row.classroom.id" class="border-t border-ink-50 text-center dark:border-ink-800">
                  <td class="p-2 text-right text-ink-800 dark:text-ink-200">{{ row.classroom.name }}</td>
                  <td class="p-2">{{ row.recordedDays.toLocaleString('fa-IR') }}</td>
                  <td class="p-2">{{ row.total.absent.toLocaleString('fa-IR') }}</td>
                  <td class="p-2">{{ row.total.late.toLocaleString('fa-IR') }}</td>
                  <td class="p-2">{{ row.total.exits.toLocaleString('fa-IR') }}</td>
                  <td class="p-2">{{ formatRate(attendanceRate(row.total)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <p v-else-if="!classId" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">ابتدا یک کلاس تعریف کنید.</p>

        <template v-else-if="activeTally">
          <dl class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div class="rounded-xl bg-emerald-50 p-3 text-center text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><dt class="text-11px">نرخ حضور</dt><dd class="text-lg font-bold">{{ formatRate(attendanceRate(activeTally)) }}</dd></div>
            <div class="rounded-xl bg-red-50 p-3 text-center text-red-700 dark:bg-red-900/30 dark:text-red-300"><dt class="text-11px">✕ غیبت</dt><dd class="text-lg font-bold">{{ activeTally.absent.toLocaleString('fa-IR') }}</dd></div>
            <div class="rounded-xl bg-amber-50 p-3 text-center text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><dt class="text-11px">⏱ تأخیر</dt><dd class="text-lg font-bold">{{ activeTally.late.toLocaleString('fa-IR') }}</dd></div>
            <div class="rounded-xl bg-sky-50 p-3 text-center text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"><dt class="text-11px">✎ موجه</dt><dd class="text-lg font-bold">{{ activeTally.excused.toLocaleString('fa-IR') }}</dd></div>
            <div class="rounded-xl bg-ink-100 p-3 text-center text-ink-700 dark:bg-ink-800 dark:text-ink-200"><dt class="text-11px">⇥ خروج</dt><dd class="text-lg font-bold">{{ activeTally.exits.toLocaleString('fa-IR') }}</dd></div>
          </dl>
          <p v-if="!recordedCount(activeTally)" class="mb-4 rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400 dark:border-ink-700">در این بازه حضور و غیابی ثبت نشده است.</p>

          <div class="mb-4 flex gap-2">
            <button type="button" class="min-h-11 rounded-xl border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="printReport">PDF گزارش</button>
          </div>

          <template v-if="tab === 'class'">
            <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">روند غیبت</p>
              <BarList :items="trendItems" />
            </div>
            <div class="mb-4 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">غیبت بر اساس روز هفته</p>
                <BarList :items="weekdayItems" />
              </div>
              <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">بیشترین غیبت</p>
                <BarList :items="topItems" />
              </div>
            </div>
            <div class="overflow-x-auto rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
              <table class="w-full min-w-[32rem] text-xs">
                <thead class="bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                  <tr><th class="p-2 text-right">دانش‌آموز</th><th class="p-2">حاضر</th><th class="p-2">غایب</th><th class="p-2">تأخیر</th><th class="p-2">موجه</th><th class="p-2">خروج</th><th class="p-2">نرخ</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in classTableRows" :key="row.id" class="border-t border-ink-50 text-center dark:border-ink-800">
                    <td class="p-2 text-right text-ink-800 dark:text-ink-200">{{ row.name }}</td>
                    <td class="p-2">{{ row.tally.present.toLocaleString('fa-IR') }}</td>
                    <td class="p-2">{{ row.tally.absent.toLocaleString('fa-IR') }}</td>
                    <td class="p-2">{{ row.tally.late.toLocaleString('fa-IR') }}</td>
                    <td class="p-2">{{ row.tally.excused.toLocaleString('fa-IR') }}</td>
                    <td class="p-2">{{ row.tally.exits.toLocaleString('fa-IR') }}</td>
                    <td class="p-2">{{ formatRate(attendanceRate(row.tally)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template v-else-if="studentReport">
            <div v-if="contacts.length" class="mb-4 flex flex-wrap gap-2">
              <a v-for="contact in contacts" :key="contact.phone" :href="toTelHref(contact.phone)" class="flex min-h-11 items-center gap-2 rounded-lg bg-brand-50 px-4 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <span aria-hidden="true">☎</span><span dir="ltr">{{ contact.phone }}</span><span class="text-11px">({{ contact.relation }})</span>
              </a>
            </div>
            <div class="mb-4 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">الگوی روز هفته</p>
                <BarList :items="weekdayItems" />
              </div>
              <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">جمع ماهانه‌ی غیبت</p>
                <BarList :items="monthlyItems" />
              </div>
            </div>
            <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">جدول زمانی</p>
              <ul v-if="studentReport.records.length" class="space-y-1.5">
                <li v-for="record in studentReport.records" :key="record.id" class="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
                  <span class="w-28 text-ink-700 dark:text-ink-200">{{ jalaliLabel(record.date) }}</span>
                  <StatusBadge :status="record.status" />
                  <span class="text-ink-500 dark:text-ink-400">{{ recordDetailText(record) }}</span>
                </li>
              </ul>
              <p v-else class="text-xs text-ink-400">رکوردی در این بازه نیست.</p>
            </div>
          </template>
        </template>
      </div>
    </div>

    <div v-if="printer.isPrinting.value && printer.payload.value && printer.component.value" id="print-root" class="hidden print:block">
      <component :is="printer.component.value" :payload="printer.payload.value" />
    </div>
  </div>
</template>
