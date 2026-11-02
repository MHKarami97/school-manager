import { openDB, type IDBPDatabase } from 'idb'
import { CLOUD_CONFIG } from '@/config/cloudConfig'

export interface VaultKeyRecord {
  id: 'backup-key'
  key: CryptoKey
  saltHex: string
  iterations: number
  createdAt: string
}

interface SnapshotRecord {
  id: 'pre-restore'
  json: string
  createdAt: string
}

export class CloudKeyVault {
  private dbPromise: Promise<IDBPDatabase> | null = null

  private getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(CLOUD_CONFIG.vaultDatabaseName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('keys')) {
            db.createObjectStore('keys', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('snapshots')) {
            db.createObjectStore('snapshots', { keyPath: 'id' })
          }
        },
      })
    }
    return this.dbPromise
  }

  async getKey(): Promise<VaultKeyRecord | undefined> {
    const db = await this.getDb()
    return db.get('keys', 'backup-key')
  }

  async saveKey(key: CryptoKey, saltHex: string, iterations: number): Promise<void> {
    const db = await this.getDb()
    await db.put('keys', { id: 'backup-key', key, saltHex, iterations, createdAt: new Date().toISOString() })
  }

  async clearKey(): Promise<void> {
    const db = await this.getDb()
    await db.delete('keys', 'backup-key')
  }

  async saveSnapshot(json: string): Promise<void> {
    const db = await this.getDb()
    await db.put('snapshots', { id: 'pre-restore', json, createdAt: new Date().toISOString() })
  }

  async getSnapshot(): Promise<string | null> {
    const db = await this.getDb()
    const record = (await db.get('snapshots', 'pre-restore')) as SnapshotRecord | undefined
    return record ? record.json : null
  }

  async clearSnapshot(): Promise<void> {
    const db = await this.getDb()
    await db.delete('snapshots', 'pre-restore')
  }
}
