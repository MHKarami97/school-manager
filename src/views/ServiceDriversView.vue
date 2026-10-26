<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import DriverFormModal from '@/components/service/DriverFormModal.vue'
import { DRIVER_GENDER_LABELS, VEHICLE_KIND_LABELS } from '@/config/service.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { createEmptyDriver, useServiceDriversStore } from '@/stores/service-drivers'
import { useServicePlansStore } from '@/stores/service-plans'
import type { ServiceDriver } from '@/types'
import { toTelHref } from '@/utils/attendance-domain'
import { capacityOf, ServiceDomainError } from '@/utils/service-domain'

const driversStore = useServiceDriversStore()
const plansStore = useServicePlansStore()
const { message, isError, show } = useFlashMessage(4000)

const isLoading = ref(true)
const isModalOpen = ref(false)
const editing = ref<ServiceDriver | null>(null)
const formError = ref('')

const ridersByDriver = computed(() => {
  const counts = new Map<string, number>()
  for (const item of plansStore.assignmentList) counts.set(item.driverId, (counts.get(item.driverId) ?? 0) + 1)
  return counts
})

onMounted(async () => {
  await Promise.all([driversStore.loadFromDb(), plansStore.loadPlans()])
  isLoading.value = false
})

function openCreate(): void {
  editing.value = createEmptyDriver()
  formError.value = ''
  isModalOpen.value = true
}

function openEdit(driver: ServiceDriver): void {
  editing.value = JSON.parse(JSON.stringify(driver)) as ServiceDriver
  formError.value = ''
  isModalOpen.value = true
}

async function save(driver: ServiceDriver): Promise<void> {
  try {
    await driversStore.save(driver)
    isModalOpen.value = false
    show('ذخیره شد.')
  } catch (error) {
    formError.value = error instanceof ServiceDomainError ? error.message : 'ذخیره انجام نشد.'
  }
}

async function toggleActive(driver: ServiceDriver): Promise<void> {
  await driversStore.save({ ...driver, isActive: !driver.isActive })
}

async function remove(driver: ServiceDriver): Promise<void> {
  if (!confirm(`راننده «${driver.fullName}» حذف شود؟`)) return
  try {
    await driversStore.remove(driver.id)
    show('حذف شد.')
  } catch (error) {
    show(error instanceof ServiceDomainError ? error.message : 'حذف انجام نشد.', true)
  }
}

function vehicleLine(driver: ServiceDriver): string {
  return [VEHICLE_KIND_LABELS[driver.vehicleKind], driver.vehicleModel, driver.vehicleYear ? String(driver.vehicleYear) : '', driver.vehicleColor]
    .filter(Boolean)
    .join(' - ')
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <AppHeader />
    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">رانندگان سرویس مدارس</h1>
          <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {{ driversStore.activeDrivers.length.toLocaleString('fa-IR') }} راننده‌ی فعال - ظرفیت کل {{ driversStore.totalCapacity.toLocaleString('fa-IR') }} دانش‌آموز
          </p>
        </div>
        <button type="button" class="min-h-11 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700" @click="openCreate">راننده‌ی جدید</button>
      </div>

      <nav class="mb-4 flex flex-wrap gap-2" aria-label="بخش‌های سرویس مدارس">
        <RouterLink to="/service/students" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">دانش‌آموزان سرویس</RouterLink>
        <RouterLink to="/service/assign" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">تخصیص به راننده</RouterLink>
        <RouterLink to="/service/payments" class="flex min-h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">هزینه و پرداخت</RouterLink>
      </nav>

      <p v-if="message" role="status" class="mb-3 text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>

      <p v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</p>
      <div v-else-if="!driversStore.items.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center dark:border-ink-700 dark:bg-ink-900">
        <p class="text-ink-500 dark:text-ink-400">هنوز راننده‌ای ثبت نشده است. پیش‌فرض خودرو «سواری با ظرفیت ۴ دانش‌آموز» است.</p>
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <article v-for="driver in driversStore.items" :key="driver.id" class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900" :class="driver.isActive ? '' : 'opacity-60'">
          <div class="h-1.5 bg-gradient-to-l from-brand-600 to-brand-400"></div>
          <div class="p-4">
            <div class="mb-1 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ DRIVER_GENDER_LABELS[driver.gender] }} {{ driver.fullName }}</p>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-11px font-medium" :class="driver.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'">{{ driver.isActive ? 'فعال' : 'غیرفعال' }}</span>
            </div>
            <p class="mb-1 text-xs text-ink-600 dark:text-ink-300">{{ vehicleLine(driver) }}</p>
            <p v-if="driver.plate" class="mb-1 text-xs text-ink-600 dark:text-ink-300">پلاک: <span class="font-medium">{{ driver.plate }}</span></p>
            <a v-if="driver.phone" :href="toTelHref(driver.phone)" class="mb-1 flex min-h-11 w-fit items-center gap-1 text-sm text-brand-600 dark:text-brand-400"><span aria-hidden="true">☎</span><span dir="ltr">{{ driver.phone }}</span></a>
            <p class="mb-1 text-xs text-ink-600 dark:text-ink-300">
              ظرفیت: {{ capacityOf(driver.seatLayout).toLocaleString('fa-IR') }} نفر
              <template v-if="plansStore.activePlan"> - در طرح «{{ plansStore.activePlan.academicYear }}»: {{ (ridersByDriver.get(driver.id) ?? 0).toLocaleString('fa-IR') }} نفر</template>
            </p>
            <ul v-if="driver.coverageRegions.length" class="mb-1 flex flex-wrap gap-1">
              <li v-for="region in driver.coverageRegions" :key="region" class="rounded-full bg-brand-50 px-2 py-0.5 text-11px text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{{ region }}</li>
            </ul>
            <p v-if="driver.note" class="text-11px text-ink-400 dark:text-ink-500">{{ driver.note }}</p>
            <div class="mt-2 flex items-center justify-between border-t border-ink-50 pt-2 dark:border-ink-800">
              <div class="flex gap-3">
                <button type="button" class="min-h-11 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400" @click="openEdit(driver)">ویرایش</button>
                <button type="button" class="min-h-11 text-xs text-ink-600 hover:underline dark:text-ink-300" @click="toggleActive(driver)">{{ driver.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}</button>
              </div>
              <button type="button" class="min-h-11 text-xs text-red-600 dark:text-red-400" @click="remove(driver)">حذف</button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <DriverFormModal v-model="isModalOpen" :driver="editing" :error-message="formError" @save="save" />
  </div>
</template>
