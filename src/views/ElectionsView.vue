<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useElectionsStore } from '../stores/elections'
import { ELECTION_STATUS_LABELS, ELECTION_STATUS_BADGE_CLASSES, ELECTION_TYPE_LABELS } from '../config/election.config'
import { jalaaliDateLabel, totalVotesOf } from '../utils/election-helpers'
import AppHeader from '../components/layout/AppHeader.vue'

const electionsStore = useElectionsStore()
onMounted(() => electionsStore.loadFromDb())

const sortedElections = computed(() => [...electionsStore.items].sort((a, b) => b.updatedAt - a.updatedAt))

async function deleteElection(id: string): Promise<void> {
  if (!confirm('این انتخابات حذف شود؟')) return
  await electionsStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">انتخابات شورا و انجمن اولیا</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ electionsStore.items.length }} دوره انتخابات ثبت‌شده</p>
        </div>
        <RouterLink
          to="/elections/new"
          class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          + انتخابات جدید
        </RouterLink>
      </div>

      <div
        v-if="!sortedElections.length"
        class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900"
      >
        <p class="text-ink-500 dark:text-ink-400">هنوز انتخاباتی ثبت نشده است.</p>
        <RouterLink
          to="/elections/new"
          class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          ثبت اولین انتخابات
        </RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="election in sortedElections"
          :key="election.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">
                {{ election.title || ELECTION_TYPE_LABELS[election.type] }}
              </p>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-sm font-medium"
                :class="ELECTION_STATUS_BADGE_CLASSES[election.status]"
              >
                {{ ELECTION_STATUS_LABELS[election.status] }}
              </span>
            </div>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              {{ ELECTION_TYPE_LABELS[election.type] }} - سال تحصیلی {{ election.academicYear || '—' }}
            </p>
            <p class="mb-3 text-sm text-ink-400 dark:text-ink-500">
              رأی‌گیری: {{ jalaaliDateLabel(election.votingStartDate) }} تا {{ jalaaliDateLabel(election.votingEndDate) }}
            </p>
            <div class="mb-3 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
              <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ election.candidates.length }} نامزد</span>
              <span class="rounded-lg bg-ink-50 px-2 py-1 dark:bg-ink-800">{{ totalVotesOf(election) }} رأی شمارش‌شده</span>
            </div>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <RouterLink
                :to="`/elections/${election.id}`"
                class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                مشاهده و مدیریت
              </RouterLink>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteElection(election.id)">
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
