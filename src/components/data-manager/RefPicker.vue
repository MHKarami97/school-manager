<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import SuggestionInput from '@/components/service/SuggestionInput.vue'
import { tableService } from '@/data-manager/table-service'

interface RefOption {
  id: string
  label: string
}

const model = defineModel<string>({ default: '' })
const props = defineProps<{ id: string; table: string }>()

const options = ref<RefOption[]>([])
const text = ref('')
const isLoaded = ref(false)

const labels = computed(() => options.value.map((option) => option.label))
const isDangling = computed(() => isLoaded.value && !!model.value && !options.value.some((option) => option.id === model.value))

function labelFor(id: string): string {
  if (!id) return ''
  return options.value.find((option) => option.id === id)?.label ?? `(ناموجود) ${id}`
}

async function load(): Promise<void> {
  const map = await tableService.labelsOf(props.table)
  const counts = new Map<string, number>()
  for (const label of map.values()) counts.set(label, (counts.get(label) ?? 0) + 1)
  options.value = Array.from(map, ([id, label]) => ({ id, label: (counts.get(label) ?? 0) > 1 ? `${label} · ${id.slice(0, 4)}` : label }))
  isLoaded.value = true
  text.value = labelFor(model.value)
}

onMounted(load)

watch(model, (value) => {
  if (!isLoaded.value) return
  const current = options.value.find((option) => option.label === text.value)
  if (current?.id !== value) text.value = labelFor(value)
})

function onText(value: string): void {
  text.value = value
  const hit = options.value.find((option) => option.label === value)
  model.value = hit ? hit.id : ''
}
</script>

<template>
  <div>
    <SuggestionInput :id="id" :model-value="text" :suggestions="labels" placeholder="جستجو و انتخاب..." @update:model-value="onText" />
    <p v-if="text && !model" class="mt-1 text-11px text-amber-600 dark:text-amber-400">موردی از فهرست انتخاب نشده است.</p>
    <p v-else-if="isDangling" class="mt-1 text-11px text-amber-600 dark:text-amber-400">این شناسه در جدول مرجع وجود ندارد.</p>
  </div>
</template>
