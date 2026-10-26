<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Gender, Student } from '@/types'
import { PARENT_RELATIONS } from '@/config/attendance.config'
import { gradeLabel } from '@/config/levels.config'
import { useClassroomsStore } from '@/stores/classrooms'
import { useStudentsStore } from '@/stores/students'
import { normalizeIranMobile } from '@/utils/attendance-domain'
import {
  dedupeRows,
  downloadAttendanceImportTemplate,
  existingIdentityKeys,
  levelIdOfGrade,
  parseAttendanceImportFile,
  parseBulkStudentLines,
  studentIdentityKey,
  type AttendanceImportRow,
  type NewStudentRow,
} from '@/utils/attendance-student-import'

type Mode = 'single' | 'bulk' | 'file'

const GENDER_KEY = 'school-manager-attendance-last-gender'
const SAME_GENDER_KEY = 'school-manager-attendance-same-gender'
const DEFAULT_RELATION = 'سرپرست'

const props = defineProps<{ grade: number }>()
const emit = defineEmits<{ (e: 'created', studentIds: string[]): void }>()

const MODES: { key: Mode; label: string }[] = [
  { key: 'single', label: 'تکی' },
  { key: 'bulk', label: 'گروهی (متن)' },
  { key: 'file', label: 'از فایل' },
]

const studentsStore = useStudentsStore()
const classroomsStore = useClassroomsStore()

const storedGender = localStorage.getItem(GENDER_KEY)
const mode = ref<Mode>('single')
const firstName = ref('')
const lastName = ref('')
const gender = ref<Gender>(storedGender === 'female' ? 'female' : 'male')
const sameGenderForAll = ref(localStorage.getItem(SAME_GENDER_KEY) !== 'false')
const primaryPhone = ref('')
const secondaryPhone = ref('')
const relation = ref(DEFAULT_RELATION)
const bulkText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const isWorking = ref(false)
const message = ref('')
const isError = ref(false)

watch(gender, (value) => localStorage.setItem(GENDER_KEY, value))
watch(sameGenderForAll, (value) => localStorage.setItem(SAME_GENDER_KEY, String(value)))

const levelId = computed(() => levelIdOfGrade(props.grade))
const bulkPreview = computed(() => parseBulkStudentLines(bulkText.value, gender.value, sameGenderForAll.value))

function report(text: string, error = false): void {
  message.value = text
  isError.value = error
}

function count(value: number): string {
  return value.toLocaleString('fa-IR')
}

async function createRows(rows: NewStudentRow[]): Promise<Student[]> {
  if (!levelId.value) throw new Error('پایه‌ی کلاس معتبر نیست.')
  const level = levelId.value
  return studentsStore.addStudentsBulk(
    rows.map((row) => ({ firstName: row.firstName, lastName: row.lastName, gender: row.gender, grade: props.grade, levelId: level })),
  )
}

async function saveParentPhones(students: Student[], rows: NewStudentRow[]): Promise<void> {
  for (let i = 0; i < students.length; i += 1) {
    const row = rows[i]
    if (!row.primaryPhone && !row.secondaryPhone) continue
    const rowRelation = row.relation || relation.value
    await classroomsStore.saveProfile(students[i].id, {
      primaryPhone: row.primaryPhone ?? row.secondaryPhone ?? '',
      primaryRelation: rowRelation,
      secondaryPhone: row.primaryPhone ? (row.secondaryPhone ?? '') : '',
      secondaryRelation: PARENT_RELATIONS[PARENT_RELATIONS.length - 1],
      nfcSerial: '',
    })
  }
}

