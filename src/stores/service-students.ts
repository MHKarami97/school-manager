import { defineStore } from 'pinia'
import { serviceRepository } from '@/db/service-db'
import type { ServiceStudentProfile } from '@/types'
import { createEmptyServiceProfile, sanitizeServiceProfile } from '@/utils/service-domain'

interface ServiceStudentsState {
  profiles: Record<string, ServiceStudentProfile>
  isLoaded: boolean
}

export const useServiceStudentsStore = defineStore('serviceStudents', {
  state: (): ServiceStudentsState => ({ profiles: {}, isLoaded: false }),
  getters: {
    enrolledIds: (state) =>
      Object.values(state.profiles)
        .filter((profile) => profile.isEnrolled)
        .map((profile) => profile.studentId),
    profileOf: (state) => (studentId: string) => state.profiles[studentId],
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      const list = await serviceRepository.listStudentProfiles()
      this.profiles = Object.fromEntries(list.map((profile) => [profile.studentId, profile]))
      this.isLoaded = true
    },

    draftFor(studentId: string): ServiceStudentProfile {
      const existing = this.profiles[studentId]
      return existing ? JSON.parse(JSON.stringify(existing)) : createEmptyServiceProfile(studentId)
    },

    async save(profile: ServiceStudentProfile): Promise<void> {
      const next = sanitizeServiceProfile(profile)
      await serviceRepository.putStudentProfile(next)
      this.profiles[next.studentId] = next
    },

    async saveMany(profiles: ServiceStudentProfile[]): Promise<void> {
      const cleaned = profiles.map((profile) => sanitizeServiceProfile(profile))
      await serviceRepository.putStudentProfiles(cleaned)
      for (const profile of cleaned) this.profiles[profile.studentId] = profile
    },

    async setEnrolled(studentId: string, isEnrolled: boolean): Promise<void> {
      await this.save({ ...this.draftFor(studentId), isEnrolled })
    },
  },
})
