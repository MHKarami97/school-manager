import { getDb } from '@/db/db'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, BackupError } from './backup-format'
import { LOCAL_STORAGE_PREFIX, type BackupPayload, type BackupScope } from './backup-snapshot'

export type RestoreMode = 'replace' | 'merge'
export type ConflictPolicy = 'keep-existing' | 'use-backup' | 'keep-newer'

export interface RestoreOptions {
  mode: RestoreMode
  conflictPolicy: ConflictPolicy
  restoreLocalStorage: boolean
  /** اگر خالی باشد، همه‌ی جدول‌های داخل پشتیبان بازیابی می‌شوند. */
  tables?: string[]
}

export interface StorePreview {
  name: string
  inBackup: number
  existing: number
  newRecords: number
  conflicts: number
  missingInApp: boolean
}

export interface RestorePreview {
  createdAt: string
  dbVersion: number
  scope: BackupScope
  stores: StorePreview[]
  localStorageKeys: number
  skippedAssets: number
  warnings: string[]
}

export interface RestoreResult {
  restored: Record<string, number>
  skippedStores: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function parsePayload(text: string): BackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupError('CORRUPT', 'محتوای فایل پشتیبان قابل خواندن نیست.')
  }
  if (!isRecord(parsed) || parsed.app !== BACKUP_APP_ID) throw new BackupError('NOT_BACKUP', 'این فایل، پشتیبان این برنامه نیست.')
  if (typeof parsed.formatVersion !== 'number' || parsed.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupError('UNSUPPORTED_VERSION', 'این پشتیبان با نسخه‌ی جدیدتری از برنامه ساخته شده است.')
  }
  if (!isRecord(parsed.stores)) throw new BackupError('CORRUPT', 'ساختار فایل پشتیبان معتبر نیست.')
  for (const records of Object.values(parsed.stores)) {
    if (!Array.isArray(records) || records.some((record) => !isRecord(record))) {
      throw new BackupError('CORRUPT', 'ساختار فایل پشتیبان معتبر نیست.')
    }
  }
  const storage = isRecord(parsed.localStorage) ? parsed.localStorage : {}
  const safeStorage: Record<string, string> = {}
  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith(LOCAL_STORAGE_PREFIX) && typeof value === 'string') safeStorage[key] = value
  }
  return {
    app: BACKUP_APP_ID,
    formatVersion: parsed.formatVersion,
    scope: parsed.scope === 'partial' ? 'partial' : 'full',
    dbName: String(parsed.dbName ?? ''),
    dbVersion: Number(parsed.dbVersion ?? 0),
    createdAt: String(parsed.createdAt ?? ''),
    options: parsed.options as BackupPayload['options'],
    stores: parsed.stores as BackupPayload['stores'],
    localStorage: safeStorage,
    skippedAssets: Array.isArray(parsed.skippedAssets) ? (parsed.skippedAssets as BackupPayload['skippedAssets']) : [],
  }
}

/** در ادغام، آیا رکورد پشتیبان باید جای رکورد موجود را بگیرد؟ */
export function shouldOverwrite(policy: ConflictPolicy, existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  if (policy === 'use-backup') return true
  if (policy === 'keep-existing') return false
  const current = existing.updatedAt
  const next = incoming.updatedAt
  if (typeof next !== 'number') return false
  if (typeof current !== 'number') return true
  return next > current
}

/** جدول‌هایی که واقعاً باید بازیابی شوند، و آیا بازیابی «کامل» است (پاک‌سازی همه‌ی جدول‌ها و تنظیمات). */
export function resolveRestoreTargets(payload: BackupPayload, known: Set<string>, selection?: string[]): { targets: string[]; isWhole: boolean } {
  const inBackup = Object.keys(payload.stores).filter((name) => known.has(name))
  const chosen = selection && selection.length ? inBackup.filter((name) => selection.includes(name)) : inBackup
  const isWhole = payload.scope === 'full' && chosen.length === inBackup.length
  return { targets: chosen, isWhole }
}

