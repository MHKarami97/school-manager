<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AutoAssignPanel, { type AutoAssignRequest } from '@/components/service/AutoAssignPanel.vue'
import DriverCarCard, { type Rider } from '@/components/service/DriverCarCard.vue'
import ServicePlanBar from '@/components/service/ServicePlanBar.vue'
import { gradeLabel } from '@/config/levels.config'
import { useFlashMessage } from '@/composables/use-flash-message'
import { useServicePrint } from '@/composables/use-service-print'
import { absentStudentIdsOn } from '@/services/service-absentees'
import { useClassroomsStore } from '@/stores/classrooms'
import { useServiceDriversStore } from '@/stores/service-drivers'
import { useServicePlansStore, type DraftPlacement } from '@/stores/service-plans'
import { useServiceStudentsStore } from '@/stores/service-students'
import { useStudentsStore } from '@/stores/students'
import type { ServiceDriver, Student } from '@/types'
import { todayIso } from '@/utils/attendance-date'
import { labelledPhonesOf } from '@/utils/attendance-domain'
import { sortByName, studentFullName } from '@/utils/attendance-format'
import { todayJalaali } from '@/utils/jalaali'
import { autoAssign, type AssignDriver, type AssignStudent } from '@/utils/service-assign'
import {
  ServiceDomainError,
  capacityOf,
  formatAddress,
  normalizeRegion,
  occupiedSeatIds,
  suggestSeats,
} from '@/utils/service-domain'
import { buildSheetPayload, seatLabelOf } from '@/utils/service-print'

const studentsStore = useStudentsStore()
const classroomsStore = useClassroomsStore()
const serviceStudents = useServiceStudentsStore()
const driversStore = useServiceDriversStore()
const plansStore = useServicePlansStore()
const { message, isError, show } = useFlashMessage(4500)
const printer = useServicePrint()

const isLoading = ref(true)
const isBusy = ref(false)
const planError = ref('')
const search = ref('')
const selectedId = ref('')
const absentIds = ref<Set<string>>(new Set())
const seatAction = ref<{ driverId: string; studentId: string; seatId: string } | null>(null)

const today = todayJalaali()
const defaultStartYear = today.jm >= 7 ? today.jy : today.jy - 1

const enrolled = computed(() =>
  serviceStudents.enrolledIds.map((id) => studentsStore.byId(id)).filter((student): student is Student => !!student),
)

const unassigned = computed(() =>
  sortByName(
    enrolled.value.filter((student) => !plansStore.assignments[student.id]),
    (student) => `${String(student.grade).padStart(2, '0')} ${studentFullName(student)}`,
  ).filter((student) => (search.value.trim() ? studentFullName(student).includes(search.value.trim()) : true)),
)

const unassignedTotal = computed(() => enrolled.value.filter((student) => !plansStore.assignments[student.id]).length)
const draftCount = computed(() => plansStore.assignmentList.filter((item) => item.status === 'draft').length)
const canFinalize = computed(() => plansStore.assignmentList.length > 0 && plansStore.assignmentList.every((item) => plansStore.isDriverConfirmed(item.driverId)))
const activeDrivers = computed(() => driversStore.activeDrivers)
const selectedStudent = computed(() => (selectedId.value ? studentsStore.byId(selectedId.value) : undefined))

const driversToShow = computed(() => {
  const withRiders = new Set(plansStore.assignmentList.map((item) => item.driverId))
  return driversStore.items.filter((driver) => driver.isActive || withRiders.has(driver.id))
})

function ridersOf(driverId: string): Rider[] {
  return plansStore.assignmentsOfDriver(driverId).map((item) => ({
    studentId: item.studentId,
    name: studentFullName(studentsStore.byId(item.studentId)),
    grade: studentsStore.byId(item.studentId)?.grade ?? 0,
    seatId: item.seatId,
    absent: absentIds.value.has(item.studentId),
  }))
}

function gradeOf(studentId: string): number {
  return studentsStore.byId(studentId)?.grade ?? 0
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
  absentIds.value = await absentStudentIdsOn(todayIso(), classroomsStore.items)
  isLoading.value = false
})

function fail(error: unknown, fallback: string): void {
  show(error instanceof ServiceDomainError ? error.message : fallback, true)
}

