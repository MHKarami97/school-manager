<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { Gender, GeoPoint, ServiceAddress, Student } from '@/types'
import { PARENT_RELATIONS } from '@/config/attendance.config'
import { LEVELS, gradeLabel } from '@/config/levels.config'
import { LAST_CITY_STORAGE_KEY, LAST_PROVINCE_STORAGE_KEY } from '@/config/service.config'
import { useClassroomsStore } from '@/stores/classrooms'
import { useServiceStudentsStore } from '@/stores/service-students'
import { useStudentsStore } from '@/stores/students'
import { normalizeIranMobile } from '@/utils/attendance-domain'
import {
  dedupeRows,
  existingIdentityKeys,
  levelIdOfGrade,
  studentIdentityKey,
} from '@/utils/attendance-student-import'
import { createEmptyServiceProfile, emptyAddress } from '@/utils/service-domain'
import {
  downloadServiceImportTemplate,
  parseServiceBulkText,
  parseServiceImportFile,
  type ServiceNewRow,
} from '@/utils/service-student-import'
import AddressFields from './AddressFields.vue'

const LocationPickerModal = defineAsyncComponent(() => import('./LocationPickerModal.vue'))

type Mode = 'single' | 'bulk' | 'file'

const GENDER_KEY = 'school-manager-attendance-last-gender'
const SAME_GENDER_KEY = 'school-manager-attendance-same-gender'
const GRADE_KEY = 'school-manager-service-last-grade'
const DEFAULT_RELATION = 'سرپرست'

defineProps<{ regionSuggestions: string[] }>()
const emit = defineEmits<{ (e: 'created', studentIds: string[]): void }>()

const MODES: { key: Mode; label: string }[] = [
  { key: 'single', label: 'تکی' },
  { key: 'bulk', label: 'گروهی (متن)' },
  { key: 'file', label: 'از فایل' },
]

const studentsStore = useStudentsStore()
const classroomsStore = useClassroomsStore()
const serviceStudents = useServiceStudentsStore()

const allGrades = LEVELS.flatMap((level) => level.grades)
const storedGrade = Number(localStorage.getItem(GRADE_KEY))
const mode = ref<Mode>('single')
const grade = ref<number>(allGrades.includes(storedGrade) ? storedGrade : allGrades[0])
const gender = ref<Gender>(localStorage.getItem(GENDER_KEY) === 'female' ? 'female' : 'male')
const sameGenderForAll = ref(localStorage.getItem(SAME_GENDER_KEY) !== 'false')
const firstName = ref('')
const lastName = ref('')
const primaryPhone = ref('')
const secondaryPhone = ref('')
const relation = ref(DEFAULT_RELATION)
const address = ref<ServiceAddress>({
  ...emptyAddress(),
  province: localStorage.getItem(LAST_PROVINCE_STORAGE_KEY) ?? '',
  city: localStorage.getItem(LAST_CITY_STORAGE_KEY) ?? '',
})
const location = ref<GeoPoint | null>(null)
const pickupTime = ref('')
const defaultProvince = ref(address.value.province)
const defaultCity = ref(address.value.city)
const bulkText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const isPickerOpen = ref(false)
const isWorking = ref(false)
const message = ref('')
const isError = ref(false)

watch(grade, (value) => localStorage.setItem(GRADE_KEY, String(value)))
watch(gender, (value) => localStorage.setItem(GENDER_KEY, value))
watch(sameGenderForAll, (value) => localStorage.setItem(SAME_GENDER_KEY, String(value)))

const levelId = computed(() => levelIdOfGrade(grade.value))
const bulkPreview = computed(() => parseServiceBulkText(bulkText.value, gender.value, sameGenderForAll.value))

function report(text: string, error = false): void {
  message.value = text
  isError.value = error
}

function count(value: number): string {
  return value.toLocaleString('fa-IR')
}

