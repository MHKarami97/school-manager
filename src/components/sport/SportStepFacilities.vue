<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSportWizardStore } from '@/stores/sport-wizard'
import { useSportFacilitiesStore } from '@/stores/sport-facilities'

const wizard = useSportWizardStore()
const facilitiesStore = useSportFacilitiesStore()

onMounted(() => facilitiesStore.loadFromDb())

const newName = ref('')
const newCapacity = ref(1)

async function addFacility(): Promise<void> {
  const name = newName.value.trim()
  if (!name) return
  const facility = await facilitiesStore.addFacility(name, newCapacity.value)
  wizard.setSelectedFacilityIds([...wizard.selectedFacilityIds, facility.id])
  newName.value = ''
  newCapacity.value = 1
}

function isSelected(id: string): boolean {
  return wizard.selectedFacilityIds.includes(id)
}

function toggleSelected(id: string): void {
  const set = new Set(wizard.selectedFacilityIds)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  wizard.setSelectedFacilityIds(Array.from(set))
}

async function removeFacility(id: string): Promise<void> {
  await facilitiesStore.removeFacility(id)
  wizard.setSelectedFacilityIds(wizard.selectedFacilityIds.filter((f) => f !== id))
}

const hasFacilities = computed(() => facilitiesStore.items.length > 0)
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
      این مرحله اختیاری است. اگر سالن/زمین ورزشی جداگانه نداری یا محدودیت هم‌زمانی برایت مهم نیست،
      می‌توانی بدون افزودن هیچ فضایی به مرحله بعد بروی.
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">افزودن سالن/زمین ورزشی</p>
      <div class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="مثال: سالن ورزشی، زمین چمن"
          class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />
        <input
          v-model.number="newCapacity"
          type="number"
          min="1"
          max="10"
          class="w-20 rounded-lg border border-ink-200 bg-white px-2 py-2 text-center text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />
        <button
          type="button"
          class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700"
          @click="addFacility"
        >
          افزودن
        </button>
      </div>
      <p class="mt-2 text-11px text-ink-400 dark:text-ink-500">
        عدد کنار نام یعنی «چند کلاس هم‌زمان می‌توانند از این فضا استفاده کنند».
      </p>
    </div>

    <div v-if="hasFacilities" class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="facility in facilitiesStore.items"
        :key="facility.id"
        class="flex items-center justify-between rounded-xl border px-4 py-2.5"
        :class="isSelected(facility.id) ? 'border-brand-300 bg-brand-50 dark:bg-brand-500/10' : 'border-ink-200 dark:border-ink-700'"
      >
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="isSelected(facility.id)"
            class="h-4 w-4 rounded border-ink-300"
            @change="toggleSelected(facility.id)"
          />
          <span class="text-sm text-ink-700 dark:text-ink-200">
            {{ facility.name }} <span class="text-11px text-ink-400 dark:text-ink-500">(ظرفیت هم‌زمان: {{ facility.concurrentCapacity }})</span>
          </span>
        </label>
        <button type="button" class="text-xs text-red-600 dark:text-red-400" @click="removeFacility(facility.id)">
          حذف
        </button>
      </div>
    </div>
  </div>
</template>
