<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useExtraClassesStore } from '../stores/extra-classes'
import { useEnrollmentsStore } from '../stores/enrollments'
import { useTeachersStore } from '../stores/teachers'
import { useStudentsStore } from '../stores/students'
import { EXTRA_CLASS_TYPES, EXTRA_CLASS_TYPE_LABELS, createEmptyExtraClass } from '../config/extra-class.config'
import { BASE_COURSES } from '../config/courses.config'
import { LEVELS, gradeLabel } from '../config/levels.config'
import { formatTeacherName } from '../utils/teacher-format'
import { activeEnrollmentsOf, findTeacherTimeConflict, remainingCapacityOf, waitlistOf } from '../utils/extra-class-helpers'
import { printPage } from '../utils/export'
import { WEEK_DAYS } from '../types'
import type { ExtraClass } from '../types'
import AppHeader from '../components/layout/AppHeader.vue'
import CapacityBar from '../components/extra-classes/CapacityBar.vue'
import EnrollStudentModal from '../components/extra-classes/EnrollStudentModal.vue'
import PrintableExtraClassSchedule from '../components/extra-classes/PrintableExtraClassSchedule.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import CurrencyInput from '../components/CurrencyInput.vue'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const extraClassesStore = useExtraClassesStore()
const enrollmentsStore = useEnrollmentsStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

const isLoading = ref(true)
const extraClass = ref<ExtraClass | null>(null)
const saveMessage = ref('')
const isPrinting = ref(false)
const isEnrollModalOpen = ref(false)

onMounted(async () => {
  await Promise.all([
    extraClassesStore.loadFromDb(),
    enrollmentsStore.loadFromDb(),
    teachersStore.loadFromDb(),
    studentsStore.loadFromDb(),
  ])
  if (props.id) {
    const existing = extraClassesStore.byId(props.id)
    extraClass.value = existing ? (JSON.parse(JSON.stringify(existing)) as ExtraClass) : null
  } else {
    extraClass.value = createEmptyExtraClass()
  }
  isLoading.value = false
})

// --- روزهای هفته (چند روزه) --------------------------------------------------
function toggleDay(dayIndex: number): void {
  if (!extraClass.value) return
  const set = new Set(extraClass.value.dayIndexes)
  if (set.has(dayIndex)) set.delete(dayIndex)
  else set.add(dayIndex)
  extraClass.value.dayIndexes = Array.from(set).sort((a, b) => a - b)
}

// --- پایه‌های مجاز، گروه‌بندی‌شده بر اساس مقطع --------------------------------
function toggleGrade(grade: number): void {
  if (!extraClass.value) return
  const set = new Set(extraClass.value.allowedGrades)
  if (set.has(grade)) set.delete(grade)
  else set.add(grade)
  extraClass.value.allowedGrades = Array.from(set).sort((a, b) => a - b)
}

// --- معلم مسئول: انتخاب از لیست یا افزودن سریع --------------------------------
const isAddingTeacher = ref(false)
const newTeacherName = ref('')

async function addTeacherQuickly(): Promise<void> {
  const name = newTeacherName.value.trim()
  if (!name || !extraClass.value) return
  const teacher = await teachersStore.addTeacher(name, extraClass.value.relatedCourseId ? [extraClass.value.relatedCourseId] : [])
  extraClass.value.teacherId = teacher.id
  newTeacherName.value = ''
  isAddingTeacher.value = false
}

const teacherConflict = computed(() => {
  if (!extraClass.value || !extraClass.value.teacherId) return null
  return findTeacherTimeConflict(extraClass.value.teacherId, extraClass.value, extraClassesStore.items, props.id)
})

const roster = computed(() => (extraClass.value ? activeEnrollmentsOf(extraClass.value.id, enrollmentsStore.items) : []))
const waitlist = computed(() => (extraClass.value ? waitlistOf(extraClass.value.id, enrollmentsStore.items) : []))
const remainingCapacity = computed(() => (extraClass.value ? remainingCapacityOf(extraClass.value, enrollmentsStore.items) : 0))

