import { defineStore } from 'pinia'
import type { Teacher } from '@/types'
import { getAllTeachers, putTeacher, deleteTeacher } from '@/db/db'

interface TeachersState {
  items: Teacher[]
  isLoaded: boolean
}

export const useTeachersStore = defineStore('teachers', {
  state: (): TeachersState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((t) => t.id === id),
    sortedByName: (state) => [...state.items].sort((a, b) => a.name.localeCompare(b.name, 'fa')),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllTeachers()
      this.isLoaded = true
    },
    async addTeacher(name: string, courseIds: string[] = []): Promise<Teacher> {
      const existing = this.items.find((t) => t.name.trim() === name.trim())
      if (existing) {
        const merged = { ...existing, courseIds: Array.from(new Set([...existing.courseIds, ...courseIds])) }
        await this.updateTeacher(merged)
        return merged
      }
      const teacher: Teacher = {
        id: crypto.randomUUID(),
        name: name.trim(),
        courseIds,
        weeklyHoursByCourse: {},
        createdAt: Date.now(),
      }
      this.items.push(teacher)
      await putTeacher(teacher)
      return teacher
    },
    async updateTeacher(teacher: Teacher): Promise<void> {
      const idx = this.items.findIndex((t) => t.id === teacher.id)
      if (idx >= 0) this.items[idx] = teacher
      else this.items.push(teacher)
      await putTeacher(teacher)
    },
    async removeTeacher(id: string): Promise<void> {
      this.items = this.items.filter((t) => t.id !== id)
      await deleteTeacher(id)
    },
  },
})
