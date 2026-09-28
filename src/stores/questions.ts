import { defineStore } from 'pinia'
import type { Question } from '../types'
import { getAllQuestions, putQuestion, putQuestions, deleteQuestion } from '../db/db'

interface QuestionsState {
  items: Question[]
  isLoaded: boolean
}

export const useQuestionsStore = defineStore('questions', {
  state: (): QuestionsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((q) => q.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllQuestions()
      this.isLoaded = true
    },
    async save(question: Question): Promise<void> {
      question.updatedAt = Date.now()
      const idx = this.items.findIndex((q) => q.id === question.id)
      if (idx >= 0) this.items[idx] = question
      else this.items.unshift(question)
      await putQuestion(question)
    },
    async addBulk(questions: Question[]): Promise<void> {
      this.items.unshift(...questions)
      await putQuestions(questions)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((q) => q.id !== id)
      await deleteQuestion(id)
    },
  },
})
