<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getPath, type PlainRecord } from '@/data-manager/record-path'
import { autoColumns, listFields, tableDef, type FieldDef } from '@/data-manager/table-registry'
import { DataError, tableService, type DeleteImpact } from '@/data-manager/table-service'
import { useFlashMessage } from '@/composables/use-flash-message'
import { jalaliLabel } from '@/utils/attendance-date'
import { normalizePersianText } from '@/utils/attendance-student-import'
import BulkEditModal from './BulkEditModal.vue'
import RecordEditorModal from './RecordEditorModal.vue'

const PAGE_SIZE = 25

const props = defineProps<{ table: string }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const { message, isError, show } = useFlashMessage(5000)

const def = computed(() => tableDef(props.table))
const records = ref<PlainRecord[]>([])
const refLabels = ref<Record<string, Map<string, string>>>({})
const isLoading = ref(true)
const search = ref('')
const page = ref(1)
const selected = ref<Set<string>>(new Set())

const isEditorOpen = ref(false)
const editing = ref<PlainRecord | null>(null)
const isBulkOpen = ref(false)

const pendingDelete = ref<{ keys: string[]; impact: DeleteImpact } | null>(null)
const deleteBusy = ref(false)
const deleteError = ref('')

const columns = computed<FieldDef[]>(() => {
  if (def.value.fields) {
    const cols = listFields(def.value)
    return cols.length ? cols : def.value.fields.slice(0, 4)
  }
  return autoColumns(records.value[0] ?? {}).map((key): FieldDef => ({ key, label: key, type: 'text' }))
})

function keyOf(record: PlainRecord): string {
  return String(record[def.value.keyPath] ?? '')
}

function cellText(field: FieldDef, record: PlainRecord): string {
  const value = getPath(record, field.key)
  if (value === null || value === undefined || value === '') return '—'
  if (field.type === 'boolean') return value ? '✓' : '—'
  if (field.type === 'ref' && field.ref) return refLabels.value[field.ref]?.get(String(value)) ?? String(value)
  if (field.type === 'select') return field.options?.find((option) => option.value === value)?.label ?? String(value)
  if (field.type === 'date') return jalaliLabel(String(value)) || String(value)
  if (Array.isArray(value)) return value.join('، ')
  if (typeof value === 'object') return '{…}'
  const text = String(value)
  return text.length > 60 ? `${text.slice(0, 60)}…` : text
}

const searchIndex = computed(() => {
  const index = new Map<string, string>()
  for (const record of records.value) {
    const parts: string[] = [def.value.labelOf(record)]
    for (const value of Object.values(record)) {
      if (typeof value === 'string' && !value.startsWith('data:')) parts.push(value)
      else if (typeof value === 'number') parts.push(String(value))
    }
    index.set(keyOf(record), normalizePersianText(parts.join(' ')).toLowerCase())
  }
  return index
})

