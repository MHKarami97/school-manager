<script setup lang="ts">
/**
 * ورودی متنی با پیشنهاد خودکار نام معلم (autocomplete سفارشی).
 * به‌جای <datalist> بومی مرورگر ساخته شده چون موقعیت‌دهی dropdown آن در
 * صفحات RTL توسط مرورگر کنترل می‌شود و قابل استایل‌دهی/تصحیح نیست؛ این
 * کامپوننت لیست پیشنهادها را دقیقاً زیر همان ورودی (position: absolute)
 * رندر می‌کند.
 */
import { computed, ref } from 'vue'
import { useTeachersStore } from '@/stores/teachers'

const modelValue = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()

const teachersStore = useTeachersStore()
const isOpen = ref(false)

const suggestions = computed(() => {
  const query = modelValue.value.trim()
  if (!query) return []
  return teachersStore.sortedByName.filter((t) => t.name.includes(query)).slice(0, 6)
})

function selectSuggestion(name: string): void {
  modelValue.value = name
  isOpen.value = false
}

function handleBlur(): void {
  window.setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<template>
  <div class="relative">
    <input
      v-model="modelValue"
      type="text"
      :placeholder="placeholder"
      class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
      @focus="isOpen = true"
      @blur="handleBlur"
    />
    <ul
      v-if="isOpen && suggestions.length"
      class="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
    >
      <li
        v-for="t in suggestions"
        :key="t.id"
        class="cursor-pointer px-3 py-2 text-sm text-ink-700 hover:bg-brand-50"
        @mousedown.prevent="selectSuggestion(t.name)"
      >
        {{ t.name }}
      </li>
    </ul>
  </div>
</template>
