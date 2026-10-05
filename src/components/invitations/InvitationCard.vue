<script setup lang="ts">
import { computed } from 'vue'
import type { Invitation, InvitationRecipient } from '../../types'
import { INVITATION_THEMES } from '../../config/invitation.config'
import { eventDateLabel, jalaaliDateLabel, renderInvitationText, salutationFor } from '../../utils/invitation-helpers'

const props = defineProps<{
  invitation: Invitation
  recipient: InvitationRecipient | null
  compact?: boolean
}>()

const theme = computed(() => INVITATION_THEMES[props.invitation.theme])

const textClass = computed(() => (props.compact ? 'text-11px leading-6' : 'text-sm leading-8'))
const titleClass = computed(() => (props.compact ? 'text-base' : 'text-2xl'))

const salutation = computed(() => salutationFor(props.invitation, props.recipient))

const paragraphs = computed(() =>
  renderInvitationText(props.invitation.body, props.invitation, props.recipient)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
)

const infoRows = computed(() => {
  const rows: { label: string; value: string }[] = []
  if (props.invitation.eventDate) rows.push({ label: 'تاریخ', value: eventDateLabel(props.invitation.eventDate) })
  if (props.invitation.eventTime) rows.push({ label: 'ساعت', value: props.invitation.eventTime })
  if (props.invitation.location) rows.push({ label: 'مکان', value: props.invitation.location })
  return rows
})

const showSlip = computed(() => props.invitation.requireRsvp && props.invitation.showRsvpSlip)
</script>

<template>
  <div
    class="invitation-card bg-white text-ink-900"
    dir="rtl"
    :style="{ border: theme.border, padding: compact ? '12px' : '26px' }"
  >
    <div
      class="mb-4 rounded-lg text-center"
      :style="{
        background: theme.headerBg,
        color: theme.headerColor,
        padding: compact ? '8px' : '14px',
        borderBottom: theme.headerBg === 'transparent' ? `2px solid ${theme.accent}` : 'none',
      }"
    >
      <p v-if="invitation.schoolName" :class="compact ? 'text-10px' : 'text-xs'" style="opacity: 0.85">
        {{ invitation.schoolName }}
      </p>
      <p :class="[titleClass, 'font-extrabold']">{{ invitation.title || 'عنوان دعوت‌نامه' }}</p>
    </div>

    <p :class="[textClass, 'font-bold']" :style="{ color: theme.accent }">{{ salutation }}</p>

    <div :class="['mt-1 space-y-1 text-ink-800', textClass]">
      <p v-for="(line, index) in paragraphs" :key="index">{{ line }}</p>
    </div>

    <div
      v-if="infoRows.length"
      class="mt-4 rounded-lg"
      :style="{ background: theme.soft, border: `1px solid ${theme.accent}`, padding: compact ? '8px' : '12px' }"
    >
      <p v-for="row in infoRows" :key="row.label" :class="textClass">
        <strong :style="{ color: theme.accent }">{{ row.label }}:</strong> {{ row.value }}
      </p>
    </div>

    <div v-if="invitation.agenda.length" class="mt-3">
      <p :class="[textClass, 'font-bold']" :style="{ color: theme.accent }">برنامه</p>
      <ol :class="['list-decimal pr-5 text-ink-800', textClass]">
        <li v-for="(item, index) in invitation.agenda" :key="index">{{ item }}</li>
      </ol>
    </div>

    <div v-if="invitation.requirements.length" class="mt-3">
      <p :class="[textClass, 'font-bold']" :style="{ color: theme.accent }">نکات و همراهان لازم</p>
      <ul :class="['list-disc pr-5 text-ink-800', textClass]">
        <li v-for="(item, index) in invitation.requirements" :key="index">{{ item }}</li>
      </ul>
    </div>

    <p v-if="invitation.requireRsvp && invitation.rsvpDeadline" :class="['mt-3 text-ink-700', textClass]">
      خواهشمند است تا تاریخ <strong>{{ jalaaliDateLabel(invitation.rsvpDeadline) }}</strong> حضور خود را اعلام فرمایید.
    </p>
    <p v-if="invitation.contactPhone" :class="['text-ink-700', textClass]">
      تلفن تماس: <span dir="ltr">{{ invitation.contactPhone }}</span>
    </p>

    <div v-if="invitation.senderName || invitation.senderTitle" class="mt-5 flex justify-end">
      <div class="text-center">
        <p :class="[textClass, 'font-bold']">{{ invitation.senderName }}</p>
        <p :class="['text-ink-500', compact ? 'text-10px' : 'text-xs']">{{ invitation.senderTitle }}</p>
      </div>
    </div>

    <div v-if="showSlip" class="mt-5 border-t-2 border-dashed border-ink-300 pt-3">
      <p :class="['mb-1 font-bold text-ink-700', compact ? 'text-10px' : 'text-xs']">
        ✂ برگه‌ی پاسخ - {{ recipient ? recipient.name : 'نام و نام‌خانوادگی: ....................' }}
      </p>
      <p :class="['text-ink-700', compact ? 'text-10px' : 'text-xs']">
        ⬜ حضور دارم &nbsp;&nbsp; ⬜ حضور ندارم &nbsp;&nbsp; تعداد همراه: ........ &nbsp;&nbsp; امضا: ............
      </p>
    </div>
  </div>
</template>

<style>
.invitation-card {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
