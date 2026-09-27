import { defineStore } from 'pinia'
import type { SportFacility } from '../types'
import { getAllSportFacilities, putSportFacility, deleteSportFacility } from '../db/db'

interface SportFacilitiesState {
  items: SportFacility[]
  isLoaded: boolean
}

export const useSportFacilitiesStore = defineStore('sportFacilities', {
  state: (): SportFacilitiesState => ({
    items: [],
    isLoaded: false,
  }),

  getters: {
    byId: (state) => (id: string) => state.items.find((f) => f.id === id),
  },

  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllSportFacilities()
      this.isLoaded = true
    },

    async addFacility(name: string, concurrentCapacity: number): Promise<SportFacility> {
      const facility: SportFacility = {
        id: crypto.randomUUID(),
        name: name.trim(),
        concurrentCapacity,
        createdAt: Date.now(),
      }
      this.items.push(facility)
      await putSportFacility(facility)
      return facility
    },

    async removeFacility(id: string): Promise<void> {
      this.items = this.items.filter((f) => f.id !== id)
      await deleteSportFacility(id)
    },
  },
})
