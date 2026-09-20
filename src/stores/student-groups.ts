import { defineStore } from 'pinia'
import type { StudentGroup } from '@/types'
import { getAllStudentGroups, putStudentGroup, putStudentGroups, deleteStudentGroup } from '@/db/db'

interface StudentGroupsState {
  items: StudentGroup[]
  isLoaded: boolean
}

export const useStudentGroupsStore = defineStore('studentGroups', {
  state: (): StudentGroupsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((g) => g.id === id),
    byGrade: (state) => (grade: number) => state.items.filter((g) => g.grade === grade),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllStudentGroups()
      this.isLoaded = true
    },
    async saveGroups(groups: StudentGroup[]): Promise<void> {
      for (const group of groups) group.updatedAt = Date.now()
      const ids = new Set(groups.map((g) => g.id))
      this.items = [...this.items.filter((g) => !ids.has(g.id)), ...groups]
      await putStudentGroups(groups)
    },
    async updateGroup(group: StudentGroup): Promise<void> {
      group.updatedAt = Date.now()
      const idx = this.items.findIndex((g) => g.id === group.id)
      if (idx >= 0) this.items[idx] = group
      else this.items.push(group)
      await putStudentGroup(group)
    },
    async removeGroup(id: string): Promise<void> {
      this.items = this.items.filter((g) => g.id !== id)
      await deleteStudentGroup(id)
    },
    async removeGroupsForGrade(grade: number): Promise<void> {
      const toRemove = this.items.filter((g) => g.grade === grade)
      this.items = this.items.filter((g) => g.grade !== grade)
      for (const group of toRemove) await deleteStudentGroup(group.id)
    },
  },
})
