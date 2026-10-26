<script setup lang="ts">
import { nextTick } from 'vue'
import { toLatinDigits } from '@/utils/attendance-domain'

const MAX_DIGITS = 12

const value = defineModel<number>({ required: true })

defineProps<{ id?: string; placeholder?: string }>()

function format(amount: number): string {
  return amount > 0 ? amount.toLocaleString('en-US') : ''
}

async function onInput(event: Event): Promise<void> {
  const element = event.target as HTMLInputElement
  const caret = element.selectionStart ?? element.value.length
  const digitsBeforeCaret = toLatinDigits(element.value.slice(0, caret)).replace(/\D/g, '').length
  const digits = toLatinDigits(element.value).replace(/\D/g, '').slice(0, MAX_DIGITS)
  value.value = digits ? Number(digits) : 0
  await nextTick()
  const text = format(value.value)
  element.value = text
  let position = 0
  let seen = 0
  while (position < text.length && seen < digitsBeforeCaret) {
    if (/\d/.test(text[position])) seen += 1
    position += 1
  }
  element.setSelectionRange(position, position)
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      dir="ltr"
      :value="format(value)"
      :placeholder="placeholder ?? '0'"
      class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 pl-14 text-left focus:border-brand-400 focus:outline-none"
      @input="onInput"
    />
    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-400 dark:text-ink-500">تومان</span>
  </div>
</template>
