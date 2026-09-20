<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudentGroupsStore } from '@/stores/student-groups'
import { useStudentsStore } from '@/stores/students'
import { gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'
import type { Student } from '@/types'

const studentGroupsStore = useStudentGroupsStore()
const studentsStore = useStudentsStore()

onMounted(async () => {
  await Promise.all([studentGroupsStore.loadFromDb(), studentsStore.loadFromDb()])
})

const groupsByGrade = computed(() => {
  const map = new Map<number, typeof studentGroupsStore.items>()
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
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-50">گروه‌بندی‌های من</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">فهرست گروه‌های ذخیره‌شده به تفکیک پایه</p>
        </div>
        <RouterLink to="/students" class="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200">
          بازگشت به دانش‌آموزان
        </RouterLink>
      </div>

      <div v-if="!groupsByGrade.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز هیچ گروه‌بندی ذخیره نشده است.</p>
        <RouterLink to="/students" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          شروع گروه‌بندی
        </RouterLink>
      </div>

      <div v-else class="space-y-8">
        <div v-for="[grade, groups] in groupsByGrade" :key="grade">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-bold text-ink-800 dark:text-ink-100">پایه {{ gradeLabel(grade) }}</h2>
            <div class="flex gap-2">
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
            <div v-for="group in groups" :key="group.id" class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ group.title }}</p>
                <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {{ group.gender === 'female' ? 'دختر' : 'پسر' }}
                </span>
              </div>
              <div class="mb-3 grid grid-cols-3 gap-2 text-[11px] text-ink-500 dark:text-ink-400">
                <span>{{ groupStats(group.studentIds).count }} / {{ group.capacity }} نفر</span>
                <span>معدل: {{ groupStats(group.studentIds).avgGpa }}</span>
                <span>انضباط: {{ groupStats(group.studentIds).avgDiscipline }}</span>
              </div>
              <div class="mb-3 flex flex-wrap gap-1.5">
                <span
                  v-for="student in studentsOf(group.studentIds)"
                  :key="student.id"
                  class="rounded-lg bg-ink-50 px-2 py-1 text-[11px] text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                >
                  {{ student.firstName }} {{ student.lastName }}
                </span>
              </div>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteGroup(group.id)">حذف این گروه</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
