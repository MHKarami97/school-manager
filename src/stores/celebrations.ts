import { defineStore } from 'pinia'
import type { Celebration } from '../types'
import { getAllCelebrations, putCelebration, deleteCelebration } from '../db/db'

interface CelebrationsState {
  items: Celebration[]
  isLoaded: boolean
}

export const useCelebrationsStore = defineStore('celebrations', {
  state: (): CelebrationsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((c) => c.id === id),
    upcoming: (state) => (limit = 5) =>
      [...state.items]
        .filter((c) => c.status !== 'held')
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .slice(0, limit),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllCelebrations()
      this.isLoaded = true
    },
    async save(celebration: Celebration): Promise<void> {
      celebration.updatedAt = Date.now()
      const idx = this.items.findIndex((c) => c.id === celebration.id)
      if (idx >= 0) this.items[idx] = celebration
      else this.items.unshift(celebration)
      await putCelebration(celebration)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((c) => c.id !== id)
      await deleteCelebration(id)
    },
  },
})