async function addSingle(): Promise<void> {
  const first = firstName.value.trim()
  const last = lastName.value.trim()
  if (!first || !last || !levelId.value) {
    report('نام و نام خانوادگی را وارد کنید.', true)
    return
  }
  const phone1 = primaryPhone.value.trim() ? normalizeIranMobile(primaryPhone.value) : ''
  const phone2 = secondaryPhone.value.trim() ? normalizeIranMobile(secondaryPhone.value) : ''
  if (phone1 === null || phone2 === null) {
    report('شماره‌ی والدین معتبر نیست (مثال: 09123456789).', true)
    return
  }
  const exists = existingIdentityKeys(studentsStore.items).has(studentIdentityKey(first, last, props.grade))
  if (exists && !confirm('دانش‌آموزی با همین نام در این پایه وجود دارد (می‌توانید او را از جستجوی پایین اضافه کنید). باز هم دانش‌آموز جدید ساخته شود؟')) return
  isWorking.value = true
  try {
    const row: NewStudentRow = {
      firstName: first,
      lastName: last,
      gender: gender.value,
      primaryPhone: phone1 || undefined,
      secondaryPhone: phone2 || undefined,
    }
    const students = await createRows([row])
    await saveParentPhones(students, [row])
    firstName.value = ''
    lastName.value = ''
    primaryPhone.value = ''
    secondaryPhone.value = ''
    report('دانش‌آموز ساخته و به کلاس اضافه شد.')
    emit('created', students.map((student) => student.id))
  } finally {
    isWorking.value = false
  }
}

function phoneSummary(rows: NewStudentRow[], invalidPhones: number): string {
  const withPhone = rows.filter((row) => row.primaryPhone || row.secondaryPhone).length
  const invalid = invalidPhones ? `، شماره‌ی نامعتبر نادیده‌گرفته‌شده: ${count(invalidPhones)}` : ''
  return `شماره‌ی والدین: ${count(withPhone)} مورد${invalid}`
}

async function addBulk(): Promise<void> {
  const { rows, invalidLines, invalidPhones } = bulkPreview.value
  const { fresh, duplicates } = dedupeRows(rows, props.grade, existingIdentityKeys(studentsStore.items))
  if (!fresh.length) {
    report(`ردیف جدیدی برای افزودن نیست (تکراری: ${count(duplicates)}، نامعتبر: ${count(invalidLines)}).`, true)
    return
  }
  isWorking.value = true
  try {
    const students = await createRows(fresh)
    await saveParentPhones(students, fresh)
    bulkText.value = ''
    report(`${count(students.length)} دانش‌آموز ساخته شد (تکراری ردشده: ${count(duplicates)}، خط نامعتبر: ${count(invalidLines)}). ${phoneSummary(fresh, invalidPhones)}`)
    emit('created', students.map((student) => student.id))
  } finally {
    isWorking.value = false
  }
}

