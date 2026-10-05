<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useExamRoomsStore } from '../stores/exam-rooms'
import { createEmptyExamRoom } from '../config/exam-seating.config'
import { cleanBlockedSeats, roomCapacity, seatKey } from '../utils/exam-seating-helpers'
import AppHeader from '../components/layout/AppHeader.vue'
import SeatGrid from '../components/exam-seating/SeatGrid.vue'
import type { ExamRoom } from '../types'

const roomsStore = useExamRoomsStore()
onMounted(() => roomsStore.loadFromDb())

const editing = ref<ExamRoom | null>(null)
const errorMessage = ref('')

const MIN_SIZE = 1
const MAX_SIZE = 20

function startNew(): void {
  editing.value = createEmptyExamRoom()
  errorMessage.value = ''
}

function startEdit(room: ExamRoom): void {
  editing.value = JSON.parse(JSON.stringify(room)) as ExamRoom
  errorMessage.value = ''
}

function step(field: 'rows' | 'cols', delta: number): void {
  if (!editing.value) return
  editing.value[field] = Math.min(MAX_SIZE, Math.max(MIN_SIZE, editing.value[field] + delta))
}

function toggleBlocked(row: number, col: number): void {
  if (!editing.value) return
  const key = seatKey(row, col)
  const set = new Set(editing.value.blockedSeats)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  editing.value.blockedSeats = Array.from(set)
}

async function saveRoom(): Promise<void> {
  if (!editing.value) return
  if (!editing.value.name.trim()) {
    errorMessage.value = 'نام سالن را وارد کن.'
    return
  }
  editing.value.name = editing.value.name.trim()
  editing.value.blockedSeats = cleanBlockedSeats(editing.value)
  if (roomCapacity(editing.value) < 1) {
    errorMessage.value = 'حداقل یک صندلی فعال لازم است.'
    return
  }
  await roomsStore.save(editing.value)
  editing.value = null
}

async function deleteRoom(id: string): Promise<void> {
  if (!confirm('این سالن حذف شود؟ جلسه‌هایی که از آن استفاده کرده‌اند باید دوباره چیده شوند.')) return
  await roomsStore.remove(id)
  if (editing.value?.id === id) editing.value = null
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">سالن‌های امتحان</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ roomsStore.items.length }} سالن ثبت‌شده</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/exam-seating" class="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            جلسه‌های امتحان
          </RouterLink>
          <button type="button" class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700" @click="startNew">
            + سالن جدید
          </button>
        </div>
      </div>

      <div v-if="editing" class="mb-6 rounded-2xl border border-brand-200 bg-white p-5 dark:border-brand-900/40 dark:bg-ink-900">
        <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">
          {{ roomsStore.byId(editing.id) ? 'ویرایش سالن' : 'سالن جدید' }}
        </p>
        <div class="mb-4 grid gap-4 sm:grid-cols-3">
          <div class="sm:col-span-3">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نام سالن</label>
            <input v-model="editing.name" type="text" placeholder="مثلاً: سالن اجتماعات" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
          </div>
          <div v-for="field in (['rows', 'cols'] as const)" :key="field">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">{{ field === 'rows' ? 'تعداد ردیف' : 'تعداد ستون' }}</label>
            <div class="flex items-center gap-2">
              <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800" :disabled="editing[field] <= MIN_SIZE" @click="step(field, -1)">−</button>
              <span class="w-8 text-center text-sm font-semibold text-ink-800 dark:text-ink-200">{{ editing[field] }}</span>
              <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40" :disabled="editing[field] >= MAX_SIZE" @click="step(field, 1)">+</button>
            </div>
          </div>
          <div class="flex items-end">
            <p class="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              ظرفیت: <strong>{{ roomCapacity(editing) }}</strong> صندلی
            </p>
          </div>
        </div>

        <p class="mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">
          برای نقشه‌ی نامنظم (ستون، میز معلم، فضای خالی)، روی هر خانه کلیک کن تا مسدود/باز شود.
        </p>
        <SeatGrid :room="editing" :assignments="[]" mode="edit" @cell-click="toggleBlocked" />

        <p v-if="errorMessage" class="mt-3 text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="saveRoom">ذخیره</button>
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="editing = null">انصراف</button>
        </div>
      </div>

      <div v-if="!roomsStore.items.length && !editing" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز سالنی تعریف نشده است.</p>
        <button type="button" class="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white" @click="startNew">تعریف اولین سالن</button>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="room in roomsStore.items" :key="room.id" class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <p class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ room.name }}</p>
            <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">{{ room.rows }} ردیف × {{ room.cols }} ستون - ظرفیت {{ roomCapacity(room) }} نفر</p>
            <div class="flex items-center justify-between border-t border-ink-50 pt-3 dark:border-ink-800">
              <button type="button" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400" @click="startEdit(room)">ویرایش</button>
              <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="deleteRoom(room.id)">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
