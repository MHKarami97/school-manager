import { toLatinDigits } from '@/utils/attendance-domain'
import { deletePath, getPath, setPath, type PlainRecord } from './record-path'
import type { FieldDef, TableDef } from './table-registry'

export type FormValues = Record<string, string | boolean>
export type FormMode = 'create' | 'update'

export function parseList(text: string): string[] {
  return text
    .split(/[,،\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseNumberList(text: string): { values: number[]; invalid: string[] } {
  const tokens = parseList(toLatinDigits(text))
  const values: number[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    const value = Number(token)
    if (Number.isFinite(value)) values.push(value)
    else invalid.push(token)
  }
  return { values, invalid }
}

export function isFieldReadonly(field: FieldDef, mode: FormMode): boolean {
  return !!field.readonly || (mode === 'update' && !!field.keyPart)
}

export function toFormValues(fields: FieldDef[], record: PlainRecord): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    const value = getPath(record, field.key)
    if (field.type === 'boolean') values[field.key] = value === true
    else if (field.type === 'list' || field.type === 'numlist') values[field.key] = Array.isArray(value) ? value.join('، ') : ''
    else values[field.key] = value === null || value === undefined ? '' : String(value)
  }
  return values
}

export interface ApplyResult {
  record: PlainRecord
  errors: string[]
}

export function applyFormValues(table: TableDef, base: PlainRecord, values: FormValues, mode: FormMode): ApplyResult {
  const record: PlainRecord = JSON.parse(JSON.stringify(base))
  const errors: string[] = []
  for (const field of table.fields ?? []) {
    if (!(field.key in values) || isFieldReadonly(field, mode)) continue
    const raw = values[field.key]
    if (field.type === 'boolean') {
      setPath(record, field.key, raw === true)
    } else if (field.type === 'list') {
      setPath(record, field.key, parseList(String(raw)))
    } else if (field.type === 'numlist') {
      const parsed = parseNumberList(String(raw))
      if (parsed.invalid.length) errors.push(`«${field.label}»: مقدار عددی نامعتبر (${parsed.invalid.join('، ')})`)
      setPath(record, field.key, parsed.values)
    } else if (field.type === 'number') {
      const text = toLatinDigits(String(raw)).trim().replace(/٬/g, '')
      if (!text) {
        if (field.nullable) setPath(record, field.key, null)
        else deletePath(record, field.key)
      } else if (Number.isFinite(Number(text))) {
        setPath(record, field.key, Number(text))
      } else {
        errors.push(`«${field.label}» باید عدد باشد.`)
      }
    } else {
      const text = String(raw).trim()
      if (!text && field.nullable) setPath(record, field.key, null)
      else if (!text && field.nullable === false) deletePath(record, field.key)
      else setPath(record, field.key, text)
    }
  }
  return { record: table.normalize ? table.normalize(record) : record, errors }
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateRecord(table: TableDef, record: PlainRecord): string[] {
  const errors: string[] = []
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return ['رکورد باید یک شیء باشد.']
  for (const field of table.fields ?? []) {
    const value = getPath(record, field.key)
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (empty) {
      if (field.required) errors.push(`«${field.label}» الزامی است.`)
      continue
    }
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) errors.push(`«${field.label}» باید عدد باشد.`)
    if (field.type === 'select' && field.options && !field.options.some((option) => option.value === value)) errors.push(`«${field.label}» مقدار مجاز ندارد.`)
    if (field.type === 'date' && !DATE_PATTERN.test(String(value))) errors.push(`«${field.label}» باید به شکل YYYY-MM-DD (تاریخ میلادی) باشد.`)
    if (field.type === 'time' && !TIME_PATTERN.test(String(value))) errors.push(`«${field.label}» باید به شکل HH:MM باشد.`)
  }
  return errors
}
