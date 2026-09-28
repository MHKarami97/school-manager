import { defineStore } from 'pinia'
import type { Transaction } from '../types'
import { getAllTransactions, putTransaction, deleteTransaction } from '../db/db'

interface TransactionsState {
  items: Transaction[]
  isLoaded: boolean
}

export const useTransactionsStore = defineStore('transactions', {
  state: (): TransactionsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byPlan: (state) => (planId: string) => state.items.filter((t) => t.planId === planId),
    byCategory: (state) => (categoryId: string) => state.items.filter((t) => t.categoryId === categoryId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllTransactions()
      this.isLoaded = true
    },
    async save(transaction: Transaction): Promise<void> {
      transaction.updatedAt = Date.now()
      const idx = this.items.findIndex((t) => t.id === transaction.id)
      if (idx >= 0) this.items[idx] = transaction
      else this.items.unshift(transaction)
      await putTransaction(transaction)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((t) => t.id !== id)
      await deleteTransaction(id)
    },
  },
})
