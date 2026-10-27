<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ACTIVE_PLAN_STORAGE_KEY } from '@/config/service.config'
import {
  applyImport,
  buildContext,
  buildPreview,
  downloadTemplate,
  matrixToRows,
  readFileMatrix,
  ImportError,
  type ImportOptions,
  type ImportPreview,
} from '@/data-manager/import/import-core'
import { IMPORT_TEMPLATES } from '@/data-manager/import/templates'
import { tableDef } from '@/data-manager/table-registry'
import { DataError, tableService } from '@/data-manager/table-service'

const GENDER_KEY = 'school-manager-attendance-last-gender'
const SAME_GENDER_KEY = 'school-manager-attendance-same-gender'

const emit = defineEmits<{ (e: 'changed'): void }>()

const templateId = ref(IMPORT_TEMPLATES[0].id)
const plans = ref<{ id: string; label: string }[]>([])
const planId = ref('')
const onExisting = ref<'update' | 'skip'>('update')
const defaultGender = ref<'male' | 'female'>(localStorage.getItem(GENDER_KEY) === 'female' ? 'female' : 'male')
const sameGenderForAll = ref(localStorage.getItem(SAME_GENDER_KEY) !== 'false')
const allOrNothing = ref(false)
const file = ref<File | null>(null)
const preview = ref<ImportPreview | null>(null)
const isBusy = ref(false)
const error = ref('')
const done = ref('')

const template = computed(() => IMPORT_TEMPLATES.find((item) => item.id === templateId.value) ?? IMPORT_TEMPLATES[0])
const visibleErrors = computed(() => (preview.value?.rows ?? []).filter((row) => !row.valid).slice(0, 25))
const visibleWarnings = computed(() => (preview.value?.rows ?? []).filter((row) => row.valid && row.outcome.warnings.length).slice(0, 15))
const canApply = computed(() => !!preview.value && preview.value.validRows > 0 && !isBusy.value && (!template.value.needsPlan || !!planId.value))

onMounted(async () => {
  const list = await tableService.list('svcPlans')
  plans.value = list.map((plan) => ({ id: String(plan.id), label: `${plan.title} (${plan.academicYear})` }))
  const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY) ?? ''
  planId.value = plans.value.find((plan) => plan.id === stored)?.id ?? plans.value[0]?.id ?? ''
})

function options(): ImportOptions {
  return { onExisting: onExisting.value, defaultGender: defaultGender.value, sameGenderForAll: sameGenderForAll.value, planId: planId.value }
}

function selectTemplate(id: string): void {
  templateId.value = id
  preview.value = null
  done.value = ''
  error.value = ''
}

async function rebuildPreview(): Promise<void> {
  if (!file.value) return
  isBusy.value = true
  error.value = ''
  done.value = ''
  try {
    const matrix = await readFileMatrix(file.value)
    const parsed = matrixToRows(matrix, template.value)
    const ctx = await buildContext(planId.value)
    preview.value = buildPreview(template.value, parsed, ctx, options())
    if (!parsed.rows.length && !parsed.missingColumns.length) error.value = 'ردیف داده‌ای در فایل پیدا نشد.'
  } catch (cause) {
    console.error(cause)
    preview.value = null
    error.value = 'خواندن فایل انجام نشد؛ از فرمت xlsx یا csv مطابق قالب استفاده کنید.'
  } finally {
    isBusy.value = false
  }
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  await rebuildPreview()
}

