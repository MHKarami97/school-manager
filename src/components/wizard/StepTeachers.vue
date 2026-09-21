<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWizardStore } from '@/stores/wizard'
import { useTeachersStore } from '@/stores/teachers'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { mainTeacherKey, sportTeacherKey } from '@/utils/wizard-keys'
import { formatTeacherName } from '@/utils/teacher-format'
import type { TeacherGender } from '@/types'
import TeacherAutocompleteInput from './TeacherAutocompleteInput.vue'

const wizard = useWizardStore()
const teachersStore = useTeachersStore()

onMounted(() => {
  teachersStore.loadFromDb()
})

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))
const isSingleTeacherMode = computed(() => level.value?.schedulingMode === 'single-teacher')

const mainNameInputs = ref<Record<number, string>>({})
const mainGenderInputs = ref<Record<number, TeacherGender | null>>({})
const sportNameInputs = ref<Record<number, string>>({})
const sportGenderInputs = ref<Record<number, TeacherGender | null>>({})

function gradeHasSport(grade: number): boolean {
  if (!wizard.levelId) return false
  const hours = getCurriculumForGrade(wizard.levelId, grade)
  return (hours.sport ?? 0) > 0
}

function currentMainTeacherLabel(grade: number): string {
  const id = wizard.teacherSelections[mainTeacherKey(grade)]?.[0]
  return id ? formatTeacherName(teachersStore.byId(id)) : ''
}

function currentSportTeacherLabel(grade: number): string {
  const id = wizard.teacherSelections[sportTeacherKey(grade)]?.[0]
  return id ? formatTeacherName(teachersStore.byId(id)) : ''
}

async function saveMainTeacher(grade: number): Promise<void> {
  const name = (mainNameInputs.value[grade] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, [], mainGenderInputs.value[grade] ?? null)
  wizard.setTeacherSelection(mainTeacherKey(grade), [teacher.id])
  mainNameInputs.value[grade] = ''
}

async function saveSportTeacher(grade: number): Promise<void> {
  const name = (sportNameInputs.value[grade] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, ['sport'], sportGenderInputs.value[grade] ?? null)
  wizard.setTeacherSelection(sportTeacherKey(grade), [teacher.id])
  sportNameInputs.value[grade] = ''
}

const requiredCourseIds = computed<string[]>(() => {
  if (!wizard.levelId) return []
  const ids = new Set<string>()
  for (const grade of wizard.selectedGrades) {
    const hours = getCurriculumForGrade(wizard.levelId, grade)
    Object.keys(hours).forEach((id) => ids.add(id))
  }
  return Array.from(ids)
})

const courseNameInputs = ref<Record<string, string>>({})
const courseGenderInputs = ref<Record<string, TeacherGender | null>>({})

async function addCourseTeacher(courseId: string): Promise<void> {
  const name = (courseNameInputs.value[courseId] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, [courseId], courseGenderInputs.value[courseId] ?? null)
  const current = wizard.teacherSelections[courseId] ?? []
  if (!current.includes(teacher.id)) {
    wizard.setTeacherSelection(courseId, [...current, teacher.id])
  }
  courseNameInputs.value[courseId] = ''
}

function removeCourseTeacher(courseId: string, teacherId: string): void {
  const current = wizard.teacherSelections[courseId] ?? []
  wizard.setTeacherSelection(
    courseId,
    current.filter((id) => id !== teacherId),
  )
}

function courseLabel(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}
</script>

<template>
  <div class="space-y-6">
    <template v-if="isSingleTeacherMode">
      <div v-for="grade in wizard.selectedGrades" :key="grade" class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">پایه {{ gradeLabel(grade) }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
              {{ wizard.audience === 'self' ? 'نام شما (معلم این پایه)' : 'نام معلم این پایه' }}
              <span v-if="currentMainTeacherLabel(grade)" class="text-brand-600 dark:text-brand-400">- ثبت‌شده: {{ currentMainTeacherLabel(grade) }}</span>
            </label>
            <div class="flex gap-2">
              <TeacherAutocompleteInput v-model="mainNameInputs[grade]" placeholder="مثلاً احمدی" @keyup.enter="saveMainTeacher(grade)" />
              <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white dark:bg-ink-700" @click="saveMainTeacher(grade)">ثبت</button>
            </div>
            <div class="mt-1.5 flex gap-1.5">
              <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="mainGenderInputs[grade] === 'male' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="mainGenderInputs[grade] = 'male'">آقا</button>
              <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="mainGenderInputs[grade] === 'female' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="mainGenderInputs[grade] = 'female'">خانم</button>
            </div>
          </div>

          <div v-if="gradeHasSport(grade)">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
              معلم ورزش (اختیاری - در غیر این صورت همان معلم اصلی)
              <span v-if="currentSportTeacherLabel(grade)" class="text-brand-600 dark:text-brand-400">- ثبت‌شده: {{ currentSportTeacherLabel(grade) }}</span>
            </label>
            <div class="flex gap-2">
              <TeacherAutocompleteInput v-model="sportNameInputs[grade]" placeholder="مثلاً رضایی" @keyup.enter="saveSportTeacher(grade)" />
              <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white dark:bg-ink-700" @click="saveSportTeacher(grade)">ثبت</button>
            </div>
            <div class="mt-1.5 flex gap-1.5">
              <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="sportGenderInputs[grade] === 'male' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="sportGenderInputs[grade] = 'male'">آقا</button>
              <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="sportGenderInputs[grade] === 'female' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="sportGenderInputs[grade] = 'female'">خانم</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="courseId in requiredCourseIds" :key="courseId" class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ courseLabel(courseId) }}</p>
        <div class="mb-3 flex flex-wrap gap-2">
          <span v-for="teacherId in wizard.teacherSelections[courseId] ?? []" :key="teacherId" class="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {{ formatTeacherName(teachersStore.byId(teacherId)) }}
            <button type="button" class="text-brand-400 hover:text-brand-700 dark:hover:text-brand-200" @click="removeCourseTeacher(courseId, teacherId)">×</button>
          </span>
          <span v-if="!(wizard.teacherSelections[courseId] ?? []).length" class="text-xs text-ink-400 dark:text-ink-500">هنوز معلمی ثبت نشده</span>
        </div>
        <div class="flex gap-2">
          <TeacherAutocompleteInput v-model="courseNameInputs[courseId]" placeholder="نام معلم را وارد و ثبت کنید" @keyup.enter="addCourseTeacher(courseId)" />
          <button type="button" class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white dark:bg-ink-700" @click="addCourseTeacher(courseId)">افزودن</button>
        </div>
        <div class="mt-1.5 flex gap-1.5">
          <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="courseGenderInputs[courseId] === 'male' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="courseGenderInputs[courseId] = 'male'">آقا</button>
          <button type="button" class="rounded-full px-3 py-1 text-[11px] font-medium transition" :class="courseGenderInputs[courseId] === 'female' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'" @click="courseGenderInputs[courseId] = 'female'">خانم</button>
        </div>
      </div>
      <p class="text-xs text-ink-400 dark:text-ink-500">
        اگر یک درس چند معلم دارد (مثلاً ریاضی در چند پایه)، همه را همین‌جا اضافه کنید؛ موتور ساعت‌ها را به‌صورت عادلانه بین آن‌ها توزیع می‌کند.
      </p>
    </template>
  </div>
</template>
