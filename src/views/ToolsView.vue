<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { SITE_FEATURES, AUDIENCE_TABS, type FeatureAudience } from '@/config/features.config'

const selectedTab = ref<'all' | FeatureAudience>('all')

const filteredFeatures = computed(() => {
  if (selectedTab.value === 'all') {
    return SITE_FEATURES
  }
  return SITE_FEATURES.filter((f) => f.audiences.includes(selectedTab.value as FeatureAudience))
})
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950">
    <AppHeader />
    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-200">امکانات و ابزارهای مدیریار</h1>
        <p class="mt-2 text-ink-500 dark:text-ink-400">
          سامانه جامع برای کادر مدرسه، معلمان، اولیا و دانش‌آموزان
        </p>

        <!-- Role Tabs -->
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            v-for="tab in AUDIENCE_TABS"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition"
            :class="
              selectedTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
            "
            @click="selectedTab = tab.id"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path :d="tab.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ tab.shortLabel }}</span>
          </button>
        </div>
      </div>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in filteredFeatures"
          :key="feature.id"
          class="relative flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
          :class="{ 'opacity-90 ring-1 ring-amber-500/20': feature.status === 'coming-soon' }"
        >
          <div class="flex items-center justify-between">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl"
              :class="
                feature.status === 'coming-soon'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  : feature.isNew
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                <path :d="feature.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <span
              v-if="feature.badge"
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                feature.status === 'coming-soon'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              "
            >
              {{ feature.badge }}
            </span>
          </div>

          <h2 class="mt-4 text-base font-semibold text-ink-800 dark:text-ink-200">{{ feature.title }}</h2>
          <p class="mt-2 flex-1 text-sm leading-6 text-ink-500 dark:text-ink-400">{{ feature.description }}</p>

          <div class="mt-5 flex items-center gap-2">
            <template v-if="feature.status === 'coming-soon'">
              <button
                type="button"
                disabled
                class="flex-1 cursor-not-allowed rounded-xl bg-ink-100 px-4 py-2.5 text-center text-sm font-medium text-ink-400 dark:bg-ink-800 dark:text-ink-500"
              >
                {{ feature.startLabel }}
              </button>
            </template>
            <template v-else>
              <RouterLink
                :to="feature.startPath"
                class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white transition"
                :class="
                  feature.isNew
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                "
              >
                {{ feature.startLabel }}
              </RouterLink>
              <RouterLink
                v-if="feature.historyPath && feature.historyPath !== feature.startPath"
                :to="feature.historyPath"
                class="rounded-xl border border-ink-200 px-3 py-2.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-300"
              >
                تاریخچه
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