async function createPlan(input: { academicYear: string; title: string; defaultMonthlyFee: number }): Promise<void> {
  planError.value = ''
  try {
    await plansStore.createPlan(input)
  } catch (error) {
    planError.value = error instanceof ServiceDomainError ? error.message : 'ساخت طرح انجام نشد.'
  }
}

async function removePlan(): Promise<void> {
  const plan = plansStore.activePlan
  if (!plan || !confirm(`طرح «${plan.title}» با همه‌ی تخصیص‌ها و پرداخت‌هایش حذف شود؟ این کار قابل بازگشت نیست.`)) return
  await plansStore.removePlan(plan.id)
}

async function finalizePlan(): Promise<void> {
  try {
    await plansStore.finalizePlan()
    show('طرح نهایی شد.')
  } catch (error) {
    fail(error, 'نهایی‌کردن انجام نشد.')
  }
}

function select(studentId: string): void {
  selectedId.value = selectedId.value === studentId ? '' : studentId
}

async function assignTo(driver: ServiceDriver, studentId: string, seatId: string | null): Promise<void> {
  try {
    await plansStore.assign(studentId, driver, seatId)
    selectedId.value = ''
  } catch (error) {
    fail(error, 'تخصیص انجام نشد.')
  }
}

async function onSeat(driver: ServiceDriver, seatId: string): Promise<void> {
  const occupant = plansStore.assignmentsOfDriver(driver.id).find((item) => item.seatId === seatId)
  if (selectedId.value) {
    if (occupant && occupant.studentId !== selectedId.value) {
      show('این صندلی پر است.', true)
      return
    }
    await assignTo(driver, selectedId.value, seatId)
    return
  }
  if (occupant) seatAction.value = { driverId: driver.id, studentId: occupant.studentId, seatId }
}

async function placeSelectedHere(driver: ServiceDriver): Promise<void> {
  if (!selectedId.value) return
  const riders = plansStore.assignmentsOfDriver(driver.id).filter((item) => item.studentId !== selectedId.value)
  const seat = suggestSeats(driver.seatLayout, occupiedSeatIds(riders), [{ studentId: selectedId.value, grade: gradeOf(selectedId.value) }]).get(selectedId.value)
  await assignTo(driver, selectedId.value, seat ?? null)
}

function pickRider(studentId: string): void {
  selectedId.value = studentId
}

async function removeRider(): Promise<void> {
  const action = seatAction.value
  seatAction.value = null
  if (!action) return
  try {
    await plansStore.unassign(action.studentId)
  } catch (error) {
    fail(error, 'حذف انجام نشد.')
  }
}

function moveRider(): void {
  if (seatAction.value) selectedId.value = seatAction.value.studentId
  seatAction.value = null
}

async function confirmDriver(driver: ServiceDriver): Promise<void> {
  try {
    await plansStore.confirmDriver(driver)
    show(`راننده «${driver.fullName}» تأیید شد.`)
  } catch (error) {
    fail(error, 'تأیید انجام نشد.')
  }
}

async function reopenDriver(driver: ServiceDriver): Promise<void> {
  await plansStore.reopenDriver(driver.id)
}

function toAssignStudent(student: Student): AssignStudent {
  const profile = serviceStudents.profiles[student.id]
  return {
    id: student.id,
    grade: student.grade,
    gender: student.gender,
    region: normalizeRegion(profile?.address.region ?? ''),
    location: profile?.location ?? null,
  }
}

