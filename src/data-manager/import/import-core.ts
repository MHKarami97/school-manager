import * as XLSX from 'xlsx'
import type { Gender } from '@/types'
import { jalaaliToIsoString } from '@/utils/jalaali'
import { normalizeIranMobile, toLatinDigits } from '@/utils/attendance-domain'
import { normalizePersianText } from '@/utils/attendance-student-import'
import { parseLocationInput } from '@/utils/service-domain'
import type { PlainRecord } from '../record-path'
import { prepareRecord } from '../record-prepare'
import { tableDef } from '../table-registry'
import { tableService } from '../table-service'

export type RowData = Record<string, string>

export interface ImportColumn {
  key: string
  title: string
  required?: boolean
  example: string
  help: string
}

export interface ImportOptions {
  onExisting: 'update' | 'skip'
  defaultGender: Gender
  sameGenderForAll: boolean
  planId: string
}

export interface ImportOp {
  table: string
  record: PlainRecord
  kind: 'create' | 'update'
}

export interface RowOutcome {
  ops: ImportOp[]
  errors: string[]
  warnings: string[]
}

export interface ImportContext {
  students: Map<string, PlainRecord>
  studentsById: Map<string, PlainRecord>
  profiles: Map<string, PlainRecord>
  svcProfiles: Map<string, PlainRecord>
  classrooms: Map<string, PlainRecord>
  members: Set<string>
  teachers: Map<string, PlainRecord>
  drivers: Map<string, PlainRecord>
  driversByPlate: Map<string, PlainRecord>
  plan: PlainRecord | null
  assignments: Map<string, PlainRecord>
  driverLoad: Map<string, number>
  seatsTaken: Map<string, Set<string>>
}

export interface ImportTemplate {
  id: string
  label: string
  description: string
  tables: string[]
  needsPlan?: boolean
  usesGender?: boolean
  columns: ImportColumn[]
  sample: string[][]
  parseRow: (row: RowData, ctx: ImportContext, options: ImportOptions) => RowOutcome
}

export interface RowReport {
  rowNumber: number
  outcome: RowOutcome
  valid: boolean
}

export interface ImportPreview {
  rows: RowReport[]
  missingColumns: string[]
  tableCounts: Record<string, { create: number; update: number }>
  validRows: number
  invalidRows: number
}

export class ImportError extends Error {}

export function outcome(): RowOutcome {
  return { ops: [], errors: [], warnings: [] }
}

