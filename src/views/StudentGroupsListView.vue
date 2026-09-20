<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudentGroupsStore } from '@/stores/student-groups'
import { useStudentsStore } from '@/stores/students'
import { useTeachersStore } from '@/stores/teachers'
import { gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'
import GroupDetailModal from '@/components/students/GroupDetailModal.vue'
import PrintableStudentGroup from '@/components/students/PrintableStudentGroup.vue'
import { printPage } from '@/utils/export'
import type { Student, StudentGroup } from '@/types'

const studentGroupsStore = useStudentGroupsStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()

onMounted(async () => {
  await Promise.all([studentGroupsStore.loadFromDb(), studentsStore.loadFromDb(), teachersStore.loadFromDb()])
})

const groupsByGrade = computed(() => {
  const map = new Map<number, StudentGroup[]>()
  for (const group of studentGroupsStore.items) {
    if (!map.has(group.grade)) map.set(group.grade, [])
    map.get(group.grade)!.push(group)
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
})

function studentsOf(studentIds: string[]): Student[] {
  return studentIds.map((id) => studentsStore.byId(id)).filter((s): s is Student => !!s)
}

function groupStats(studentIds: string[]) {
  const students = studentsOf(studentIds)
  const gpas = students.map((s) => s.gpa).filter((v): v is number => v !== null)
  const disciplines = students.map((s) => s.disciplineScore).filter((v): v is number => v !== null)
  return {
    count: students.length,
    avgGpa: gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(1) : '-',
    avgDiscipline: disciplines.length ? (disciplines.reduce((a, b) => a + b, 0) / disciplines.length).toFixed(1) : '-',
  }
}

async function deleteGroup(id: string): Promise<void> {
  if (!confirm('این گروه برای همیشه حذف شود؟ (دانش‌آموزان عضو، حذف نمی‌شوند)')) return
  await studentGroupsStore.removeGroup(id)
}

async function deleteAllOfGrade(grade: number): Promise<void> {
  if (!confirm(`همه گروه‌های پایه ${gradeLabel(grade)} حذف شوند؟`)) return
  await studentGroupsStore.removeGroupsForGrade(grade)
}

const detailGroup = ref<StudentGroup | null>(null)
const isDetailOpen = ref(false)

function openDetail(group: StudentGroup): void {
  detailGroup.value = group
  isDetailOpen.value = true
}

const detailTeacher = computed(() => (detailGroup.value?.teacherId ? teachersStore.byId(detailGroup.value.teacherId) ?? null : null))

const printingGroup = ref<StudentGroup | null>(null)

async function printGroup(group: StudentGroup): Promise<void> {
  printingGroup.value = group
  await nextTick()
  printPage()
}

window.addEventListener('afterprint', () => {
  printingGroup.value = null
})
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6 print:hidden">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-50">گروه‌بندی‌های من</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">فهرست گروه‌های ذخیره‌شده به تفکیک پایه؛ برای مشاهده جزئیات کامل روی هر کارت کلیک کنید.</p>
        </div>
        <RouterLink to="/students" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
          بازگشت به دانش‌آموزان
        </RouterLink>
      </div>

      <div v-if="!groupsByGrade.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-7 w-7">
            <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="text-ink-500 dark:text-ink-400">هنوز هیچ گروه‌بندی ذخیره نشده است.</p>
        <RouterLink to="/students" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          شروع گروه‌بندی
        </RouterLink>
      </div>

      <div v-else class="space-y-10">
        <div v-for="[grade, groups] in groupsByGrade" :key="grade">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-base font-bold text-ink-800 dark:text-ink-100">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white dark:bg-brand-600">{{ groups.length }}</span>
              پایه {{ gradeLabel(grade) }}
            </h2>
            <div class="flex gap-3">
              <RouterLink
                :to="`/students/grouping?grade=${grade}&level=${groups[0]?.levelId ?? 'elementary'}`"
                class="text-xs font-medium text-brand-600 dark:text-brand-400"
              >
                گروه‌بندی مجدد
              </RouterLink>
              <button type="button" class="text-xs font-medium text-red-600 dark:text-red-400" @click="deleteAllOfGrade(grade)">حذف همه</button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="group in groups"
              :key="group.id"
              class="group cursor-pointer overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
              @click="openDetail(group)"
            >
              <div
                class="h-1.5"
                :class="group.gender === 'female' ? 'bg-gradient-to-l from-pink-500 to-pink-300' : 'bg-gradient-to-l from-brand-600 to-brand-400'"
              ></div>
              <div class="p-4">
                <div class="mb-2 flex items-start justify-between gap-2">
                  <p class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ group.title }}</p>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    :class="group.gender === 'female' ? 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'"
                  >
                    {{ group.gender === 'female' ? 'دختر' : 'پسر' }}
                  </span>
                </div>

                <div class="mb-3 grid grid-cols-3 gap-2 text-[11px] text-ink-500 dark:text-ink-400">
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    {{ groupStats(group.studentIds).count }}/{{ group.capacity }}
                  </span>
                  <span>معدل {{ groupStats(group.studentIds).avgGpa }}</span>
                  <span>انضباط {{ groupStats(group.studentIds).avgDiscipline }}</span>
                </div>

                <div class="mb-3 flex flex-wrap gap-1.5">
                  <span
                    v-for="student in studentsOf(group.studentIds).slice(0, 6)"
                    :key="student.id"
                    class="rounded-lg bg-ink-50 px-2 py-1 text-[11px] text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                  >
                    {{ student.firstName }} {{ student.lastName }}
                  </span>
                  <span
                    v-if="group.studentIds.length > 6"
                    class="rounded-lg bg-ink-50 px-2 py-1 text-[11px] text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                  >
                    +{{ group.studentIds.length - 6 }} نفر دیگر
                  </span>
                </div>

                <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800" @click.stop>
                  <button type="button" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400" @click="printGroup(group)">
                    خروجی PDF
                  </button>
                  <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteGroup(group.id)">حذف این گروه</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <GroupDetailModal
      v-model="isDetailOpen"
      :group="detailGroup"
      :students="detailGroup ? studentsOf(detailGroup.studentIds) : []"
      :teacher="detailTeacher"
    />

    <div v-if="printingGroup" id="print-root" class="hidden print:block">
      <PrintableStudentGroup :group="printingGroup" :students="studentsOf(printingGroup.studentIds)" />
    </div>
  </div>
</template>
