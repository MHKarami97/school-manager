<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useExamSessionsStore } from '../stores/exam-sessions'
import { useExamRoomsStore } from '../stores/exam-rooms'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { jalaaliDateLabel } from '../utils/exam-seating-helpers'
import AppHeader from '../components/layout/AppHeader.vue'

const sessionsStore = useExamSessionsStore()
const roomsStore = useExamRoomsStore()

onMounted(async () => {
  await Promise.all([sessionsStore.loadFromDb(), roomsStore.loadFromDb()])
})

const sortedSessions = computed(() =>
  [...sessionsStore.items].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.updatedAt - a.updatedAt),
)

async function deleteSession(id: string): Promise<void> {
  if (!confirm('این جلسه‌ی امتحان حذف شود؟')) return
  await sessionsStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">چیدمان صندلی امتحان</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ sessionsStore.items.length }} جلسه — {{ roomsStore.items.length }} سالن تعریف‌شده</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/exam-seating/rooms" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            مدیریت سالن‌ها
          </RouterLink>
          <RouterLink to="/exam-seating/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
            + جلسه‌ی جدید
          </RouterLink>
        </div>
      </div>

      <div v-if="!roomsStore.items.length" class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
        قبل از ساخت جلسه، حداقل یک سالن تعریف کن.
        <RouterLink to="/exam-seating/rooms" class="font-semibold underline">تعریف سالن</RouterLink>
      </div>

      <div v-if="!sortedSessions.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز جلسه‌ی امتحانی ثبت نشده است.</p>
        <RouterLink to="/exam-seating/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">ساخت اولین جلسه</RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="session in sortedSessions" :key="session.id" class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ session.title || 'بدون عنوان' }}</p>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium"
                :class="session.generatedAt ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'"
              >
                {{ session.generatedAt ? 'چیده‌شده' : 'چیده‌نشده' }}
              </span>
            </div>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              <template v-if="findCourse(BASE_COURSES, session.courseId)">{{ findCourse(BASE_COURSES, session.courseId)!.name }} — </template>{{ jalaaliDateLabel(session.date) }}
              <template v-if="session.time"> — {{ session.time }}</template>
            </p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
              {{ session.participantIds.length }} شرکت‌کننده — {{ session.roomIds.length }} سالن
              <template v-if="session.unseatedIds.length"> — <span class="text-red-600 dark:text-red-400">{{ session.unseatedIds.length }} نفر بدون صندلی</span></template>
            </p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink :to="`/exam-seating/${session.id}`" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">مدیریت و چاپ</RouterLink>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteSession(session.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
