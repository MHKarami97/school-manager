<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SERVICE_GUIDE_STEPS } from '@/config/service-guide.config'
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 sm:pb-0 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-200">راهنمای سرویس مدارس</h1>
        <RouterLink to="/service/drivers" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">شروع</RouterLink>
      </div>
      <ol class="space-y-6">
        <li v-for="step in SERVICE_GUIDE_STEPS" :key="step.title" class="rounded-2xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <h2 class="text-base font-semibold text-ink-800 dark:text-ink-200">{{ step.title }}</h2>
          <p class="mt-2 text-sm leading-7 text-ink-600 dark:text-ink-300">{{ step.body }}</p>
        </li>
      </ol>
    </main>
    <AppFooter />
  </div>
</template>
