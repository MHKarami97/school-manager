<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useExtraClassesStore } from '../stores/extra-classes'
import { useEnrollmentsStore } from '../stores/enrollments'
import { useTeachersStore } from '../stores/teachers'
import { useStudentsStore } from '../stores/students'
import { EXTRA_CLASS_TYPE_LABELS, EXTRA_CLASS_TYPE_BADGE_CLASSES, EXTRA_CLASS_TYPES } from '../config/extra-class.config'
import { activeEnrollmentsOf, reportByTeacher, toWeeklyBoardItems, type WeeklyBoardItem } from '../utils/extra-class-helpers'
import { formatTeacherName } from '../utils/teacher-format'
import { WEEK_DAYS } from '../types'
import type { ExtraClass, ExtraClassType } from '../types'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import CapacityBar from '../components/extra-classes/CapacityBar.vue'
import WeeklyCalendarBoard from '../components/extra-classes/WeeklyCalendarBoard.vue'
import EnrollStudentModal from '../components/extra-classes/EnrollStudentModal.vue'
import PrintableExtraClassSchedule from '../components/extra-classes/PrintableExtraClassSchedule.vue'

const extraClassesStore = useExtraClassesStore()
const enrollmentsStore = useEnrollmentsStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

onMounted(async () => {
  await Promise.all([
    extraClassesStore.loadFromDb(),
    enrollmentsStore.loadFromDb(),
    teachersStore.loadFromDb(),
    studentsStore.loadFromDb(),
  ])
})

const tab = ref<'list' | 'school-calendar' | 'teacher-calendar' | 'student-calendar'>('list')
const typeFilter = ref<'all' | ExtraClassType>('all')

const filteredClasses = computed(() =>
  extraClassesStore.items.filter((c) => typeFilter.value === 'all' || c.type === typeFilter.value),
)

function teacherName(teacherId: string | null): string {
  if (!teacherId) return 'بدون معلم'
  const teacher = teachersStore.items.find((t) => t.id === teacherId)
  return teacher ? formatTeacherName(teacher) : 'بدون معلم'
}

async function deleteClass(id: string): Promise<void> {
  if (!confirm('این کلاس حذف شود؟')) return
  await extraClassesStore.remove(id)
}

// --- تقویم هفتگی کل مدرسه --------------------------------------------------
const schoolBoardItems = computed<WeeklyBoardItem[]>(() =>
  filteredClasses.value.flatMap((klass) =>
    toWeeklyBoardItems(klass, (k) => ({
      startTime: k.startTime,
      endTime: k.endTime,
      title: k.title,
      subtitle: teacherName(k.teacherId),
      badge: `${activeEnrollmentsOf(k.id, enrollmentsStore.items).length}/${k.capacity}`,
    })),
  ),
)

// --- تقویم هفتگی معلم --------------------------------------------------
// همه‌ی معلم‌ها قابل انتخاب‌اند (نه فقط کسانی که از قبل کلاسی دارند)، چون در
// غیر این‌صورت وقتی هنوز هیچ کلاسی ثبت نشده بود، این فهرست خالی می‌ماند.
const selectedTeacherId = ref('')
const teacherBoardItems = computed<WeeklyBoardItem[]>(() =>
  extraClassesStore.items
    .filter((c) => c.teacherId === selectedTeacherId.value)
    .flatMap((klass) =>
      toWeeklyBoardItems(klass, (k) => ({
        startTime: k.startTime,
        endTime: k.endTime,
        title: k.title,
        subtitle: `${activeEnrollmentsOf(k.id, enrollmentsStore.items).length}/${k.capacity} نفر`,
      })),
    ),
)

// --- تقویم هفتگی دانش‌آموز --------------------------------------------------
const studentSearch = ref('')
const selectedStudentId = ref('')
const studentMatches = computed(() => {
  const query = studentSearch.value.trim()
  if (!query || selectedStudentId.value) return []
  return studentsStore.items.filter((s) => `${s.firstName} ${s.lastName}`.includes(query)).slice(0, 6)
})

function selectStudent(id: string): void {
  selectedStudentId.value = id
  const student = studentsStore.byId(id)
  studentSearch.value = student ? `${student.firstName} ${student.lastName}` : ''
}

