<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCelebrationsStore } from '../stores/celebrations'
import { CELEBRATION_STATUSES, CELEBRATION_STATUS_LABELS, createEmptyCelebration, createEmptyCelebrationTask } from '../config/celebration.config'
import { overdueTasksOf, upcomingTasksOf } from '../utils/celebration-helpers'
import { printPage } from '../utils/export'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import CelebrationKanbanBoard from '../components/celebrations/CelebrationKanbanBoard.vue'
import CelebrationTaskModal from '../components/celebrations/CelebrationTaskModal.vue'
import CelebrationBudgetPanel from '../components/celebrations/CelebrationBudgetPanel.vue'
import PrintableCelebration from '../components/celebrations/PrintableCelebration.vue'
import type { Celebration, CelebrationTask, CelebrationTaskStatus } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const celebrationsStore = useCelebrationsStore()

const isLoading = ref(true)
const celebration = ref<Celebration | null>(null)
const saveMessage = ref('')
const isPrinting = ref(false)
const activeTask = ref<CelebrationTask | null>(null)
const isTaskModalOpen = ref(false)

onMounted(async () => {
  await celebrationsStore.loadFromDb()
  if (props.id) {
    const existing = celebrationsStore.byId(props.id)
    celebration.value = existing ? (JSON.parse(JSON.stringify(existing)) as Celebration) : null
  } else {
    celebration.value = createEmptyCelebration()
  }
  isLoading.value = false
})

const overdueCount = computed(() => (celebration.value ? overdueTasksOf(celebration.value).length : 0))
const upcomingCount = computed(() => (celebration.value ? upcomingTasksOf(celebration.value).length : 0))

function openNewTask(status: CelebrationTaskStatus): void {
  if (!celebration.value) return
  const task = createEmptyCelebrationTask(celebration.value.id)
  task.status = status
  celebration.value.tasks.push(task)
  activeTask.value = task
  isTaskModalOpen.value = true
}

function openTask(task: CelebrationTask): void {
  activeTask.value = task
  isTaskModalOpen.value = true
}

function saveTask(updated: CelebrationTask): void {
  if (!celebration.value) return
  celebration.value.tasks = celebration.value.tasks.map((task) => (task.id === updated.id ? updated : task))
}

function deleteTask(taskId: string): void {
  if (!celebration.value) return
  celebration.value.tasks = celebration.value.tasks.filter((task) => task.id !== taskId)
}

function updateTaskStatus(taskId: string, status: CelebrationTaskStatus): void {
  if (!celebration.value) return
  celebration.value.tasks = celebration.value.tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  )
}

async function handleSave(): Promise<void> {
  if (!celebration.value || !celebration.value.title.trim()) return
  const isNew = !props.id
  await celebrationsStore.save(celebration.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/celebrations/${celebration.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!celebration.value || !props.id) return
  if (!confirm('این جشن حذف شود؟')) return
  await celebrationsStore.remove(celebration.value.id)
  router.push('/celebrations')
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
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 print:bg-white dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>

    <div v-else-if="!celebration" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">این جشن یافت نشد.</p>
      <RouterLink to="/celebrations" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
        بازگشت به فهرست جشن‌ها
      </RouterLink>
    </div>

    <div v-else class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">
              {{ props.id ? 'ویرایش جشن' : 'ثبت جشن جدید' }}
            </h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {{ overdueCount }} کار عقب‌افتاده - {{ upcomingCount }} کار نزدیک به سررسید
            </p>
          </div>
          <RouterLink to="/celebrations" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">
            بازگشت به فهرست
          </RouterLink>
        </div>

        <div v-if="overdueCount" class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          {{ overdueCount }} کار این جشن سررسیدشان گذشته و هنوز انجام نشده‌اند.
        </div>
        <div v-else-if="upcomingCount" class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
          {{ upcomingCount }} کار تا ۳ روز آینده سررسید دارند.
        </div>

        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات جشن</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان جشن</label>
              <input
                v-model="celebration.title"
                type="text"
                placeholder="مثلاً: جشن شروع سال تحصیلی"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ برگزاری (شمسی)</label>
              <JalaliDatePicker v-model="celebration.date" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">وضعیت</label>
              <select
                v-model="celebration.status"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option v-for="s in CELEBRATION_STATUSES" :key="s" :value="s">{{ CELEBRATION_STATUS_LABELS[s] }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مکان برگزاری</label>
              <input
                v-model="celebration.location"
                type="text"
                placeholder="مثلاً: سالن اجتماعات"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مسئول برگزاری</label>
              <input
                v-model="celebration.organizer"
                type="text"
                placeholder="نام مسئول جشن"
                class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <CelebrationBudgetPanel v-model="celebration.budget" />
        </div>

        <div class="mb-4 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">چک‌لیست کارهای جشن</p>
          <CelebrationKanbanBoard
            :tasks="celebration.tasks"
            @update-status="updateTaskStatus"
            @open-task="openTask"
            @add-task="openNewTask"
          />
        </div>

        <div class="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            @click="handleSave"
          >
            ذخیره جشن
          </button>
          <button
            type="button"
            class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
            @click="handlePrint"
          >
            چاپ / PDF
          </button>
          <button
            v-if="props.id"
            type="button"
            class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400"
            @click="handleDelete"
          >
            حذف جشن
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableCelebration :celebration="celebration" />
      </div>
    </div>

    <CelebrationTaskModal
      v-model="isTaskModalOpen"
      :task="activeTask"
      @save="saveTask"
      @delete="deleteTask"
    />
  </div>
</template>
