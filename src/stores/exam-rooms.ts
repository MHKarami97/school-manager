import { defineStore } from 'pinia'
import type { ExamRoom } from '../types'
import { getAllExamRooms, putExamRoom, deleteExamRoom } from '../db/db'

interface ExamRoomsState {
  items: ExamRoom[]
  isLoaded: boolean
}

export const useExamRoomsStore = defineStore('examRooms', {
  state: (): ExamRoomsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((r) => r.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExamRooms()
      this.isLoaded = true
    },
    async save(room: ExamRoom): Promise<void> {
      room.updatedAt = Date.now()
      const idx = this.items.findIndex((r) => r.id === room.id)
      if (idx >= 0) this.items[idx] = room
      else this.items.push(room)
      await putExamRoom(room)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((r) => r.id !== id)
      await deleteExamRoom(id)
    },
  },
})
