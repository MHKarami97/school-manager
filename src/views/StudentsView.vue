<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudentsStore } from '@/stores/students'
import { LEVELS } from '@/config/levels.config'
import { gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'
import { downloadStudentImportTemplate, parseStudentImportFile } from '@/utils/student-import-export'
import type { Gender, LevelId } from '@/types'

const studentsStore = useStudentsStore()

onMounted(() => {
  studentsStore.loadFromDb()
})

const activeLevelId = ref<LevelId>('elementary')
const activeGrade = ref<number | null>(null)

const gradesOfActiveLevel = computed(() => LEVELS.find((l) => l.id === activeLevelId.value)?.grades ?? [])

function selectLevel(levelId: LevelId): void {
  activeLevelId.value = levelId
  activeGrade.value = LEVELS.find((l) => l.id === levelId)?.grades[0] ?? null
}
selectLevel('elementary')

const visibleStudents = computed(() =>
  activeGrade.value === null ? [] : studentsStore.items.filter((s) => s.grade === activeGrade.value),
)

const newFirstName = ref('')
const newLastName = ref('')
const newGender = ref<Gender>('male')

async function addStudent(): Promise<void> {
  if (!newFirstName.value.trim() || !newLastName.value.trim() || activeGrade.value === null) return
  await studentsStore.addStudent({
    firstName: newFirstName.value,
    lastName: newLastName.value,
    gender: newGender.value,
    grade: activeGrade.value,
    levelId: activeLevelId.value,
  })
  newFirstName.value = ''
  newLastName.value = ''
}

const isImportOpen = ref(false)
const importText = ref('')

async function importBulk(): Promise<void> {
  if (activeGrade.value === null) return
  const lines = importText.value
    .split('\\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const inputs = lines
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      const [firstName, lastName, genderRaw] = parts
      const gender: Gender = genderRaw === 'f' || genderRaw === 'F' ? 'female' : 'male'
      return firstName && lastName ? { firstName, lastName, gender, grade: activeGrade.value as number, levelId: activeLevelId.value } : null
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
  if (inputs.length) await studentsStore.addStudentsBulk(inputs)
  importText.value = ''
  isImportOpen.value = false
}

const fileInputRef = ref<HTMLInputElement | null>(null)
const isImportingFile = ref(false)
const fileImportMessage = ref('')

function triggerFileDialog(): void {
  fileInputRef.value?.click()
}

async function handleFileSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || activeGrade.value === null) return

  isImportingFile.value = true
  fileImportMessage.value = ''
  try {
    const rows = await parseStudentImportFile(file)
    if (!rows.length) {
      fileImportMessage.value = 'هیچ ردیف معتبری در فایل پیدا نشد.'
      return
    }
    const inputs = rows.map((row) => ({
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      grade: activeGrade.value as number,
      levelId: activeLevelId.value,
    }))
    const createdStudents = await studentsStore.addStudentsBulk(inputs)

    for (let i = 0; i < createdStudents.length; i++) {
      const row = rows[i]
      if (row.gpa === null && row.disciplineScore === null) continue
      await studentsStore.updateStudent({ ...createdStudents[i], gpa: row.gpa, disciplineScore: row.disciplineScore })
    }

    fileImportMessage.value = `${rows.length} دانش‌آموز با موفقیت وارد شد.`
  } catch (error) {
    console.error(error)
    fileImportMessage.value = 'خواندن فایل با خطا مواجه شد؛ از فرمت xlsx یا csv مطابق قالب استفاده کنید.'
  } finally {
    isImportingFile.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

const selectedIds = ref<Set<string>>(new Set())

function toggleSelect(id: string): void {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function selectAllVisible(): void {
  selectedIds.value = new Set(visibleStudents.value.map((s) => s.id))
}

function clearSelection(): void {
  selectedIds.value = new Set()
}

async function promoteSelected(): Promise<void> {
  if (!selectedIds.value.size) return
  if (!confirm(`${selectedIds.value.size} دانش‌آموز به پایه بعد ارتقا یابند و اطلاعات سال جاری بایگانی شود؟`)) return
  const year = new Date().getFullYear()
  await studentsStore.promoteStudents([...selectedIds.value], year, null)
  clearSelection()
}

async function deleteStudent(id: string): Promise<void> {
  if (!confirm('این دانش‌آموز حذف شود؟')) return
  await studentsStore.removeStudent(id)
  selectedIds.value.delete(id)
}

async function toggleWeak(id: string): Promise<void> {
  const student = studentsStore.byId(id)
  if (!student) return
  await studentsStore.updateStudent({ ...student, isAcademicallyWeak: !student.isAcademicallyWeak })
}

async function toggleDisruptive(id: string): Promise<void> {
  const student = studentsStore.byId(id)
  if (!student) return
  await studentsStore.updateStudent({ ...student, isDisruptive: !student.isDisruptive })
}

async function updateGpa(id: string, value: string): Promise<void> {
  const student = studentsStore.byId(id)
  if (!student) return
  const gpa = value === '' ? null : Number(value)
  await studentsStore.updateStudent({ ...student, gpa })
}

async function updateDiscipline(id: string, value: string): Promise<void> {
  const student = studentsStore.byId(id)
  if (!student) return
  const disciplineScore = value === '' ? null : Number(value)
  await studentsStore.updateStudent({ ...student, disciplineScore })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />

    <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-50">مدیریت دانش‌آموزان</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">افزودن، ویرایش و گروه‌بندی عادلانه دانش‌آموزان هر پایه</p>
        </div>
        <RouterLink
          v-if="activeGrade !== null"
          :to="`/students/grouping?grade=${activeGrade}&level=${activeLevelId}`"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          گروه‌بندی عادلانه این پایه
        </RouterLink>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="level in LEVELS"
          :key="level.id"
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="activeLevelId === level.id ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
          @click="selectLevel(level.id)"
        >
          {{ level.name }}
        </button>
      </div>

      <div class="mb-6 flex flex-wrap gap-2">
        <button
          v-for="grade in gradesOfActiveLevel"
          :key="grade"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
          :class="activeGrade === grade ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
          @click="activeGrade = grade"
        >
          پایه {{ gradeLabel(grade) }}
        </button>
      </div>

      <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">افزودن سریع دانش‌آموز</p>
          <div class="flex flex-wrap gap-2">
            <input v-model="newFirstName" type="text" placeholder="نام" class="min-w-[100px] flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
            <input v-model="newLastName" type="text" placeholder="نام‌خانوادگی" class="min-w-[100px] flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
            <select v-model="newGender" class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
              <option value="male">پسر</option>
              <option value="female">دختر</option>
            </select>
            <button type="button" class="rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700" @click="addStudent">افزودن</button>
          </div>
        </div>

        <div class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">ورود از فایل اکسل / CSV</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="downloadStudentImportTemplate">
              دانلود قالب خالی اکسل
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              :disabled="isImportingFile"
              @click="triggerFileDialog"
            >
              {{ isImportingFile ? 'در حال خواندن…' : 'انتخاب فایل و ورود' }}
            </button>
            <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileSelected" />
          </div>
          <p class="mt-2 text-[11px] text-ink-400 dark:text-ink-500">
            ستون‌ها به ترتیب: نام، نام‌خانوادگی، جنسیت (پسر/دختر)، معدل (اختیاری)، امتیاز انضباطی (اختیاری).
          </p>
          <p v-if="fileImportMessage" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{{ fileImportMessage }}</p>

          <div class="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-ink-600 dark:text-ink-300">یا ورود گروهی با کپی/پیست متنی</p>
              <button type="button" class="text-xs text-brand-600 dark:text-brand-400" @click="isImportOpen = !isImportOpen">
                {{ isImportOpen ? 'بستن' : 'باز کردن' }}
              </button>
            </div>
            <template v-if="isImportOpen">
              <p class="mt-2 text-xs text-ink-400 dark:text-ink-500">هر سطر یک دانش‌آموز: نام, نام‌خانوادگی, جنسیت(m/f)</p>
              <textarea v-model="importText" rows="4" placeholder="علی, رضایی, m&#10;سارا, احمدی, f" class="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"></textarea>
              <button type="button" class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="importBulk">ثبت همه</button>
            </template>
          </div>
        </div>
      </div>

      <div v-if="selectedIds.size" class="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs dark:border-brand-500/30 dark:bg-brand-500/10">
        <span class="text-brand-700 dark:text-brand-300">{{ selectedIds.size }} دانش‌آموز انتخاب شده</span>
        <button type="button" class="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white" @click="promoteSelected">ارتقا به پایه بعد</button>
        <button type="button" class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 dark:border-ink-700 dark:bg-ink-900" @click="clearSelection">لفو انتخاب</button>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr class="border-b border-ink-100 text-right text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">
              <th class="p-3"><input type="checkbox" @change="selectAllVisible" /></th>
              <th class="p-3">نام و نام‌خانوادگی</th>
              <th class="p-3">جنسیت</th>
              <th class="p-3">معدل / رتبه</th>
              <th class="p-3">انضباط</th>
              <th class="p-3">وضعیت</th>
              <th class="p-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in visibleStudents" :key="student.id" class="border-b border-ink-50 dark:border-ink-800/60">
              <td class="p-3"><input type="checkbox" :checked="selectedIds.has(student.id)" @change="toggleSelect(student.id)" /></td>
              <td class="p-3 text-ink-800 dark:text-ink-100">{{ student.firstName }} {{ student.lastName }}</td>
              <td class="p-3 text-ink-500 dark:text-ink-400">{{ student.gender === 'male' ? 'پسر' : 'دختر' }}</td>
              <td class="p-3">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  :value="student.gpa ?? ''"
                  placeholder="-"
                  class="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                  @change="updateGpa(student.id, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="p-3">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  :value="student.disciplineScore ?? ''"
                  placeholder="-"
                  class="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                  @change="updateDiscipline(student.id, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="p-3">
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="rounded-full px-2 py-1 text-[11px]"
                    :class="student.isAcademicallyWeak ? 'bg-amber-500 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
                    @click="toggleWeak(student.id)"
                  >
                    ضعیف علمی
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-2 py-1 text-[11px]"
                    :class="student.isDisruptive ? 'bg-red-500 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'"
                    @click="toggleDisruptive(student.id)"
                  >
                    بی‌انضباط
                  </button>
                </div>
              </td>
              <td class="p-3 text-left">
                <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteStudent(student.id)">حذف</button>
              </td>
            </tr>
            <tr v-if="!visibleStudents.length">
              <td colspan="7" class="p-6 text-center text-xs text-ink-400 dark:text-ink-500">هنوز دانش‌آموزی برای این پایه ثبت نشده است.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
