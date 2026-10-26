<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isCompressionSupported } from '@/backup/backup-crypto'
import { BackupError, MIN_PASSWORD_LENGTH } from '@/backup/backup-format'
import type { ConflictPolicy, RestoreMode } from '@/backup/backup-restore'
import { backupService, type BackupPhase, type BackupSummary, type LoadedBackup } from '@/backup/backup-service'
import { DEFAULT_MAX_ASSET_MB, planAssets, type ScanResult } from '@/backup/backup-snapshot'
import { storeLabel } from '@/backup/store-labels'
import { jalaliLabel } from '@/utils/attendance-date'

const PHASE_TEXT: Record<BackupPhase, string> = {
  reading: 'در حال خواندن داده‌ها...',
  serializing: 'در حال آماده‌سازی...',
  encrypting: 'در حال فشرده‌سازی و رمزگذاری (چند ثانیه طول می‌کشد)...',
  decrypting: 'در حال بازکردن رمز...',
  parsing: 'در حال بررسی فایل...',
  restoring: 'در حال بازیابی...',
}

const MB = 1024 * 1024

const scan = ref<ScanResult | null>(null)
const includeLarge = ref(true)
const maxMb = ref(DEFAULT_MAX_ASSET_MB)
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const exportBusy = ref(false)
const exportPhase = ref('')
const exportError = ref('')
const exportSummary = ref<BackupSummary | null>(null)

const file = ref<File | null>(null)
const importPassword = ref('')
const loaded = ref<LoadedBackup | null>(null)
const mode = ref<RestoreMode>('merge')
const policy = ref<ConflictPolicy>('keep-newer')
const restoreStorage = ref(true)
const backupFirst = ref(true)
const importBusy = ref(false)
const importPhase = ref('')
const importError = ref('')
const importDone = ref('')

const assetPlan = computed(() => {
  if (!scan.value) return { included: 0, includedBytes: 0, skipped: 0, totalBytes: 0 }
  const sizes = scan.value.assetSizes
  const included = planAssets(sizes, { includeLarge: includeLarge.value, maxLargeBytes: Math.max(0, maxMb.value) * MB })
  const includedBytes = Array.from(included).reduce((sum, index) => sum + sizes[index], 0)
  return {
    included: included.size,
    includedBytes,
    skipped: sizes.length - included.size,
    totalBytes: sizes.reduce((sum, value) => sum + value, 0),
  }
})

const strength = computed(() => {
  const length = password.value.length
  if (length < MIN_PASSWORD_LENGTH) return { text: 'ضعیف (حداقل ۸ نویسه)', cls: 'text-red-600 dark:text-red-400' }
  if (length < 12) return { text: 'متوسط', cls: 'text-amber-600 dark:text-amber-400' }
  return { text: 'خوب', cls: 'text-emerald-600 dark:text-emerald-400' }
})

const canExport = computed(() => password.value.length >= MIN_PASSWORD_LENGTH && password.value === confirmPassword.value && !exportBusy.value)

onMounted(async () => {
  scan.value = await backupService.scan()
})

function megabytes(bytes: number): string {
  return (bytes / MB).toLocaleString('fa-IR', { maximumFractionDigits: 1 })
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof BackupError ? error.message : fallback
}

async function doExport(): Promise<void> {
  exportError.value = ''
  exportSummary.value = null
  exportBusy.value = true
  try {
    exportSummary.value = await backupService.createBackup(
      { includeLarge: includeLarge.value, maxLargeBytes: Math.max(0, maxMb.value) * MB },
      password.value,
      (phase) => (exportPhase.value = PHASE_TEXT[phase]),
    )
    password.value = ''
    confirmPassword.value = ''
  } catch (error) {
    console.error(error)
    exportError.value = errorText(error, 'ساخت پشتیبان انجام نشد.')
  } finally {
    exportBusy.value = false
    exportPhase.value = ''
  }
}

function onFile(event: Event): void {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
  loaded.value = null
  importError.value = ''
  importDone.value = ''
}

