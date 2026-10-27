import { getDb } from '@/db/db'
import { planCascade, type CascadePlan, type ChildData } from './cascade'
import { applyFormValues, validateRecord, type FormValues, type FormMode } from './record-form'
import { prepareRecord } from './record-prepare'
import { getPath, type PlainRecord } from './record-path'
import { tableDef, type TableDef } from './table-registry'

export class DataError extends Error {
  readonly details: string[]

  constructor(message: string, details: string[] = []) {
    super(message)
    this.name = 'DataError'
    this.details = details
  }
}

export interface SaveResult {
  record: PlainRecord
  warnings: string[]
}

export interface DeleteImpact {
  plan: CascadePlan
  totalDeletes: number
  totalUpdates: number
}

export interface TableCount {
  name: string
  count: number
}

export interface PutOp {
  table: string
  record: PlainRecord
}

function isConstraintError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'ConstraintError'
}

function keyOfRecord(table: TableDef, record: PlainRecord): string {
  return String(record[table.keyPath] ?? '')
}

export class TableService {
  private revisionCounter = 0
  private readonly labelCache = new Map<string, { revision: number; labels: Map<string, string> }>()

  get revision(): number {
    return this.revisionCounter
  }

  invalidate(): void {
    this.revisionCounter += 1
  }

  async tableNames(): Promise<string[]> {
    const db = await getDb()
    return Array.from(db.objectStoreNames)
  }

  async counts(): Promise<TableCount[]> {
    const db = await getDb()
    return Promise.all(Array.from(db.objectStoreNames).map(async (name) => ({ name, count: await db.count(name) })))
  }

  async list(name: string): Promise<PlainRecord[]> {
    const db = await getDb()
    return (await db.getAll(name)) as PlainRecord[]
  }

  async labelsOf(name: string): Promise<Map<string, string>> {
    const cached = this.labelCache.get(name)
    if (cached && cached.revision === this.revisionCounter) return cached.labels
    const table = tableDef(name)
    const labels = new Map<string, string>()
    for (const record of await this.list(name)) labels.set(keyOfRecord(table, record), table.labelOf(record))
    this.labelCache.set(name, { revision: this.revisionCounter, labels })
    return labels
  }

  buildFromForm(name: string, base: PlainRecord, values: FormValues, mode: FormMode): { record: PlainRecord; errors: string[] } {
    return applyFormValues(tableDef(name), base, values, mode)
  }

  private prepare(table: TableDef, input: PlainRecord, mode: FormMode): PlainRecord {
    const prepared = prepareRecord(table, input, mode)
    const keyErrors = prepared.errors.filter((message) => message.includes('الزامی') && table.idOf)
    if (keyErrors.length && table.idOf && !prepared.record[table.keyPath]) throw new DataError('بخش‌های کلید رکورد کامل نیست.', keyErrors)
    return prepared.record
  }

  private async referenceWarnings(table: TableDef, record: PlainRecord): Promise<string[]> {
    const db = await getDb()
    const warnings: string[] = []
    for (const field of table.fields ?? []) {
      if (field.type !== 'ref' || !field.ref) continue
      const value = getPath(record, field.key)
      if (typeof value !== 'string' || !value) continue
      if (!(await db.get(field.ref, value))) warnings.push(`«${field.label}» به رکوردی اشاره می‌کند که وجود ندارد.`)
    }
    return warnings
  }

  async save(name: string, input: PlainRecord, mode: FormMode): Promise<SaveResult> {
    const table = tableDef(name)
    const record = this.prepare(table, input, mode)
    const errors = validateRecord(table, record)
    if (errors.length) throw new DataError('اطلاعات معتبر نیست.', errors)
    const db = await getDb()
    if (mode === 'create' && (await db.get(name, keyOfRecord(table, record)))) {
      throw new DataError('رکوردی با همین کلید از قبل وجود دارد.')
    }
    try {
      await db.put(name, record)
    } catch (error) {
      if (isConstraintError(error)) throw new DataError('یک مقدار یکتا (مثل GUID یا سریال NFC) تکراری است.')
      throw error
    }
    this.invalidate()
    return { record, warnings: await this.referenceWarnings(table, record) }
  }

