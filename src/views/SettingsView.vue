<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import BackupPanel from '@/components/settings/BackupPanel.vue'
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-24 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 class="mb-1 text-xl font-bold text-ink-900 dark:text-ink-200">تنظیمات</h1>
      <p class="mb-6 text-sm text-ink-500 dark:text-ink-400">همه‌ی داده‌ها فقط در مرورگر همین دستگاه ذخیره می‌شوند؛ از آن‌ها پشتیبان بگیرید.</p>
      <BackupPanel />
    </main>
  </div>
</template>
