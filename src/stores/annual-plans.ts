import { defineStore } from 'pinia'
import type { AnnualPlan } from '../types'
import { getAllAnnualPlans, putAnnualPlan, deleteAnnualPlan } from '../db/db'

interface AnnualPlansState {
  items: AnnualPlan[]
  isLoaded: boolean
}

export const useAnnualPlansStore = defineStore('annualPlans', {
  state: (): AnnualPlansState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((p) => p.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllAnnualPlans()
      this.isLoaded = true
    },
    async save(plan: AnnualPlan): Promise<void> {
      plan.updatedAt = Date.now()
      const idx = this.items.findIndex((p) => p.id === plan.id)
      if (idx >= 0) this.items[idx] = plan
      else this.items.unshift(plan)
      await putAnnualPlan(plan)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((p) => p.id !== id)
      await deleteAnnualPlan(id)
    },
  },
})
