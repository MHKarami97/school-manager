<script setup lang="ts">
import { computed } from 'vue'

const value = defineModel<number>({ required: true })

const props = defineProps<{
  placeholder?: string
}>()

const displayValue = computed(() => (value.value ? value.value.toLocaleString('en-US') : ''))

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  value.value = raw ? Number(raw) : 0
}
</script>

<template>
  <div class="relative">
    <input
      type="text"
      inputmode="numeric"
      dir="ltr"
      :value="displayValue"
      :placeholder="placeholder ?? '0'"
      class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 pl-14 text-left text-sm text-ink-800 focus:border-brand-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
      @input="onInput"
    />
    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-11px text-ink-400 dark:text-ink-500">
      تومان
    </span>
  </div>
</template>