const filtered = computed(() => {
  const query = normalizePersianText(search.value).toLowerCase()
  const list = query ? records.value.filter((record) => searchIndex.value.get(keyOf(record))?.includes(query)) : records.value
  return list
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const allOnPageSelected = computed(() => pageRows.value.length > 0 && pageRows.value.every((record) => selected.value.has(keyOf(record))))

async function load(): Promise<void> {
  isLoading.value = true
  selected.value = new Set()
  page.value = 1
  search.value = ''
  const list = await tableService.list(props.table)
  const sortKey = list.some((record) => typeof record.updatedAt === 'number') ? 'updatedAt' : list.some((record) => typeof record.createdAt === 'number') ? 'createdAt' : ''
  records.value = sortKey ? list.sort((a, b) => Number(b[sortKey] ?? 0) - Number(a[sortKey] ?? 0)) : list
  const needed = new Set((def.value.fields ?? []).filter((field) => field.type === 'ref' && field.ref && field.inList).map((field) => field.ref as string))
  const labels: Record<string, Map<string, string>> = {}
  for (const name of needed) labels[name] = await tableService.labelsOf(name)
  refLabels.value = labels
  isLoading.value = false
}

onMounted(load)
watch(() => props.table, load)
watch(search, () => {
  page.value = 1
})

function togglePage(): void {
  const next = new Set(selected.value)
  for (const record of pageRows.value) {
    if (allOnPageSelected.value) next.delete(keyOf(record))
    else next.add(keyOf(record))
  }
  selected.value = next
}

function toggleOne(key: string): void {
  const next = new Set(selected.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selected.value = next
}

function selectAllFiltered(): void {
  selected.value = new Set(filtered.value.map(keyOf))
}

function openCreate(): void {
  editing.value = null
  isEditorOpen.value = true
}

function openEdit(record: PlainRecord): void {
  editing.value = record
  isEditorOpen.value = true
}

async function afterChange(): Promise<void> {
  await load()
  emit('changed')
}

async function onSaved(warnings: string[]): Promise<void> {
  await afterChange()
  show(warnings.length ? `ذخیره شد، اما: ${warnings.join(' ')}` : 'ذخیره شد.', warnings.length > 0)
}

async function onBulkDone(count: number): Promise<void> {
  await afterChange()
  show(`${count.toLocaleString('fa-IR')} رکورد ویرایش شد.`)
}

async function askDelete(keys: string[]): Promise<void> {
  if (!keys.length) return
  deleteError.value = ''
  pendingDelete.value = { keys, impact: await tableService.deleteImpact(props.table, keys) }
}

async function confirmDelete(): Promise<void> {
  if (!pendingDelete.value) return
  deleteBusy.value = true
  deleteError.value = ''
  try {
    const { keys } = pendingDelete.value
    const result = await tableService.deleteRecords(props.table, keys)
    pendingDelete.value = null
    await afterChange()
    show(`${keys.length.toLocaleString('fa-IR')} رکورد حذف شد${result.totalDeletes ? ` (و ${result.totalDeletes.toLocaleString('fa-IR')} رکورد وابسته)` : ''}.`)
  } catch (error) {
    deleteError.value = error instanceof DataError ? error.message : 'حذف انجام نشد.'
  } finally {
    deleteBusy.value = false
  }
}
</script>

<template>
  <section class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900" :aria-label="def.label">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-base font-bold text-ink-800 dark:text-ink-200">{{ def.label }}</h2>
        <p class="text-11px text-ink-500 dark:text-ink-400">
          {{ filtered.length.toLocaleString('fa-IR') }} رکورد<template v-if="search"> از {{ records.length.toLocaleString('fa-IR') }}</template>
          <template v-if="!def.fields"> — ویرایش فقط با JSON</template>
        </p>
      </div>
      <button type="button" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700" @click="openCreate">+ افزودن</button>
    </div>

    <label class="sr-only" for="tb-search">جستجو در جدول</label>
    <input id="tb-search" v-model="search" type="search" placeholder="جستجو..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11" />

    <p v-if="message" role="status" class="mb-2 text-xs leading-6" :class="isError ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>

    <div v-if="selected.size" class="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
      <span class="text-xs font-medium text-brand-800 dark:text-brand-200">{{ selected.size.toLocaleString('fa-IR') }} رکورد انتخاب شد</span>
      <button v-if="selected.size < filtered.length" type="button" class="min-h-11 text-xs underline" @click="selectAllFiltered">انتخاب همه‌ی {{ filtered.length.toLocaleString('fa-IR') }} نتیجه</button>
      <button v-if="def.fields" type="button" class="min-h-11 rounded-lg border border-brand-300 px-3 text-xs" @click="isBulkOpen = true">ویرایش گروهی</button>
      <button type="button" class="min-h-11 rounded-lg border border-red-300 px-3 text-xs text-red-700 dark:text-red-300" @click="askDelete(Array.from(selected))">حذف انتخاب‌شده‌ها</button>
      <button type="button" class="min-h-11 px-2 text-xs" @click="selected = new Set()">لغو انتخاب</button>
    </div>

    <p v-if="isLoading" class="p-6 text-center text-ink-400">در حال بارگذاری...</p>
    <p v-else-if="!pageRows.length" class="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400 dark:border-ink-700">رکوردی نیست.</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[32rem] text-xs">
        <thead class="text-ink-500 dark:text-ink-400">
          <tr>
            <th class="w-10 p-1.5"><input type="checkbox" class="h-5 w-5" :checked="allOnPageSelected" aria-label="انتخاب همه‌ی این صفحه" @change="togglePage" /></th>
            <th v-for="column in columns" :key="column.key" class="p-1.5 text-right font-medium">{{ column.label }}</th>
            <th class="p-1.5"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in pageRows" :key="keyOf(record)" class="border-t border-ink-50 dark:border-ink-800" :class="selected.has(keyOf(record)) ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''">
            <td class="p-1.5"><input type="checkbox" class="h-5 w-5" :checked="selected.has(keyOf(record))" :aria-label="`انتخاب ${def.labelOf(record)}`" @change="toggleOne(keyOf(record))" /></td>
            <td v-for="column in columns" :key="column.key" class="max-w-48 truncate p-1.5 text-ink-800 dark:text-ink-200" :title="cellText(column, record)">{{ cellText(column, record) }}</td>
            <td class="whitespace-nowrap p-1.5 text-left">
              <button type="button" class="min-h-11 px-2 text-brand-600 dark:text-brand-400" @click="openEdit(record)">ویرایش</button>
              <button type="button" class="min-h-11 px-2 text-red-600 dark:text-red-400" @click="askDelete([keyOf(record)])">حذف</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pageCount > 1" class="mt-3 flex items-center justify-center gap-3 text-xs text-ink-600 dark:text-ink-300">
      <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 disabled:opacity-40 dark:border-ink-700" :disabled="page <= 1" @click="page -= 1">قبلی</button>
      <span>صفحه‌ی {{ page.toLocaleString('fa-IR') }} از {{ pageCount.toLocaleString('fa-IR') }}</span>
      <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-3 disabled:opacity-40 dark:border-ink-700" :disabled="page >= pageCount" @click="page += 1">بعدی</button>
    </div>

    <RecordEditorModal v-model="isEditorOpen" :table="table" :record="editing" @saved="onSaved" />
    <BulkEditModal v-model="isBulkOpen" :table="table" :keys="Array.from(selected)" @done="onBulkDone" />

    <Teleport to="body">
      <div v-if="pendingDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="pendingDelete = null">
        <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
          <p id="del-title" class="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">حذف {{ pendingDelete.keys.length.toLocaleString('fa-IR') }} رکورد از «{{ def.label }}»؟</p>
          <template v-if="pendingDelete.impact.totalDeletes || pendingDelete.impact.totalUpdates">
            <p class="mb-1 text-xs text-ink-600 dark:text-ink-300">رکوردهای وابسته هم تغییر می‌کنند:</p>
            <ul class="mb-2 space-y-1 text-xs text-ink-700 dark:text-ink-200">
              <li v-for="(count, name) in pendingDelete.impact.plan.counts" :key="name">
                {{ tableDef(String(name)).label }}:
                <template v-if="count.delete">{{ count.delete.toLocaleString('fa-IR') }} حذف</template>
                <template v-if="count.delete && count.update"> و </template>
                <template v-if="count.update">{{ count.update.toLocaleString('fa-IR') }} اصلاح</template>
              </li>
            </ul>
          </template>
          <p v-else class="mb-2 text-xs text-ink-600 dark:text-ink-300">رکورد وابسته‌ای وجود ندارد.</p>
          <p class="mb-3 text-11px text-amber-700 dark:text-amber-300">این کار قابل بازگشت نیست؛ برای اطمینان قبل از آن از «تنظیمات» پشتیبان بگیرید.</p>
          <p v-if="deleteError" class="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ deleteError }}</p>
          <div class="flex justify-end gap-2">
            <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="pendingDelete = null">انصراف</button>
            <button type="button" :disabled="deleteBusy" class="min-h-11 rounded-lg bg-red-600 px-4 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50" @click="confirmDelete">{{ deleteBusy ? 'در حال حذف...' : 'حذف' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
