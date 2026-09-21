<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSchedulesStore } from '@/stores/schedules'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'

const schedulesStore = useSchedulesStore()

onMounted(() => {
  schedulesStore.loadFromDb()
})

function levelName(levelId: string): string {
  return getLevelById(levelId)?.name ?? levelId
}

function formattedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function handleDelete(id: string): Promise<void> {
  if (!confirm('این برنامه برای همیشه حذف شود؟')) return
  await schedulesStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">برنامه‌های ذخیره‌شده من</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ schedulesStore.items.length }} برنامه ذخیره‌شده روی همین دستگاه</p>
        </div>
        <RouterLink to="/wizard" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">+ ساخت برنامه جدید</RouterLink>
      </div>

      <div v-if="!schedulesStore.items.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-7 w-7"><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        </div>
        <p class="text-ink-500 dark:text-ink-400">هنوز هیچ برنامه‌ای ذخیره نکرده‌اید.</p>
        <RouterLink to="/wizard" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">شروع ساخت برنامه</RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="item in schedulesStore.items" :key="item.id" class="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-2">
              <p class="text-base font-semibold text-ink-800 dark:text-ink-200">{{ item.title }}</p>
              <span class="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{{ levelName(item.levelId) }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span v-for="g in item.grades" :key="g.grade" class="rounded-lg bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">پایه {{ gradeLabel(g.grade) }}</span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-400 dark:text-ink-500">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5"><path d="M12 7v5l3 3M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                {{ item.shiftConfig.name }}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                {{ item.teachers.length }} معلم
              </span>
              <span>آخرین ویرایش: {{ formattedDate(item.updatedAt) }}</span>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <RouterLink :to="`/schedules/${item.id}`" class="col-span-1 rounded-lg bg-ink-900 px-3 py-2 text-center text-xs font-medium text-white dark:bg-brand-600">باز کردن و ویرایش</RouterLink>
              <button type="button" class="col-span-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-500/30 dark:text-red-400" @click="handleDelete(item.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