async function apply(): Promise<void> {
  if (!preview.value) return
  if (template.value.needsPlan && !planId.value) {
    error.value = 'ابتدا یک طرح سرویس بسازید و انتخاب کنید.'
    return
  }
  isBusy.value = true
  error.value = ''
  try {
    const count = await applyImport(preview.value, allOrNothing.value)
    done.value = `${count.toLocaleString('fa-IR')} رکورد در ${Object.keys(preview.value.tableCounts).length.toLocaleString('fa-IR')} جدول ذخیره شد.`
    preview.value = null
    file.value = null
    emit('changed')
  } catch (cause) {
    error.value = cause instanceof ImportError || cause instanceof DataError ? cause.message : 'ورود داده انجام نشد و هیچ تغییری اعمال نشد.'
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <section class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900" aria-labelledby="import-title">
    <h2 id="import-title" class="mb-1 text-base font-bold text-ink-800 dark:text-ink-200">ورود گروهی از فایل (اکسل / CSV)</h2>
    <p class="mb-4 text-xs leading-6 text-ink-500 dark:text-ink-400">
      جدول‌های مرتبط در یک فایل وارد می‌شوند؛ مثلاً هر ردیف دانش‌آموز، شماره‌ی والدین، آدرس سرویس و عضویت کلاس او را با هم می‌سازد. ارجاع‌ها خودکار برقرار می‌شود و لازم نیست شناسه بنویسید.
    </p>

    <div class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="نوع فایل">
      <button
        v-for="item in IMPORT_TEMPLATES"
        :key="item.id"
        type="button"
        role="radio"
        :aria-checked="templateId === item.id"
        class="min-h-11 rounded-xl border p-3 text-right"
        :class="templateId === item.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-ink-200 dark:border-ink-700'"
        @click="selectTemplate(item.id)"
      >
        <span class="block text-sm font-semibold text-ink-800 dark:text-ink-200">{{ item.label }}</span>
        <span class="mt-1 block text-11px text-ink-500 dark:text-ink-400">جدول‌ها: {{ item.tables.map((name) => tableDef(name).label).join('، ') }}</span>
      </button>
    </div>

    <p class="mt-3 text-xs leading-6 text-ink-600 dark:text-ink-300">{{ template.description }}</p>

    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <div v-if="template.needsPlan">
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="imp-plan">طرح سرویس</label>
        <select id="imp-plan" v-model="planId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="rebuildPreview">
          <option v-if="!plans.length" value="">طرحی ساخته نشده است</option>
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.label }}</option>
        </select>
      </div>
      <div v-if="!template.needsPlan || template.id === 'service-assignments'">
        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="imp-existing">اگر رکورد از قبل وجود داشت</label>
        <select id="imp-existing" v-model="onExisting" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="rebuildPreview">
          <option value="update">به‌روزرسانی شود</option>
          <option value="skip">رد شود</option>
        </select>
      </div>
      <template v-if="template.usesGender">
        <div>
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="imp-gender">جنسیت پیش‌فرض</label>
          <select id="imp-gender" v-model="defaultGender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="rebuildPreview">
            <option value="male">پسر / آقا</option>
            <option value="female">دختر / خانم</option>
          </select>
        </div>
        <label class="flex min-h-11 cursor-pointer items-center gap-2 self-end text-xs text-ink-700 dark:text-ink-200">
          <input v-model="sameGenderForAll" type="checkbox" class="h-5 w-5" @change="rebuildPreview" />
          جنسیت همه یکسان است (ستون جنسیت نادیده گرفته شود)
        </label>
      </template>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="downloadTemplate(template)">دانلود قالب (با برگه‌ی راهنما)</button>
      <label class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 inline-flex cursor-pointer items-center">
        انتخاب فایل
        <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onFile" />
      </label>
      <span v-if="file" class="self-center text-xs text-ink-500 dark:text-ink-400">{{ file.name }}</span>
    </div>

    <p v-if="isBusy && !preview" class="mt-3 text-xs text-ink-500">در حال بررسی فایل...</p>
    <p v-if="error" class="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    <p v-if="done" class="mt-3 text-xs text-emerald-700 dark:text-emerald-400" role="status">✓ {{ done }}</p>

    <div v-if="preview" class="mt-4 space-y-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
      <p v-if="preview.missingColumns.length" class="text-xs text-red-600 dark:text-red-400" role="alert">
        ستون‌های الزامی در فایل پیدا نشد: {{ preview.missingColumns.join('، ') }}. عنوان ستون‌ها باید مثل قالب باشد.
      </p>
      <template v-else>
        <p class="text-xs text-ink-700 dark:text-ink-200">
          {{ preview.validRows.toLocaleString('fa-IR') }} ردیف معتبر<template v-if="preview.invalidRows"> — <span class="text-red-600 dark:text-red-400">{{ preview.invalidRows.toLocaleString('fa-IR') }} ردیف دارای خطا</span></template>
        </p>
        <table v-if="Object.keys(preview.tableCounts).length" class="w-full text-xs">
          <thead class="text-ink-500 dark:text-ink-400"><tr><th class="p-1.5 text-right">جدول</th><th class="p-1.5">جدید</th><th class="p-1.5">به‌روزرسانی</th></tr></thead>
          <tbody>
            <tr v-for="(counts, name) in preview.tableCounts" :key="name" class="border-t border-ink-50 text-center dark:border-ink-800">
              <td class="p-1.5 text-right text-ink-800 dark:text-ink-200">{{ tableDef(String(name)).label }}</td>
              <td class="p-1.5">{{ counts.create.toLocaleString('fa-IR') }}</td>
              <td class="p-1.5">{{ counts.update.toLocaleString('fa-IR') }}</td>
            </tr>
          </tbody>
        </table>

        <ul v-if="visibleErrors.length" class="max-h-48 space-y-1 overflow-y-auto text-xs text-red-600 dark:text-red-400">
          <li v-for="row in visibleErrors" :key="row.rowNumber">ردیف {{ row.rowNumber.toLocaleString('fa-IR') }}: {{ row.outcome.errors[0] }}</li>
          <li v-if="preview.invalidRows > visibleErrors.length">... و {{ (preview.invalidRows - visibleErrors.length).toLocaleString('fa-IR') }} ردیف دیگر</li>
        </ul>
        <ul v-if="visibleWarnings.length" class="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-700 dark:text-amber-300">
          <li v-for="row in visibleWarnings" :key="row.rowNumber">⚠ ردیف {{ row.rowNumber.toLocaleString('fa-IR') }}: {{ row.outcome.warnings[0] }}</li>
        </ul>

        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-xs text-ink-700 dark:text-ink-200"><input v-model="allOrNothing" type="checkbox" class="h-5 w-5" /> اگر حتی یک ردیف خطا داشت، هیچ‌چیز وارد نشود</label>
        <button type="button" :disabled="!canApply" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 w-full disabled:opacity-50" @click="apply">
          {{ isBusy ? 'در حال ذخیره...' : `ورود ${preview.validRows.toLocaleString('fa-IR')} ردیف معتبر` }}
        </button>
        <p class="text-11px text-ink-400 dark:text-ink-500">همه‌ی رکوردها در یک تراکنش ذخیره می‌شوند؛ اگر خطایی رخ دهد هیچ تغییری اعمال نمی‌شود. پیش از ورود حجیم، از «تنظیمات» پشتیبان بگیرید.</p>
      </template>
    </div>
  </section>
</template>