function applyDefaultPlace(row: ServiceNewRow): ServiceNewRow {
  return {
    ...row,
    address: {
      ...row.address,
      province: row.address.province || defaultProvince.value,
      city: row.address.city || defaultCity.value,
    },
  }
}

async function createRows(rows: ServiceNewRow[]): Promise<Student[]> {
  if (!levelId.value) throw new Error('پایه معتبر نیست.')
  const level = levelId.value
  const students = await studentsStore.addStudentsBulk(
    rows.map((row) => ({ firstName: row.firstName, lastName: row.lastName, gender: row.gender, grade: grade.value, levelId: level })),
  )
  for (let i = 0; i < students.length; i += 1) {
    const row = rows[i]
    if (!row.primaryPhone && !row.secondaryPhone) continue
    await classroomsStore.saveProfile(students[i].id, {
      primaryPhone: row.primaryPhone ?? row.secondaryPhone ?? '',
      primaryRelation: row.relation || relation.value,
      secondaryPhone: row.primaryPhone ? (row.secondaryPhone ?? '') : '',
      secondaryRelation: PARENT_RELATIONS[PARENT_RELATIONS.length - 1],
      nfcSerial: '',
    })
  }
  await serviceStudents.saveMany(
    students.map((student, index) => ({
      ...createEmptyServiceProfile(student.id),
      address: rows[index].address,
      location: rows[index].location,
      pickupTime: rows[index].pickupTime,
    })),
  )
  return students
}

function finish(students: Student[], text: string): void {
  report(text)
  emit('created', students.map((student) => student.id))
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
  if (existingIdentityKeys(studentsStore.items).has(studentIdentityKey(first, last, grade.value))) {
    if (!confirm('دانش‌آموزی با همین نام در این پایه وجود دارد (می‌توانید او را از «افزودن از دانش‌آموزان موجود» وارد سرویس کنید). باز هم دانش‌آموز جدید ساخته شود؟')) return
  }
  isWorking.value = true
  try {
    const students = await createRows([
      {
        firstName: first,
        lastName: last,
        gender: gender.value,
        primaryPhone: phone1 || undefined,
        secondaryPhone: phone2 || undefined,
        relation: relation.value,
        address: { ...address.value },
        location: location.value,
        pickupTime: pickupTime.value,
      },
    ])
    localStorage.setItem(LAST_PROVINCE_STORAGE_KEY, address.value.province)
    localStorage.setItem(LAST_CITY_STORAGE_KEY, address.value.city)
    firstName.value = ''
    lastName.value = ''
    primaryPhone.value = ''
    secondaryPhone.value = ''
    location.value = null
    pickupTime.value = ''
    address.value = { ...emptyAddress(), province: address.value.province, city: address.value.city }
    finish(students, 'دانش‌آموز ساخته و وارد سرویس شد.')
  } finally {
    isWorking.value = false
  }
}

function onLocation(point: GeoPoint | null): void {
  location.value = point
}

function summary(rows: ServiceNewRow[], invalidPhones: number): string {
  const phones = rows.filter((row) => row.primaryPhone || row.secondaryPhone).length
  const addresses = rows.filter((row) => Object.values(row.address).some((value) => value.trim())).length
  const locations = rows.filter((row) => row.location).length
  const invalid = invalidPhones ? `، شماره‌ی نامعتبر نادیده‌گرفته‌شده: ${count(invalidPhones)}` : ''
  return `با شماره: ${count(phones)}، با آدرس: ${count(addresses)}، با موقعیت: ${count(locations)}${invalid}`
}

