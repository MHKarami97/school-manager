import { defineStore } from 'pinia'
import type { TeachingPlan } from '../types'
import { getAllTeachingPlans, putTeachingPlan, deleteTeachingPlan } from '../db/db'

interface TeachingPlansState {
  items: TeachingPlan[]
  isLoaded: boolean
}

export const useTeachingPlansStore = defineStore('teachingPlans', {
  state: (): TeachingPlansState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((p) => p.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllTeachingPlans()
      this.isLoaded = true
    },
    async save(plan: TeachingPlan): Promise<void> {
      plan.updatedAt = Date.now()
      const idx = this.items.findIndex((p) => p.id === plan.id)
      if (idx >= 0) this.items[idx] = plan
      else this.items.unshift(plan)
      await putTeachingPlan(plan)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((p) => p.id !== id)
      await deleteTeachingPlan(id)
    },
  },
})
