import { defineStore } from 'pinia'
import { serviceRepository } from '@/db/service-db'
import { ACTIVE_PLAN_STORAGE_KEY } from '@/config/service.config'
import type {
  PaymentMethod,
  ServiceAssignment,
  ServiceDriver,
  ServiceDriverState,
  ServicePayment,
  ServicePlan,
} from '@/types'
import {
  ServiceDomainError,
  academicYearLabel,
  assignmentKey,
  capacityOf,
  defaultPlanMonths,
  driverStateKey,
  isSeatInLayout,
  occupiedSeatIds,
} from '@/utils/service-domain'

interface PlansState {
  plans: ServicePlan[]
  isLoaded: boolean
  activePlanId: string
  assignments: Record<string, ServiceAssignment>
  driverStates: Record<string, ServiceDriverState>
  payments: ServicePayment[]
  isPlanLoading: boolean
}

export interface DraftPlacement {
  studentId: string
  driverId: string
  seatId: string | null
}

export interface NewPaymentInput {
  studentId: string
  month: string
  amount: number
  paidAt: string
  method: PaymentMethod
  note: string
}

export function startYearOf(academicYear: string): number {
  const match = /^(\d{4})/.exec(academicYear.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)))
  return match ? Number(match[1]) : new Date().getFullYear() - 621
}

