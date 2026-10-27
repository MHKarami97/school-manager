<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import BackupPanel from '@/components/settings/BackupPanel.vue'
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 class="mb-1 text-xl font-bold text-ink-900 dark:text-ink-200">تنظیمات</h1>
      <p class="mb-6 text-sm text-ink-500 dark:text-ink-400">همه‌ی داده‌ها فقط در مرورگر همین دستگاه ذخیره می‌شوند؛ از آن‌ها پشتیبان بگیرید.</p>

      <RouterLink to="/settings/data" class="mb-6 flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-brand-300 dark:border-ink-800 dark:bg-ink-900">
        <span>
          <span class="block text-base font-bold text-ink-800 dark:text-ink-200">مدیریت داده‌ها</span>
          <span class="mt-1 block text-xs leading-6 text-ink-500 dark:text-ink-400">مشاهده، افزودن، ویرایش و حذف رکوردهای همه‌ی جدول‌ها (تکی و گروهی)</span>
        </span>
        <span class="text-brand-600 dark:text-brand-400" aria-hidden="true">←</span>
      </RouterLink>

      <BackupPanel />
    </main>
  </div>
</template>