const studentBoardItems = computed<WeeklyBoardItem[]>(() => {
  if (!selectedStudentId.value) return []
  return enrollmentsStore.items
    .filter((e) => e.studentId === selectedStudentId.value && e.status === 'active' && !e.waitlisted)
    .map((enrollment) => extraClassesStore.byId(enrollment.extraClassId))
    .filter((klass): klass is ExtraClass => !!klass)
    .flatMap((klass) =>
      toWeeklyBoardItems(klass, (k) => ({
        startTime: k.startTime,
        endTime: k.endTime,
        title: k.title,
        subtitle: teacherName(k.teacherId),
      })),
    )
})

// --- گزارش بر اساس معلم --------------------------------------------------
const teacherReport = computed(() =>
  reportByTeacher(extraClassesStore.items, enrollmentsStore.items).map((row) => ({
    ...row,
    teacherLabel: teacherName(row.teacherId),
  })),
)

// --- ثبت‌نام سریع --------------------------------------------------
const enrollingClass = ref<ExtraClass | null>(null)
const isEnrollModalOpen = ref(false)

function openEnroll(klass: ExtraClass): void {
  enrollingClass.value = klass
  isEnrollModalOpen.value = true
}

// --- چاپ / PDF --------------------------------------------------
const printMode = ref<'school' | 'teacher'>('school')
const isPrinting = ref(false)