async function runAuto(request: AutoAssignRequest): Promise<void> {
  if (!plansStore.activePlan) {
    show('ابتدا طرح سرویس بسازید.', true)
    return
  }
  const editable = activeDrivers.value.filter((driver) => !plansStore.isDriverConfirmed(driver.id))
  if (!editable.length) {
    show('راننده‌ی فعال و باز (تأییدنشده) وجود ندارد.', true)
    return
  }
  if (request.replaceDrafts && draftCount.value && !confirm('پیش‌نویس‌های فعلی پاک و دوباره چیده می‌شوند. ادامه می‌دهید؟')) return
  isBusy.value = true
  try {
    const editableIds = new Set(editable.map((driver) => driver.id))
    const pool = enrolled.value.filter((student) => {
      const current = plansStore.assignments[student.id]
      if (!current) return true
      return request.replaceDrafts && editableIds.has(current.driverId) && current.status === 'draft'
    })
    const drivers: AssignDriver[] = editable.map((driver) => {
      const kept = request.replaceDrafts ? [] : plansStore.assignmentsOfDriver(driver.id)
      return {
        id: driver.id,
        gender: driver.gender,
        freeSeats: capacityOf(driver.seatLayout) - kept.length,
        coverageRegions: driver.coverageRegions.map(normalizeRegion),
        baseLocation: driver.baseLocation,
        existing: kept.map((item) => {
          const profile = serviceStudents.profiles[item.studentId]
          return { region: normalizeRegion(profile?.address.region ?? ''), location: profile?.location ?? null }
        }),
      }
    })
    const result = autoAssign(pool.map(toAssignStudent), drivers, { mode: request.mode, preferSameGender: request.preferSameGender })
    const byDriver = new Map<string, string[]>()
    for (const placement of result.placements) byDriver.set(placement.driverId, [...(byDriver.get(placement.driverId) ?? []), placement.studentId])
    const items: DraftPlacement[] = []
    for (const driver of editable) {
      const ids = byDriver.get(driver.id) ?? []
      const kept = request.replaceDrafts ? [] : plansStore.assignmentsOfDriver(driver.id)
      const seats = suggestSeats(driver.seatLayout, occupiedSeatIds(kept), ids.map((studentId) => ({ studentId, grade: gradeOf(studentId) })))
      for (const studentId of ids) items.push({ studentId, driverId: driver.id, seatId: seats.get(studentId) ?? null })
    }
    const count = await plansStore.applyDraftPlacements(items, request.replaceDrafts)
    const extra = result.notes.length ? ` ${result.notes.join(' ')}` : ''
    show(`${count.toLocaleString('fa-IR')} دانش‌آموز به‌صورت پیش‌نویس تخصیص یافتند.${extra}`, result.unassigned.length > 0)
  } catch (error) {
    fail(error, 'تخصیص خودکار انجام نشد.')
  } finally {
    isBusy.value = false
  }
}

function sources() {
  return {
    nameOf: (id: string) => studentFullName(studentsStore.byId(id)),
    gradeOf: (id: string) => gradeLabel(gradeOf(id)),
    phonesOf: (id: string) => labelledPhonesOf(classroomsStore.profiles[id]).map((item) => item.phone).join(' / '),
    addressOf: (id: string) => {
      const profile = serviceStudents.profiles[id]
      return profile ? formatAddress(profile.address) : ''
    },
    pickupOf: (id: string) => serviceStudents.profiles[id]?.pickupTime ?? '',
  }
}

