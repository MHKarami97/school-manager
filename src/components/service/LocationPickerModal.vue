<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CircleMarker, Map as LeafletMap } from 'leaflet'
import type { GeoPoint } from '@/types'
import { isValidPoint, parseLocationInput } from '@/utils/service-domain'

type LeafletModule = typeof import('leaflet')

const CENTER_KEY = 'school-manager-service-last-center'
const IRAN_CENTER: GeoPoint = { lat: 32.4279, lng: 53.688 }

const props = defineProps<{ modelValue: boolean; point: GeoPoint | null; title?: string }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: GeoPoint | null): void
}>()

const mapElement = ref<HTMLDivElement | null>(null)
const draft = ref<GeoPoint | null>(null)
const manualText = ref('')
const status = ref('')
const isLoadingMap = ref(false)

let leaflet: LeafletModule | null = null
let map: LeafletMap | null = null
let marker: CircleMarker | null = null
let tileErrorShown = false

function readStoredCenter(): GeoPoint | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CENTER_KEY) ?? 'null') as GeoPoint | null
    return isValidPoint(parsed) ? parsed : null
  } catch {
    return null
  }
}

function drawMarker(point: GeoPoint): void {
  if (!leaflet || !map) return
  if (marker) marker.setLatLng([point.lat, point.lng])
  else marker = leaflet.circleMarker([point.lat, point.lng], { radius: 11, color: '#1c5fe0', weight: 3, fillColor: '#559eff', fillOpacity: 0.7 }).addTo(map)
}

function setPoint(point: GeoPoint, recenter: boolean): void {
  draft.value = point
  drawMarker(point)
  if (recenter && map) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 15))
}

function destroyMap(): void {
  if (map) map.remove()
  map = null
  marker = null
  tileErrorShown = false
}

async function initMap(): Promise<void> {
  isLoadingMap.value = true
  status.value = ''
  try {
    leaflet = await import('leaflet')
  } catch {
    status.value = 'بارگذاری نقشه ممکن نشد؛ مختصات را دستی وارد کنید یا لینک نقشه را بچسبانید.'
    isLoadingMap.value = false
    return
  }
  await nextTick()
  if (!mapElement.value || !props.modelValue) {
    isLoadingMap.value = false
    return
  }
  const start = draft.value ?? readStoredCenter() ?? IRAN_CENTER
  const zoom = draft.value ? 16 : readStoredCenter() ? 13 : 5
  map = leaflet.map(mapElement.value).setView([start.lat, start.lng], zoom)
  const tiles = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  })
  tiles.on('tileerror', () => {
    if (tileErrorShown) return
    tileErrorShown = true
    status.value = 'تایل‌های نقشه بارگذاری نشد (اینترنت لازم است). می‌توانید مختصات را دستی وارد کنید.'
  })
  tiles.addTo(map)
  map.on('click', (event) => setPoint({ lat: event.latlng.lat, lng: event.latlng.lng }, false))
  if (draft.value) drawMarker(draft.value)
  setTimeout(() => map?.invalidateSize(), 80)
  isLoadingMap.value = false
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      destroyMap()
      return
    }
    draft.value = props.point && isValidPoint(props.point) ? { ...props.point } : null
    manualText.value = ''
    status.value = ''
    await nextTick()
    await initMap()
  },
)

onBeforeUnmount(destroyMap)

function close(): void {
  emit('update:modelValue', false)
}

function applyManual(): void {
  const point = parseLocationInput(manualText.value)
  if (!point) {
    status.value = 'مختصات یا لینک معتبر نیست؛ نمونه: 35.8327, 51.0123'
    return
  }
  status.value = ''
  setPoint(point, true)
}

function useMyLocation(): void {
  if (!('geolocation' in navigator)) {
    status.value = 'مرورگر از موقعیت‌یابی پشتیبانی نمی‌کند.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => setPoint({ lat: position.coords.latitude, lng: position.coords.longitude }, true),
    () => {
      status.value = 'دسترسی به موقعیت داده نشد یا در دسترس نیست.'
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function save(point: GeoPoint | null): void {
  if (point) localStorage.setItem(CENTER_KEY, JSON.stringify(point))
  emit('save', point)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <div class="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="location-modal-title">
        <p id="location-modal-title" class="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ title ?? 'انتخاب موقعیت روی نقشه' }}</p>
        <p class="mb-2 text-xs text-ink-500 dark:text-ink-400">روی نقشه لمس کنید تا نشانگر قرار بگیرد.</p>

        <div ref="mapElement" class="relative z-0 h-72 w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-100 sm:h-96 dark:border-ink-700" dir="ltr">
          <p v-if="isLoadingMap" class="absolute inset-0 z-10 flex items-center justify-center text-xs text-ink-500">در حال بارگذاری نقشه...</p>
        </div>

        <p class="mt-2 text-xs text-ink-600 dark:text-ink-300" dir="ltr">
          <template v-if="draft">{{ draft.lat.toFixed(6) }}, {{ draft.lng.toFixed(6) }}</template>
          <template v-else>—</template>
        </p>

        <div class="mt-2 flex gap-2">
          <label class="sr-only" for="loc-manual">مختصات یا لینک نقشه</label>
          <input id="loc-manual" v-model="manualText" type="text" dir="ltr" placeholder="35.8327, 51.0123  یا لینک نقشه" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" @keydown.enter.prevent="applyManual" />
          <button type="button" class="min-h-11 shrink-0 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="applyManual">اعمال</button>
          <button type="button" class="min-h-11 shrink-0 rounded-lg border border-ink-200 px-3 text-xs dark:border-ink-700 dark:text-ink-200" @click="useMyLocation">موقعیت من</button>
        </div>
        <p v-if="status" class="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">{{ status }}</p>

        <div class="mt-3 flex items-center justify-between gap-2">
          <button type="button" class="min-h-11 text-xs text-red-600 hover:underline dark:text-red-400" @click="save(null)">حذف موقعیت</button>
          <div class="flex gap-2">
            <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
            <button type="button" :disabled="!draft" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50" @click="save(draft)">تأیید موقعیت</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
