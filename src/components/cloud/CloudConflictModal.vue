<template>
  <Teleport to="body">
    <div
      v-if="decision && !decision.dismissed"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-ink-950/70 backdrop-blur-sm"
    >
      <div
        class="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="w-5 h-5">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m0 0l-3-3m3 3l3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-ink-900 dark:text-ink-100">{{ title }}</h3>
            <p class="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{{ description }}</p>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/80 dark:border-ink-800 text-xs space-y-2">
          <div class="flex justify-between gap-3">
            <span class="text-ink-500 dark:text-ink-400">آخرین نسخه‌ی ابری</span>
            <span class="font-semibold text-ink-800 dark:text-ink-200">{{ toPersianDigits(formatDateTimeFa(decision.remote.modifiedTime)) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-ink-500 dark:text-ink-400">تعداد رکوردهای ابری</span>
            <span class="font-bold text-brand-600 dark:text-brand-400">{{ toPersianDigits(String(decision.remoteRecordsCount)) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-ink-500 dark:text-ink-400">تعداد رکوردهای این دستگاه</span>
            <span class="font-bold text-ink-800 dark:text-ink-200">{{ toPersianDigits(String(decision.localRecordsCount)) }}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-ink-500 dark:text-ink-400">رمزنگاری</span>
            <span class="font-semibold text-ink-800 dark:text-ink-200">{{ decision.remoteEncrypted ? 'AES-GCM' : 'ندارد' }}</span>
          </div>
        </div>

        <div v-if="needsPassphrase" class="space-y-1.5">
          <label class="text-xs font-bold text-ink-700 dark:text-ink-300">رمز پشتیبان ابری</label>
          <input
            v-model="passphrase"
            type="password"
            autocomplete="current-password"
            placeholder="رمز تعریف‌شده روی دستگاه مبدأ"
            class="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 outline-none"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-ink-700 dark:text-ink-300">روش بازیابی</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label
              class="flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer"
              :class="mode === 'merge' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'border-ink-200 dark:border-ink-700'"
            >
              <input v-model="mode" type="radio" value="merge" class="mt-0.5" />
              <span>
                <span class="block font-semibold text-ink-800 dark:text-ink-200">ادغام</span>
                <span class="block text-[11px] text-ink-500 dark:text-ink-400">نسخه‌ی جدیدتر هر رکورد می‌ماند و حذف‌ها منتقل نمی‌شوند.</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer"
              :class="mode === 'replace' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/20' : 'border-ink-200 dark:border-ink-700'"
            >
              <input v-model="mode" type="radio" value="replace" class="mt-0.5" />
              <span>
                <span class="block font-semibold text-rose-600 dark:text-rose-400">جایگزینی کامل</span>
                <span class="block text-[11px] text-ink-500 dark:text-ink-400">دیتای این دستگاه با نسخه‌ی ابری عوض می‌شود.</span>
              </span>
            </label>
          </div>
          <p class="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
            پیش از بازیابی، از دیتای فعلی یک نسخه‌ی بازگشتی گرفته می‌شود تا قابل بازیابی باشد.
          </p>
        </div>

        <p v-if="errorText" class="text-xs text-rose-500 font-medium" role="alert">{{ errorText }}</p>

        <div class="flex flex-col sm:flex-row-reverse gap-2 pt-1">
          <button
            type="button"
            :disabled="isWorking || (needsPassphrase && passphrase.length === 0)"
            class="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            @click="handleRestore"
          >
            {{ isWorking ? 'در حال بازیابی...' : 'بازیابی از Google Drive' }}
          </button>
          <button
            v-if="decision.localRecordsCount > 0"
            type="button"
            :disabled="isWorking"
            class="flex-1 px-4 py-2.5 rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-200 text-xs font-semibold transition-colors disabled:opacity-50"
            @click="handleKeepLocal"
          >
            نگه‌داشتن دیتای این دستگاه
          </button>
          <button
            type="button"
            :disabled="isWorking"
            class="px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 text-xs font-medium hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            @click="handleDismiss"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CloudRestoreMode } from '@/types/cloud-sync'
import { toUserMessage } from '@/services/cloud/CloudSyncError'
import { useCloudSyncStore } from '@/stores/cloudSyncStore'
import { formatDateTimeFa } from '@/utils/cloudFormat'
import { toPersianDigits } from '@/utils/persian-digits'

const store = useCloudSyncStore()

const mode = ref<CloudRestoreMode>('merge')
const passphrase = ref('')
const isWorking = ref(false)
const errorText = ref('')

const decision = computed(() => store.snapshot.decision)
const needsPassphrase = computed(() => !!decision.value?.remoteEncrypted && !store.snapshot.encryptionEnabled)

const title = computed(() => {
  if (!decision.value) return ''
  switch (decision.value.kind) {
    case 'remote-only':
      return 'پشتیبان ابری پیدا شد'
    case 'remote-newer':
      return 'نسخه‌ی جدیدتر در Google Drive'
    case 'conflict':
      return 'مغایرت داده‌های ابری و این دستگاه'
  }
})

const description = computed(() => {
  if (!decision.value) return ''
  switch (decision.value.kind) {
    case 'remote-only':
      return 'این دستگاه هنوز رکوردی ندارد، اما یک نسخه‌ی پشتیبان در Google Drive شما موجود است.'
    case 'remote-newer':
      return 'نسخه‌ی موجود در Google Drive نسبت به این دستگاه تغییرات جدیدتری دارد.'
    case 'conflict':
      return 'داده‌ها هم در این دستگاه و هم در Google Drive تغییر کرده‌اند. انتخاب کنید کدام نسخه مبنا باشد.'
  }
})

async function handleRestore() {
  errorText.value = ''
  isWorking.value = true
  try {
    await store.resolveRestore(mode.value, passphrase.value || undefined)
  } catch (error) {
    errorText.value = toUserMessage(error)
  } finally {
    isWorking.value = false
  }
}

async function handleKeepLocal() {
  if (!confirm('دیتای فعلی این دستگاه روی Google Drive آپلود می‌شود و جایگزین نسخه‌ی قبلی خواهد شد. ادامه می‌دهید؟')) return
  errorText.value = ''
  isWorking.value = true
  try {
    await store.resolveKeepLocal()
  } catch (error) {
    errorText.value = toUserMessage(error)
  } finally {
    isWorking.value = false
  }
}

function handleDismiss() {
  store.dismissDecision()
}
</script>
