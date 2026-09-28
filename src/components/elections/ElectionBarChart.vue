<script setup lang="ts">
import { computed } from 'vue'
import type { Election } from '../../types'
import { sortCandidatesByVotes, totalVotesOf, votePercentageOf, winnersOf } from '../../utils/election-helpers'

const props = defineProps<{
  election: Election
}>()

const ranked = computed(() => sortCandidatesByVotes(props.election.candidates))
const total = computed(() => totalVotesOf(props.election))
const winnerIds = computed(() => new Set(winnersOf(props.election).map((c) => c.id)))

function barWidthOf(voteCount: number): number {
  return votePercentageOf({ voteCount } as never, total.value)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(candidate, index) in ranked"
      :key="candidate.id"
      class="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900"
    >
      <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span class="flex items-center gap-2 font-semibold text-ink-800 dark:text-ink-200">
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full text-10px font-bold text-white"
            :class="winnerIds.has(candidate.id) ? 'bg-emerald-600' : 'bg-ink-400 dark:bg-ink-600'"
          >
            {{ index + 1 }}
          </span>
          {{ candidate.name || 'بدون نام' }}
          <span
            v-if="winnerIds.has(candidate.id)"
            class="rounded-full bg-emerald-50 px-2 py-0.5 text-10px font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            منتخب
          </span>
        </span>
        <span class="text-ink-500 dark:text-ink-400">
          {{ candidate.voteCount.toLocaleString('fa-IR') }} رأی ({{ votePercentageOf(candidate, total) }}٪)
        </span>
      </div>
      <div class="h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          class="h-full rounded-full transition-all"
          :class="winnerIds.has(candidate.id) ? 'bg-emerald-500' : 'bg-brand-500'"
          :style="{ width: `${barWidthOf(candidate.voteCount)}%` }"
        ></div>
      </div>
    </div>

    <p
      v-if="!ranked.length"
      class="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 dark:border-ink-700 dark:text-ink-500"
    >
      نامزدی ثبت نشده است.
    </p>
  </div>
</template>