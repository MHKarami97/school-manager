import { defineStore } from 'pinia'
import type { ExtraClass } from '../types'
import { getAllExtraClasses, putExtraClass, deleteExtraClass } from '../db/db'

interface ExtraClassesState {
  items: ExtraClass[]
  isLoaded: boolean
}

export const useExtraClassesStore = defineStore('extraClasses', {
  state: (): ExtraClassesState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((c) => c.id === id),
    byTeacher: (state) => (teacherId: string) => state.items.filter((c) => c.teacherId === teacherId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllExtraClasses()
      this.isLoaded = true
    },
    async save(extraClass: ExtraClass): Promise<void> {
      extraClass.updatedAt = Date.now()
      const idx = this.items.findIndex((c) => c.id === extraClass.id)
      if (idx >= 0) this.items[idx] = extraClass
      else this.items.unshift(extraClass)
      await putExtraClass(extraClass)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((c) => c.id !== id)
      await deleteExtraClass(id)
    },
  },
})
