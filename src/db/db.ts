import { openDB, type IDBPDatabase } from 'idb'
import type { Teacher, SavedSchedule } from '@/types'

const DB_NAME = 'school-manager-db'
const DB_VERSION = 1

export const STORE_TEACHERS = 'teachers'
export const STORE_SCHEDULES = 'schedules'

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
