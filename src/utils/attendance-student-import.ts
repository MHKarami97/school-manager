import * as XLSX from 'xlsx'
import type { Gender, LevelId, Student } from '@/types'
import { LEVELS } from '@/config/levels.config'
import { normalizeIranMobile, toLatinDigits } from '@/utils/attendance-domain'

export interface NewStudentRow {
  firstName: string
  lastName: string
  gender: Gender
  primaryPhone?: string
  secondaryPhone?: string
  relation?: string
}

export interface AttendanceImportRow extends NewStudentRow {
  gpa: number | null
  disciplineScore: number | null
}

export interface BulkParseResult {
  rows: NewStudentRow[]
  invalidLines: number
  invalidPhones: number
}

export interface ImportParseResult {
  rows: AttendanceImportRow[]
  invalidPhones: number
}

export interface ImportParseOptions {
  defaultGender: Gender
  sameGenderForAll: boolean
}

const FEMALE_TOKENS = new Set(['f', 'female', 'زن', 'دختر', 'خانم', 'مونث', 'د'])
const MALE_TOKENS = new Set(['m', 'male', 'مرد', 'پسر', 'آقا', 'مذکر', 'پ'])
const PHONE_LIKE = /^[\d+\-() ]{7,}$/

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const TEMPLATE_HEADERS = [
  'نام',
  'نام‌خانوادگی',
  'جنسیت (اختیاری)',
  'معدل (اختیاری)',
  'امتیاز انضباطی (اختیاری)',
  'شماره‌ی والدین',
  'شماره‌ی دوم والدین (اختیاری)',
  'نسبت (پدر/مادر/سرپرست - اختیاری)',
]

const TEMPLATE_SAMPLE_ROWS = [
  ['علی', 'رضایی', '', '', '', '09123456789', '', 'پدر'],
  ['سارا', 'احمدی', '', '18.5', '19', '09351234567', '09121112233', 'مادر'],
]

export function levelIdOfGrade(grade: number): LevelId | null {
  return LEVELS.find((level) => level.grades.includes(grade))?.id ?? null
}

export function normalizePersianText(value: string): string {
  return toLatinDigits(value)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function studentIdentityKey(firstName: string, lastName: string, grade: number): string {
  return `${normalizePersianText(firstName)}|${normalizePersianText(lastName)}|${grade}`
}

export function existingIdentityKeys(students: Student[]): Set<string> {
  return new Set(students.map((student) => studentIdentityKey(student.firstName, student.lastName, student.grade)))
}

function isGenderToken(token: string): boolean {
  const value = token.trim().toLowerCase()
  return FEMALE_TOKENS.has(value) || MALE_TOKENS.has(value)
}

function genderFromToken(token: string | undefined, fallback: Gender): Gender {
  const value = (token ?? '').trim().toLowerCase()
  if (FEMALE_TOKENS.has(value)) return 'female'
  if (MALE_TOKENS.has(value)) return 'male'
  return fallback
}

export function parseBulkStudentLines(text: string, defaultGender: Gender, sameGenderForAll = false): BulkParseResult {
  const rows: NewStudentRow[] = []
  let invalidLines = 0
  let invalidPhones = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const cells = line
      .split(/[,،;\t]/)
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0)
    let firstName = ''
    let lastName = ''
    const extras: string[] = []
    if (cells.length >= 2) {
      firstName = cells[0]
      lastName = cells[1]
      extras.push(...cells.slice(2))
    } else if (cells.length === 1) {
      const words = cells[0].split(/\s+/)
      if (words.length >= 2) {
        firstName = words[0]
        lastName = words.slice(1).join(' ')
      }
    }
    if (!firstName || !lastName) {
      invalidLines += 1
      continue
    }
    const phones: string[] = []
    let genderToken: string | undefined
    for (const extra of extras) {
      if (PHONE_LIKE.test(toLatinDigits(extra))) {
        const phone = normalizeIranMobile(extra)
        if (phone) phones.push(phone)
        else invalidPhones += 1
      } else if (isGenderToken(extra)) {
        genderToken = extra
      }
    }
    rows.push({
      firstName,
      lastName,
      gender: sameGenderForAll ? defaultGender : genderFromToken(genderToken, defaultGender),
      primaryPhone: phones[0],
      secondaryPhone: phones[1],
    })
  }
  return { rows, invalidLines, invalidPhones }
}

export interface DedupeResult<T extends NewStudentRow> {
  fresh: T[]
  duplicates: number
}

export function dedupeRows<T extends NewStudentRow>(rows: T[], grade: number, existing: Set<string>): DedupeResult<T> {
  const seen = new Set(existing)
  const fresh: T[] = []
  let duplicates = 0
  for (const row of rows) {
    const key = studentIdentityKey(row.firstName, row.lastName, grade)
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
    fresh.push(row)
  }
  return { fresh, duplicates }
}

function cellText(row: unknown[], index: number): string {
  return index >= 0 ? String(row[index] ?? '').trim() : ''
}

function parseNumberCell(value: string): number | null {
  if (!value) return null
  const parsed = Number(toLatinDigits(value))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseImportMatrix(matrix: unknown[][], options: ImportParseOptions): ImportParseResult {
  const header = (matrix[0] ?? []).map((cell) => normalizePersianText(String(cell ?? '')))
  const find = (predicate: (title: string) => boolean, fallback: number): number => {
    const index = header.findIndex(predicate)
    return index >= 0 ? index : fallback
  }
  const columns = {
    first: find((title) => title.startsWith('نام') && !title.includes('خانوادگی'), 0),
    last: find((title) => title.includes('خانوادگی'), 1),
    gender: find((title) => title.includes('جنسیت'), 2),
    gpa: find((title) => title.includes('معدل'), 3),
    discipline: find((title) => title.includes('انضباط'), 4),
    phone: find((title) => title.includes('شماره') && !title.includes('دوم') && !title.includes('نسبت'), 5),
    phone2: find((title) => title.includes('شماره') && title.includes('دوم'), 6),
    relation: find((title) => title.includes('نسبت'), 7),
  }
  const rows: AttendanceImportRow[] = []
  let invalidPhones = 0
  for (const row of matrix.slice(1)) {
    const firstName = cellText(row, columns.first)
    const lastName = cellText(row, columns.last)
    if (!firstName || !lastName) continue
    const phones = [cellText(row, columns.phone), cellText(row, columns.phone2)].map((raw) => {
      if (!raw) return ''
      const phone = normalizeIranMobile(raw)
      if (!phone) invalidPhones += 1
      return phone ?? ''
    })
    const relation = cellText(row, columns.relation)
    rows.push({
      firstName,
      lastName,
      gender: options.sameGenderForAll
        ? options.defaultGender
        : genderFromToken(cellText(row, columns.gender), options.defaultGender),
      primaryPhone: phones[0] || undefined,
      secondaryPhone: phones[1] || undefined,
      relation: relation && relation.length <= 20 ? relation : undefined,
      gpa: parseNumberCell(cellText(row, columns.gpa)),
      disciplineScore: parseNumberCell(cellText(row, columns.discipline)),
    })
  }
  return { rows, invalidPhones }
}

export async function parseAttendanceImportFile(file: File, options: ImportParseOptions): Promise<ImportParseResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
  return parseImportMatrix(matrix, options)
}

export function downloadAttendanceImportTemplate(): void {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE_ROWS])
  worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دانش‌آموزان')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'قالب-ورود-دانش-آموزان-با-شماره-والدین.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
