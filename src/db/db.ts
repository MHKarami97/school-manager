import { openDB, type IDBPDatabase } from 'idb'
import type { Teacher, SavedSchedule, Student, StudentGroup } from '@/types'

const DB_NAME = 'school-manager-db'
const DB_VERSION = 2

export const STORE_TEACHERS = 'teachers'
export const STORE_SCHEDULES = 'schedules'
export const STORE_STUDENTS = 'students'
export const STORE_STUDENT_GROUPS = 'studentGroups'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_TEACHERS)) {
          const store = db.createObjectStore(STORE_TEACHERS, { keyPath: 'id' })
          store.createIndex('by-name', 'name')
        }
        if (!db.objectStoreNames.contains(STORE_SCHEDULES)) {
          const store = db.createObjectStore(STORE_SCHEDULES, { keyPath: 'id' })
          store.createIndex('by-updatedAt', 'updatedAt')
        }
        if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
          const store = db.createObjectStore(STORE_STUDENTS, { keyPath: 'id' })
          store.createIndex('by-grade', 'grade')
          store.createIndex('by-group', 'currentGroupId')
        }
        if (!db.objectStoreNames.contains(STORE_STUDENT_GROUPS)) {
          const store = db.createObjectStore(STORE_STUDENT_GROUPS, { keyPath: 'id' })
          store.createIndex('by-grade', 'grade')
        }
      },
    })
  }
  return dbPromise
}

/**
 * IndexedDB الگوریتم structured-clone را برای ذخیره مقادیر استفاده می‌کند که با
 * Proxy های reactive ویو/پینیا سازگار نیست و خطای DataCloneError می‌دهد. این تابع
 * قبل از put/add، یک کپی کاملاً ساده (plain) و بدون reactivity از آبجکت می‌سازد.
 */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const db = await getDb()
  return db.getAll(STORE_TEACHERS)
}

export async function putTeacher(teacher: Teacher): Promise<void> {
  const db = await getDb()
  await db.put(STORE_TEACHERS, toPlain(teacher))
}

export async function deleteTeacher(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_TEACHERS, id)
}

export async function getAllSchedules(): Promise<SavedSchedule[]> {
  const db = await getDb()
  const all = await db.getAll(STORE_SCHEDULES)
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getSchedule(id: string): Promise<SavedSchedule | undefined> {
  const db = await getDb()
  return db.get(STORE_SCHEDULES, id)
}

export async function putSchedule(schedule: SavedSchedule): Promise<void> {
  const db = await getDb()
  await db.put(STORE_SCHEDULES, toPlain(schedule))
}

export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_SCHEDULES, id)
}

export async function getAllStudents(): Promise<Student[]> {
  const db = await getDb()
  return db.getAll(STORE_STUDENTS)
}

export async function putStudent(student: Student): Promise<void> {
  const db = await getDb()
  await db.put(STORE_STUDENTS, toPlain(student))
}

export async function putStudents(students: Student[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_STUDENTS, 'readwrite')
  for (const student of students) {
    await tx.store.put(toPlain(student))
  }
  await tx.done
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_STUDENTS, id)
}

export async function getAllStudentGroups(): Promise<StudentGroup[]> {
  const db = await getDb()
  return db.getAll(STORE_STUDENT_GROUPS)
}

export async function putStudentGroup(group: StudentGroup): Promise<void> {
  const db = await getDb()
  await db.put(STORE_STUDENT_GROUPS, toPlain(group))
}

export async function putStudentGroups(groups: StudentGroup[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_STUDENT_GROUPS, 'readwrite')
  for (const group of groups) {
    await tx.store.put(toPlain(group))
  }
  await tx.done
}

export async function deleteStudentGroup(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_STUDENT_GROUPS, id)
}
