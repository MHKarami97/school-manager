import { defineStore } from 'pinia'
import type { SavedSchedule } from '@/types'
import { getAllSchedules, putSchedule, deleteSchedule } from '@/db/db'

interface SchedulesState {
  items: SavedSchedule[]
  isLoaded: boolean
}

export const useSchedulesStore = defineStore('schedules', {
  state: (): SchedulesState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((s) => s.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllSchedules()
      this.isLoaded = true
    },
    async save(schedule: SavedSchedule): Promise<void> {
      schedule.updatedAt = Date.now()
      const idx = this.items.findIndex((s) => s.id === schedule.id)
      if (idx >= 0) this.items[idx] = schedule
      else this.items.unshift(schedule)
      await putSchedule(schedule)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((s) => s.id !== id)
      await deleteSchedule(id)
    },
  },
})
