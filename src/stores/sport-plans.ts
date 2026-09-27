import { defineStore } from 'pinia'
import type { SportPlan } from '../types'
import { getAllSportPlans, putSportPlan, deleteSportPlan } from '../db/db'

interface SportPlansState {
  items: SportPlan[]
  isLoaded: boolean
}

export const useSportPlansStore = defineStore('sportPlans', {
  state: (): SportPlansState => ({
    items: [],
    isLoaded: false,
  }),

  getters: {
    byId: (state) => (id: string) => state.items.find((p) => p.id === id),
  },

  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllSportPlans()
      this.isLoaded = true
    },

    async save(plan: SportPlan): Promise<void> {
      plan.updatedAt = Date.now()
      const idx = this.items.findIndex((p) => p.id === plan.id)
      if (idx >= 0) this.items[idx] = plan
      else this.items.unshift(plan)
      await putSportPlan(plan)
    },

    async remove(id: string): Promise<void> {
      this.items = this.items.filter((p) => p.id !== id)
      await deleteSportPlan(id)
    },
  },
})
