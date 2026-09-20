import { defineStore } from 'pinia'
import type { Student, LevelId, Gender } from '@/types'
import { getAllStudents, putStudent, putStudents, deleteStudent } from '@/db/db'

interface StudentsState {
  items: Student[]
  isLoaded: boolean
}

function createEmptyStudent(input: {
  firstName: string
  lastName: string
  gender: Gender
  grade: number
  levelId: LevelId
}): Student {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    gender: input.gender,
    grade: input.grade,
    levelId: input.levelId,
    gpa: null,
    gpaBand: null,
    disciplineScore: null,
    isAcademicallyWeak: false,
    isDisruptive: false,
    statusTags: [],
    currentGroupId: null,
    yearlyRecords: [],
    createdAt: now,
    updatedAt: now,
  }
}

export const useStudentsStore = defineStore('students', {
  state: (): StudentsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((s) => s.id === id),
    byGrade: (state) => (grade: number) => state.items.filter((s) => s.grade === grade),
    byGradeAndGender: (state) => (grade: number, gender: Gender) =>
      state.items.filter((s) => s.grade === grade && s.gender === gender),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllStudents()
      this.isLoaded = true
    },
    async addStudent(input: { firstName: string; lastName: string; gender: Gender; grade: number; levelId: LevelId }): Promise<Student> {
      const student = createEmptyStudent(input)
      this.items.push(student)
      await putStudent(student)
      return student
    },
    async addStudentsBulk(
      inputs: { firstName: string; lastName: string; gender: Gender; grade: number; levelId: LevelId }[],
    ): Promise<Student[]> {
      const students = inputs.map((input) => createEmptyStudent(input))
      this.items.push(...students)
      await putStudents(students)
      return students
    },
    async updateStudent(student: Student): Promise<void> {
      student.updatedAt = Date.now()
      const idx = this.items.findIndex((s) => s.id === student.id)
      if (idx >= 0) this.items[idx] = student
      else this.items.push(student)
      await putStudent(student)
    },
    async bulkUpdate(studentIds: string[], patch: Partial<Student>): Promise<void> {
      const updated: Student[] = []
      for (const id of studentIds) {
        const student = this.items.find((s) => s.id === id)
        if (!student) continue
        Object.assign(student, patch, { updatedAt: Date.now() })
        updated.push(student)
      }
      await putStudents(updated)
    },
    async removeStudent(id: string): Promise<void> {
      this.items = this.items.filter((s) => s.id !== id)
      await deleteStudent(id)
    },
    async promoteStudents(studentIds: string[], year: number, teacherId: string | null): Promise<void> {
      const updated: Student[] = []
      for (const id of studentIds) {
        const student = this.items.find((s) => s.id === id)
        if (!student) continue
        student.yearlyRecords.push({
          year,
          grade: student.grade,
          gpa: student.gpa,
          gpaBand: student.gpaBand,
          disciplineScore: student.disciplineScore,
          teacherId,
          groupId: student.currentGroupId,
        })
        student.grade += 1
        student.gpa = null
        student.gpaBand = null
        student.disciplineScore = null
        student.isAcademicallyWeak = false
        student.isDisruptive = false
        student.currentGroupId = null
        student.updatedAt = Date.now()
        updated.push(student)
      }
      await putStudents(updated)
    },
  },
})
