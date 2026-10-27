import { getPath, type PlainRecord } from './record-path'
import { validateRecord, type FormMode } from './record-form'
import type { TableDef } from './table-registry'

export interface PreparedRecord {
  record: PlainRecord
  errors: string[]
}

/** شناسه، زمان‌ها و نرمال‌سازی را اعمال و اعتبارسنجی می‌کند (بدون نوشتن). */
export function prepareRecord(table: TableDef, input: PlainRecord, mode: FormMode, now = Date.now()): PreparedRecord {
  let record: PlainRecord = JSON.parse(JSON.stringify(input))
  if (table.normalize) record = table.normalize(record)
  const errors: string[] = []
  if (table.idOf) {
    const missing = (table.fields ?? []).filter((field) => field.keyPart && !String(getPath(record, field.key) ?? '').trim())
    if (missing.length) errors.push(...missing.map((field) => `«${field.label}» الزامی است.`))
    else record[table.keyPath] = table.idOf(record)
  } else if (!record[table.keyPath]) {
    if (table.keyPath === 'id') record.id = crypto.randomUUID()
    else errors.push('کلید رکورد مشخص نیست.')
  }
  if (mode === 'create' && 'createdAt' in record) record.createdAt = now
  if ('updatedAt' in record) record.updatedAt = now
  errors.push(...validateRecord(table, record))
  return { record, errors }
}
