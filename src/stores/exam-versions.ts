import { defineStore } from 'pinia'
import type { ExamVersion } from '../types'
import { getAllExamVersions, putExamVersion, deleteExamVersion } from '../db/db'

interface ExamVersionsState {
  items: ExamVersion[]
  isLoaded: boolean
}

export const useExamVersionsStore = defineStore('examVersions', {
  state: (): ExamVersionsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byExam: (state) => (examId: string) => state.items.filter((v) => v.examId === examId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExamVersions()
      this.isLoaded = true
    },
    async saveMany(versions: ExamVersion[]): Promise<void> {
      this.items.unshift(...versions)
      for (const version of versions) await putExamVersion(version)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((v) => v.id !== id)
      await deleteExamVersion(id)
    },
  },
})
