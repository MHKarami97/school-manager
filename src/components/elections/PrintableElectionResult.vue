<script setup lang="ts">
import { computed } from 'vue'
import type { Election } from '../../types'
import { ELECTION_STATUS_LABELS, ELECTION_TYPE_LABELS } from '../../config/election.config'
import { jalaaliDateLabel, sortCandidatesByVotes, totalVotesOf, votePercentageOf, winnersOf } from '../../utils/election-helpers'

const props = defineProps<{
  election: Election
}>()

const ranked = computed(() => sortCandidatesByVotes(props.election.candidates))
const total = computed(() => totalVotesOf(props.election))
const winnerIds = computed(() => new Set(winnersOf(props.election).map((c) => c.id)))
const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="election-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ election.title || ELECTION_TYPE_LABELS[election.type] }}</h1>
        <p class="text-xs text-ink-600">
          {{ ELECTION_TYPE_LABELS[election.type] }} - سال تحصیلی {{ election.academicYear || '—' }} -
          {{ ELECTION_STATUS_LABELS[election.status] }}
        </p>
      </div>
      <p class="text-xs text-ink-500">{{ printDate }}</p>
    </div>

    <p class="mb-4 text-xs text-ink-600">
      <strong>بازه‌ی رأی‌گیری:</strong> {{ jalaaliDateLabel(election.votingStartDate) }} تا {{ jalaaliDateLabel(election.votingEndDate) }} -
      <strong>تعداد کرسی:</strong> {{ election.seatsCount }} -
      <strong>مجموع آرا:</strong> {{ total.toLocaleString('fa-IR') }}
    </p>

    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="w-10 border border-ink-400 bg-ink-100 p-2">رتبه</th>
          <th class="border border-ink-400 bg-ink-100 p-2">نام نامزد</th>
          <th class="border border-ink-400 bg-ink-100 p-2">کلاس/پایه</th>
          <th class="border border-ink-400 bg-ink-100 p-2">تعداد آرا</th>
          <th class="border border-ink-400 bg-ink-100 p-2">درصد</th>
          <th class="border border-ink-400 bg-ink-100 p-2">وضعیت</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(candidate, index) in ranked" :key="candidate.id">
          <td class="border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
          <td class="border border-ink-400 p-2">{{ candidate.name || '—' }}</td>
          <td class="border border-ink-400 p-2 text-center">{{ candidate.gradeOrClass || '—' }}</td>
          <td class="border border-ink-400 p-2 text-center">{{ candidate.voteCount.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-2 text-center">{{ votePercentageOf(candidate, total) }}٪</td>
          <td class="border border-ink-400 p-2 text-center">
            <strong v-if="winnerIds.has(candidate.id)">منتخب</strong>
            <span v-else>—</span>
          </td>
        </tr>
        <tr v-if="!ranked.length">
          <td colspan="6" class="border border-ink-400 p-4 text-center text-ink-400">نامزدی ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex items-center justify-between border-t border-ink-300 pt-3">
      <p class="text-10px text-ink-500">school.mhkarami97.ir</p>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
}
</style>
