<script setup lang="ts">
import { computed, ref } from 'vue'

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<{ id: string; suggestions: string[]; placeholder?: string; maxItems?: number }>(), {
  placeholder: '',
  maxItems: 8,
})

const isOpen = ref(false)
const activeIndex = ref(-1)

const filtered = computed(() => {
  const query = model.value.trim()
  const matches = query ? props.suggestions.filter((item) => item.includes(query) && item !== query) : props.suggestions
  return matches.slice(0, props.maxItems)
})

const isListVisible = computed(() => isOpen.value && filtered.value.length > 0)

function open(): void {
  isOpen.value = true
}

function close(): void {
  isOpen.value = false
  activeIndex.value = -1
}

function pick(item: string): void {
  model.value = item
  close()
}

function onInput(event: Event): void {
  model.value = (event.target as HTMLInputElement).value
  activeIndex.value = -1
  open()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (!isListVisible.value) {
    if (event.key === 'ArrowDown') open()
    return
  }
  const last = filtered.value.length - 1
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = activeIndex.value >= last ? 0 : activeIndex.value + 1
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = activeIndex.value <= 0 ? last : activeIndex.value - 1
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    pick(filtered.value[activeIndex.value])
  }
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      :value="model"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="isListVisible"
      :aria-controls="`${id}-list`"
      :placeholder="placeholder"
      class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11"
      @input="onInput"
      @focus="open"
      @blur="close"
      @keydown="onKeydown"
    />
    <ul
      v-if="isListVisible"
      :id="`${id}-list`"
      role="listbox"
      class="absolute inset-x-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 text-right shadow-lg dark:border-ink-700 dark:bg-ink-800"
    >
      <li
        v-for="(item, index) in filtered"
        :key="item"
        role="option"
        :aria-selected="activeIndex === index"
        class="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-ink-800 dark:text-ink-200"
        :class="activeIndex === index ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-ink-50 dark:hover:bg-ink-700'"
        @mousedown.prevent="pick(item)"
      >
        <slot name="item" :item="item">{{ item }}</slot>
      </li>
    </ul>
  </div>
</template>
