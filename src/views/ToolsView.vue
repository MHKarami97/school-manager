<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES } from '@/config/features.config'
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-200">شروع یک کار جدید</h1>
        <p class="mt-3 text-ink-500 dark:text-ink-400">
          لیست ابزارهای مدیر یار
        </p>
      </div>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in SITE_FEATURES"
          :key="feature.id"
          class="flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path :d="feature.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h2 class="mt-4 text-base font-semibold text-ink-800 dark:text-ink-200">{{ feature.title }}</h2>
          <p class="mt-2 flex-1 text-sm leading-6 text-ink-500 dark:text-ink-400">{{ feature.description }}</p>
          <div class="mt-5 flex items-center gap-2">
            <RouterLink
              :to="feature.startPath"
              class="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {{ feature.startLabel }}
            </RouterLink>
            <RouterLink
              :to="feature.historyPath"
              class="rounded-xl border border-ink-200 px-3 py-2.5 text-xs font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            >
              تاریخچه
            </RouterLink>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
