<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { InvitationAudience, InvitationRecipient, RsvpStatus } from '../../types'
import { RSVP_BADGE_CLASSES, RSVP_STATUSES, RSVP_STATUS_LABELS, createCustomRecipient } from '../../config/invitation.config'
import { gradeLabel } from '../../config/levels.config'
import { buildStudentRecipients, buildTeacherRecipients, rsvpSummary } from '../../utils/invitation-helpers'
import { useStudentsStore } from '../../stores/students'
import { useTeachersStore } from '../../stores/teachers'

const recipients = defineModel<InvitationRecipient[]>({ required: true })

const props = defineProps<{
  audience: InvitationAudience
  targetGrades: number[]
}>()

const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()

onMounted(async () => {
  await Promise.all([studentsStore.loadFromDb(), teachersStore.loadFromDb()])
})

const statusFilter = ref<'all' | RsvpStatus>('all')
const customName = ref('')
const message = ref('')

const summary = computed(() => rsvpSummary(recipients.value))

const visibleRecipients = computed(() =>
  recipients.value.filter((r) => statusFilter.value === 'all' || r.rsvp === statusFilter.value),
)

const canAddStudents = computed(() => props.audience === 'parents' || props.audience === 'students')

function addStudents(): void {
  if (!props.targetGrades.length) {
    message.value = 'ابتدا پایه‌های هدف را در بالا انتخاب کن.'
    return
  }
  const before = recipients.value.length
  recipients.value = buildStudentRecipients(studentsStore.items, props.targetGrades, recipients.value)
  message.value = `${recipients.value.length - before} مدعو جدید اضافه شد.`
}

function addTeachers(): void {
  const before = recipients.value.length
  recipients.value = buildTeacherRecipients(teachersStore.items, recipients.value)
  message.value = `${recipients.value.length - before} مدعو جدید اضافه شد.`
}

function addCustom(): void {
  const name = customName.value.trim()
  if (!name) return
  recipients.value = [...recipients.value, createCustomRecipient(name)]
  customName.value = ''
}

function updateRecipient(id: string, patch: Partial<InvitationRecipient>): void {
  recipients.value = recipients.value.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

function removeRecipient(id: string): void {
  recipients.value = recipients.value.filter((r) => r.id !== id)
}

function markAll(status: RsvpStatus): void {
  recipients.value = recipients.value.map((r) => ({ ...r, rsvp: status }))
}

function clearAll(): void {
  if (!confirm('کل فهرست مدعوین پاک شود؟')) return
  recipients.value = []
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">مدعوین و پیگیری پاسخ‌ها</p>
      <div class="flex flex-wrap gap-2 text-11px">
        <span class="rounded-lg bg-ink-50 px-2 py-1 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{{ summary.total }} مدعو</span>
        <span class="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{{ summary.attending }} تأیید</span>
        <span class="rounded-lg bg-red-50 px-2 py-1 text-red-700 dark:bg-red-900/30 dark:text-red-300">{{ summary.declined }} عدم حضور</span>
        <span class="rounded-lg bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{{ summary.pending }} بی‌پاسخ</span>
        <span v-if="summary.guests" class="rounded-lg bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {{ summary.expectedAttendees }} نفر با همراهان
        </span>
      </div>
    </div>

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <button
        v-if="canAddStudents"
        type="button"
        class="rounded-lg bg-ink-800 px-3 py-1.5 text-11px font-medium text-white dark:bg-ink-700"
        @click="addStudents"
      >
        + افزودن دانش‌آموزان پایه‌های انتخاب‌شده
        <template v-if="targetGrades.length">({{ targetGrades.map((g) => gradeLabel(g)).join('، ') }})</template>
      </button>
      <button
        v-if="audience === 'teachers'"
        type="button"
        class="rounded-lg bg-ink-800 px-3 py-1.5 text-11px font-medium text-white dark:bg-ink-700"
        @click="addTeachers"
      >
        + افزودن همه معلمان
      </button>
      <input
        v-model="customName"
        type="text"
        placeholder="مدعو دلخواه (مثلاً مهمان ویژه)"
        class="min-w-160px flex-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        @keyup.enter="addCustom"
      />
      <button type="button" class="rounded-lg border border-ink-200 px-3 py-1.5 text-11px font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="addCustom">
        افزودن
      </button>
    </div>
    <p v-if="message" class="mb-3 text-11px text-emerald-600 dark:text-emerald-400">{{ message }}</p>

    <div v-if="recipients.length" class="mb-3 flex flex-wrap items-center gap-2">
      <select v-model="statusFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
        <option value="all">همه وضعیت‌ها</option>
        <option v-for="s in RSVP_STATUSES" :key="s" :value="s">{{ RSVP_STATUS_LABELS[s] }}</option>
      </select>
      <button type="button" class="text-11px text-ink-500 hover:underline dark:text-ink-400" @click="markAll('attending')">همه را «حضور دارد» کن</button>
      <button type="button" class="text-11px text-ink-500 hover:underline dark:text-ink-400" @click="markAll('pending')">بازنشانی همه</button>
      <button type="button" class="mr-auto text-11px text-red-600 hover:underline dark:text-red-400" @click="clearAll">پاک‌کردن فهرست</button>
    </div>

    <div v-if="visibleRecipients.length" class="max-h-96 space-y-1.5 overflow-y-auto">
      <div
        v-for="recipient in visibleRecipients"
        :key="recipient.id"
        class="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800"
      >
        <span class="min-w-120px flex-1 text-ink-700 dark:text-ink-200">
          {{ recipient.name }}
          <span v-if="recipient.grade" class="text-10px text-ink-400 dark:text-ink-500">({{ gradeLabel(recipient.grade) }})</span>
        </span>
        <span class="rounded-full px-2 py-0.5 text-10px font-medium" :class="RSVP_BADGE_CLASSES[recipient.rsvp]">
          {{ RSVP_STATUS_LABELS[recipient.rsvp] }}
        </span>
        <select
          :value="recipient.rsvp"
          class="rounded border border-ink-200 bg-white px-1.5 py-1 text-11px dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
          @change="updateRecipient(recipient.id, { rsvp: ($event.target as HTMLSelectElement).value as RsvpStatus })"
        >
          <option v-for="s in RSVP_STATUSES" :key="s" :value="s">{{ RSVP_STATUS_LABELS[s] }}</option>
        </select>
        <label v-if="recipient.rsvp === 'attending'" class="flex items-center gap-1 text-10px text-ink-500 dark:text-ink-400">
          همراه
          <input
            type="number"
            min="0"
            max="10"
            :value="recipient.guestsCount"
            class="w-12 rounded border border-ink-200 bg-white px-1 py-0.5 text-center dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
            @change="updateRecipient(recipient.id, { guestsCount: Math.max(0, Number(($event.target as HTMLInputElement).value) || 0) })"
          />
        </label>
        <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeRecipient(recipient.id)">حذف</button>
      </div>
    </div>
    <p v-else class="rounded-xl border border-dashed border-ink-200 p-4 text-center text-11px text-ink-400 dark:border-ink-700 dark:text-ink-500">
      {{ recipients.length ? 'موردی با این فیلتر پیدا نشد.' : 'هنوز مدعوینی اضافه نشده است.' }}
    </p>
  </div>
</template>
