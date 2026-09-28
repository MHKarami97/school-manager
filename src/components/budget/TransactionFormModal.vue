<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BudgetCategory, Transaction, TransactionType } from '../../types'
import { TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from '../../config/budget.config'
import JalaliDatePicker from '../lessonPlan/JalaliDatePicker.vue'
import CurrencyInput from '../CurrencyInput.vue'

const props = defineProps<{
  modelValue: boolean
  transaction: Transaction | null
  categories: BudgetCategory[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', transaction: Transaction): void
  (e: 'delete', transactionId: string): void
}>()

const categoryId = ref('')
const type = ref<TransactionType>('expense')
const amount = ref(0)
const date = ref('')
const description = ref('')
const attachmentDataUrl = ref<string | null>(null)
const isUploadingAttachment = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.transaction) {
      categoryId.value = props.transaction.categoryId
      type.value = props.transaction.type
      amount.value = props.transaction.amount
      date.value = props.transaction.date
      description.value = props.transaction.description
      attachmentDataUrl.value = props.transaction.attachmentDataUrl
    }
  },
)

async function onAttachmentSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploadingAttachment.value = true
  try {
    attachmentDataUrl.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  } finally {
    isUploadingAttachment.value = false
  }
}

function removeAttachment(): void {
  attachmentDataUrl.value = null
}

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  if (!props.transaction || !categoryId.value || !amount.value) return
  emit('save', {
    ...props.transaction,
    categoryId: categoryId.value,
    type: type.value,
    amount: amount.value,
    date: date.value,
    description: description.value.trim(),
    attachmentDataUrl: attachmentDataUrl.value,
  })
  close()
}

function removeTransaction(): void {
  if (!props.transaction) return
  emit('delete', props.transaction.id)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && transaction"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="close"
    >
      <div class="max-h-90vh w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">ثبت تراکنش</p>

        <div class="mb-3 flex gap-2">
          <button
            v-for="t in TRANSACTION_TYPES"
            :key="t"
            type="button"
            class="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition"
            :class="
              type === t
                ? t === 'expense'
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300'
                : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
            "
            @click="type = t"
          >
            {{ TRANSACTION_TYPE_LABELS[t] }}
          </button>
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">دسته بودجه</label>
        <select
          v-model="categoryId"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option value="" disabled>یک دسته را انتخاب کن</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.title }}</option>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">مبلغ</label>
        <div class="mb-3">
          <CurrencyInput v-model="amount" />
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ (شمسی)</label>
        <div class="mb-3">
          <JalaliDatePicker v-model="date" />
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">توضیح</label>
        <textarea
          v-model="description"
          rows="2"
          placeholder="مثلاً: خرید تجهیزات آزمایشگاه"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        ></textarea>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پیوست/رسید (اختیاری)</label>
        <div class="mb-4 flex items-center gap-3">
          <img v-if="attachmentDataUrl" :src="attachmentDataUrl" alt="" class="h-14 w-14 rounded-lg object-cover" />
          <label class="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-11px font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300">
            {{ isUploadingAttachment ? 'در حال بارگذاری...' : 'انتخاب فایل' }}
            <input type="file" accept="image/*,application/pdf" class="hidden" @change="onAttachmentSelected" />
          </label>
          <button v-if="attachmentDataUrl" type="button" class="text-11px text-red-600 dark:text-red-400" @click="removeAttachment">
            حذف
          </button>
        </div>

        <div class="flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="removeTransaction">
            حذف تراکنش
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200"
              @click="close"
            >
              انصراف
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!categoryId || !amount"
              @click="save"
            >
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
