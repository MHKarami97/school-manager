<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useInvitationsStore } from '../stores/invitations'
import { useCelebrationsStore } from '../stores/celebrations'
import { useElectionsStore } from '../stores/elections'
import {
  INVITATION_AUDIENCES,
  INVITATION_AUDIENCE_LABELS,
  INVITATION_PRESETS,
  INVITATION_STATUS_LABELS,
  INVITATION_THEMES,
  INVITATION_THEME_KEYS,
  INVITATION_TYPES,
  INVITATION_TYPE_LABELS,
  createEmptyInvitation,
} from '../config/invitation.config'
import { LEVELS, gradeLabel } from '../config/levels.config'
import { INVITATION_PLACEHOLDERS, todayIsoString } from '../utils/invitation-helpers'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import InvitationCard from '../components/invitations/InvitationCard.vue'
import PrintableInvitations from '../components/invitations/PrintableInvitations.vue'
import RecipientsPanel from '../components/invitations/RecipientsPanel.vue'
import type { Invitation, InvitationPageLayout, InvitationType } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const invitationsStore = useInvitationsStore()
const celebrationsStore = useCelebrationsStore()
const electionsStore = useElectionsStore()

const isLoading = ref(true)
const invitation = ref<Invitation | null>(null)
const saveMessage = ref('')
const bodyRef = ref<HTMLTextAreaElement | null>(null)

onMounted(async () => {
  await Promise.all([invitationsStore.loadFromDb(), celebrationsStore.loadFromDb(), electionsStore.loadFromDb()])
  if (props.id) {
    const existing = invitationsStore.byId(props.id)
    invitation.value = existing ? (JSON.parse(JSON.stringify(existing)) as Invitation) : null
  } else {
    invitation.value = createEmptyInvitation()
  }
  isLoading.value = false
})

const needsRecipients = computed(() => !!invitation.value && invitation.value.audience !== 'general')
const showGradePicker = computed(() => !!invitation.value && (invitation.value.audience === 'parents' || invitation.value.audience === 'students'))

// --- نوع دعوت‌نامه و متن پیش‌فرض --------------------------------------------------
function applyPreset(type: InvitationType): void {
  if (!invitation.value) return
  const current = invitation.value
  const currentPreset = INVITATION_PRESETS[current.type]
  const isCustomized = current.body.trim() !== '' && current.body !== currentPreset.body
  if (isCustomized && !confirm('متن فعلی با متن پیش‌فرض این نوع جایگزین شود؟')) {
    current.type = type
    return
  }
  const preset = INVITATION_PRESETS[type]
  current.type = type
  current.body = preset.body
  current.agenda = [...preset.agenda]
  current.requirements = [...preset.requirements]
  current.audience = preset.audience
  current.requireRsvp = preset.requireRsvp
  current.showRsvpSlip = preset.requireRsvp
  if (!current.title.trim() || current.title === currentPreset.title) current.title = preset.title
}

// --- پر کردن از جشن‌ها / انتخابات ثبت‌شده --------------------------------------------------
function fillFromCelebration(event: Event): void {
  const id = (event.target as HTMLSelectElement).value
  const celebration = celebrationsStore.items.find((c) => c.id === id)
  if (!invitation.value || !celebration) return
  invitation.value.title = celebration.title
  invitation.value.eventDate = celebration.date
  invitation.value.location = celebration.location
  invitation.value.senderName = invitation.value.senderName || celebration.organizer
  ;(event.target as HTMLSelectElement).value = ''
}

function fillFromElection(event: Event): void {
  const id = (event.target as HTMLSelectElement).value
  const election = electionsStore.items.find((e) => e.id === id)
  if (!invitation.value || !election) return
  invitation.value.title = election.title
  invitation.value.eventDate = election.votingStartDate
  ;(event.target as HTMLSelectElement).value = ''
}

// --- پایه‌های هدف --------------------------------------------------
function toggleGrade(grade: number): void {
  if (!invitation.value) return
  const set = new Set(invitation.value.targetGrades)
  if (set.has(grade)) set.delete(grade)
  else set.add(grade)
  invitation.value.targetGrades = Array.from(set).sort((a, b) => a - b)
}