async function printRoster(drivers: ServiceDriver[]): Promise<void> {
  const plan = plansStore.activePlan
  if (!plan) return
  await printer.print(buildSheetPayload('roster', `لیست دانش‌آموزان سرویس - ${plan.title}`, `سال تحصیلی ${plan.academicYear}`, drivers, plansStore.assignmentList, sources()))
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16 dark:bg-ink-950">
    <div class="print:hidden">
      <AppHeader />
      <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">تخصیص دانش‌آموزان به راننده</h1>
          <nav class="flex flex-wrap gap-3 text-sm text-ink-500 dark:text-ink-400">
            <RouterLink to="/service/drivers" class="flex min-h-11 items-center">رانندگان</RouterLink>
            <RouterLink to="/service/students" class="flex min-h-11 items-center">دانش‌آموزان سرویس</RouterLink>
            <RouterLink to="/service/absentees" class="flex min-h-11 items-center">غایبین رانندگان</RouterLink>
          </nav>
        </div>

        <p v-if="message" role="status" class="mb-3 text-xs leading-6" :class="isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">{{ message }}</p>
        <p v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری...</p>

        <template v-else>
          <ServicePlanBar
            :plans="plansStore.plans"
            :active-id="plansStore.activePlanId"
            :active-plan="plansStore.activePlan"
            :can-finalize="canFinalize"
            :default-start-year="defaultStartYear"
            :error-message="planError"
            @select="plansStore.setActive($event)"
            @create="createPlan"
            @remove="removePlan"
            @finalize="finalizePlan"
            @print-all="printRoster(driversToShow)"
          />

          <p v-if="!plansStore.activePlan" class="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">ابتدا یک طرح سرویس برای سال تحصیلی بسازید.</p>

          <template v-else>
            <div class="mt-4"><AutoAssignPanel :unassigned-count="unassignedTotal" :draft-count="draftCount" :is-busy="isBusy" @run="runAuto" /></div>

            <section class="mt-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900" aria-labelledby="unassigned-title">
              <p id="unassigned-title" class="mb-2 text-sm font-semibold text-ink-800 dark:text-ink-200">بدون راننده ({{ unassignedTotal.toLocaleString('fa-IR') }})</p>
              <p v-if="selectedStudent" class="mb-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                انتخاب‌شده: <strong>{{ studentFullName(selectedStudent) }}</strong> ({{ gradeLabel(selectedStudent.grade) }}) - صندلی خالی یک خودرو را لمس کنید.
                <button type="button" class="mr-2 min-h-11 text-xs underline" @click="selectedId = ''">لغو انتخاب</button>
              </p>
              <label class="sr-only" for="svc-search">جستجو</label>
              <input id="svc-search" v-model="search" type="search" placeholder="جستجوی دانش‌آموز..." class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-2 min-h-11" />
              <ul v-if="unassigned.length" class="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                <li v-for="student in unassigned" :key="student.id">
                  <button type="button" class="min-h-11 rounded-lg border px-3 text-xs" :class="selectedId === student.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200' : 'border-ink-200 text-ink-700 dark:border-ink-700 dark:text-ink-200'" :aria-pressed="selectedId === student.id" @click="select(student.id)">
                    {{ studentFullName(student) }} <span class="text-11px text-ink-400">{{ gradeLabel(student.grade) }}</span>
                  </button>
                </li>
              </ul>
              <p v-else class="text-xs text-ink-400">{{ unassignedTotal ? 'موردی با این جستجو نیست.' : 'همه‌ی دانش‌آموزان سرویس راننده دارند.' }}</p>
            </section>

            <p class="mt-4 text-11px text-ink-500 dark:text-ink-400">⚠ دور صندلی جلوی دانش‌آموزان پایه‌ی پایین (۱ تا ۶) زرد می‌شود، چون سن کمی دارند. این فقط هشدار است و جلوگیری نمی‌کند.</p>

            <p v-if="!driversToShow.length" class="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">راننده‌ی فعالی ثبت نشده است.</p>
            <div v-else class="mt-3 grid gap-4 sm:grid-cols-2">
              <DriverCarCard
                v-for="driver in driversToShow"
                :key="driver.id"
                :driver="driver"
                :riders="ridersOf(driver.id)"
                :confirmed="plansStore.isDriverConfirmed(driver.id)"
                :has-selection="!!selectedId"
                @seat="onSeat(driver, $event)"
                @place-here="placeSelectedHere(driver)"
                @pick-unseated="pickRider"
                @confirm="confirmDriver(driver)"
                @reopen="reopenDriver(driver)"
                @print="printRoster([driver])"
              />
            </div>
          </template>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="seatAction" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" @click.self="seatAction = null">
        <div class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="seat-action-title">
          <p id="seat-action-title" class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{{ studentFullName(studentsStore.byId(seatAction.studentId)) }}</p>
          <p class="mb-3 text-xs text-ink-500 dark:text-ink-400">{{ seatLabelOf(seatAction.seatId) }}</p>
          <div class="grid gap-2">
            <button type="button" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700" @click="moveRider">انتقال (سپس صندلی جدید را لمس کنید)</button>
            <button type="button" class="min-h-11 rounded-lg border border-red-300 px-4 text-xs font-medium text-red-700 dark:border-red-700 dark:text-red-300" @click="removeRider">برداشتن از این راننده</button>
            <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="seatAction = null">بستن</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="printer.isPrinting.value && printer.payload.value && printer.component.value" id="print-root" class="hidden print:block">
      <component :is="printer.component.value" :payload="printer.payload.value" />
    </div>
  </div>
</template>
