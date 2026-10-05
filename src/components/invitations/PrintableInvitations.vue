<script setup lang="ts">
import { computed } from 'vue'
import type { Invitation, InvitationPageLayout, InvitationRecipient } from '../../types'
import { RSVP_STATUS_LABELS } from '../../config/invitation.config'
import { gradeLabel } from '../../config/levels.config'
import { eventDateLabel, rsvpSummary } from '../../utils/invitation-helpers'
import InvitationCard from './InvitationCard.vue'

const props = defineProps<{
  invitation: Invitation
  mode: 'generic' | 'personalized' | 'attendance'
  layout: InvitationPageLayout
}>()

const cards = computed<(InvitationRecipient | null)[]>(() => {
  if (props.mode === 'personalized' && props.invitation.recipients.length) return props.invitation.recipients
  return [null]
})

const perPage = computed(() => (props.mode === 'personalized' && props.layout === 'half' ? 2 : 1))

const pages = computed(() => {
  const result: (InvitationRecipient | null)[][] = []
  for (let i = 0; i < cards.value.length; i += perPage.value) {
    result.push(cards.value.slice(i, i + perPage.value))
  }
  return result
})

const summary = computed(() => rsvpSummary(props.invitation.recipients))
const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="invitation-print" dir="rtl">
    <!-- لیست حضور و امضا -->
    <div v-if="mode === 'attendance'" class="p-4 text-ink-900">
      <div class="mb-3 flex items-center justify-between border-b-2 border-ink-800 pb-2">
        <div>
          <h1 class="text-base font-bold">لیست حضور و امضا - {{ invitation.title }}</h1>
          <p class="text-11px text-ink-600">
            {{ eventDateLabel(invitation.eventDate) }} {{ invitation.eventTime }} - {{ invitation.location || '—' }}
          </p>
        </div>
        <p class="text-11px text-ink-500">{{ printDate }}</p>
      </div>
      <p class="mb-2 text-11px text-ink-600">
        مدعوین: {{ summary.total }} - تأییدشده: {{ summary.attending }} - همراهان: {{ summary.guests }} - در انتظار پاسخ: {{ summary.pending }}
      </p>
      <table class="w-full border-collapse text-11px">
        <thead>
          <tr>
            <th class="w-10 border border-ink-400 bg-ink-100 p-1.5">#</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">نام</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">پایه</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">وضعیت پاسخ</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">همراه</th>
            <th class="w-40 border border-ink-400 bg-ink-100 p-1.5">امضا</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(recipient, index) in invitation.recipients" :key="recipient.id" style="height: 26px">
            <td class="border border-ink-400 p-1.5 text-center">{{ index + 1 }}</td>
            <td class="border border-ink-400 p-1.5">{{ recipient.name }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ recipient.grade ? gradeLabel(recipient.grade) : '—' }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ RSVP_STATUS_LABELS[recipient.rsvp] }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ recipient.guestsCount || '' }}</td>
            <td class="border border-ink-400 p-1.5"></td>
          </tr>
          <tr v-if="!invitation.recipients.length">
            <td colspan="6" class="border border-ink-400 p-4 text-center text-ink-400">مدعوینی ثبت نشده است.</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-3 text-10px text-ink-400">school.mhkarami97.ir</p>
    </div>

    <!-- دعوت‌نامه‌ها -->
    <template v-else>
      <div
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        :style="{
          breakAfter: pageIndex < pages.length - 1 ? 'page' : 'auto',
          pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
          height: perPage === 2 ? '275mm' : 'auto',
        }"
      >
        <div
          v-for="(recipient, index) in page"
          :key="recipient ? recipient.id : 'generic'"
          :style="{
            height: perPage === 2 ? '136mm' : 'auto',
            overflow: 'hidden',
            marginBottom: perPage === 2 && index === 0 ? '3mm' : '0',
            borderBottom: perPage === 2 && index === 0 ? '1px dashed #b3bac8' : 'none',
          }"
        >
          <InvitationCard :invitation="invitation" :recipient="recipient" :compact="perPage === 2" />
        </div>
      </div>
    </template>
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
