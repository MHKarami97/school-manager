<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useElectionsStore } from '../stores/elections'
import {
  ELECTION_STATUS_LABELS,
  ELECTION_STATUS_ORDER,
  ELECTION_TYPES,
  ELECTION_TYPE_LABELS,
  candidateTypeOfElection,
  createEmptyCandidate,
  createEmptyElection,
} from '../config/election.config'
import { totalVotesOf } from '../utils/election-helpers'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import CandidateFormModal from '../components/elections/CandidateFormModal.vue'
import VoteCountingPanel from '../components/elections/VoteCountingPanel.vue'
import ElectionBarChart from '../components/elections/ElectionBarChart.vue'
import PrintableElectionResult from '../components/elections/PrintableElectionResult.vue'
import type { Candidate, Election, ElectionStatus } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const electionsStore = useElectionsStore()

const isLoading = ref(true)
const election = ref<Election | null>(null)
const saveMessage = ref('')
const isPrinting = ref(false)
const activeCandidate = ref<Candidate | null>(null)
const isCandidateModalOpen = ref(false)

onMounted(async () => {
  await electionsStore.loadFromDb()
  if (props.id) {
    const existing = electionsStore.byId(props.id)
    election.value = existing ? (JSON.parse(JSON.stringify(existing)) as Election) : null
  } else {
    election.value = createEmptyElection()
  }
  isLoading.value = false
})

const totalVotes = computed(() => (election.value ? totalVotesOf(election.value) : 0))

const statusIndex = computed(() => (election.value ? ELECTION_STATUS_ORDER.indexOf(election.value.status) : 0))

const canGoToNextStatus = computed(() => {
  if (!election.value) return false
  if (election.value.status === 'candidacy') return election.value.candidates.length >= 2
  return statusIndex.value < ELECTION_STATUS_ORDER.length - 1
})

function nextStatusLabel(status: ElectionStatus): string {
  const labels: Record<ElectionStatus, string> = {
    candidacy: 'شروع رأی‌گیری',
    voting: 'شروع شمارش آرا',
    counting: 'پایان شمارش و اعلام نتایج',
    completed: 'پایان یافته',
  }
  return labels[status]
}

function goToNextStatus(): void {
  if (!election.value || !canGoToNextStatus.value) return
  const next = ELECTION_STATUS_ORDER[statusIndex.value + 1]
  if (next) election.value.status = next
}

function goToPreviousStatus(): void {
  if (!election.value || statusIndex.value <= 0) return
  election.value.status = ELECTION_STATUS_ORDER[statusIndex.value - 1]
}

function openNewCandidate(): void {
  if (!election.value) return
  const candidate = createEmptyCandidate(election.value.id, candidateTypeOfElection(election.value.type))
  election.value.candidates.push(candidate)
  activeCandidate.value = candidate
  isCandidateModalOpen.value = true
}

function openCandidate(candidate: Candidate): void {
  activeCandidate.value = candidate
  isCandidateModalOpen.value = true
}

function saveCandidate(updated: Candidate): void {
  if (!election.value) return
  election.value.candidates = election.value.candidates.map((c) => (c.id === updated.id ? updated : c))
}

function deleteCandidate(candidateId: string): void {
  if (!election.value) return
  election.value.candidates = election.value.candidates.filter((c) => c.id !== candidateId)
}

function incrementVote(candidateId: string): void {
  if (!election.value) return
  election.value.candidates = election.value.candidates.map((c) =>
    c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c,
  )
}

function decrementVote(candidateId: string): void {
  if (!election.value) return
  election.value.candidates = election.value.candidates.map((c) =>
    c.id === candidateId ? { ...c, voteCount: Math.max(0, c.voteCount - 1) } : c,
  )
}

function setVotes(candidateId: string, value: number): void {
  if (!election.value) return
  election.value.candidates = election.value.candidates.map((c) =>
    c.id === candidateId ? { ...c, voteCount: value } : c,
  )
}

