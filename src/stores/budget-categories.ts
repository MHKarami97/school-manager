import { defineStore } from 'pinia'
import type { BudgetCategory } from '../types'
import { getAllBudgetCategories, putBudgetCategory, deleteBudgetCategory } from '../db/db'

interface BudgetCategoriesState {
  items: BudgetCategory[]
  isLoaded: boolean
}

export const useBudgetCategoriesStore = defineStore('budgetCategories', {
  state: (): BudgetCategoriesState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((c) => c.id === id),
    byPlan: (state) => (planId: string) => state.items.filter((c) => c.planId === planId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllBudgetCategories()
      this.isLoaded = true
    },
    async save(category: BudgetCategory): Promise<void> {
      category.updatedAt = Date.now()
      const idx = this.items.findIndex((c) => c.id === category.id)
      if (idx >= 0) this.items[idx] = category
      else this.items.push(category)
      await putBudgetCategory(category)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((c) => c.id !== id)
      await deleteBudgetCategory(id)
    },
  },
})