async function addBulk(): Promise<void> {
  const { rows, invalidLines, invalidPhones } = bulkPreview.value
  const { fresh, duplicates } = dedupeRows(rows.map(applyDefaultPlace), grade.value, existingIdentityKeys(studentsStore.items))
  if (!fresh.length) {
    report(`ردیف جدیدی برای افزودن نیست (تکراری: ${count(duplicates)}، نامعتبر: ${count(invalidLines)}).`, true)
    return
  }
  isWorking.value = true
  try {
    const students = await createRows(fresh)
    bulkText.value = ''
    finish(students, `${count(students.length)} دانش‌آموز ساخته شد (تکراری ردشده: ${count(duplicates)}، خط نامعتبر: ${count(invalidLines)}). ${summary(fresh, invalidPhones)}`)
  } finally {
    isWorking.value = false
  }
}

async function onFileSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isWorking.value = true
  try {
    const parsed = await parseServiceImportFile(file, { defaultGender: gender.value, sameGenderForAll: sameGenderForAll.value })
    if (!parsed.rows.length) {
      report('هیچ ردیف معتبری در فایل پیدا نشد.', true)
      return
    }
    const { fresh, duplicates } = dedupeRows(parsed.rows.map(applyDefaultPlace), grade.value, existingIdentityKeys(studentsStore.items))
    if (!fresh.length) {
      report(`همه‌ی ردیف‌های فایل تکراری بودند (${count(duplicates)} مورد).`, true)
      return
    }
    const students = await createRows(fresh)
    finish(students, `${count(students.length)} دانش‌آموز از فایل وارد شد (تکراری ردشده: ${count(duplicates)}). ${summary(fresh, parsed.invalidPhones)}`)
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
    <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">ساخت دانش‌آموز جدید برای سرویس</p>
    <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">دانش‌آموز در فهرست اصلی دانش‌آموزان ساخته می‌شود و همان لحظه وارد سرویس می‌شود. آدرس و موقعیت اختیاری‌اند.</p>

    <div class="mb-3 flex flex-wrap gap-2" role="tablist">
      <button v-for="item in MODES" :key="item.key" type="button" role="tab" :aria-selected="mode === item.key" class="min-h-11 rounded-lg px-4 text-xs font-medium" :class="mode === item.key ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="mode = item.key">{{ item.label }}</button>
    </div>

    <div class="mb-3 flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-grade">پایه</label>
        <select id="sqa-grade" v-model.number="grade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-36">
          <option v-for="item in allGrades" :key="item" :value="item">{{ gradeLabel(item) }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-gender">جنسیت {{ mode === 'single' ? '' : 'همه' }}</label>
        <select id="sqa-gender" v-model="gender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 sm:w-36">
          <option value="male">پسر</option>
          <option value="female">دختر</option>
        </select>
      </div>
      <label v-if="mode !== 'single'" class="flex min-h-11 cursor-pointer items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
        <input v-model="sameGenderForAll" type="checkbox" class="h-5 w-5" />
        جنسیت همه یکسان است
      </label>
    </div>

    <form v-if="mode === 'single'" class="space-y-3" @submit.prevent="addSingle">
      <div class="grid gap-2 sm:grid-cols-2">
        <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-first">نام</label><input id="sqa-first" v-model="firstName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" /></div>
        <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-last">نام خانوادگی</label><input id="sqa-last" v-model="lastName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" /></div>
        <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-phone1">شماره‌ی والدین (اختیاری)</label><input id="sqa-phone1" v-model="primaryPhone" type="tel" inputmode="tel" dir="ltr" placeholder="09123456789" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" /></div>
        <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-phone2">شماره‌ی دوم (اختیاری)</label><input id="sqa-phone2" v-model="secondaryPhone" type="tel" inputmode="tel" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" /></div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-relation">نسبت شماره‌ی اول</label>
          <select id="sqa-relation" v-model="relation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option></select>
        </div>
      </div>

      <details class="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
        <summary class="min-h-11 cursor-pointer text-xs font-semibold text-ink-700 dark:text-ink-200">جزئیات آدرس و موقعیت (اختیاری)</summary>
        <div class="mt-3 space-y-3">
          <AddressFields v-model="address" :region-suggestions="regionSuggestions" id-prefix="sqa" />
          <div class="grid gap-2 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-pickup">ساعت سوار شدن</label><input id="sqa-pickup" v-model="pickupTime" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" /></div>
            <div class="flex items-end gap-2">
              <button type="button" class="min-h-11 flex-1 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="isPickerOpen = true">📍 {{ location ? 'تغییر موقعیت' : 'انتخاب از نقشه' }}</button>
            </div>
          </div>
          <p v-if="location" class="text-11px text-ink-500" dir="ltr">{{ location.lat.toFixed(5) }}, {{ location.lng.toFixed(5) }}</p>
        </div>
      </details>

      <button type="submit" :disabled="isWorking" class="min-h-11 w-full rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">ساخت و افزودن به سرویس</button>
    </form>

    <div v-else class="space-y-3">
      <div class="grid gap-2 sm:grid-cols-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-def-province">استان پیش‌فرض (اگر ردیف نداشت)</label>
          <input id="sqa-def-province" v-model="defaultProvince" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-def-city">شهر پیش‌فرض</label>
          <input id="sqa-def-city" v-model="defaultCity" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-def-relation">نسبت شماره‌ی اول</label>
          <select id="sqa-def-relation" v-model="relation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"><option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option></select>
        </div>
      </div>

      <template v-if="mode === 'bulk'">
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="sqa-bulk">هر خط یک دانش‌آموز: نام، نام خانوادگی، شماره‌ی والدین، سپس آدرس به‌صورت «کلید: مقدار»</label>
        <textarea id="sqa-bulk" v-model="bulkText" rows="6" dir="rtl" placeholder="علی, رضایی, 09123456789, منطقه: 5, خیابان: طالقانی, کوچه: 12, پلاک: 3, واحد: 4, ساعت: 7:15&#10;سارا, احمدی, 09351234567, شهر: کرج, لوکیشن: 35.8327,51.0123" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"></textarea>
        <p class="text-11px leading-6 text-ink-400 dark:text-ink-500">کلیدها: استان، شهر، منطقه، خیابان، کوچه، ساختمان، پلاک، واحد، نشانه، ساعت، و «لوکیشن» (مختصات یا لینک نقشه؛ باید آخرین مورد خط باشد).</p>
        <p class="text-xs text-ink-500 dark:text-ink-400">
          {{ count(bulkPreview.rows.length) }} ردیف معتبر
          <template v-if="bulkPreview.invalidLines"> - {{ count(bulkPreview.invalidLines) }} خط نامعتبر</template>
          <template v-if="bulkPreview.invalidPhones"> - {{ count(bulkPreview.invalidPhones) }} شماره‌ی نامعتبر</template>
        </p>
        <button type="button" :disabled="isWorking || !bulkPreview.rows.length" class="min-h-11 w-full rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="addBulk">ساخت و افزودن به سرویس</button>
      </template>

      <template v-else>
        <p class="text-xs leading-6 text-ink-600 dark:text-ink-300">فایل xlsx یا csv؛ ستون‌ها با عنوان شناسایی می‌شوند: نام، نام‌خانوادگی، جنسیت، شماره‌ی والدین، شماره‌ی دوم، نسبت، استان، شهر، منطقه، خیابان، کوچه، ساختمان، پلاک، واحد، نشانه، ساعت سوار شدن و مختصات/لینک نقشه.</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="downloadServiceImportTemplate()">دانلود قالب</button>
          <button type="button" :disabled="isWorking" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="fileInput?.click()">{{ isWorking ? 'در حال وارد کردن...' : 'انتخاب فایل' }}</button>
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFileSelected" />
        </div>
      </template>
    </div>

    <p v-if="message" class="mt-3 text-xs leading-6" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'" :role="isError ? 'alert' : 'status'">{{ message }}</p>
  </div>
  <LocationPickerModal v-model="isPickerOpen" :point="location" title="موقعیت دانش‌آموز" @save="onLocation" />
</template>
