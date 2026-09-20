<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWizardStore } from '@/stores/wizard'
import { useTeachersStore } from '@/stores/teachers'
import { getCurriculumForGrade } from '@/config/curriculum.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { mainTeacherKey, sportTeacherKey } from '@/utils/wizard-keys'
import TeacherAutocompleteInput from './TeacherAutocompleteInput.vue'

const wizard = useWizardStore()
const teachersStore = useTeachersStore()

onMounted(() => {
  teachersStore.loadFromDb()
})

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))
const isSingleTeacherMode = computed(() => level.value?.schedulingMode === 'single-teacher')

const mainNameInputs = ref<Record<number, string>>({})
const sportNameInputs = ref<Record<number, string>>({})

function gradeHasSport(grade: number): boolean {
  if (!wizard.levelId) return false
  const hours = getCurriculumForGrade(wizard.levelId, grade)
  return (hours.sport ?? 0) > 0
}

function currentMainTeacherName(grade: number): string {
  const id = wizard.teacherSelections[mainTeacherKey(grade)]?.[0]
  return id ? teachersStore.byId(id)?.name ?? '' : ''
}

function currentSportTeacherName(grade: number): string {
  const id = wizard.teacherSelections[sportTeacherKey(grade)]?.[0]
  return id ? teachersStore.byId(id)?.name ?? '' : ''
}

async function saveMainTeacher(grade: number): Promise<void> {
  const name = (mainNameInputs.value[grade] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name)
  wizard.setTeacherSelection(mainTeacherKey(grade), [teacher.id])
  mainNameInputs.value[grade] = ''
}

async function saveSportTeacher(grade: number): Promise<void> {
  const name = (sportNameInputs.value[grade] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, ['sport'])
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

async function addCourseTeacher(courseId: string): Promise<void> {
  const name = (courseNameInputs.value[courseId] ?? '').trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, [courseId])
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
      <div v-for="grade in wizard.selectedGrades" :key="grade" class="rounded-2xl border border-ink-100 bg-white p-5">
        <p class="mb-3 text-sm font-semibold text-ink-800">پایه {{ gradeLabel(grade) }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600">
              {{ wizard.audience === 'self' ? 'نام شما (معلم این پایه)' : 'نام معلم این پایه' }}
              <span v-if="currentMainTeacherName(grade)" class="text-brand-600">- ثبت‌شده: {{ currentMainTeacherName(grade) }}</span>
            </label>
            <div class="flex gap-2">
              <TeacherAutocompleteInput
                v-model="mainNameInputs[grade]"
                placeholder="مثلاً خانم احمدی"
                @keyup.enter="saveMainTeacher(grade)"
              />
              <button
                type="button"
                class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white"
                @click="saveMainTeacher(grade)"
              >
                ثبت
              </button>
            </div>
          </div>

          <div v-if="gradeHasSport(grade)">
            <label class="mb-1 block text-xs font-medium text-ink-600">
              معلم ورزش (اختیاری - در فیر این صورت همان معلم اصلی)
              <span v-if="currentSportTeacherName(grade)" class="text-brand-600">- ثبت‌شده: {{ currentSportTeacherName(grade) }}</span>
            </label>
            <div class="flex gap-2">
              <TeacherAutocompleteInput
                v-model="sportNameInputs[grade]"
                placeholder="مثلاً آقای رضایی"
                @keyup.enter="saveSportTeacher(grade)"
              />
              <button
                type="button"
                class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white"
                @click="saveSportTeacher(grade)"
              >
                ثبت
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="courseId in requiredCourseIds" :key="courseId" class="rounded-2xl border border-ink-100 bg-white p-5">
        <p class="mb-3 text-sm font-semibold text-ink-800">{{ courseLabel(courseId) }}</p>
        <div class="mb-3 flex flex-wrap gap-2">
          <span
            v-for="teacherId in wizard.teacherSelections[courseId] ?? []"
            :key="teacherId"
            class="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700"
          >
            {{ teachersStore.byId(teacherId)?.name }}
            <button type="button" class="text-brand-400 hover:text-brand-700" @click="removeCourseTeacher(courseId, teacherId)">×</button>
          </span>
          <span v-if="!(wizard.teacherSelections[courseId] ?? []).length" class="text-xs text-ink-400">هنوز معلمی ثبت نشده</span>
        </div>
        <div class="flex gap-2">
          <TeacherAutocompleteInput
            v-model="courseNameInputs[courseId]"
            placeholder="نام معلم را وارد و ثبت کنید"
            @keyup.enter="addCourseTeacher(courseId)"
          />
          <button
            type="button"
            class="shrink-0 rounded-lg bg-ink-800 px-3 text-xs font-medium text-white"
            @click="addCourseTeacher(courseId)"
          >
            افزودن
          </button>
        </div>
      </div>
      <p class="text-xs text-ink-400">
        اگر یک درس چند معلم دارد (مثلاً ریاضی در چند پایه)، همه را همین‌جا اضافه کنید؛ موتور ساعت‌ها را به‌صورت عادلانه بین آن‌ها توزیع می‌کند.
      </p>
    </template>
  </div>
</template>
