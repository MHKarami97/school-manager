import * as XLSX from 'xlsx'
import type { Gender, GeoPoint, ServiceAddress } from '@/types'
import {
  parseBulkStudentLines,
  parseImportMatrix,
  normalizePersianText,
  type ImportParseOptions,
  type NewStudentRow,
} from '@/utils/attendance-student-import'
import { emptyAddress, parseLocationInput } from '@/utils/service-domain'

export interface ServiceNewRow extends NewStudentRow {
  address: ServiceAddress
  location: GeoPoint | null
  pickupTime: string
}

export interface ServiceBulkResult {
  rows: ServiceNewRow[]
  invalidLines: number
  invalidPhones: number
}

const KEY_TO_FIELD: Record<string, keyof ServiceAddress> = {
  استان: 'province',
  شهر: 'city',
  منطقه: 'region',
  خیابان: 'street',
  کوچه: 'alley',
  ساختمان: 'building',
  پلاک: 'plaque',
  واحد: 'unit',
  نشانه: 'landmark',
}

/** لوکیشن باید آخرین مورد خط باشد، چون خودش می‌تواند کاما داشته باشد (۳۵٫۸،۵۱٫۰ یا لینک نقشه). */
const LOCATION_TAIL = /(?:^|[,،;\t])\s*(?:لوکیشن|موقعیت|مختصات|نقشه)\s*[:=：]\s*(.+)$/
const TIME_KEYS = new Set(['ساعت'])

const HEADER_FIELDS: { title: string; field: keyof ServiceAddress }[] = [
  { title: 'استان', field: 'province' },
  { title: 'شهر', field: 'city' },
  { title: 'منطقه', field: 'region' },
  { title: 'خیابان', field: 'street' },
  { title: 'کوچه', field: 'alley' },
  { title: 'ساختمان', field: 'building' },
  { title: 'پلاک', field: 'plaque' },
  { title: 'واحد', field: 'unit' },
  { title: 'نشانه', field: 'landmark' },
]

const TEMPLATE_HEADERS = [
  'نام',
  'نام‌خانوادگی',
  'جنسیت (اختیاری)',
  'شماره‌ی والدین',
  'شماره‌ی دوم والدین (اختیاری)',
  'نسبت (پدر/مادر/سرپرست - اختیاری)',
  ...HEADER_FIELDS.map((item) => `${item.title} (اختیاری)`),
  'ساعت سوار شدن (اختیاری)',
  'مختصات یا لینک نقشه (اختیاری)',
]

const TEMPLATE_SAMPLE = [
  ['علی', 'رضایی', '', '09123456789', '', 'پدر', 'البرز', 'کرج', '5', 'طالقانی', '12', 'نگین', '4', '3', 'نزدیک پارک', '07:15', ''],
]

function splitKeyValue(cell: string): { key: string; value: string } | null {
  const index = cell.search(/[:=：]/)
  if (index <= 0) return null
  return { key: normalizePersianText(cell.slice(0, index)), value: cell.slice(index + 1).trim() }
}

export function parseServiceBulkText(text: string, defaultGender: Gender, sameGenderForAll: boolean): ServiceBulkResult {
  const rows: ServiceNewRow[] = []
  let invalidLines = 0
  let invalidPhones = 0
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim()
    if (!line) continue
    let location: GeoPoint | null = null
    const locationMatch = LOCATION_TAIL.exec(line)
    if (locationMatch) {
      location = parseLocationInput(locationMatch[1])
      line = line.slice(0, locationMatch.index).trim()
    }
    const cells = line.split(/[,،;\t]/).map((cell) => cell.trim()).filter(Boolean)
    const address = emptyAddress()
    let pickupTime = ''
    const plain: string[] = []
    for (const cell of cells) {
      const pair = splitKeyValue(cell)
      if (!pair) {
        plain.push(cell)
        continue
      }
      const field = KEY_TO_FIELD[pair.key]
      if (field) address[field] = pair.value
      else if (TIME_KEYS.has(pair.key)) pickupTime = /^([01]?\d|2[0-3]):[0-5]\d$/.test(pair.value) ? pair.value.padStart(5, '0') : ''
      else plain.push(cell)
    }
    const parsed = parseBulkStudentLines(plain.join('،'), defaultGender, sameGenderForAll)
    invalidPhones += parsed.invalidPhones
    if (!parsed.rows.length) {
      invalidLines += 1
      continue
    }
    rows.push({ ...parsed.rows[0], address, location, pickupTime })
  }
  return { rows, invalidLines, invalidPhones }
}

export interface ServiceMatrixResult {
  rows: ServiceNewRow[]
  invalidPhones: number
}

export function parseServiceMatrix(matrix: unknown[][], options: ImportParseOptions): ServiceMatrixResult {
  const header = (matrix[0] ?? []).map((cell) => normalizePersianText(String(cell ?? '')))
  const columnOf = (keyword: string): number => header.findIndex((title) => title.startsWith(keyword))
  const timeColumn = header.findIndex((title) => title.includes('ساعت'))
  const locationColumn = header.findIndex((title) => title.includes('مختصات') || title.includes('لینک نقشه'))
  const rows: ServiceNewRow[] = []
  let invalidPhones = 0
  for (const row of matrix.slice(1)) {
    const base = parseImportMatrix([matrix[0] ?? [], row], options)
    if (!base.rows.length) continue
    invalidPhones += base.invalidPhones
    const address = emptyAddress()
    for (const item of HEADER_FIELDS) {
      const column = columnOf(item.title)
      if (column >= 0) address[item.field] = String(row[column] ?? '').trim()
    }
    const time = timeColumn >= 0 ? String(row[timeColumn] ?? '').trim() : ''
    const location = locationColumn >= 0 ? parseLocationInput(String(row[locationColumn] ?? '')) : null
    rows.push({
      firstName: base.rows[0].firstName,
      lastName: base.rows[0].lastName,
      gender: base.rows[0].gender,
      primaryPhone: base.rows[0].primaryPhone,
      secondaryPhone: base.rows[0].secondaryPhone,
      relation: base.rows[0].relation,
      address,
      location,
      pickupTime: /^([01]?\d|2[0-3]):[0-5]\d$/.test(time) ? time.padStart(5, '0') : '',
    })
  }
  return { rows, invalidPhones }
}

export async function parseServiceImportFile(file: File, options: ImportParseOptions): Promise<ServiceMatrixResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
  return parseServiceMatrix(matrix, options)
}

export function downloadServiceImportTemplate(): void {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE])
  worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 20 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دانش‌آموزان سرویس')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'قالب-دانش-آموزان-سرویس.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