async function handleSave(): Promise<void> {
  if (!election.value) return
  const isNew = !props.id
  await electionsStore.save(election.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/elections/${election.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!election.value || !props.id) return
  if (!confirm('این انتخابات حذف شود؟')) return
  await electionsStore.remove(election.value.id)
  router.push('/elections')
}

async function handlePrint(): Promise<void> {
  isPrinting.value = true
  await nextTick()
  printPage()
  window.addEventListener(
    'afterprint',
    () => {
      isPrinting.value = false
    },
    { once: true },
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>

    <div v-else-if="!election" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این انتخابات یافت نشد.</p>
      <RouterLink to="/elections" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
        بازگشت به فهرست انتخابات
      </RouterLink>
    </div>

    <div v-else class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">
              {{ props.id ? 'ویرایش انتخابات' : 'ثبت انتخابات جدید' }}
            </h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {{ election.candidates.length }} نامزد - {{ totalVotes }} رأی شمارش‌شده
            </p>
          </div>
          <RouterLink to="/elections" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به فهرست
          </RouterLink>
        </div>

        <!-- نوار مراحل -->
        <div class="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <span
            v-for="status in ELECTION_STATUS_ORDER"
            :key="status"
            class="rounded-full px-3 py-1.5 text-sm font-medium"
            :class="
              status === election.status
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
            "
          >
            {{ ELECTION_STATUS_LABELS[status] }}
          </span>

          <div class="mr-auto flex gap-2">
            <button
              v-if="statusIndex > 0"
              type="button"
              class="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
              @click="goToPreviousStatus"
            >
              بازگشت به مرحله قبل
            </button>
            <button
              v-if="statusIndex < ELECTION_STATUS_ORDER.length - 1"
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canGoToNextStatus"
              @click="goToNextStatus"
            >
              {{ nextStatusLabel(election.status) }}
            </button>
          </div>
        </div>
        <p
          v-if="election.status === 'candidacy' && election.candidates.length < 2"
          class="mb-4 text-sm text-amber-600 dark:text-amber-400"
        >
          برای شروع رأی‌گیری حداقل به ۲ نامزد نیاز است.
        </p>

        <!-- اطلاعات انتخابات -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات انتخابات</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان انتخابات</label>
              <input
                v-model="election.title"
                type="text"
                placeholder="مثلاً: انتخابات شورای دانش‌آموزی ۱۴۰۴"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نوع انتخابات</label>
              <select
                v-model="election.type"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="t in ELECTION_TYPES" :key="t" :value="t">{{ ELECTION_TYPE_LABELS[t] }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">سال تحصیلی</label>
              <input
                v-model="election.academicYear"
                type="text"
                placeholder="مثلاً: ۱۴۰۴-۱۴۰۵"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">شروع رأی‌گیری (شمسی)</label>
              <JalaliDatePicker v-model="election.votingStartDate" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایان رأی‌گیری (شمسی)</label>
              <JalaliDatePicker v-model="election.votingEndDate" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تعداد کرسی موردنیاز</label>
              <input
                v-model.number="election.seatsCount"
                type="number"
                min="1"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
          </div>
        </div>

        <!-- نامزدها / شمارش / نتایج بر اساس مرحله -->
        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">
              <template v-if="election.status === 'candidacy'">نامزدها</template>
              <template v-else-if="election.status === 'voting'">نامزدهای ثبت‌شده</template>
              <template v-else-if="election.status === 'counting'">شمارش آرا</template>
              <template v-else>نتایج نهایی</template>
            </p>
            <button
              v-if="election.status === 'candidacy'"
              type="button"
              class="rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-white dark:bg-ink-700"
              @click="openNewCandidate"
            >
              + افزودن نامزد
            </button>
          </div>

          <!-- مرحله ثبت‌نام: لیست قابل‌ویرایش -->
          <div v-if="election.status === 'candidacy'" class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="candidate in election.candidates"
              :key="candidate.id"
              type="button"
              class="flex items-center gap-3 rounded-xl border border-ink-100 p-3 text-right hover:border-brand-200 dark:border-ink-800"
              @click="openCandidate(candidate)"
            >
              <img v-if="candidate.photoDataUrl" :src="candidate.photoDataUrl" alt="" class="h-10 w-10 rounded-full object-cover" />
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-xs text-ink-400 dark:bg-ink-800 dark:text-ink-500"
              >
                {{ candidate.name.slice(0, 1) || '؟' }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-ink-800 dark:text-ink-200">{{ candidate.name || 'بدون نام' }}</p>
                <p class="truncate text-10px text-ink-400 dark:text-ink-500">{{ candidate.gradeOrClass || '—' }}</p>
              </div>
            </button>
            <p
              v-if="!election.candidates.length"
              class="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 sm:col-span-2 dark:border-ink-700 dark:text-ink-500"
            >
              هنوز نامزدی ثبت نشده است.
            </p>
          </div>

          <!-- مرحله رأی‌گیری: لیست فقط‌خواندنی -->
          <div v-else-if="election.status === 'voting'" class="space-y-2">
            <p class="mb-2 text-sm text-ink-400 dark:text-ink-500">
              رأی‌گیری به‌صورت کاغذی در جریان است؛ بعد از پایان آن، وضعیت را به «شمارش آرا» تغییر بده.
            </p>
            <div
              v-for="candidate in election.candidates"
              :key="candidate.id"
              class="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800"
            >
              <img v-if="candidate.photoDataUrl" :src="candidate.photoDataUrl" alt="" class="h-10 w-10 rounded-full object-cover" />
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-xs text-ink-400 dark:bg-ink-800 dark:text-ink-500"
              >
                {{ candidate.name.slice(0, 1) || '؟' }}
              </div>
              <p class="text-xs font-semibold text-ink-800 dark:text-ink-200">{{ candidate.name || 'بدون نام' }}</p>
            </div>
          </div>

          <!-- مرحله شمارش: پنل +/- -->
          <VoteCountingPanel
            v-else-if="election.status === 'counting'"
            :candidates="election.candidates"
            @increment="incrementVote"
            @decrement="decrementVote"
            @set-votes="setVotes"
          />

          <!-- مرحله نتایج نهایی: نمودار ستونی -->
          <ElectionBarChart v-else :election="election" />
        </div>

        <div class="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            @click="handleSave"
          >
            ذخیره
          </button>
          <button
            v-if="election.status === 'completed'"
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            @click="handlePrint"
          >
            چاپ / خروجی PDF نتایج
          </button>
          <button
            v-if="props.id"
            type="button"
            class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400"
            @click="handleDelete"
          >
            حذف انتخابات
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableElectionResult :election="election" />
      </div>
    </div>

    <CandidateFormModal
      v-model="isCandidateModalOpen"
      :candidate="activeCandidate"
      @save="saveCandidate"
      @delete="deleteCandidate"
    />
  </div>
</template>
