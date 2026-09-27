<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSportPlansStore } from '@/stores/sport-plans'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'

const sportPlansStore = useSportPlansStore()
onMounted(() => sportPlansStore.loadFromDb())

function levelName(levelId: string): string {
  return getLevelById(levelId)?.name ?? levelId
}
function formattedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}
async function handleDelete(id: string): Promise<void> {
  if (!confirm('این برنامه ورزش حذف شود؟')) return
  await sportPlansStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">برنامه‌های ورزش</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ sportPlansStore.items.length }} برنامه ذخیره‌شده</p>
        </div>
        <RouterLink to="/sport/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
          + برنامه ورزش جدید
        </RouterLink>
      </div>

      <div v-if="!sportPlansStore.items.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز برنامه ورزشی نساخته‌ای.</p>
        <RouterLink to="/sport/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          شروع ساخت برنامه ورزش
        </RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="item in sportPlansStore.items"
          :key="item.id"
          class="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-2">
              <p class="text-base font-semibold text-ink-800 dark:text-ink-200">{{ item.title }}</p>
              <span class="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-11px font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                {{ levelName(item.levelId) }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span v-for="g in item.grades" :key="g" class="rounded-lg bg-ink-50 px-2 py-1 text-11px font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {{ gradeLabel(g) }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3 text-11px text-ink-400 dark:text-ink-500">
              <span>{{ item.classes.length }} کلاس</span>
              <span>{{ item.teachers.length }} معلم</span>
              <span>{{ formattedDate(item.updatedAt) }}</span>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <RouterLink :to="`/sport/${item.id}`" class="col-span-1 rounded-lg bg-ink-900 px-3 py-2 text-center text-xs font-medium text-white dark:bg-brand-600">
                مشاهده / ویرایش
              </RouterLink>
              <button type="button" class="col-span-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete(item.id)">
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