  /** نوشتن چند رکورد از چند جدول در یک تراکنش؛ یا همه یا هیچ. */
  async putMany(ops: PutOp[]): Promise<number> {
    if (!ops.length) return 0
    const db = await getDb()
    const names = Array.from(new Set(ops.map((op) => op.table)))
    const tx = db.transaction(names, 'readwrite')
    try {
      for (const op of ops) await tx.objectStore(op.table).put(op.record)
      await tx.done
    } catch (error) {
      try {
        tx.abort()
      } catch {
        // تراکنش از قبل بسته شده است
      }
      throw new DataError(isConstraintError(error) ? 'یک مقدار یکتا (مثل GUID یا سریال NFC) تکراری است؛ هیچ تغییری اعمال نشد.' : 'ذخیره انجام نشد و هیچ تغییری اعمال نشد.')
    }
    this.invalidate()
    return ops.length
  }

  async bulkUpdate(name: string, keys: string[], values: FormValues): Promise<number> {
    const table = tableDef(name)
    const db = await getDb()
    const prepared: PlainRecord[] = []
    const problems: string[] = []
    for (const key of keys) {
      const existing = (await db.get(name, key)) as PlainRecord | undefined
      if (!existing) continue
      const applied = applyFormValues(table, existing, values, 'update')
      const record = this.prepare(table, applied.record, 'update')
      const errors = [...applied.errors, ...validateRecord(table, record)]
      if (errors.length) problems.push(`${table.labelOf(existing)}: ${errors[0]}`)
      else prepared.push(record)
    }
    if (problems.length) throw new DataError('ویرایش گروهی انجام نشد؛ هیچ رکوردی تغییر نکرد.', problems.slice(0, 6))
    const tx = db.transaction(name, 'readwrite')
    try {
      for (const record of prepared) await tx.store.put(record)
      await tx.done
    } catch (error) {
      throw new DataError(isConstraintError(error) ? 'یک مقدار یکتا تکراری است؛ هیچ تغییری اعمال نشد.' : 'ذخیره انجام نشد.')
    }
    this.invalidate()
    return prepared.length
  }

  private async readChildren(table: TableDef): Promise<Record<string, ChildData>> {
    const db = await getDb()
    const children: Record<string, ChildData> = {}
    for (const child of new Set(table.relations.map((relation) => relation.child))) {
      if (!db.objectStoreNames.contains(child)) continue
      children[child] = {
        keyPath: String(db.transaction(child, 'readonly').store.keyPath),
        records: (await db.getAll(child)) as PlainRecord[],
      }
    }
    return children
  }

  async deleteImpact(name: string, keys: string[]): Promise<DeleteImpact> {
    const table = tableDef(name)
    const plan = planCascade(table.relations, new Set(keys), await this.readChildren(table))
    return { plan, totalDeletes: plan.deletes.length, totalUpdates: plan.updates.length }
  }

  async deleteRecords(name: string, keys: string[]): Promise<DeleteImpact> {
    const table = tableDef(name)
    const db = await getDb()
    const childNames = Array.from(new Set(table.relations.map((relation) => relation.child))).filter((child) => db.objectStoreNames.contains(child))
    const tx = db.transaction([name, ...childNames], 'readwrite')
    let plan: CascadePlan
    try {
      const children: Record<string, ChildData> = {}
      for (const child of childNames) {
        const store = tx.objectStore(child)
        children[child] = { keyPath: String(store.keyPath), records: (await store.getAll()) as PlainRecord[] }
      }
      plan = planCascade(table.relations, new Set(keys), children)
      for (const item of plan.deletes) await tx.objectStore(item.table).delete(item.key)
      for (const item of plan.updates) await tx.objectStore(item.table).put(item.record)
      for (const key of keys) await tx.objectStore(name).delete(key)
      await tx.done
    } catch {
      try {
        tx.abort()
      } catch {
        // تراکنش از قبل بسته شده است
      }
      throw new DataError('حذف انجام نشد و هیچ تغییری اعمال نشد.')
    }
    this.invalidate()
    return { plan, totalDeletes: plan.deletes.length, totalUpdates: plan.updates.length }
  }
}

export const tableService = new TableService()
