import { defineStore } from 'pinia'
import type { GameHistorySession } from '@/types'
import { getAllGameHistory, putGameHistory, deleteGameHistory, clearAllGameHistory } from '@/db/db'

interface GameHistoryState {
  items: GameHistorySession[]
  isLoaded: boolean
}

export const useGameHistoryStore = defineStore('gameHistory', {
  state: (): GameHistoryState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((item) => item.id === id),
    totalSessions: (state) => state.items.length,
    totalQuestionsAnswered: (state) =>
      state.items.reduce((acc, curr) => acc + (curr.totalQuestionsAnswered || 0), 0),
    totalCorrectAnswers: (state) =>
      state.items.reduce((acc, curr) => acc + (curr.correctAnswersCount || 0), 0),
    overallAccuracy: (state): number => {
      const total = state.items.reduce((acc, curr) => acc + (curr.totalQuestionsAnswered || 0), 0)
      if (total === 0) return 0
      const correct = state.items.reduce((acc, curr) => acc + (curr.correctAnswersCount || 0), 0)
      return Math.round((correct / total) * 100)
    },
    totalPlaytimeSeconds: (state) =>
      state.items.reduce((acc, curr) => acc + (curr.totalDurationSeconds || 0), 0),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllGameHistory()
      this.isLoaded = true
    },
    async save(session: GameHistorySession): Promise<void> {
      const idx = this.items.findIndex((item) => item.id === session.id)
      if (idx >= 0) this.items[idx] = session
      else this.items.unshift(session)
      await putGameHistory(session)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((item) => item.id !== id)
      await deleteGameHistory(id)
    },
    async clearAll(): Promise<void> {
      this.items = []
      await clearAllGameHistory()
    },
  },
})