export const useServicePlansStore = defineStore('servicePlans', {
  state: (): PlansState => ({
    plans: [],
    isLoaded: false,
    activePlanId: '',
    assignments: {},
    driverStates: {},
    payments: [],
    isPlanLoading: false,
  }),
  getters: {
    activePlan: (state) => state.plans.find((plan) => plan.id === state.activePlanId),
    assignmentList: (state) => Object.values(state.assignments),
    isDriverConfirmed: (state) => (driverId: string) => state.driverStates[driverId]?.status === 'confirmed',
    assignmentsOfDriver: (state) => (driverId: string) =>
      Object.values(state.assignments).filter((item) => item.driverId === driverId),
  },
  actions: {
    async loadPlans(): Promise<void> {
      if (this.isLoaded) return
      this.plans = await serviceRepository.listPlans()
      this.isLoaded = true
      const stored = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY) ?? ''
      const initial = this.plans.find((plan) => plan.id === stored) ?? this.plans[0]
      if (initial) await this.setActive(initial.id)
    },

    async setActive(planId: string): Promise<void> {
      this.activePlanId = planId
      localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, planId)
      await this.loadPlanData(planId)
    },

    async loadPlanData(planId: string): Promise<void> {
      this.isPlanLoading = true
      try {
        const [assignments, states, payments] = await Promise.all([
          serviceRepository.listAssignments(planId),
          serviceRepository.listDriverStates(planId),
          serviceRepository.listPayments(planId),
        ])
        if (planId !== this.activePlanId) return
        this.assignments = Object.fromEntries(assignments.map((item) => [item.studentId, item]))
        this.driverStates = Object.fromEntries(states.map((item) => [item.driverId, item]))
        this.payments = payments
      } finally {
        this.isPlanLoading = false
      }
    },

    async createPlan(input: { academicYear: string; title: string; defaultMonthlyFee: number }): Promise<ServicePlan> {
      const now = Date.now()
      const startJy = startYearOf(input.academicYear)
      const academicYear = academicYearLabel(startJy)
      if (this.plans.some((plan) => plan.academicYear === academicYear)) {
        throw new ServiceDomainError('PLAN_EXISTS', `برای سال تحصیلی ${academicYear} قبلاً طرح ساخته شده است.`)
      }
      const plan: ServicePlan = {
        id: crypto.randomUUID(),
        academicYear,
        title: input.title.trim() || `سرویس مدارس ${academicYear}`,
        status: 'draft',
        months: defaultPlanMonths(startJy),
        defaultMonthlyFee: Math.max(0, Math.round(input.defaultMonthlyFee || 0)),
        createdAt: now,
        updatedAt: now,
      }
      await serviceRepository.putPlan(plan)
      this.plans.unshift(plan)
      await this.setActive(plan.id)
      return plan
    },

    async updatePlan(plan: ServicePlan): Promise<void> {
      const next = { ...plan, updatedAt: Date.now() }
      await serviceRepository.putPlan(next)
      const index = this.plans.findIndex((item) => item.id === next.id)
      if (index >= 0) this.plans[index] = next
    },

    async removePlan(planId: string): Promise<void> {
      await serviceRepository.deletePlan(planId)
      this.plans = this.plans.filter((plan) => plan.id !== planId)
      if (this.activePlanId === planId) {
        this.activePlanId = ''
        this.assignments = {}
        this.driverStates = {}
        this.payments = []
        if (this.plans[0]) await this.setActive(this.plans[0].id)
      }
    },

    requirePlan(): ServicePlan {
      const plan = this.activePlan
      if (!plan) throw new ServiceDomainError('NO_PLAN', 'ابتدا یک طرح سرویس برای سال تحصیلی بسازید.')
      return plan
    },

    assertEditable(driverId: string): void {
      if (this.isDriverConfirmed(driverId)) {
        throw new ServiceDomainError('DRIVER_CONFIRMED', 'این راننده تأیید شده است؛ برای ویرایش، ابتدا «بازگشایی» را بزنید.')
      }
    },

    async assign(studentId: string, driver: ServiceDriver, seatId: string | null): Promise<void> {
      const plan = this.requirePlan()
      this.assertEditable(driver.id)
      const previous = this.assignments[studentId]
      if (previous && previous.driverId !== driver.id) this.assertEditable(previous.driverId)
      const others = this.assignmentsOfDriver(driver.id).filter((item) => item.studentId !== studentId)
      if (others.length >= capacityOf(driver.seatLayout)) {
        throw new ServiceDomainError('DRIVER_FULL', 'ظرفیت این راننده تکمیل است.')
      }
      if (seatId) {
        if (!isSeatInLayout(driver.seatLayout, seatId)) throw new ServiceDomainError('BAD_SEAT', 'صندلی معتبر نیست.')
        if (occupiedSeatIds(others, studentId).has(seatId)) throw new ServiceDomainError('SEAT_TAKEN', 'این صندلی پر است.')
      }
      const now = Date.now()
      const next: ServiceAssignment = {
        id: assignmentKey(plan.id, studentId),
        planId: plan.id,
        studentId,
        driverId: driver.id,
        seatId,
        status: 'draft',
        monthlyFee: previous ? previous.monthlyFee : plan.defaultMonthlyFee,
        createdAt: previous ? previous.createdAt : now,
        updatedAt: now,
      }
      await serviceRepository.saveAssignments(plan.id, [], [next])
      this.assignments[studentId] = next
    },

    async unassign(studentId: string): Promise<void> {
      const plan = this.requirePlan()
      const current = this.assignments[studentId]
      if (!current) return
      this.assertEditable(current.driverId)
      await serviceRepository.saveAssignments(plan.id, [current.id], [])
      delete this.assignments[studentId]
    },

    async setFee(studentId: string, monthlyFee: number): Promise<void> {
      const plan = this.requirePlan()
      const current = this.assignments[studentId]
      if (!current) throw new ServiceDomainError('NOT_ASSIGNED', 'این دانش‌آموز به راننده‌ای تخصیص داده نشده است.')
      const next = { ...current, monthlyFee: Math.max(0, Math.round(monthlyFee)), updatedAt: Date.now() }
      await serviceRepository.saveAssignments(plan.id, [], [next])
      this.assignments[studentId] = next
    },

    async applyDraftPlacements(items: DraftPlacement[], clearExistingDrafts: boolean): Promise<number> {
      const plan = this.requirePlan()
      const now = Date.now()
      const removeIds: string[] = []
      const upserts: ServiceAssignment[] = []
      const incoming = new Map(items.map((item) => [item.studentId, item]))
      if (clearExistingDrafts) {
        for (const current of Object.values(this.assignments)) {
          if (current.status === 'confirmed' || this.isDriverConfirmed(current.driverId)) continue
          if (!incoming.has(current.studentId)) removeIds.push(current.id)
        }
      }
      for (const item of items) {
        if (this.isDriverConfirmed(item.driverId)) continue
        const previous = this.assignments[item.studentId]
        if (previous && this.isDriverConfirmed(previous.driverId)) continue
        upserts.push({
          id: assignmentKey(plan.id, item.studentId),
          planId: plan.id,
          studentId: item.studentId,
          driverId: item.driverId,
          seatId: item.seatId,
          status: 'draft',
          monthlyFee: previous ? previous.monthlyFee : plan.defaultMonthlyFee,
          createdAt: previous ? previous.createdAt : now,
          updatedAt: now,
        })
      }
      await serviceRepository.saveAssignments(plan.id, removeIds, upserts)
      for (const id of removeIds) {
        const studentId = id.split('|')[1]
        delete this.assignments[studentId]
      }
      for (const item of upserts) this.assignments[item.studentId] = item
      return upserts.length
    },

    async confirmDriver(driver: ServiceDriver): Promise<void> {
      const plan = this.requirePlan()
      const riders = this.assignmentsOfDriver(driver.id)
      if (riders.length > capacityOf(driver.seatLayout)) {
        throw new ServiceDomainError('OVER_CAPACITY', 'تعداد دانش‌آموزان از ظرفیت راننده بیشتر است.')
      }
      const now = Date.now()
      const confirmed = riders.map((item): ServiceAssignment => ({ ...item, status: 'confirmed', updatedAt: now }))
      const state: ServiceDriverState = {
        id: driverStateKey(plan.id, driver.id),
        planId: plan.id,
        driverId: driver.id,
        status: 'confirmed',
        confirmedAt: now,
      }
      await serviceRepository.saveAssignments(plan.id, [], confirmed)
      await serviceRepository.putDriverState(state)
      for (const item of confirmed) this.assignments[item.studentId] = item
      this.driverStates[driver.id] = state
    },

    async reopenDriver(driverId: string): Promise<void> {
      const plan = this.requirePlan()
      const riders = this.assignmentsOfDriver(driverId)
      const now = Date.now()
      const reopened = riders.map((item): ServiceAssignment => ({ ...item, status: 'draft', updatedAt: now }))
      const state: ServiceDriverState = {
        id: driverStateKey(plan.id, driverId),
        planId: plan.id,
        driverId,
        status: 'draft',
        confirmedAt: null,
      }
      await serviceRepository.saveAssignments(plan.id, [], reopened)
      await serviceRepository.putDriverState(state)
      for (const item of reopened) this.assignments[item.studentId] = item
      this.driverStates[driverId] = state
    },

    async finalizePlan(): Promise<void> {
      const plan = this.requirePlan()
      const driverIds = new Set(this.assignmentList.map((item) => item.driverId))
      for (const driverId of driverIds) {
        if (!this.isDriverConfirmed(driverId)) {
          throw new ServiceDomainError('DRIVER_NOT_CONFIRMED', 'همه‌ی رانندگانِ دارای دانش‌آموز باید تأیید شده باشند.')
        }
      }
      await this.updatePlan({ ...plan, status: 'final' })
    },

    async addPayment(input: NewPaymentInput): Promise<ServicePayment> {
      const plan = this.requirePlan()
      if (!(input.amount > 0)) throw new ServiceDomainError('BAD_AMOUNT', 'مبلغ پرداخت باید بزرگ‌تر از صفر باشد.')
      const payment: ServicePayment = {
        id: crypto.randomUUID(),
        planId: plan.id,
        studentId: input.studentId,
        month: input.month,
        amount: Math.round(input.amount),
        paidAt: input.paidAt,
        method: input.method,
        note: input.note.trim(),
        createdAt: Date.now(),
      }
      await serviceRepository.putPayment(payment)
      this.payments.push(payment)
      return payment
    },

    async removePayment(id: string): Promise<void> {
      await serviceRepository.deletePayment(id)
      this.payments = this.payments.filter((payment) => payment.id !== id)
    },
  },
})
