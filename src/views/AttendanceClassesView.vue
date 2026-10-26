<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import ClassroomFormModal from '@/components/attendance/ClassroomFormModal.vue'
import { ALL_TEACHERS } from '@/config/attendance.config'
import { gradeLabel } from '@/config/levels.config'
import { useActiveTeacher } from '@/composables/use-active-teacher'
import { createEmptyClassroom, useClassroomsStore } from '@/stores/classrooms'
import { useTeachersStore } from '@/stores/teachers'
import type { Classroom } from '@/types'
import { formatTeacherName } from '@/utils/teacher-format'

const classroomsStore = useClassroomsStore()
const teachersStore = useTeachersStore()
const { activeTeacherId, teacherNameOf } = useActiveTeacher()

const isLoading = ref(true)
const isModalOpen = ref(false)
const editing = ref<Classroom | null>(null)

const visible = computed(() => classroomsStore.visibleFor(activeTeacherId.value))

onMounted(async () => {
  await Promise.all([classroomsStore.loadFromDb(), teachersStore.loadFromDb()])
  await classroomsStore.refreshCounts()
  isLoading.value = false
})

function openCreate(): void {
  editing.value = createEmptyClassroom(activeTeacherId.value || null)
  isModalOpen.value = true
}

function openEdit(classroom: Classroom): void {
  editing.value = { ...classroom }
  isModalOpen.value = true
}

async function saveClassroom(classroom: Classroom): Promise<void> {
  await classroomsStore.saveClassroom(classroom)
  await classroomsStore.refreshCounts()
}

async function removeClassroom(classroom: Classroom): Promise<void> {
  if (!confirm(`کلاس «${classroom.name}» با تمام سوابق حضور و غیابش حذف شود؟ این کار قابل بازگشت نیست.`)) return
  await classroomsStore.removeClassroom(classroom.id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">حضور و غیاب</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ visible.length.toLocaleString('fa-IR') }} کلاس</p>
        </div>
        <button type="button" class="min-h-11 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700" @click="openCreate">
          کلاس جدید
        </button>
      </div>

      <nav class="mb-4 flex flex-wrap gap-2" aria-label="بخش‌های حضور و غیاب">
        <RouterLink to="/attendance/principal" class="flex min-h-11 items-center rounded-xl bg-ink-900 px-4 text-sm font-medium text-white dark:bg-brand-600">پنل مدیر مدرسه</RouterLink>
        <RouterLink to="/attendance/absentees" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">لیست غایبین</RouterLink>
        <RouterLink to="/attendance/reports" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">گزارش‌ها</RouterLink>
        <RouterLink to="/attendance/guide" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">راهنما</RouterLink>
      </nav>

      <div class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        داده‌های حضور و غیاب فقط در حافظه‌ی همین مرورگر ذخیره می‌شود و پشتیبان‌گیری خودکار ندارد؛ پاک‌کردن اطلاعات مرورگر یا حذف اپ آن‌ها را از بین می‌برد.
        انتخاب معلم فقط فیلتر نمایش است و کنترل دسترسی واقعی نیست، چون اپ سرور و ورود کاربر ندارد.
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <label class="text-xs font-medium text-ink-600 dark:text-ink-300" for="teacher-filter">نمایش کلاس‌های</label>
        <select id="teacher-filter" v-model="activeTeacherId" class="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 sm:w-auto">
          <option :value="ALL_TEACHERS">همه‌ی معلم‌ها (مدیر)</option>
          <option v-for="teacher in teachersStore.sortedByName" :key="teacher.id" :value="teacher.id">{{ formatTeacherName(teacher) }}</option>
        </select>
      </div>

      <p v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</p>
      <div v-else-if="!visible.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز کلاسی تعریف نشده است.</p>
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <article v-for="classroom in visible" :key="classroom.id" class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ classroom.name }}</p>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              {{ gradeLabel(classroom.grade) }}<template v-if="classroom.academicYear"> - {{ classroom.academicYear }}</template><template v-if="classroom.shift"> - {{ classroom.shift }}</template>
            </p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
              {{ teacherNameOf(classroom.teacherId) || 'بدون معلم' }} - {{ (classroomsStore.memberCounts[classroom.id] ?? 0).toLocaleString('fa-IR') }} دانش‌آموز
            </p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <div class="flex gap-3">
                <RouterLink :to="`/attendance/classes/${classroom.id}`" class="flex min-h-11 items-center text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">حضور و غیاب</RouterLink>
                <button type="button" class="min-h-11 text-xs text-ink-600 hover:underline dark:text-ink-300" @click="openEdit(classroom)">ویرایش</button>
              </div>
              <button type="button" class="min-h-11 text-xs text-red-600 dark:text-red-400" @click="removeClassroom(classroom)">حذف</button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <ClassroomFormModal v-model="isModalOpen" :classroom="editing" @save="saveClassroom" />
  </div>
</template>
