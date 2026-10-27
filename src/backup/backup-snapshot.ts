import { getDb } from '@/db/db'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION } from './backup-format'

export const LOCAL_STORAGE_PREFIX = 'school-manager'
export const MIN_ASSET_CHARS = 2048
export const DEFAULT_MAX_ASSET_MB = 50

export interface BackupOptions {
  includeLarge: boolean
  maxLargeBytes: number
  /** اگر خالی باشد، کل برنامه؛ وگرنه فقط همین جدول‌ها. */
  tables?: string[]
}

export type SkipReason = 'excluded' | 'over-limit'
export type BackupScope = 'full' | 'partial'

export interface SkippedAsset {
  store: string
  id: string
  field: string
  bytes: number
  reason: SkipReason
}

export interface BackupPayload {
  app: typeof BACKUP_APP_ID
  formatVersion: number
  scope: BackupScope
  dbName: string
  dbVersion: number
  createdAt: string
  options: BackupOptions
  stores: Record<string, Record<string, unknown>[]>
  localStorage: Record<string, string>
  skippedAssets: SkippedAsset[]
}

export interface AssetRef {
  store: string
  id: string
  field: string
  bytes: number
  holder: Record<string, unknown>
  key: string
}

export interface ScanResult {
  stores: { name: string; count: number }[]
  totalRecords: number
  assetSizes: number[]
  assetsByStore: Record<string, number[]>
}

export function isAssetString(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:') && value.length >= MIN_ASSET_CHARS
}

export function collectAssets(store: string, id: string, record: Record<string, unknown>): AssetRef[] {
  const found: AssetRef[] = []
  const visit = (holder: Record<string, unknown>, path: string): void => {
    for (const key of Object.keys(holder)) {
      const value = holder[key]
      const field = path ? `${path}.${key}` : key
      if (isAssetString(value)) found.push({ store, id, field, bytes: value.length, holder, key })
      else if (value && typeof value === 'object') visit(value as Record<string, unknown>, field)
    }
  }
  visit(record, '')
  return found
}

/** ایندکس دارایی‌هایی که در سقف حجم جا می‌شوند؛ کوچک‌ترها اول. */
export function planAssets(sizes: number[], options: Pick<BackupOptions, 'includeLarge' | 'maxLargeBytes'>): Set<number> {
  const included = new Set<number>()
  if (!options.includeLarge) return included
  let total = 0
  const order = sizes.map((bytes, index) => ({ bytes, index })).sort((a, b) => a.bytes - b.bytes)
  for (const item of order) {
    if (total + item.bytes > options.maxLargeBytes) continue
    total += item.bytes
    included.add(item.index)
  }
  return included
}

function recordId(record: Record<string, unknown>, keyPath: string | string[] | null): string {
  if (typeof keyPath === 'string') return String(record[keyPath] ?? '?')
  return String(record.id ?? '?')
}

interface StoreData {
  name: string
  keyPath: string | string[] | null
  records: Record<string, unknown>[]
}

async function readStores(only?: string[]): Promise<StoreData[]> {
  const db = await getDb()
  const wanted = only ? new Set(only) : null
  const result: StoreData[] = []
  for (const name of Array.from(db.objectStoreNames)) {
    if (wanted && !wanted.has(name)) continue
    const keyPath = db.transaction(name, 'readonly').store.keyPath as string | string[] | null
    result.push({ name, keyPath, records: (await db.getAll(name)) as Record<string, unknown>[] })
  }
  return result
}

export async function scanDatabase(): Promise<ScanResult> {
  const stores = await readStores()
  const assetSizes: number[] = []
  const assetsByStore: Record<string, number[]> = {}
  for (const store of stores) {
    const sizes: number[] = []
    for (const record of store.records) {
      for (const asset of collectAssets(store.name, recordId(record, store.keyPath), record)) sizes.push(asset.bytes)
    }
    assetsByStore[store.name] = sizes
    assetSizes.push(...sizes)
  }
  return {
    stores: stores.map((store) => ({ name: store.name, count: store.records.length })),
    totalRecords: stores.reduce((sum, store) => sum + store.records.length, 0),
    assetSizes,
    assetsByStore,
  }
}

export function collectLocalStorage(): Record<string, string> {
  const result: Record<string, string> = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) result[key] = localStorage.getItem(key) ?? ''
  }
  return result
}

export async function createPayload(options: BackupOptions): Promise<BackupPayload> {
  const db = await getDb()
  const isPartial = !!options.tables && options.tables.length > 0
  const stores = await readStores(isPartial ? options.tables : undefined)
  const assets: AssetRef[] = []
  for (const store of stores) {
    for (const record of store.records) assets.push(...collectAssets(store.name, recordId(record, store.keyPath), record))
  }
  const included = planAssets(assets.map((asset) => asset.bytes), options)
  const skippedAssets: SkippedAsset[] = []
  assets.forEach((asset, index) => {
    if (included.has(index)) return
    asset.holder[asset.key] = null
    skippedAssets.push({
      store: asset.store,
      id: asset.id,
      field: asset.field,
      bytes: asset.bytes,
      reason: options.includeLarge ? 'over-limit' : 'excluded',
    })
  })
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    scope: isPartial ? 'partial' : 'full',
    dbName: db.name,
    dbVersion: db.version,
    createdAt: new Date().toISOString(),
    options,
    stores: Object.fromEntries(stores.map((store) => [store.name, store.records])),
    localStorage: isPartial ? {} : collectLocalStorage(),
    skippedAssets,
  }
}