function studentName(studentId: string): string {
  const student = studentsStore.byId(studentId)
  return student ? `${student.firstName} ${student.lastName}` : '—'
}

async function cancelEnrollment(id: string): Promise<void> {
  if (!confirm('این ثبت‌نام لغو شود؟')) return
  await enrollmentsStore.cancelEnrollment(id)
}

async function promoteFromWaitlist(id: string): Promise<void> {
  await enrollmentsStore.promoteFromWaitlist(id)
}

async function handleSave(): Promise<void> {
  if (!extraClass.value || !extraClass.value.title.trim() || !extraClass.value.dayIndexes.length) return
  const isNew = !props.id
  await extraClassesStore.save(extraClass.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/extra-classes/${extraClass.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!extraClass.value || !props.id) return
  if (!confirm('این کلاس حذف شود؟')) return
  await extraClassesStore.remove(extraClass.value.id)
  router.push('/extra-classes')
}

async function handlePrint(): Promise<void> {
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

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>

    <div v-else-if="!extraClass" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این کلاس یافت نشد.</p>
      <RouterLink to="/extra-classes" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
        بازگشت به فهرست کلاس‌ها
      </RouterLink>
    </div>

    <div v-else class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">
              {{ props.id ? 'ویرایش کلاس' : 'ثبت کلاس جدید' }}
            </h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ roster.length }} ثبت‌نام فعال - {{ waitlist.length }} نفر در لیست انتظار</p>
          </div>
          <RouterLink to="/extra-classes" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به فهرست
          </RouterLink>
        </div>

        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات کلاس</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان کلاس</label>
              <input
                v-model="extraClass.title"
                type="text"
                placeholder="مثلاً: تقویتی ریاضی هفتم"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نوع کلاس</label>
              <select v-model="extraClass.type" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option v-for="t in EXTRA_CLASS_TYPES" :key="t" :value="t">{{ EXTRA_CLASS_TYPE_LABELS[t] }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس مرتبط (اختیاری)</label>
              <select v-model="extraClass.relatedCourseId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                <option :value="null">— بدون درس مرتبط —</option>
                <option v-for="course in BASE_COURSES" :key="course.id" :value="course.id">{{ course.name }}</option>
              </select>
            </div>

            <!-- معلم مسئول: از لیست یا افزودن سریع -->
            <div class="sm:col-span-2">
              <div class="mb-1 flex items-center justify-between">
                <label class="block text-xs font-medium text-ink-600 dark:text-ink-300">معلم مسئول</label>
                <button
                  type="button"
                  class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  @click="isAddingTeacher = !isAddingTeacher"
                >
                  {{ isAddingTeacher ? 'انتخاب از لیست' : '+ معلم جدید' }}
                </button>
              </div>
              <select
                v-if="!isAddingTeacher"
                v-model="extraClass.teacherId"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option :value="null">— بدون معلم —</option>
                <option v-for="t in teachersStore.sortedByName" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
              </select>
              <div v-else class="flex gap-2">
                <input
                  v-model="newTeacherName"
                  type="text"
                  placeholder="نام معلم جدید"
                  class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
                  @keyup.enter="addTeacherQuickly"
                />
                <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addTeacherQuickly">
                  افزودن
                </button>
              </div>
              <p v-if="teacherConflict" class="mt-1 text-sm text-red-600 dark:text-red-400">
                این معلم در همین بازه، کلاس «{{ teacherConflict.title }}» را هم دارد.
              </p>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">ظرفیت کلاس</label>
              <input
                v-model.number="extraClass.capacity"
                type="number"
                min="1"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">هزینه (صفر یعنی رایگان)</label>
              <CurrencyInput v-model="extraClass.cost" />
            </div>

            <!-- روزهای هفته: چند روزه -->
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">روزهای هفته</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(day, dayIndex) in WEEK_DAYS"
                  :key="day"
                  type="button"
                  class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  :class="
                    extraClass.dayIndexes.includes(dayIndex)
                      ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300'
                      : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
                  "
                  @click="toggleDay(dayIndex)"
                >
                  {{ day }}
                </button>
              </div>
              <p v-if="!extraClass.dayIndexes.length" class="mt-1 text-sm text-amber-600 dark:text-amber-400">
                حداقل یک روز هفته را انتخاب کن.
              </p>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">ساعت شروع</label>
              <input v-model="extraClass.startTime" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">ساعت پایان</label>
              <input v-model="extraClass.endTime" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
            </div>

            <!-- بازه‌ی تاریخی (اختیاری): برای دوره‌های کوتاه‌مدت مثلاً یک هفته‌ای -->
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">شروع بازه (اختیاری، شمسی)</label>
              <JalaliDatePicker v-model="extraClass.startDate" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایان بازه (اختیاری، شمسی)</label>
              <JalaliDatePicker v-model="extraClass.endDate" />
            </div>
            <p class="text-sm text-ink-400 sm:col-span-2 dark:text-ink-500">
              اگر بازه خالی بماند، کلاس نامحدود (تا اطلاع ثانوی) در نظر گرفته می‌شود. برای یک دوره‌ی کوتاه مثل یک هفته
              فشرده، هم تاریخ شروع و هم پایان را مشخص کن.
            </p>
          </div>

          <div class="mt-4">
            <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">پایه‌های مجاز (خالی = همه پایه‌ها)</p>
            <div v-for="level in LEVELS" :key="level.id" class="mb-3">
              <p class="mb-1.5 text-sm font-medium text-ink-400 dark:text-ink-500">{{ level.name }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="grade in level.grades"
                  :key="grade"
                  type="button"
                  class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  :class="
                    extraClass.allowedGrades.includes(grade)
                      ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300'
                      : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
                  "
                  @click="toggleGrade(grade)"
                >
                  {{ gradeLabel(grade) }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <CapacityBar :filled="roster.length" :total="extraClass.capacity" />
        </div>

        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">ثبت‌نامی‌ها</p>
            <button
              type="button"
              class="rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-white dark:bg-ink-700"
              @click="isEnrollModalOpen = true"
            >
              + ثبت‌نام دانش‌آموز
            </button>
          </div>

          <div v-if="roster.length" class="space-y-1.5">
            <div v-for="enrollment in roster" :key="enrollment.id" class="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800">
              <span class="text-ink-700 dark:text-ink-200">{{ studentName(enrollment.studentId) }}</span>
              <button type="button" class="text-red-600 dark:text-red-400" @click="cancelEnrollment(enrollment.id)">لغو ثبت‌نام</button>
            </div>
          </div>
          <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400 dark:border-ink-700 dark:text-ink-500">
            هنوز دانش‌آموزی ثبت‌نام نکرده است.
          </p>

          <template v-if="waitlist.length">
            <p class="mb-2 mt-4 text-xs font-semibold text-amber-700 dark:text-amber-400">لیست انتظار ({{ waitlist.length }} نفر)</p>
            <div class="space-y-1.5">
              <div v-for="enrollment in waitlist" :key="enrollment.id" class="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-900/30 dark:bg-amber-900/10">
                <span class="text-amber-800 dark:text-amber-300">{{ studentName(enrollment.studentId) }}</span>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="text-emerald-700 dark:text-emerald-400"
                    :disabled="remainingCapacity <= 0"
                    @click="promoteFromWaitlist(enrollment.id)"
                  >
                    ارتقا به ثبت‌نام فعال
                  </button>
                  <button type="button" class="text-red-600 dark:text-red-400" @click="cancelEnrollment(enrollment.id)">حذف</button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="mb-8 flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">
            ذخیره
          </button>
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="handlePrint">
            چاپ / خروجی PDF کلاس
          </button>
          <button
            v-if="props.id"
            type="button"
            class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400"
            @click="handleDelete"
          >
            حذف کلاس
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableExtraClassSchedule mode="class" :classes="[extraClass]" :class-id="extraClass.id" />
      </div>
    </div>

    <EnrollStudentModal v-model="isEnrollModalOpen" :extra-class="extraClass" @enrolled="isEnrollModalOpen = false" />
  </div>
</template>
