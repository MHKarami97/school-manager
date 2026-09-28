import { defineStore } from 'pinia'
import type { Enrollment } from '../types'
import { getAllEnrollments, putEnrollment, deleteEnrollment } from '../db/db'

interface EnrollmentsState {
  items: Enrollment[]
  isLoaded: boolean
}

export const useEnrollmentsStore = defineStore('enrollments', {
  state: (): EnrollmentsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byExtraClass: (state) => (extraClassId: string) => state.items.filter((e) => e.extraClassId === extraClassId),
    byStudent: (state) => (studentId: string) => state.items.filter((e) => e.studentId === studentId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllEnrollments()
      this.isLoaded = true
    },
    async enrollStudent(extraClassId: string, studentId: string, waitlisted: boolean): Promise<Enrollment> {
      const now = Date.now()
      const enrollment: Enrollment = {
        id: crypto.randomUUID(),
        extraClassId,
        studentId,
        enrollmentDate: '',
        status: 'active',
        waitlisted,
        createdAt: now,
        updatedAt: now,
      }
      this.items.unshift(enrollment)
      await putEnrollment(enrollment)
      return enrollment
    },
    async setEnrollmentDate(id: string, date: string): Promise<void> {
      const enrollment = this.items.find((e) => e.id === id)
      if (!enrollment) return
      enrollment.enrollmentDate = date
      enrollment.updatedAt = Date.now()
      await putEnrollment(enrollment)
    },
    async cancelEnrollment(id: string): Promise<void> {
      const enrollment = this.items.find((e) => e.id === id)
      if (!enrollment) return
      enrollment.status = 'cancelled'
      enrollment.updatedAt = Date.now()
      await putEnrollment(enrollment)
    },
    async promoteFromWaitlist(id: string): Promise<void> {
      const enrollment = this.items.find((e) => e.id === id)
      if (!enrollment) return
      enrollment.waitlisted = false
      enrollment.updatedAt = Date.now()
      await putEnrollment(enrollment)
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((e) => e.id !== id)
      await deleteEnrollment(id)
    },
  },
})
