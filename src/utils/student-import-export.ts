import * as XLSX from 'xlsx'
import type { Gender, Student } from '@/types'

export interface StudentImportRow {
  firstName: string
  lastName: string
  gender: Gender
  gpa: number | null
  disciplineScore: number | null
}

const TEMPLATE_HEADERS = ['نام', 'نام‌خانوادگی', 'جنسیت (پسر/دختر)', 'معدل (اختیاری)', 'امتیاز انضباطی (اختیاری)']

const TEMPLATE_SAMPLE_ROWS = [
  ['علی', 'رضایی', 'پسر', '18.5', '19'],
  ['سارا', 'احمدی', 'دختر', '', ''],
]

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function buildWorkbookFromRows(headers: string[], rows: (string | number)[][], sheetName: string): ArrayBuffer {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = headers.map(() => ({ wch: 18 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

/**
 * ساخت و دانلود قالب خالی اکسل برای ورود دانش‌آموزان. ستون‌ها فارسی و با یک سطر راهنما/نمونه هستند تا کاربر فرمت
 * مورد انتظار را ببیند؛ خودِ سطر نمونه در زمان وارد کردن فایل توسط کاربر نادیده گرفته نمی‌شود، پس بهتر است کاربر آن را
 * قبل از پر کردن حذف یا با اطلاعات واقعی جایگزین کند.
 */
export function downloadStudentImportTemplate(): void {
  const arrayBuffer = buildWorkbookFromRows(TEMPLATE_HEADERS, TEMPLATE_SAMPLE_ROWS, 'دانش‌آموزان')
  triggerBlobDownload(
    new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'قالب-ورود-دانش-آموزان.xlsx',
  )
}

/**
 * خروجی اکسل از لیست فعلی دانش‌آموزان یک پایه (همان ستون‌بندی قالب ورودی، به‌علاوه ستون‌های وضعیت) تا بتوان آن را ذخیره، چاپ یا دوباره ویرایش‌شده وارد کرد.
 */
export function exportStudentsToExcel(students: Student[], fileName: string): void {
  const headers = [...TEMPLATE_HEADERS, 'ضعیف علمی', 'بی‌انضباط']
  const rows = students.map((s) => [
    s.firstName,
    s.lastName,
    s.gender === 'female' ? 'دختر' : 'پسر',
    s.gpa ?? '',
    s.disciplineScore ?? '',
    s.isAcademicallyWeak ? 'بله' : '',
    s.isDisruptive ? 'بله' : '',
  ])
  const arrayBuffer = buildWorkbookFromRows(headers, rows, 'دانش‌آموزان')
  triggerBlobDownload(new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}.xlsx`)
}

function parseGenderCell(value: unknown): Gender {
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'دختر' || text === 'f' || text === 'female') return 'female'
  return 'male'
}

function parseNumberCell(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * خواندن فایل اکسل (.xlsx/.xls) یا CSV آپلود‌شده و تبدیل آن به لیست دانش‌آموزان
 * آماده ثبت. سطر اول همیشه به‌عنوان هدر نادیده گرفته می‌شود؛ سطر‌هایی که نام یا
 * نام‌خانوادگی ندارند رد می‌شوند تا خط خالی باعث ساخت دانش‌آموز خالی نشود.
 */
export async function parseStudentImportFile(file: File): Promise<StudentImportRow[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })

  const dataRows = rows.slice(1)

  return dataRows
    .map((row): StudentImportRow | null => {
      const firstName = String(row[0] ?? '').trim()
      const lastName = String(row[1] ?? '').trim()
      if (!firstName || !lastName) return null
      return {
        firstName,
        lastName,
        gender: parseGenderCell(row[2]),
        gpa: parseNumberCell(row[3]),
        disciplineScore: parseNumberCell(row[4]),
      }
    })
    .filter((row): row is StudentImportRow => row !== null)
}