function keyOf(record: Record<string, unknown>, keyPath: unknown): string | null {
  if (typeof keyPath !== 'string') return null
  const value = record[keyPath]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

export async function buildPreview(payload: BackupPayload): Promise<RestorePreview> {
  const db = await getDb()
  if (payload.dbVersion > db.version) {
    throw new BackupError('NEWER_BACKUP', 'این پشتیبان از نسخه‌ی جدیدتر پایگاه داده است؛ ابتدا برنامه را به‌روزرسانی کنید.')
  }
  const warnings: string[] = []
  const known = new Set(Array.from(db.objectStoreNames))
  const stores: StorePreview[] = []
  for (const [name, records] of Object.entries(payload.stores)) {
    if (!known.has(name)) {
      stores.push({ name, inBackup: records.length, existing: 0, newRecords: 0, conflicts: 0, missingInApp: true })
      continue
    }
    const keyPath = db.transaction(name, 'readonly').store.keyPath
    const existingKeys = new Set((await db.getAllKeys(name)).map((key) => String(key)))
    let conflicts = 0
    for (const record of records) {
      const key = keyOf(record, keyPath)
      if (key !== null && existingKeys.has(key)) conflicts += 1
    }
    stores.push({ name, inBackup: records.length, existing: existingKeys.size, newRecords: records.length - conflicts, conflicts, missingInApp: false })
  }
  if (payload.skippedAssets.length) {
    warnings.push(`${payload.skippedAssets.length} تصویر/فایل بزرگ هنگام ساخت این پشتیبان کنار گذاشته شده بود؛ فیلد آن‌ها خالی بازیابی می‌شود.`)
  }
  if (payload.dbVersion < db.version) warnings.push('این پشتیبان از نسخه‌ی قدیمی‌تر برنامه است؛ بخش‌های جدیدتر در آن وجود ندارد.')
  if (payload.scope === 'partial') warnings.push('این پشتیبان فقط بخشی از جدول‌ها را دارد؛ جدول‌های دیگر و تنظیمات برنامه دست نمی‌خورند.')
  return {
    createdAt: payload.createdAt,
    dbVersion: payload.dbVersion,
    scope: payload.scope,
    stores,
    localStorageKeys: Object.keys(payload.localStorage).length,
    skippedAssets: payload.skippedAssets.length,
    warnings,
  }
}

function applyLocalStorage(payload: BackupPayload, options: RestoreOptions, isWhole: boolean): void {
  if (!options.restoreLocalStorage || !isWhole) return
  if (options.mode === 'replace') {
    const stale: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX) && !(key in payload.localStorage)) stale.push(key)
    }
    for (const key of stale) localStorage.removeItem(key)
  }
  for (const [key, value] of Object.entries(payload.localStorage)) {
    if (options.mode === 'merge' && localStorage.getItem(key) !== null) continue
    localStorage.setItem(key, value)
  }
}

export async function applyRestore(payload: BackupPayload, options: RestoreOptions): Promise<RestoreResult> {
  const db = await getDb()
  if (payload.dbVersion > db.version) {
    throw new BackupError('NEWER_BACKUP', 'این پشتیبان از نسخه‌ی جدیدتر پایگاه داده است.')
  }
  const known = new Set(Array.from(db.objectStoreNames))
  const skippedStores = Object.keys(payload.stores).filter((name) => !known.has(name))
  const { targets, isWhole } = resolveRestoreTargets(payload, known, options.tables)
  const names = options.mode === 'replace' ? (isWhole ? Array.from(known) : targets) : targets
  const restored: Record<string, number> = {}
  if (!names.length) return { restored, skippedStores }
  const tx = db.transaction(names, 'readwrite')
  try {
    if (options.mode === 'replace') {
      for (const name of names) await tx.objectStore(name).clear()
    }
    for (const name of targets) {
      const store = tx.objectStore(name)
      const keyPath = store.keyPath
      let existing = new Map<string, Record<string, unknown>>()
      if (options.mode === 'merge') {
        const current = (await store.getAll()) as Record<string, unknown>[]
        existing = new Map(current.flatMap((record) => {
          const key = keyOf(record, keyPath)
          return key === null ? [] : [[key, record] as [string, Record<string, unknown>]]
        }))
      }
      let count = 0
      for (const record of payload.stores[name]) {
        if (options.mode === 'merge') {
          const key = keyOf(record, keyPath)
          const current = key === null ? undefined : existing.get(key)
          if (current && !shouldOverwrite(options.conflictPolicy, current, record)) continue
        }
        await store.put(record)
        count += 1
      }
      restored[name] = count
    }
    await tx.done
  } catch (error) {
    try {
      tx.abort()
    } catch {
      // تراکنش از قبل بسته شده است
    }
    throw new BackupError('RESTORE_FAILED', `بازیابی انجام نشد و هیچ تغییری اعمال نشد. (${error instanceof Error ? error.message : 'خطای نامشخص'})`)
  }
  applyLocalStorage(payload, options, isWhole)
  return { restored, skippedStores }
}
