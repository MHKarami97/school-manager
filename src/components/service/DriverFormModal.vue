<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { GeoPoint, ServiceDriver, VehicleKind } from '@/types'
import {
  DRIVER_GENDERS,
  DRIVER_GENDER_LABELS,
  VEHICLE_COLORS,
  VEHICLE_KINDS,
  VEHICLE_KIND_LABELS,
} from '@/config/service.config'
import { capacityOf, defaultLayoutFor } from '@/utils/service-domain'
import SeatLayoutEditor from './SeatLayoutEditor.vue'
import SuggestionInput from './SuggestionInput.vue'

const LocationPickerModal = defineAsyncComponent(() => import('./LocationPickerModal.vue'))

const COLOR_SWATCHES: Record<string, string> = {
  سفید: '#ffffff',
  مشکی: '#111827',
  'نقره‌ای': '#c0c0c0',
  خاکستری: '#6b7280',
  سرمه‌ای: '#1e3a8a',
  آبی: '#2563eb',
  قرمز: '#dc2626',
  زرد: '#facc15',
  سبز: '#16a34a',
  'قهوه‌ای': '#78350f',
  بژ: '#d6c7a1',
}

const props = defineProps<{ modelValue: boolean; driver: ServiceDriver | null; errorMessage: string }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: ServiceDriver): void
}>()

const form = ref<ServiceDriver | null>(null)
const regionText = ref('')
const isPickerOpen = ref(false)

const capacity = computed(() => (form.value ? capacityOf(form.value.seatLayout) : 0))
const canSave = computed(() => !!form.value && form.value.fullName.trim().length > 0)

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.driver) return
    form.value = JSON.parse(JSON.stringify(props.driver)) as ServiceDriver
    regionText.value = ''
  },
)

function swatchOf(color: string): string {
  return COLOR_SWATCHES[color] ?? 'transparent'
}

function close(): void {
  emit('update:modelValue', false)
}

function onKindEvent(event: Event): void {
  if (!form.value) return
  const kind = (event.target as HTMLSelectElement).value as VehicleKind
  form.value.vehicleKind = kind
  form.value.seatLayout = defaultLayoutFor(kind)
}

function addRegion(): void {
  if (!form.value) return
  const value = regionText.value.trim()
  if (value && !form.value.coverageRegions.includes(value)) form.value.coverageRegions.push(value)
  regionText.value = ''
}

function removeRegion(region: string): void {
  if (form.value) form.value.coverageRegions = form.value.coverageRegions.filter((item) => item !== region)
}

function onLocation(point: GeoPoint | null): void {
  if (form.value) form.value.baseLocation = point
}

function onYearInput(event: Event): void {
  if (!form.value) return
  const value = (event.target as HTMLInputElement).value.trim()
  form.value.vehicleYear = value ? Number(value) : null
}

function submit(): void {
  if (form.value && canSave.value) emit('save', form.value)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && form" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <form class="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="driver-modal-title" @submit.prevent="submit">
        <p id="driver-modal-title" class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">مشخصات راننده و خودرو</p>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-name">نام و نام خانوادگی راننده</label>
            <input id="drv-name" v-model="form.fullName" type="text" required class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-gender">جنسیت راننده</label>
            <select id="drv-gender" v-model="form.gender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option v-for="item in DRIVER_GENDERS" :key="item" :value="item">{{ DRIVER_GENDER_LABELS[item] }}</option>
            </select>
          </div>
          <div class="sm:col-span-3">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-phone">شماره‌ی تماس راننده</label>
            <input id="drv-phone" v-model="form.phone" type="tel" inputmode="tel" dir="ltr" placeholder="09123456789" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
          </div>
        </div>

        <p class="mb-2 mt-5 text-xs font-semibold text-ink-700 dark:text-ink-200">خودرو</p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-kind">نوع خودرو</label>
            <select id="drv-kind" :value="form.vehicleKind" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @change="onKindEvent">
              <option v-for="item in VEHICLE_KINDS" :key="item" :value="item">{{ VEHICLE_KIND_LABELS[item] }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-model">مدل (مثلاً پژو ۲۰۶)</label>
            <input id="drv-model" v-model="form.vehicleModel" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-year">سال ساخت (شمسی)</label>
            <input id="drv-year" :value="form.vehicleYear ?? ''" type="number" inputmode="numeric" min="1300" max="1500" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @input="onYearInput" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-color">رنگ</label>
            <SuggestionInput id="drv-color" v-model="form.vehicleColor" :suggestions="VEHICLE_COLORS">
              <template #item="{ item }">
                <span class="h-4 w-4 shrink-0 rounded-full border border-ink-300 dark:border-ink-500" :style="{ backgroundColor: swatchOf(item) }" aria-hidden="true"></span>
                {{ item }}
              </template>
            </SuggestionInput>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="drv-plate">پلاک</label>
            <input id="drv-plate" v-model="form.plate" type="text" placeholder="مثلاً ۱۲ ب ۳۴۵ – ایران ۶۷" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
        </div>

        <div class="mt-4">
          <SeatLayoutEditor v-model="form.seatLayout" />
          <p class="mt-1 text-11px text-ink-400 dark:text-ink-500">ظرفیت فعلی: {{ capacity.toLocaleString('fa-IR') }} دانش‌آموز. با تغییر نوع خودرو چیدمان پیش‌فرض آن نوع جایگزین می‌شود.</p>
        </div>

        <p class="mb-2 mt-5 text-xs font-semibold text-ink-700 dark:text-ink-200">محل فعالیت (برای تخصیص خودکار؛ اختیاری)</p>
        <div class="flex gap-2">
          <label class="sr-only" for="drv-region">منطقه‌ی تحت پوشش</label>
          <input id="drv-region" v-model="regionText" type="text" placeholder="منطقه‌ی تحت پوشش، سپس Enter" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" @keydown.enter.prevent="addRegion" />
          <button type="button" class="min-h-11 shrink-0 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="addRegion">افزودن</button>
        </div>
        <ul v-if="form.coverageRegions.length" class="mt-2 flex flex-wrap gap-1.5">
          <li v-for="region in form.coverageRegions" :key="region" class="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {{ region }}
            <button type="button" class="flex h-6 w-6 items-center justify-center text-brand-500" :aria-label="`حذف ${region}`" @click="removeRegion(region)">✕</button>
          </li>
        </ul>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="isPickerOpen = true">
            📍 {{ form.baseLocation ? 'تغییر محل شروع مسیر' : 'انتخاب محل شروع مسیر از نقشه' }}
          </button>
          <span v-if="form.baseLocation" class="text-11px text-ink-500" dir="ltr">{{ form.baseLocation.lat.toFixed(4) }}, {{ form.baseLocation.lng.toFixed(4) }}</span>
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300 mt-4" for="drv-note">توضیحات</label>
        <textarea id="drv-note" v-model="form.note" rows="2" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"></textarea>

        <label class="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
          <input v-model="form.isActive" type="checkbox" class="h-5 w-5" />
          راننده فعال است (در تخصیص دیده شود)
        </label>

        <p v-if="errorMessage" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ errorMessage }}</p>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="submit" :disabled="!canSave" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">ذخیره</button>
        </div>
      </form>
    </div>
  </Teleport>
  <LocationPickerModal v-if="form" v-model="isPickerOpen" :point="form.baseLocation" title="محل شروع مسیر راننده" @save="onLocation" />
</template>