// --- متن، برنامه و نکات --------------------------------------------------
function insertPlaceholder(key: string): void {
  if (!invitation.value) return
  const token = '{{' + key + '}}'
  const el = bodyRef.value
  if (!el) {
    invitation.value.body += token
    return
  }
  const start = el.selectionStart ?? invitation.value.body.length
  const end = el.selectionEnd ?? start
  invitation.value.body = invitation.value.body.slice(0, start) + token + invitation.value.body.slice(end)
  nextTick(() => {
    el.focus()
    const position = start + token.length
    el.setSelectionRange(position, position)
  })
}

function addListItem(list: 'agenda' | 'requirements'): void {
  invitation.value?.[list].push('')
}

function removeListItem(list: 'agenda' | 'requirements', index: number): void {
  invitation.value?.[list].splice(index, 1)
}

// --- پیش‌نمایش --------------------------------------------------
const previewRecipientId = ref('')
const previewRecipient = computed(
  () => invitation.value?.recipients.find((r) => r.id === previewRecipientId.value) ?? invitation.value?.recipients[0] ?? null,
)

// --- ذخیره / وضعیت --------------------------------------------------
function cleanLists(target: Invitation): void {
  target.agenda = target.agenda.map((i) => i.trim()).filter(Boolean)
  target.requirements = target.requirements.map((i) => i.trim()).filter(Boolean)
}

