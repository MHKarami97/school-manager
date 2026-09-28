import { defineStore } from 'pinia'
import type { ExamTemplate } from '../types'
import { getAllExamTemplates, putExamTemplate, deleteExamTemplate } from '../db/db'

interface ExamTemplatesState {
  items: ExamTemplate[]
  isLoaded: boolean
}

export const useExamTemplatesStore = defineStore('examTemplates', {
  state: (): ExamTemplatesState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((t) => t.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExamTemplates()
      this.isLoaded = true
    },
    async save(template: ExamTemplate): Promise<void> {
      template.updatedAt = Date.now()
      const idx = this.items.findIndex((t) => t.id === template.id)
      if (idx >= 0) this.items[idx] = template
      else this.items.unshift(template)
      await putExamTemplate(template)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((t) => t.id !== id)
      await deleteExamTemplate(id)
    },
  },
})
