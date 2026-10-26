import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { IDBPDatabase } from 'idb'
import { createAttendanceStores } from '@/db/attendance-schema'

interface FakeStore {
  indexes: Map<string, { keyPath: unknown; options?: IDBIndexParameters }>
}

function createFakeDb(existing: string[] = []) {
  const stores = new Map<string, FakeStore>()
  const names = new Set(existing)
  const db = {
    objectStoreNames: { contains: (name: string) => names.has(name) },
    createObjectStore(name: string) {
      const store: FakeStore = { indexes: new Map() }
      stores.set(name, store)
      names.add(name)
      return {
        createIndex(indexName: string, keyPath: unknown, options?: IDBIndexParameters) {
          store.indexes.set(indexName, { keyPath, options })
        },
      }
    },
  }
  return { db: db as unknown as IDBPDatabase, stores }
}

describe('migration schema (نسخه ۱۳)', () => {
  it('همه‌ی storeها و ایندکس‌های ضروری ساخته می‌شوند', () => {
    const { db, stores } = createFakeDb()
    createAttendanceStores(db)
    assert.deepEqual([...stores.keys()].sort(), ['attAudit', 'attClassrooms', 'attFollowUps', 'attMembers', 'attProfiles', 'attRecords'])
    assert.deepEqual(stores.get('attRecords')?.indexes.get('by-class-date')?.keyPath, ['classroomId', 'date'])
    assert.equal(stores.get('attRecords')?.indexes.get('by-slot')?.options?.unique, true)
    assert.equal(stores.get('attProfiles')?.indexes.get('by-guid')?.options?.unique, true)
    assert.equal(stores.get('attProfiles')?.indexes.get('by-nfc')?.options?.unique, true)
  })

  it('اجرای دوباره (یا storeهای موجود) خطا نمی‌دهد و چیزی را بازسازی نمی‌کند', () => {
    const { db, stores } = createFakeDb(['attRecords', 'students'])
    createAttendanceStores(db)
    assert.equal(stores.has('attRecords'), false)
    assert.equal(stores.has('students'), false)
    assert.equal(stores.has('attClassrooms'), true)
  })
})