async function handlePrint(mode: 'school' | 'teacher'): Promise<void> {
  printMode.value = mode
  isPrinting.value = true
  await nextTick()
  printPage()
  window.addEventListener(
    'afterprint',
    () => {
      isPrinting.value = false
    },
    { once: true },
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">کلاس تقویتی و فوق‌برنامه</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ extraClassesStore.items.length }} کلاس ثبت‌شده</p>
        </div>
        <RouterLink
          to="/extra-classes/new"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + کلاس جدید
        </RouterLink>
      </div>

      <div class="mb-4 flex flex-wrap gap-2 print:hidden">
        <button
          v-for="option in [
            { key: 'list', label: 'فهرست کلاس‌ها' },
            { key: 'school-calendar', label: 'تقویم هفتگی مدرسه' },
            { key: 'teacher-calendar', label: 'تقویم معلم' },
            { key: 'student-calendar', label: 'تقویم دانش‌آموز' },
          ]"
          :key="option.key"
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            tab === option.key
              ? 'bg-ink-900 text-white dark:bg-brand-600'
              : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
          "
          @click="tab = option.key as typeof tab"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- ===================== فهرست کارتی ===================== -->
      <template v-if="tab === 'list'">
        <div class="mb-4 flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="typeFilter === 'all' ? 'bg-brand-600 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
            @click="typeFilter = 'all'"
          >
            همه
          </button>
          <button
            v-for="t in EXTRA_CLASS_TYPES"
            :key="t"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="typeFilter === t ? 'bg-brand-600 text-white' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
            @click="typeFilter = t"
          >
            {{ EXTRA_CLASS_TYPE_LABELS[t] }}
          </button>
        </div>

        <div v-if="!filteredClasses.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
          <p class="text-ink-500 dark:text-ink-400">هنوز کلاسی ثبت نشده است.</p>
          <RouterLink to="/extra-classes/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
            ثبت اولین کلاس
          </RouterLink>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="klass in filteredClasses"
            :key="klass.id"
            class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
          >
            <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
            <div class="p-4">
              <div class="mb-2 flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ klass.title }}</p>
                <span class="shrink-0 rounded-full px-2.5 py-1 text-sm font-medium" :class="EXTRA_CLASS_TYPE_BADGE_CLASSES[klass.type]">
                  {{ EXTRA_CLASS_TYPE_LABELS[klass.type] }}
                </span>
              </div>
              <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
                {{ klass.dayIndexes.map((d) => WEEK_DAYS[d]).join('، ') || '—' }}
                {{ klass.startTime }} تا {{ klass.endTime }} - {{ teacherName(klass.teacherId) }}
              </p>
              <p v-if="klass.startDate || klass.endDate" class="mb-1 text-sm text-ink-400 dark:text-ink-500">
                بازه: {{ klass.startDate || 'نامحدود' }} تا {{ klass.endDate || 'نامحدود' }}
              </p>
              <p v-if="klass.cost" class="mb-3 text-sm text-ink-400 dark:text-ink-500">هزینه: {{ klass.cost.toLocaleString('fa-IR') }} تومان</p>
              <div class="mb-3">
                <CapacityBar :filled="activeEnrollmentsOf(klass.id, enrollmentsStore.items).length" :total="klass.capacity" />
              </div>
              <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
                <div class="flex gap-3">
                  <RouterLink :to="`/extra-classes/${klass.id}`" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                    مدیریت
                  </RouterLink>
                  <button type="button" class="text-xs text-ink-600 hover:underline dark:text-ink-300" @click="openEnroll(klass)">
                    ثبت‌نام سریع
                  </button>
                </div>
                <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteClass(klass.id)">حذف</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="teacherReport.length" class="mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">گزارش تعداد کلاس و ثبت‌نامی به ازای هر معلم</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div v-for="row in teacherReport" :key="row.teacherId" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
              <span class="text-ink-700 dark:text-ink-200">{{ row.teacherLabel }}</span>
              <span class="text-ink-500 dark:text-ink-400">{{ row.classCount }} کلاس - {{ row.enrollmentCount }} ثبت‌نامی</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ===================== تقویم هفتگی مدرسه ===================== -->
      <template v-else-if="tab === 'school-calendar'">
        <div class="mb-4 flex justify-end print:hidden">
          <button type="button" class="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('school')">
            چاپ / خروجی PDF
          </button>
        </div>
        <div class="print:hidden">
          <WeeklyCalendarBoard :items="schoolBoardItems" />
        </div>
      </template>

      <!-- ===================== تقویم هفتگی معلم ===================== -->
      <template v-else-if="tab === 'teacher-calendar'">
        <div class="mb-4 flex flex-wrap items-center gap-3 print:hidden">
          <select v-model="selectedTeacherId" class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
            <option value="" disabled>یک معلم را انتخاب کن</option>
            <option v-for="t in teachersStore.sortedByName" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
          </select>
          <button
            v-if="selectedTeacherId"
            type="button"
            class="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200"
            @click="handlePrint('teacher')"
          >
            چاپ / خروجی PDF
          </button>
        </div>
        <div v-if="selectedTeacherId" class="print:hidden">
          <WeeklyCalendarBoard :items="teacherBoardItems" />
        </div>
        <p v-else class="text-xs text-ink-400 dark:text-ink-500 print:hidden">یک معلم را از فهرست بالا انتخاب کن.</p>
      </template>

      <!-- ===================== تقویم هفتگی دانش‌آموز ===================== -->
      <template v-else>
        <div class="mb-4 space-y-2 print:hidden">
          <input
            v-model="studentSearch"
            type="text"
            placeholder="نام دانش‌آموز را تایپ کن"
            class="w-full max-w-sm rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            @input="selectedStudentId = ''"
          />
          <ul v-if="studentMatches.length" class="max-w-sm space-y-1 rounded-lg border border-ink-100 bg-white p-2 dark:border-ink-800 dark:bg-ink-900">
            <li
              v-for="student in studentMatches"
              :key="student.id"
              class="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
              @click="selectStudent(student.id)"
            >
              {{ student.firstName }} {{ student.lastName }}
            </li>
          </ul>
        </div>
        <div v-if="selectedStudentId" class="print:hidden">
          <WeeklyCalendarBoard :items="studentBoardItems" />
        </div>
        <p v-else class="text-xs text-ink-400 dark:text-ink-500 print:hidden">یک دانش‌آموز را جست‌وجو و انتخاب کن.</p>
      </template>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableExtraClassSchedule
          :mode="printMode"
          :classes="extraClassesStore.items"
          :teacher-id="printMode === 'teacher' ? selectedTeacherId : undefined"
        />
      </div>
    </div>

    <EnrollStudentModal v-model="isEnrollModalOpen" :extra-class="enrollingClass" />
  </div>
</template>