async function inspect(): Promise<void> {
  if (!file.value) return
  importError.value = ''
  importBusy.value = true
  try {
    loaded.value = await backupService.loadBackup(file.value, importPassword.value, (phase) => (importPhase.value = PHASE_TEXT[phase]))
  } catch (error) {
    console.error(error)
    loaded.value = null
    importError.value = errorText(error, 'خواندن فایل انجام نشد.')
  } finally {
    importBusy.value = false
    importPhase.value = ''
  }
}

async function doRestore(): Promise<void> {
  if (!loaded.value) return
  const message =
    mode.value === 'replace'
      ? 'همه‌ی داده‌های فعلی برنامه حذف و با محتوای پشتیبان جایگزین می‌شود. ادامه می‌دهید؟'
      : 'داده‌های پشتیبان با داده‌های فعلی ادغام می‌شود. ادامه می‌دهید؟'
  if (!confirm(message)) return
  importError.value = ''
  importBusy.value = true
  try {
    const result = await backupService.restore(
      loaded.value,
      { mode: mode.value, conflictPolicy: policy.value, restoreLocalStorage: restoreStorage.value },
      { backupCurrentFirst: backupFirst.value, password: importPassword.value },
      (phase) => (importPhase.value = PHASE_TEXT[phase]),
    )
    const total = Object.values(result.restored).reduce((sum, value) => sum + value, 0)
    importDone.value = `${total.toLocaleString('fa-IR')} رکورد بازیابی شد. برنامه دوباره بارگذاری می‌شود...`
    setTimeout(() => window.location.reload(), 1800)
  } catch (error) {
    console.error(error)
    importError.value = errorText(error, 'بازیابی انجام نشد.')
  } finally {
    importBusy.value = false
    importPhase.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900" aria-labelledby="backup-title">
      <h2 id="backup-title" class="mb-1 text-base font-bold text-ink-800 dark:text-ink-200">پشتیبان‌گیری رمزگذاری‌شده</h2>
      <p class="mb-4 text-xs leading-6 text-ink-500 dark:text-ink-400">
        همه‌ی داده‌های برنامه (دانش‌آموزان، حضور و غیاب، سرویس مدارس، مالی و ...) در یک فایل با رمز شما ذخیره می‌شود. بدون رمز کسی نمی‌تواند محتوا را بخواند.
      </p>

      <p v-if="scan" class="mb-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        {{ scan.totalRecords.toLocaleString('fa-IR') }} رکورد در {{ scan.stores.filter((s) => s.count > 0).length.toLocaleString('fa-IR') }} بخش
        <template v-if="scan.assetSizes.length"> - {{ scan.assetSizes.length.toLocaleString('fa-IR') }} تصویر/فایل بزرگ (حدود {{ megabytes(assetPlan.totalBytes) }} مگابایت)</template>
      </p>

      <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-800 dark:text-ink-200">
        <input v-model="includeLarge" type="checkbox" class="h-5 w-5" />
        تصاویر و فایل‌های بزرگ هم در پشتیبان باشد
      </label>
      <div v-if="includeLarge" class="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="max-mb">حداکثر حجم کل تصاویر و فایل‌ها (مگابایت)</label>
          <input id="max-mb" v-model.number="maxMb" type="number" min="0" inputmode="numeric" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
        <p class="self-end text-xs leading-6 text-ink-500 dark:text-ink-400">
          {{ assetPlan.included.toLocaleString('fa-IR') }} مورد ({{ megabytes(assetPlan.includedBytes) }} مگابایت) وارد می‌شود<template v-if="assetPlan.skipped">؛ {{ assetPlan.skipped.toLocaleString('fa-IR') }} مورد که در سقف جا نمی‌شوند حذف می‌شوند (کوچک‌ترها اولویت دارند)</template>.
        </p>
      </div>
      <p v-else-if="assetPlan.skipped" class="mt-1 text-xs text-amber-700 dark:text-amber-300">{{ assetPlan.skipped.toLocaleString('fa-IR') }} تصویر/فایل در پشتیبان نخواهد بود (فیلد آن‌ها خالی بازیابی می‌شود).</p>

      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bk-pass">رمز پشتیبان</label>
          <input id="bk-pass" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          <p class="mt-1 text-11px" :class="strength.cls">{{ strength.text }}</p>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bk-pass2">تکرار رمز</label>
          <input id="bk-pass2" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          <p v-if="confirmPassword && confirmPassword !== password" class="mt-1 text-11px text-red-600 dark:text-red-400">رمزها یکسان نیستند.</p>
        </div>
      </div>
      <label class="mt-1 flex min-h-11 cursor-pointer items-center gap-2 text-xs text-ink-600 dark:text-ink-300"><input v-model="showPassword" type="checkbox" class="h-5 w-5" /> نمایش رمز</label>

      <p class="mt-1 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        رمز جایی ذخیره نمی‌شود و قابل بازیابی نیست؛ اگر آن را فراموش کنید، پشتیبان غیرقابل‌بازیابی است. فایل پشتیبان را در جای امن نگه دارید.
        <template v-if="!isCompressionSupported()"> این مرورگر فشرده‌سازی را پشتیبانی نمی‌کند؛ فایل بدون فشرده‌سازی (و بزرگ‌تر) ساخته می‌شود.</template>
      </p>

      <button type="button" :disabled="!canExport" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 mt-3 w-full disabled:opacity-50" @click="doExport">
        {{ exportBusy ? exportPhase || 'در حال ساخت...' : 'ساخت و دانلود پشتیبان' }}
      </button>
      <p v-if="exportError" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ exportError }}</p>
      <p v-if="exportSummary" class="mt-2 text-xs leading-6 text-emerald-700 dark:text-emerald-400" role="status">
        ✓ «{{ exportSummary.fileName }}» ساخته شد - {{ exportSummary.records.toLocaleString('fa-IR') }} رکورد، {{ megabytes(exportSummary.bytes) }} مگابایت<template v-if="exportSummary.skippedAssets"> ({{ exportSummary.skippedAssets.toLocaleString('fa-IR') }} تصویر/فایل کنار گذاشته شد)</template>.
      </p>
    </section>

    <section class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900" aria-labelledby="restore-title">
      <h2 id="restore-title" class="mb-1 text-base font-bold text-ink-800 dark:text-ink-200">ورود داده از پشتیبان</h2>
      <p class="mb-4 text-xs leading-6 text-ink-500 dark:text-ink-400">فایل پشتیبان و رمز آن را بدهید؛ پیش از اعمال هر تغییری، خلاصه‌ی محتوا نشان داده می‌شود.</p>

      <div class="grid gap-2 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bk-file">فایل پشتیبان</label>
          <input id="bk-file" type="file" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="onFile" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bk-import-pass">رمز</label>
          <input id="bk-import-pass" v-model="importPassword" type="password" autocomplete="current-password" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
        </div>
      </div>
      <button type="button" :disabled="!file || !importPassword || importBusy" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200 mt-3 w-full disabled:opacity-50" @click="inspect">
        {{ importBusy && !loaded ? importPhase || 'در حال بررسی...' : 'بازکردن و بررسی فایل' }}
      </button>
      <p v-if="importError" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ importError }}</p>

      <template v-if="loaded">
        <div class="mt-4 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
          <p class="mb-2 text-xs text-ink-600 dark:text-ink-300">
            ساخته‌شده در {{ jalaliLabel(loaded.preview.createdAt.slice(0, 10)) }} - {{ loaded.preview.localStorageKeys.toLocaleString('fa-IR') }} مورد تنظیمات
          </p>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[26rem] text-xs">
              <thead class="text-ink-500 dark:text-ink-400"><tr><th class="p-1.5 text-right">بخش</th><th class="p-1.5">در پشتیبان</th><th class="p-1.5">موجود</th><th class="p-1.5">جدید</th><th class="p-1.5">تداخل</th></tr></thead>
              <tbody>
                <tr v-for="row in loaded.preview.stores.filter((s) => s.inBackup > 0)" :key="row.name" class="border-t border-ink-50 text-center dark:border-ink-800">
                  <td class="p-1.5 text-right text-ink-800 dark:text-ink-200">{{ storeLabel(row.name) }}<span v-if="row.missingInApp" class="mr-1 text-11px text-amber-600">(در این نسخه نیست؛ نادیده گرفته می‌شود)</span></td>
                  <td class="p-1.5">{{ row.inBackup.toLocaleString('fa-IR') }}</td>
                  <td class="p-1.5">{{ row.existing.toLocaleString('fa-IR') }}</td>
                  <td class="p-1.5">{{ row.newRecords.toLocaleString('fa-IR') }}</td>
                  <td class="p-1.5">{{ row.conflicts.toLocaleString('fa-IR') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul v-if="loaded.preview.warnings.length" class="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
            <li v-for="warning in loaded.preview.warnings" :key="warning">⚠ {{ warning }}</li>
          </ul>
        </div>

        <fieldset class="mt-4 space-y-2">
          <legend class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">با داده‌های فعلی چه شود؟</legend>
          <label class="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm" :class="mode === 'merge' ? 'border-brand-300 bg-brand-50 dark:bg-brand-500/10' : 'border-ink-200 dark:border-ink-700'">
            <input v-model="mode" type="radio" value="merge" class="mt-1 h-5 w-5" />
            <span><strong>ادغام</strong><span class="block text-xs text-ink-500 dark:text-ink-400">داده‌ی فعلی می‌ماند و موارد پشتیبان به آن اضافه می‌شود.</span></span>
          </label>
          <div v-if="mode === 'merge'" class="pr-8">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="bk-policy">اگر رکوردی هم در پشتیبان و هم در برنامه بود:</label>
            <select id="bk-policy" v-model="policy" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option value="keep-newer">نسخه‌ی جدیدتر (بر اساس زمان ویرایش) بماند</option>
              <option value="keep-existing">همیشه نسخه‌ی فعلی بماند</option>
              <option value="use-backup">همیشه نسخه‌ی پشتیبان جایگزین شود</option>
            </select>
          </div>
          <label class="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm" :class="mode === 'replace' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-ink-200 dark:border-ink-700'">
            <input v-model="mode" type="radio" value="replace" class="mt-1 h-5 w-5" />
            <span><strong>جایگزینی کامل</strong><span class="block text-xs text-ink-500 dark:text-ink-400">همه‌ی داده‌ی فعلی پاک می‌شود و دقیقاً محتوای پشتیبان جایگزین می‌شود.</span></span>
          </label>
          <label v-if="mode === 'replace'" class="flex min-h-11 cursor-pointer items-center gap-3 pr-2 text-xs text-ink-700 dark:text-ink-200"><input v-model="backupFirst" type="checkbox" class="h-5 w-5" /> پیش از جایگزینی، از وضعیت فعلی هم یک پشتیبان (با همین رمز) دانلود شود</label>
          <label class="flex min-h-11 cursor-pointer items-center gap-3 pr-2 text-xs text-ink-700 dark:text-ink-200"><input v-model="restoreStorage" type="checkbox" class="h-5 w-5" /> تنظیمات برنامه (تم، پیش‌نویس ویزاردها و ...) هم بازیابی شود</label>
        </fieldset>

        <button type="button" :disabled="importBusy" class="min-h-11 mt-3 w-full rounded-lg px-4 text-xs font-medium text-white disabled:opacity-50" :class="mode === 'replace' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'" @click="doRestore">
          {{ importBusy ? importPhase || 'در حال بازیابی...' : mode === 'replace' ? 'جایگزینی کامل و بازیابی' : 'ادغام و بازیابی' }}
        </button>
      </template>
      <p v-if="importDone" class="mt-2 text-xs text-emerald-700 dark:text-emerald-400" role="status">{{ importDone }}</p>
    </section>
  </div>
</template>
