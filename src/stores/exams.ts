import { defineStore } from 'pinia'
import type { Exam } from '../types'
import { getAllExams, putExam, deleteExam } from '../db/db'

interface ExamsState {
  items: Exam[]
  isLoaded: boolean
}

export const useExamsStore = defineStore('exams', {
  state: (): ExamsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((e) => e.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExams()
      this.isLoaded = true
    },
    async save(exam: Exam): Promise<void> {
      exam.updatedAt = Date.now()
      const idx = this.items.findIndex((e) => e.id === exam.id)
      if (idx >= 0) this.items[idx] = exam
      else this.items.unshift(exam)
      await putExam(exam)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((e) => e.id !== id)
      await deleteExam(id)
    },
  },
})
