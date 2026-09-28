import { defineStore } from 'pinia'
import type { Election } from '../types'
import { getAllElections, putElection, deleteElection } from '../db/db'

interface ElectionsState {
  items: Election[]
  isLoaded: boolean
}

export const useElectionsStore = defineStore('elections', {
  state: (): ElectionsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((election) => election.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllElections()
      this.isLoaded = true
    },
    async save(election: Election): Promise<void> {
      election.updatedAt = Date.now()
      const idx = this.items.findIndex((item) => item.id === election.id)
      if (idx >= 0) this.items[idx] = election
      else this.items.unshift(election)
      await putElection(election)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((election) => election.id !== id)
      await deleteElection(id)
    },
  },
})