export function normalizeHeader(title: string): string {
  return normalizePersianText(title)
    .replace(/\(.*?\)/g, '')
    .replace(/[*:]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function nameKey(value: string): string {
  return normalizePersianText(value).replace(/\s+/g, ' ').toLowerCase()
}

export function parseBool(text: string): boolean | null {
  const value = normalizePersianText(text).toLowerCase()
  if (['بله', 'دارد', 'آری', 'yes', 'y', 'true', '1', '✓'].includes(value)) return true
  if (['خیر', 'ندارد', 'نه', 'no', 'n', 'false', '0'].includes(value)) return false
  return null
}

export function parseGender(text: string, fallback: Gender): Gender {
  const value = normalizePersianText(text).toLowerCase()
  if (['دختر', 'خانم', 'زن', 'f', 'female', 'مونث'].includes(value)) return 'female'
  if (['پسر', 'آقا', 'مرد', 'm', 'male', 'مذکر'].includes(value)) return 'male'
  return fallback
}

export function parseNumber(text: string): number | null {
  const cleaned = toLatinDigits(text).replace(/[,٬\s]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : Number.NaN
}

export function parseGrade(text: string): number | null {
  const value = parseNumber(text)
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 12 ? value : null
}

export function parseTime(text: string): string | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(toLatinDigits(text).trim())
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null
}

export function parsePhone(text: string): string | null {
  return text.trim() ? normalizeIranMobile(text) : null
}

/** تاریخ شمسی (۱۴۰۵/۰۷/۲۰) یا میلادی (2026-10-12) را به ISO میلادی برمی‌گرداند. */
export function parseDateCell(text: string): string | null {
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(toLatinDigits(text).trim())
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (year < 1700) return jalaaliToIsoString(year, month, day)
  return `${match[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseLocationCell(text: string) {
  return text.trim() ? parseLocationInput(text) : null
}

async function mapBy(table: string, keyOf: (record: PlainRecord) => string): Promise<Map<string, PlainRecord>> {
  const map = new Map<string, PlainRecord>()
  for (const record of await tableService.list(table)) {
    const key = keyOf(record)
    if (key && !map.has(key)) map.set(key, record)
  }
  return map
}

export async function buildContext(planId: string): Promise<ImportContext> {
  const students = await tableService.list('students')
  const studentMap = new Map<string, PlainRecord>()
  for (const student of students) {
    const key = `${nameKey(String(student.firstName))}|${nameKey(String(student.lastName))}|${student.grade}`
    if (!studentMap.has(key)) studentMap.set(key, student)
  }
  const plans = await tableService.list('svcPlans')
  const plan = plans.find((item) => item.id === planId) ?? null
  const assignments = new Map<string, PlainRecord>()
  const driverLoad = new Map<string, number>()
  const seatsTaken = new Map<string, Set<string>>()
  if (plan) {
    for (const item of await tableService.list('svcAssignments')) {
      if (item.planId !== plan.id) continue
      assignments.set(String(item.studentId), item)
      const driverId = String(item.driverId)
      driverLoad.set(driverId, (driverLoad.get(driverId) ?? 0) + 1)
      if (typeof item.seatId === 'string') seatsTaken.set(driverId, new Set([...(seatsTaken.get(driverId) ?? []), item.seatId]))
    }
  }
  const members = new Set((await tableService.list('attMembers')).map((item) => String(item.id)))
  return {
    students: studentMap,
    studentsById: new Map(students.map((student) => [String(student.id), student])),
    profiles: await mapBy('attProfiles', (record) => String(record.studentId)),
    svcProfiles: await mapBy('svcStudents', (record) => String(record.studentId)),
    classrooms: await mapBy('attClassrooms', (record) => nameKey(String(record.name))),
    members,
    teachers: await mapBy('teachers', (record) => nameKey(String(record.name))),
    drivers: await mapBy('svcDrivers', (record) => nameKey(String(record.fullName))),
    driversByPlate: await mapBy('svcDrivers', (record) => nameKey(String(record.plate ?? ''))),
    plan,
    assignments,
    driverLoad,
    seatsTaken,
  }
}

export function studentNaturalKey(first: string, last: string, grade: number): string {
  return `${nameKey(first)}|${nameKey(last)}|${grade}`
}

export interface ParsedFile {
  rows: { rowNumber: number; data: RowData }[]
  missingColumns: string[]
}

export function matrixToRows(matrix: unknown[][], template: ImportTemplate): ParsedFile {
  const header = (matrix[0] ?? []).map((cell) => normalizeHeader(String(cell ?? '')))
  const indexOf = new Map<string, number>()
  const missingColumns: string[] = []
  for (const column of template.columns) {
    const index = header.indexOf(normalizeHeader(column.title))
    if (index >= 0) indexOf.set(column.key, index)
    else if (column.required) missingColumns.push(column.title)
  }
  const rows: ParsedFile['rows'] = []
  matrix.slice(1).forEach((row, offset) => {
    const data: RowData = {}
    let hasValue = false
    for (const column of template.columns) {
      const index = indexOf.get(column.key)
      const value = index === undefined ? '' : String(row[index] ?? '').trim()
      data[column.key] = value
      if (value) hasValue = true
    }
    if (hasValue) rows.push({ rowNumber: offset + 2, data })
  })
  return { rows, missingColumns }
}

export async function readFileMatrix(file: File): Promise<unknown[][]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
}

export function downloadTemplate(template: ImportTemplate): void {
  const data = XLSX.utils.aoa_to_sheet([template.columns.map((column) => (column.required ? `${column.title} *` : column.title)), ...template.sample])
  data['!cols'] = template.columns.map(() => ({ wch: 20 }))
  const guide = XLSX.utils.aoa_to_sheet([
    ['ستون', 'الزامی', 'توضیح', 'مثال'],
    ...template.columns.map((column) => [column.title, column.required ? 'بله' : 'خیر', column.help, column.example]),
  ])
  guide['!cols'] = [{ wch: 28 }, { wch: 8 }, { wch: 60 }, { wch: 24 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, data, 'داده‌ها')
  XLSX.utils.book_append_sheet(workbook, guide, 'راهنما')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `قالب-${template.id}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

function finalizeOps(outcomeValue: RowOutcome): void {
  const finalOps: ImportOp[] = []
  for (const op of outcomeValue.ops) {
    const prepared = prepareRecord(tableDef(op.table), op.record, op.kind)
    if (prepared.errors.length) outcomeValue.errors.push(...prepared.errors.map((message) => `${tableDef(op.table).label}: ${message}`))
    else finalOps.push({ ...op, record: prepared.record })
  }
  outcomeValue.ops = finalOps
}

export function buildPreview(template: ImportTemplate, parsed: ParsedFile, ctx: ImportContext, options: ImportOptions): ImportPreview {
  const rows: RowReport[] = []
  const tableCounts: ImportPreview['tableCounts'] = {}
  const seen = new Set<string>()
  if (parsed.missingColumns.length) {
    return { rows, missingColumns: parsed.missingColumns, tableCounts, validRows: 0, invalidRows: 0 }
  }
  for (const item of parsed.rows) {
    const result = template.parseRow(item.data, ctx, options)
    if (!result.errors.length) finalizeOps(result)
    const valid = result.errors.length === 0
    if (valid) {
      for (const op of result.ops) {
        const marker = `${op.table}|${String(op.record[tableDef(op.table).keyPath])}`
        if (seen.has(marker)) continue
        seen.add(marker)
        tableCounts[op.table] ??= { create: 0, update: 0 }
        tableCounts[op.table][op.kind] += 1
      }
    }
    rows.push({ rowNumber: item.rowNumber, outcome: result, valid })
  }
  return {
    rows,
    missingColumns: [],
    tableCounts,
    validRows: rows.filter((row) => row.valid).length,
    invalidRows: rows.filter((row) => !row.valid).length,
  }
}

/** آخرین عملیات هر (جدول، کلید) نگه داشته می‌شود. */
export function collectOps(preview: ImportPreview, allOrNothing: boolean): ImportOp[] {
  if (allOrNothing && preview.invalidRows > 0) throw new ImportError('در فایل خطا هست؛ چون گزینه‌ی «همه یا هیچ» روشن است چیزی وارد نمی‌شود.')
  const byKey = new Map<string, ImportOp>()
  for (const row of preview.rows) {
    if (!row.valid) continue
    for (const op of row.outcome.ops) byKey.set(`${op.table}|${String(op.record[tableDef(op.table).keyPath])}`, op)
  }
  return Array.from(byKey.values())
}

export async function applyImport(preview: ImportPreview, allOrNothing: boolean): Promise<number> {
  const ops = collectOps(preview, allOrNothing)
  return tableService.putMany(ops.map((op) => ({ table: op.table, record: op.record })))
}
