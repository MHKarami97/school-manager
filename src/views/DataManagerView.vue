<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import ImportPanel from '@/components/data-manager/ImportPanel.vue'
import TableBrowser from '@/components/data-manager/TableBrowser.vue'
import { GROUP_LABELS, tableDef, type GroupId } from '@/data-manager/table-registry'
import { tableService, type TableCount } from '@/data-manager/table-service'

const route = useRoute()

const counts = ref<TableCount[]>([])
const selected = ref(typeof route.query.t === 'string' ? route.query.t : '')
const tab = ref<'tables' | 'import'>('tables')
const isLoading = ref(true)
const browserAnchor = ref<HTMLElement | null>(null)

const groups = computed(() => {
  const result = new Map<GroupId, TableCount[]>()
  for (const item of counts.value) {
    const group = tableDef(item.name).group
    result.set(group, [...(result.get(group) ?? []), item])
  }
  return Array.from(result, ([group, tables]) => ({
    group,
    label: GROUP_LABELS[group],
    tables: tables.sort((a, b) => tableDef(a.name).label.localeCompare(tableDef(b.name).label, 'fa')),
  }))
})

async function refreshCounts(): Promise<void> {
  counts.value = await tableService.counts()
}

onMounted(async () => {
  await refreshCounts()
  isLoading.value = false
})

async function selectTable(name: string): Promise<void> {
  selected.value = name
  await nextTick()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  browserAnchor.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">مدیریت داده‌ها</h1>
        <RouterLink to="/settings" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">تنظیمات</RouterLink>
      </div>
      <p class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        اینجا مستقیم روی داده‌های برنامه کار می‌کنید. حذف یک رکورد، رکوردهای وابسته‌اش را هم پاک می‌کند (مثلاً حذف دانش‌آموز، حضور و غیاب و سرویس او را هم حذف می‌کند). پیش از تغییرهای بزرگ از «تنظیمات» پشتیبان بگیرید.
      </p>

      <div class="mb-4 flex gap-2" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'tables'" class="min-h-11 rounded-lg px-4 text-sm font-medium" :class="tab === 'tables' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'" @click="tab = 'tables'">جدول‌ها</button>
        <button type="button" role="tab" :aria-selected="tab === 'import'" class="min-h-11 rounded-lg px-4 text-sm font-medium" :class="tab === 'import' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'" @click="tab = 'import'">ورود گروهی از فایل</button>
      </div>

      <p v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</p>

      <ImportPanel v-else-if="tab === 'import'" @changed="refreshCounts" />

      <div v-else class="space-y-4">
        <section v-for="group in groups" :key="group.group" :aria-label="group.label">
          <h2 class="mb-1.5 text-xs font-semibold text-ink-500 dark:text-ink-400">{{ group.label }}</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in group.tables"
              :key="item.name"
              type="button"
              class="min-h-11 rounded-xl border px-3 text-xs font-medium"
              :class="selected === item.name ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200'"
              :aria-pressed="selected === item.name"
              @click="selectTable(item.name)"
            >
              {{ tableDef(item.name).label }}
              <span class="mr-1 opacity-70">{{ item.count.toLocaleString('fa-IR') }}</span>
            </button>
          </div>
        </section>

        <div ref="browserAnchor" class="min-h-[70vh] scroll-mt-20">
          <div v-if="selected" class="mb-2 flex flex-wrap items-center gap-3 text-xs">
            <RouterLink :to="{ path: '/settings', query: { table: selected }, hash: '#backup-export' }" class="flex min-h-11 items-center text-brand-600 hover:underline dark:text-brand-400">پشتیبان‌گیری از این جدول</RouterLink>
            <RouterLink :to="{ path: '/settings', hash: '#backup-import' }" class="flex min-h-11 items-center text-brand-600 hover:underline dark:text-brand-400">بازیابی از پشتیبان</RouterLink>
          </div>
          <TableBrowser v-if="selected" :key="selected" :table="selected" @changed="refreshCounts" />
          <p v-else class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">یک جدول را انتخاب کنید.</p>
        </div>
      </div>
    </main>
  </div>
</template>
