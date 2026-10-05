<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTeachingPlansStore } from '../stores/teaching-plans'
import { getLevelById } from '../config/levels.config'
import AppHeader from '../components/layout/AppHeader.vue'
import { formatJalaaliDate, isoStringToJalaali } from '../utils/jalaali'

const plansStore = useTeachingPlansStore()
onMounted(() => plansStore.loadFromDb())

const sortedPlans = computed(() => [...plansStore.items].sort((a, b) => b.updatedAt - a.updatedAt))

function dateLabel(iso: string): string {
  const jalaali = iso ? isoStringToJalaali(iso) : null
  return jalaali ? formatJalaaliDate(jalaali) : ''
}

async function deletePlan(id: string): Promise<void> {
  if (!confirm('این برنامه‌ی تدریس حذف شود؟')) return
  await plansStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">تخصیص معلم به کلاس</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ plansStore.items.length }} برنامه‌ی تدریس</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/teaching-plans/teachers" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            معلمان و محدودیت‌ها
          </RouterLink>
          <RouterLink to="/teaching-plans/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">+ برنامه‌ی جدید</RouterLink>
        </div>
      </div>

      <div v-if="!sortedPlans.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز برنامه‌ی تدریسی ساخته نشده است.</p>
        <RouterLink to="/teaching-plans/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">ساخت اولین برنامه</RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="plan in sortedPlans" :key="plan.id" class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ plan.title || 'بدون عنوان' }}</p>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium" :class="plan.generatedAt ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'">
                {{ plan.generatedAt ? 'ساخته‌شده' : 'ساخته‌نشده' }}
              </span>
            </div>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">{{ getLevelById(plan.levelId)?.name }} - {{ plan.shiftConfig.name }}</p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
              {{ plan.classes.length }} کلاس - {{ plan.teacherIds.length }} معلم - {{ plan.slots.length }} ساعت چیده‌شده
              <template v-if="dateLabel(plan.effectiveFrom)"> - از {{ dateLabel(plan.effectiveFrom) }}</template>
            </p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink :to="`/teaching-plans/${plan.id}`" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">مدیریت و چاپ</RouterLink>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deletePlan(plan.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
