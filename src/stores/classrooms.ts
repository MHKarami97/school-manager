import { defineStore } from 'pinia'
import { attendanceRepository } from '@/db/attendance-db'
import { ALL_TEACHERS } from '@/config/attendance.config'
import type { Classroom, StudentAttendanceProfile } from '@/types'
import { applyProfileInput, type ProfileInput } from '@/utils/attendance-domain'

interface ClassroomsState {
  items: Classroom[]
  isLoaded: boolean
  memberIds: Record<string, string[]>
  memberCounts: Record<string, number>
  profiles: Record<string, StudentAttendanceProfile>
}

export function createEmptyClassroom(teacherId: string | null): Classroom {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: '',
    grade: 1,
    academicYear: '',
    shift: '',
    teacherId,
    createdAt: now,
    updatedAt: now,
  }
}

export const useClassroomsStore = defineStore('classrooms', {
  state: (): ClassroomsState => ({
    items: [],
    isLoaded: false,
    memberIds: {},
    memberCounts: {},
    profiles: {},
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((item) => item.id === id),
    visibleFor: (state) => (teacherId: string) =>
      teacherId === ALL_TEACHERS ? state.items : state.items.filter((item) => item.teacherId === teacherId),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await attendanceRepository.listClassrooms()
      this.isLoaded = true
    },

    async refreshCounts(): Promise<void> {
      const counts = await Promise.all(
        this.items.map(async (item) => [item.id, await attendanceRepository.countMembers(item.id)] as const),
      )
      this.memberCounts = Object.fromEntries(counts)
    },

    async saveClassroom(classroom: Classroom): Promise<void> {
      classroom.updatedAt = Date.now()
      await attendanceRepository.putClassroom(classroom)
      const index = this.items.findIndex((item) => item.id === classroom.id)
      if (index >= 0) this.items[index] = classroom
      else this.items.unshift(classroom)
    },

    async removeClassroom(id: string): Promise<void> {
      await attendanceRepository.deleteClassroom(id)
      this.items = this.items.filter((item) => item.id !== id)
      delete this.memberIds[id]
      delete this.memberCounts[id]
    },

    async loadMembers(classroomId: string): Promise<string[]> {
      const ids = await this.loadMembersLight(classroomId)
      await this.loadProfiles(ids)
      return ids
    },

    async loadMembersLight(classroomId: string): Promise<string[]> {
      const members = await attendanceRepository.listMembers(classroomId)
      const ids = members.map((member) => member.studentId)
      this.memberIds[classroomId] = ids
      this.memberCounts[classroomId] = ids.length
      return ids
    },

    async loadProfiles(studentIds: string[]): Promise<void> {
      const missing = studentIds.filter((id) => !this.profiles[id])
      if (!missing.length) return
      const profiles = await attendanceRepository.ensureProfiles(missing)
      for (const [id, profile] of profiles) this.profiles[id] = profile
    },

    async addStudents(classroomId: string, studentIds: string[]): Promise<number> {
      const added = await attendanceRepository.addMembers(classroomId, studentIds)
      await this.loadMembers(classroomId)
      return added
    },

    async removeStudent(classroomId: string, studentId: string): Promise<void> {
      await attendanceRepository.removeMember(classroomId, studentId)
      this.memberIds[classroomId] = (this.memberIds[classroomId] ?? []).filter((id) => id !== studentId)
      this.memberCounts[classroomId] = this.memberIds[classroomId].length
    },

    async saveProfile(studentId: string, input: ProfileInput): Promise<void> {
      await this.loadProfiles([studentId])
      const next = applyProfileInput(this.profiles[studentId], input, Date.now())
      await attendanceRepository.putProfile(next)
      this.profiles[studentId] = next
    },
  },
})
