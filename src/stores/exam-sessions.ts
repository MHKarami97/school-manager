import { defineStore } from 'pinia'
import type { ExamSession } from '../types'
import { getAllExamSessions, putExamSession, deleteExamSession } from '../db/db'

interface ExamSessionsState {
  items: ExamSession[]
  isLoaded: boolean
}

export const useExamSessionsStore = defineStore('examSessions', {
  state: (): ExamSessionsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((s) => s.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExamSessions()
      this.isLoaded = true
    },
    async save(session: ExamSession): Promise<void> {
      session.updatedAt = Date.now()
      const idx = this.items.findIndex((s) => s.id === session.id)
      if (idx >= 0) this.items[idx] = session
      else this.items.unshift(session)
      await putExamSession(session)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((s) => s.id !== id)
      await deleteExamSession(id)
    },
  },
})
