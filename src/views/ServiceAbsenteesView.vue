<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import JalaliDatePicker from '@/components/lessonPlan/JalaliDatePicker.vue'
import { gradeLabel } from '@/config/levels.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { useServicePrint } from '@/composables/use-service-print'
import { absentStudentIdsOn } from '@/services/service-absentees'
import { useClassroomsStore } from '@/stores/classrooms'
import { useServiceDriversStore } from '@/stores/service-drivers'
import { useServicePlansStore } from '@/stores/service-plans'
import { useServiceStudentsStore } from '@/stores/service-students'
import { useStudentsStore } from '@/stores/students'
import type { ServiceAssignment, ServiceDriver } from '@/types'
import { jalaliLabelWithWeekday, todayIso } from '@/utils/attendance-date'
import { labelledPhonesOf, toTelHref } from '@/utils/attendance-domain'
import { studentFullName } from '@/utils/attendance-format'
import { absentRidersByDriver, formatAddress } from '@/utils/service-domain'
import { absenteeMessage, buildSheetPayload, seatLabelOf } from '@/utils/service-print'

const studentsStore = useStudentsStore()
const classroomsStore = useClassroomsStore()
const serviceStudents = useServiceStudentsStore()
const driversStore = useServiceDriversStore()
const plansStore = useServicePlansStore()
const { message, isError, show } = useFlashMessage(3500)
const printer = useServicePrint()

const date = ref(todayIso())
const absentIds = ref<Set<string>>(new Set())
const isLoading = ref(true)
let token = 0

const grouped = computed(() => {
  const absentByDriver = absentRidersByDriver(plansStore.assignmentList, absentIds.value)
  return driversStore.items
    .filter((driver) => absentByDriver.has(driver.id))
    .map((driver) => ({
      driver,
      absent: absentByDriver.get(driver.id) as ServiceAssignment[],
      total: plansStore.assignmentsOfDriver(driver.id).length,
    }))
})

const totalAbsent = computed(() => grouped.value.reduce((sum, item) => sum + item.absent.length, 0))

async function load(): Promise<void> {
  const current = ++token
  isLoading.value = true
  const ids = await absentStudentIdsOn(date.value, classroomsStore.items)
  if (current !== token) return
  absentIds.value = ids
  isLoading.value = false
}

onMounted(async () => {
  await Promise.all([
    studentsStore.loadFromDb(),
    serviceStudents.loadFromDb(),
    driversStore.loadFromDb(),
    plansStore.loadPlans(),
    classroomsStore.loadFromDb(),
  ])
  await classroomsStore.loadProfiles(serviceStudents.enrolledIds)
  await load()
})

watch(date, load)

function nameOf(studentId: string): string {
  return studentFullName(studentsStore.byId(studentId))
}

function phonesOf(studentId: string) {
  return labelledPhonesOf(classroomsStore.profiles[studentId])
}

function addressOf(studentId: string): string {
  const profile = serviceStudents.profiles[studentId]
  return profile ? formatAddress(profile.address) : ''
}

async function copyText(driver: ServiceDriver, items: ServiceAssignment[]): Promise<void> {
  const text = absenteeMessage(driver, items.map((item) => nameOf(item.studentId)), jalaliLabelWithWeekday(date.value))
  if (!navigator.clipboard) {
    show('مرورگر از کپی خودکار پشتیبانی نمی‌کند.', true)
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    show('متن کپی شد؛ می‌توانید در پیام‌رسان برای راننده بفرستید.')
  } catch {
    show('کپی انجام نشد.', true)
  }
}

