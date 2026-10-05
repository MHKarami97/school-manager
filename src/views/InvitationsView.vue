<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useInvitationsStore } from '../stores/invitations'
import {
  INVITATION_AUDIENCE_LABELS,
  INVITATION_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_LABELS,
  INVITATION_TYPES,
  INVITATION_TYPE_LABELS,
} from '../config/invitation.config'
import { eventDateLabel, isRsvpOverdue, rsvpSummary } from '../utils/invitation-helpers'
import AppHeader from '../components/layout/AppHeader.vue'
import type { InvitationStatus, InvitationType } from '../types'

const invitationsStore = useInvitationsStore()
const router = useRouter()
onMounted(() => invitationsStore.loadFromDb())

const searchText = ref('')
const statusFilter = ref<'all' | InvitationStatus>('all')
const typeFilter = ref<'all' | InvitationType>('all')

const filteredInvitations = computed(() => {
  const query = searchText.value.trim()
  return [...invitationsStore.items]
    .filter((i) => statusFilter.value === 'all' || i.status === statusFilter.value)
    .filter((i) => typeFilter.value === 'all' || i.type === typeFilter.value)
    .filter((i) => !query || i.title.includes(query))
    .sort((a, b) => b.updatedAt - a.updatedAt)
})

const overdueInvitations = computed(() => invitationsStore.items.filter(isRsvpOverdue))

async function duplicateInvitation(id: string): Promise<void> {
  const copy = await invitationsStore.duplicate(id)
  if (copy) router.push(`/invitations/${copy.id}`)
}

async function deleteInvitation(id: string): Promise<void> {
  if (!confirm('این دعوت‌نامه حذف شود؟')) return
  await invitationsStore.remove(id)
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">دعوت‌نامه‌ها</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ invitationsStore.items.length }} دعوت‌نامه ثبت‌شده</p>
        </div>
        <RouterLink to="/invitations/new" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
          + دعوت‌نامه جدید
        </RouterLink>
      </div>

      <div
        v-if="overdueInvitations.length"
        class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300"
      >
        <p class="mb-1 font-semibold">یادآوری پیگیری پاسخ‌ها</p>
        <p v-for="invitation in overdueInvitations" :key="invitation.id">
          مهلت پاسخ «{{ invitation.title }}» گذشته و {{ rsvpSummary(invitation.recipients).pending }} نفر هنوز پاسخ نداده‌اند.
        </p>
      </div>

      <div class="mb-4 grid gap-2 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-3 dark:border-ink-800 dark:bg-ink-900">
        <input v-model="searchText" type="text" placeholder="جست‌وجو در عنوان..." class="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
        <select v-model="typeFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="all">همه انواع</option>
          <option v-for="t in INVITATION_TYPES" :key="t" :value="t">{{ INVITATION_TYPE_LABELS[t] }}</option>
        </select>
        <select v-model="statusFilter" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
          <option value="all">همه وضعیت‌ها</option>
          <option v-for="(label, key) in INVITATION_STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>

      <div v-if="!filteredInvitations.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">دعوت‌نامه‌ای پیدا نشد.</p>
        <RouterLink to="/invitations/new" class="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          ساخت اولین دعوت‌نامه
        </RouterLink>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="invitation in filteredInvitations"
          :key="invitation.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
        >
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ invitation.title || 'بدون عنوان' }}</p>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium" :class="INVITATION_STATUS_BADGE_CLASSES[invitation.status]">
                {{ INVITATION_STATUS_LABELS[invitation.status] }}
              </span>
            </div>
            <p class="mb-1 text-xs text-ink-500 dark:text-ink-400">
              {{ INVITATION_TYPE_LABELS[invitation.type] }} — {{ INVITATION_AUDIENCE_LABELS[invitation.audience] }}
            </p>
            <p class="mb-3 text-11px text-ink-400 dark:text-ink-500">
              {{ eventDateLabel(invitation.eventDate) || 'تاریخ مشخص نشده' }} {{ invitation.eventTime }}
            </p>

            <div v-if="invitation.recipients.length" class="mb-3">
              <div class="mb-1 flex items-center justify-between text-10px text-ink-500 dark:text-ink-400">
                <span>پاسخ‌ها</span>
                <span>{{ rsvpSummary(invitation.recipients).attending }} تأیید از {{ invitation.recipients.length }} مدعو</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all"
                  :style="{ width: `${(rsvpSummary(invitation.recipients).attending / invitation.recipients.length) * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <div class="flex gap-3">
                <RouterLink :to="`/invitations/${invitation.id}`" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  مدیریت و چاپ
                </RouterLink>
                <button type="button" class="text-xs text-ink-600 hover:underline dark:text-ink-300" @click="duplicateInvitation(invitation.id)">
                  تکثیر
                </button>
              </div>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteInvitation(invitation.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