async function onFileSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isWorking.value = true
  try {
    const parsed = await parseAttendanceImportFile(file, {
      defaultGender: gender.value,
      sameGenderForAll: sameGenderForAll.value,
    })
    if (!parsed.rows.length) {
      report('هیچ ردیف معتبری در فایل پیدا نشد.', true)
      return
    }
    const { fresh, duplicates } = dedupeRows<AttendanceImportRow>(parsed.rows, props.grade, existingIdentityKeys(studentsStore.items))
    if (!fresh.length) {
      report(`همه‌ی ردیف‌های فایل تکراری بودند (${count(duplicates)} مورد).`, true)
      return
    }
    const students = await createRows(fresh)
    for (let i = 0; i < students.length; i += 1) {
      const row = fresh[i]
      if (row.gpa === null && row.disciplineScore === null) continue
      await studentsStore.updateStudent({ ...students[i], gpa: row.gpa, disciplineScore: row.disciplineScore })
    }
    await saveParentPhones(students, fresh)
    report(`${count(students.length)} دانش‌آموز از فایل وارد شد (تکراری ردشده: ${count(duplicates)}). ${phoneSummary(fresh, parsed.invalidPhones)}`)
    emit('created', students.map((student) => student.id))
  } catch (error) {
    console.error(error)
    report('خواندن فایل با خطا مواجه شد؛ از فرمت xlsx یا csv مطابق قالب استفاده کنید.', true)
  } finally {
    isWorking.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ساخت دانش‌آموز جدید</p>
    <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">
      دانش‌آموز در پایه‌ی {{ gradeLabel(grade) }} (پایه‌ی همین کلاس) در فهرست اصلی دانش‌آموزان ساخته و همان لحظه به این کلاس اضافه می‌شود.
    </p>

    <div class="mb-3 flex flex-wrap gap-2" role="tablist">
      <button
        v-for="item in MODES"
        :key="item.key"
        type="button"
        role="tab"
        :aria-selected="mode === item.key"
        class="min-h-11 rounded-lg px-4 text-xs font-medium"
        :class="mode === item.key ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
        @click="mode = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="mb-3 flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-gender">جنسیت {{ mode === 'single' ? '' : 'همه' }}</label>
        <select id="qa-gender" v-model="gender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-36">
          <option value="male">پسر</option>
          <option value="female">دختر</option>
        </select>
      </div>
      <label v-if="mode !== 'single'" class="flex min-h-11 cursor-pointer items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
        <input v-model="sameGenderForAll" type="checkbox" class="h-5 w-5" />
        جنسیت همه یکسان است (نیازی به نوشتن حرف جنسیت در هر ردیف نیست)
      </label>
    </div>

    <form v-if="mode === 'single'" class="grid gap-2 sm:grid-cols-2" @submit.prevent="addSingle">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-first">نام</label>
        <input id="qa-first" v-model="firstName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-last">نام خانوادگی</label>
        <input id="qa-last" v-model="lastName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-phone1">شماره‌ی والدین (اختیاری)</label>
        <input id="qa-phone1" v-model="primaryPhone" type="tel" inputmode="tel" dir="ltr" placeholder="09123456789" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-phone2">شماره‌ی دوم (اختیاری)</label>
        <input id="qa-phone2" v-model="secondaryPhone" type="tel" inputmode="tel" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
      </div>
      <div class="sm:col-span-2">
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-relation">نسبت شماره‌ی اول</label>
        <select id="qa-relation" v-model="relation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
          <option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <button type="submit" :disabled="isWorking" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:col-span-2">
        ساخت و افزودن به کلاس
      </button>
    </form>

    <div v-else-if="mode === 'bulk'" class="space-y-2">
      <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="qa-bulk">هر خط یک دانش‌آموز: نام، نام خانوادگی، شماره‌ی والدین (اختیاری)، شماره‌ی دوم (اختیاری)</label>
      <textarea id="qa-bulk" v-model="bulkText" rows="6" dir="rtl" placeholder="علی, رضایی, 09123456789&#10;سارا, احمدی, 09351234567, 09121112233&#10;محمد حسینی" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"></textarea>
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-xs text-ink-600 dark:text-ink-300" for="qa-bulk-relation">نسبت شماره‌ی اول</label>
        <select id="qa-bulk-relation" v-model="relation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-auto">
          <option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <p class="text-xs text-ink-500 dark:text-ink-400">
        {{ count(bulkPreview.rows.length) }} ردیف معتبر
        <template v-if="bulkPreview.invalidLines"> - {{ count(bulkPreview.invalidLines) }} خط نامعتبر</template>
        <template v-if="bulkPreview.invalidPhones"> - {{ count(bulkPreview.invalidPhones) }} شماره‌ی نامعتبر (نادیده گرفته می‌شود)</template>
      </p>
      <button type="button" :disabled="isWorking || !bulkPreview.rows.length" class="min-h-11 w-full rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="addBulk">
        ساخت و افزودن به کلاس
      </button>
    </div>

    <div v-else class="space-y-2">
      <p class="text-xs leading-6 text-ink-600 dark:text-ink-300">
        فایل xlsx یا csv با ستون‌های نام، نام‌خانوادگی و (اختیاری) جنسیت، معدل، امتیاز انضباطی، شماره‌ی والدین، شماره‌ی دوم و نسبت. ستون‌ها با عنوان‌شان شناسایی می‌شوند.
        در صورت خالی بودن نسبت، «{{ relation }}» ثبت می‌شود.
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <label class="text-xs text-ink-600 dark:text-ink-300" for="qa-file-relation">نسبت پیش‌فرض</label>
        <select id="qa-file-relation" v-model="relation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-auto">
          <option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="downloadAttendanceImportTemplate()">
          دانلود قالب (با ستون شماره‌ی والدین)
        </button>
        <button type="button" :disabled="isWorking" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="fileInput?.click()">
          {{ isWorking ? 'در حال وارد کردن...' : 'انتخاب فایل' }}
        </button>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFileSelected" />
      </div>
    </div>

    <p v-if="message" class="mt-3 text-xs leading-6" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'" :role="isError ? 'alert' : 'status'">
      {{ message }}
    </p>
  </div>
</template>