async function print(drivers: ServiceDriver[]): Promise<void> {
  const plan = plansStore.activePlan
  if (!plan) return
  await printer.print(
    buildSheetPayload(
      'absentees',
      `غایبین رانندگان سرویس - ${jalaliLabelWithWeekday(date.value)}`,
      `طرح ${plan.title}`,
      drivers,
      plansStore.assignmentList,
      {
        nameOf,
        gradeOf: (id) => gradeLabel(studentsStore.byId(id)?.grade ?? 0),
        phonesOf: (id) => phonesOf(id).map((item) => item.phone).join(' / '),
        addressOf,
        pickupOf: (id) => serviceStudents.profiles[id]?.pickupTime ?? '',
      },
      absentIds.value,
    ),
  )
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
      <div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">غایبین هر راننده</h1>
          <RouterLink to="/service/assign" class="flex min-h-11 items-center text-sm text-ink-500 dark:text-ink-400">تخصیص</RouterLink>
        </div>

        <div class="mb-4 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 sm:grid-cols-2 dark:border-ink-800 dark:bg-ink-900">
          <div>
            <p class="mb-1 text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ</p>
            <JalaliDatePicker v-model="date" />
            <p class="mt-1 text-11px text-ink-400">{{ jalaliLabelWithWeekday(date) }}</p>
          </div>
          <div class="flex flex-col justify-end gap-2">
            <p class="text-xs text-ink-600 dark:text-ink-300">
              غایب از دانش‌آموزان دارای راننده: <strong>{{ totalAbsent.toLocaleString('fa-IR') }}</strong> نفر
            </p>
            <button type="button" :disabled="!grouped.length" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" @click="print(grouped.map((item) => item.driver))">PDF همه‌ی رانندگان</button>
          </div>
        </div>

        <p v-if="message" role="status" class="mb-3 text-xs" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>

        <p v-if="!plansStore.activePlan" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">ابتدا در صفحه‌ی «تخصیص» یک طرح سرویس بسازید.</p>
        <p v-else-if="isLoading" class="p-8 text-center text-ink-400">در حال بارگذاری...</p>
        <p v-else-if="!grouped.length" class="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">برای این تاریخ دانش‌آموز غایبی در بین سرویس‌دارها نیست (یا حضور و غیاب آن روز ثبت نشده است).</p>

        <ul v-else class="space-y-4">
          <li v-for="group in grouped" :key="group.driver.id" class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ group.driver.fullName }}</p>
                <a v-if="group.driver.phone" :href="toTelHref(group.driver.phone)" class="flex min-h-11 items-center gap-1 text-sm text-brand-600 dark:text-brand-400"><span aria-hidden="true">☎</span><span dir="ltr">{{ group.driver.phone }}</span></a>
              </div>
              <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">✕ {{ group.absent.length.toLocaleString('fa-IR') }} از {{ group.total.toLocaleString('fa-IR') }} غایب</span>
            </div>

            <ul class="space-y-2">
              <li v-for="item in group.absent" :key="item.studentId" class="rounded-xl bg-ink-50 p-3 text-xs dark:bg-ink-800">
                <p class="text-sm font-medium text-ink-800 dark:text-ink-200">{{ nameOf(item.studentId) }} <span class="text-11px font-normal text-ink-400">{{ gradeLabel(studentsStore.byId(item.studentId)?.grade ?? 0) }} - {{ seatLabelOf(item.seatId) }}</span></p>
                <p v-if="serviceStudents.profiles[item.studentId]?.pickupTime" class="mt-1 text-ink-600 dark:text-ink-300">ساعت سوار شدن: {{ serviceStudents.profiles[item.studentId]?.pickupTime }}</p>
                <p v-if="addressOf(item.studentId)" class="mt-1 text-ink-600 dark:text-ink-300">{{ addressOf(item.studentId) }}</p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <a v-for="phone in phonesOf(item.studentId)" :key="phone.phone" :href="toTelHref(phone.phone)" class="flex min-h-11 items-center gap-1 rounded-lg bg-brand-50 px-3 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><span aria-hidden="true">☎</span><span dir="ltr">{{ phone.phone }}</span> ({{ phone.relation }})</a>
                </div>
              </li>
            </ul>

            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="copyText(group.driver, group.absent)">کپی متن برای راننده</button>
              <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs font-medium dark:border-ink-700 dark:text-ink-200" @click="print([group.driver])">PDF</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="printer.isPrinting.value && printer.payload.value && printer.component.value" id="print-root" class="hidden print:block">
      <component :is="printer.component.value" :payload="printer.payload.value" />
    </div>
  </div>
</template>
