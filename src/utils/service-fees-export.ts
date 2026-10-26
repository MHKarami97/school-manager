import * as XLSX from 'xlsx'
import { JALAALI_MONTH_NAMES } from '@/utils/jalaali'

export interface FeeExportRow {
  name: string
  grade: string
  driver: string
  monthlyFee: number
  monthPaid: number[]
  totalPaid: number
  balance: number
}

export function monthKeyLabel(key: string, withYear = true): string {
  const [year, month] = key.split('-').map(Number)
  const name = JALAALI_MONTH_NAMES[month - 1] ?? key
  return withYear ? `${name} ${year}` : name
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString('fa-IR')} تومان`
}

export function buildFeeTable(months: string[], rows: FeeExportRow[]): (string | number)[][] {
  const header = ['دانش‌آموز', 'پایه', 'راننده', 'هزینه‌ی ماهانه', ...months.map((month) => monthKeyLabel(month)), 'جمع پرداختی', 'مانده']
  const body = rows.map((row) => [row.name, row.grade, row.driver, row.monthlyFee, ...row.monthPaid, row.totalPaid, row.balance])
  return [header, ...body]
}

export function exportFeesToExcel(months: string[], rows: FeeExportRow[], fileName: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(buildFeeTable(months, rows))
  worksheet['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 20 }, ...months.map(() => ({ wch: 14 })), { wch: 14 }, { wch: 14 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'هزینه‌ی سرویس')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
