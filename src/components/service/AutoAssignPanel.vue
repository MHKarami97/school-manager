<script setup lang="ts">
import { ref } from 'vue'
import type { AssignMode } from '@/types'
import { ASSIGN_MODES, ASSIGN_MODE_LABELS } from '@/config/service.config'

export interface AutoAssignRequest {
  mode: AssignMode
  preferSameGender: boolean
  replaceDrafts: boolean
}

defineProps<{ unassignedCount: number; draftCount: number; isBusy: boolean }>()
const emit = defineEmits<{ (e: 'run', request: AutoAssignRequest): void }>()

const mode = ref<AssignMode>('smart')
const preferSameGender = ref(true)
const replaceDrafts = ref(false)
</script>

<template>
  <details class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
    <summary class="min-h-11 cursor-pointer text-sm font-semibold text-ink-800 dark:text-ink-200">تخصیص خودکار بر اساس منطقه و نقشه</summary>
    <div class="mt-3 space-y-3">
      <p class="text-xs leading-6 text-ink-600 dark:text-ink-300">
        نتیجه به‌صورت <strong>پیش‌نویس</strong> ثبت می‌شود؛ می‌توانید هر دانش‌آموز را جابه‌جا کنید و بعد هر راننده را جداگانه تأیید کنید. رانندگان تأییدشده دست نمی‌خورند.
        هم‌منطقه‌ای‌ها (متن «منطقه») و نزدیک‌ها روی نقشه (فاصله‌ی هوایی) در یک ماشین قرار می‌گیرند؛ دانش‌آموز بدون منطقه و موقعیت فقط بر اساس ظرفیت جاگذاری می‌شود.
      </p>
      <div>
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="auto-mode">روش تخصیص</label>
        <select id="auto-mode" v-model="mode" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
          <option v-for="item in ASSIGN_MODES" :key="item" :value="item">{{ ASSIGN_MODE_LABELS[item] }}</option>
        </select>
      </div>
      <label class="flex min-h-11 cursor-pointer items-center gap-3 text-xs text-ink-700 dark:text-ink-200"><input v-model="preferSameGender" type="checkbox" class="h-5 w-5" /> ترجیح راننده‌ی هم‌جنس دانش‌آموزان (امتیاز، نه اجبار)</label>
      <label class="flex min-h-11 cursor-pointer items-center gap-3 text-xs text-ink-700 dark:text-ink-200"><input v-model="replaceDrafts" type="checkbox" class="h-5 w-5" /> پیش‌نویس‌های فعلی ({{ draftCount.toLocaleString('fa-IR') }} مورد) پاک و دوباره چیده شوند</label>
      <button type="button" :disabled="isBusy" class="min-h-11 w-full rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="emit('run', { mode, preferSameGender, replaceDrafts })">
        اجرای تخصیص ({{ unassignedCount.toLocaleString('fa-IR') }} دانش‌آموز بدون راننده)
      </button>
    </div>
  </details>
</template>