async function handleSave(): Promise<void> {
  if (!invitation.value || !invitation.value.title.trim()) return
  cleanLists(invitation.value)
  const isNew = !props.id
  await invitationsStore.save(invitation.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/invitations/${invitation.value.id}`)
}

async function markAsSent(): Promise<void> {
  if (!invitation.value) return
  invitation.value.status = 'sent'
  invitation.value.sentDate = todayIsoString()
  await handleSave()
}

async function markAsClosed(): Promise<void> {
  if (!invitation.value) return
  invitation.value.status = 'closed'
  await handleSave()
}

async function handleDelete(): Promise<void> {
  if (!invitation.value || !props.id) return
  if (!confirm('این دعوت‌نامه حذف شود؟')) return
  await invitationsStore.remove(invitation.value.id)
  router.push('/invitations')
}

// --- چاپ / PDF --------------------------------------------------
const printMode = ref<'generic' | 'personalized' | 'attendance'>('generic')
const printLayout = ref<InvitationPageLayout>('full')
const isPrinting = ref(false)

async function handlePrint(mode: 'generic' | 'personalized' | 'attendance'): Promise<void> {
  printMode.value = mode
  isPrinting.value = true
  await nextTick()
  printPage()
  window.addEventListener('afterprint', () => { isPrinting.value = false }, { once: true })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>
    <div v-else-if="!invitation" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این دعوت‌نامه یافت نشد.</p>
      <RouterLink to="/invitations" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به فهرست دعوت‌نامه‌ها</RouterLink>
    </div>

    <div v-else class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ props.id ? 'ویرایش دعوت‌نامه' : 'دعوت‌نامه جدید' }}</h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">وضعیت: {{ INVITATION_STATUS_LABELS[invitation.status] }}</p>
          </div>
          <RouterLink to="/invitations" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به فهرست
          </RouterLink>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <!-- ستون فرم -->
          <div class="space-y-4">
            <!-- نوع دعوت‌نامه -->
            <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">نوع دعوت‌نامه</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="t in INVITATION_TYPES"
                  :key="t"
                  type="button"
                  class="rounded-lg border-2 px-3 py-2 text-xs font-medium transition"
                  :class="invitation.type === t ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                  @click="applyPreset(t)"
                >
                  {{ INVITATION_TYPE_LABELS[t] }}
                </button>
              </div>
              <div v-if="celebrationsStore.items.length || electionsStore.items.length" class="mt-3 grid gap-2 sm:grid-cols-2">
                <select v-if="celebrationsStore.items.length" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @change="fillFromCelebration">
                  <option value="">پر کردن از یک جشن ثبت‌شده…</option>
                  <option v-for="c in celebrationsStore.items" :key="c.id" :value="c.id">{{ c.title }}</option>
                </select>
                <select v-if="electionsStore.items.length" class="rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" @change="fillFromElection">
                  <option value="">پر کردن از یک انتخابات ثبت‌شده…</option>
                  <option v-for="e in electionsStore.items" :key="e.id" :value="e.id">{{ e.title }}</option>
                </select>
              </div>
            </div>

            <!-- اطلاعات اصلی -->
            <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات رویداد</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان</label>
                  <input v-model="invitation.title" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نام مدرسه (بالای دعوت‌نامه)</label>
                  <input v-model="invitation.schoolName" type="text" placeholder="مثلاً: دبیرستان شهید بهشتی" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ برگزاری (شمسی)</label>
                  <JalaliDatePicker v-model="invitation.eventDate" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">ساعت</label>
                  <input v-model="invitation.eventTime" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مکان</label>
                  <input v-model="invitation.location" type="text" placeholder="مثلاً: سالن اجتماعات" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مدعوین</label>
                  <select v-model="invitation.audience" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                    <option v-for="a in INVITATION_AUDIENCES" :key="a" :value="a">{{ INVITATION_AUDIENCE_LABELS[a] }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تلفن تماس</label>
                  <input v-model="invitation.contactPhone" type="text" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نام امضاکننده</label>
                  <input v-model="invitation.senderName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">سمت</label>
                  <input v-model="invitation.senderTitle" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
              </div>

              <div v-if="showGradePicker" class="mt-4">
                <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">پایه‌های هدف</p>
                <div v-for="level in LEVELS" :key="level.id" class="mb-2">
                  <p class="mb-1 text-10px text-ink-400 dark:text-ink-500">{{ level.name }}</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="grade in level.grades"
                      :key="grade"
                      type="button"
                      class="rounded-lg border px-2.5 py-1 text-11px font-medium transition"
                      :class="invitation.targetGrades.includes(grade) ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                      @click="toggleGrade(grade)"
                    >
                      {{ gradeLabel(grade) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- متن -->
            <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-200">متن دعوت‌نامه</p>
              <div class="mb-2 flex flex-wrap gap-1.5">
                <button
                  v-for="p in INVITATION_PLACEHOLDERS"
                  :key="p.key"
                  type="button"
                  class="rounded-full border border-ink-200 px-2.5 py-1 text-10px font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-300"
                  @click="insertPlaceholder(p.key)"
                >
                  + {{ p.label }}
                </button>
              </div>
              <textarea
                ref="bodyRef"
                v-model="invitation.body"
                rows="8"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-7 text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              ></textarea>
              <p class="mt-1 text-10px text-ink-400 dark:text-ink-500">
                جاگذاری‌ها هنگام پیش‌نمایش/چاپ برای هر مدعو جداگانه پر می‌شوند. خطاب (مثلاً «اولیای گرامی دانش‌آموز …») خودکار بالای متن می‌آید.
              </p>

              <div class="mt-4">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-xs font-medium text-ink-600 dark:text-ink-300">برنامه‌ی مراسم/جلسه (اختیاری)</p>
                  <button type="button" class="text-11px text-brand-600 dark:text-brand-400" @click="addListItem('agenda')">+ مورد</button>
                </div>
                <div v-for="(item, index) in invitation.agenda" :key="'a' + index" class="mb-1.5 flex gap-2">
                  <input v-model="invitation.agenda[index]" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                  <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeListItem('agenda', index)">حذف</button>
                </div>
              </div>

              <div class="mt-3">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-xs font-medium text-ink-600 dark:text-ink-300">نکات و موارد لازم (اختیاری)</p>
                  <button type="button" class="text-11px text-brand-600 dark:text-brand-400" @click="addListItem('requirements')">+ مورد</button>
                </div>
                <div v-for="(item, index) in invitation.requirements" :key="'r' + index" class="mb-1.5 flex gap-2">
                  <input v-model="invitation.requirements[index]" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                  <button type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeListItem('requirements', index)">حذف</button>
                </div>
              </div>
            </div>

            <!-- پاسخ و ظاهر -->
            <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">پاسخ مدعوین و ظاهر</p>
              <label class="mb-2 flex items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
                <input v-model="invitation.requireRsvp" type="checkbox" class="h-4 w-4 rounded border-ink-300" />
                از مدعوین تأیید حضور خواسته شود
              </label>
              <template v-if="invitation.requireRsvp">
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مهلت پاسخ (شمسی)</label>
                <div class="mb-2"><JalaliDatePicker v-model="invitation.rsvpDeadline" /></div>
                <label class="mb-3 flex items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
                  <input v-model="invitation.showRsvpSlip" type="checkbox" class="h-4 w-4 rounded border-ink-300" />
                  برگه‌ی پاسخ جداشدنی (✂) پایین دعوت‌نامه چاپ شود
                </label>
              </template>
              <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">قالب ظاهری</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="key in INVITATION_THEME_KEYS"
                  :key="key"
                  type="button"
                  class="rounded-lg border-2 p-2 text-center text-11px font-medium transition"
                  :class="invitation.theme === key ? 'border-brand-500' : 'border-ink-200 dark:border-ink-700'"
                  @click="invitation.theme = key"
                >
                  <span class="mb-1 block h-4 rounded" :style="{ background: INVITATION_THEMES[key].accent }"></span>
                  <span class="text-ink-700 dark:text-ink-200">{{ INVITATION_THEMES[key].label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ستون پیش‌نمایش -->
          <div class="space-y-4">
            <div class="sticky top-16 rounded-2xl border border-ink-100 bg-ink-100 p-3 dark:border-ink-800 dark:bg-ink-800">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p class="text-11px font-medium text-ink-500 dark:text-ink-400">پیش‌نمایش (همین چیزی که چاپ می‌شود)</p>
                <select
                  v-if="invitation.recipients.length"
                  v-model="previewRecipientId"
                  class="rounded-lg border border-ink-200 bg-white px-2 py-1 text-11px text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                >
                  <option value="">اولین مدعو</option>
                  <option v-for="r in invitation.recipients" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
              </div>
              <div class="max-h-[80vh] overflow-y-auto rounded-xl">
                <InvitationCard :invitation="invitation" :recipient="previewRecipient" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="needsRecipients" class="mt-4">
          <RecipientsPanel v-model="invitation.recipients" :audience="invitation.audience" :target-grades="invitation.targetGrades" />
        </div>

        <!-- عملیات -->
        <div class="mt-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">چاپ / خروجی PDF</p>
          <div class="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span class="text-ink-500 dark:text-ink-400">چیدمان دعوت‌نامه‌های شخصی:</span>
            <button type="button" class="rounded-lg border px-3 py-1.5" :class="printLayout === 'full' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="printLayout = 'full'">
              یکی در هر A4
            </button>
            <button type="button" class="rounded-lg border px-3 py-1.5" :class="printLayout === 'half' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'" @click="printLayout = 'half'">
              دو تا در هر A4 (صرفه‌جویی کاغذ)
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('generic')">
              PDF دعوت‌نامه عمومی (یک برگ)
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200"
              :disabled="!invitation.recipients.length"
              @click="handlePrint('personalized')"
            >
              PDF دعوت‌نامه‌ی شخصی برای همه مدعوین ({{ invitation.recipients.length }})
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200"
              :disabled="!invitation.recipients.length"
              @click="handlePrint('attendance')"
            >
              لیست حضور و امضا
            </button>
          </div>
        </div>

        <div class="mb-8 mt-4 flex flex-wrap items-center gap-3">
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">ذخیره</button>
          <button v-if="props.id && invitation.status === 'draft'" type="button" class="rounded-xl border border-blue-200 px-5 py-2.5 text-sm font-medium text-blue-700 dark:border-blue-900/30 dark:text-blue-300" @click="markAsSent">
            ثبت به‌عنوان ارسال‌شده
          </button>
          <button v-if="props.id && invitation.status === 'sent'" type="button" class="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-900/30 dark:text-emerald-400" @click="markAsClosed">
            پایان رویداد
          </button>
          <button v-if="props.id" type="button" class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete">
            حذف
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableInvitations :invitation="invitation" :mode="printMode" :layout="printLayout" />
      </div>
    </div>
  </div>
</template>
