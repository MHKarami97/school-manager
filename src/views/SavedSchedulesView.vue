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
  <div class="min-h-screen bg-ink-50 pb-16">
    <AppHeader />

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-ink-900">برنامه‌های ذخیره‌شده من</h1>
        <RouterLink to="/wizard" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">ساخت برنامه جدید</RouterLink>
      </div>

      <div v-if="!schedulesStore.items.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
        <p class="text-ink-500">هنوز هیچ برنامه‌ای ذخیره نکرده‌اید.</p>
        <RouterLink to="/wizard" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          شروع ساخت برنامه
        </RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="item in schedulesStore.items" :key="item.id" class="rounded-2xl border border-ink-100 bg-white p-5">
          <p class="text-base font-semibold text-ink-800">{{ item.title }}</p>
          <p class="mt-1 text-xs text-ink-500">
            {{ levelName(item.levelId) }} — پایه {{ item.grades.map((g) => gradeLabel(g.grade)).join('، ') }}
          </p>
          <p class="mt-1 text-xs text-ink-400">آخرین ویرایش: {{ formattedDate(item.updatedAt) }}</p>

          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink :to="`/schedules/${item.id}`" class="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-white">
              باز کردن و ویرایش
            </RouterLink>
            <button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600" @click="handleDelete(item.id)">
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
