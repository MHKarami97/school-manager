import * as XLSX from 'xlsx'
import type { DifficultyLevel, Question, QuestionType } from '../types'

export interface QuestionImportRow {
  text: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  courseId: string
  grade: number
  difficulty: DifficultyLevel
  tags: string[]
  suggestedScore: number
}

const TEMPLATE_HEADERS = [
  'متن سوال',
  'نوع (تستی/تشریحی/جای‌خالی/صحیح‌غلط)',
  'گزینه ۱',
  'گزینه ۲',
  'گزینه ۳',
  'گزینه ۴',
  'پاسخ صحیح',
  'کد درس',
  'پایه',
  'سطح دشواری (آسان/متوسط/سخت)',
  'تگ‌ها (با , جدا کن)',
  'بارم پیشنهادی',
]

const TEMPLATE_SAMPLE_ROWS: (string | number)[][] = [
  ['پایتخت ایران کجاست؟', 'تستی', 'تهران', 'اصفهان', 'شیراز', 'مشهد', '0', 'social-studies', 5, 'آسان', 'جغرافیا,ایران', 1],
]

const TYPE_LABEL_FA: Record<QuestionType, string> = {
  'multiple-choice': 'تستی',
  essay: 'تشریحی',
  'fill-blank': 'جای‌خالی',
  'true-false': 'صحیح‌غلط',
}

const TYPE_FA_TO_TYPE: Record<string, QuestionType> = {
  تستی: 'multiple-choice',
  تشریحی: 'essay',
  'جای‌خالی': 'fill-blank',
  صحیح‌غلط: 'true-false',
}

const DIFFICULTY_LABEL_FA: Record<DifficultyLevel, string> = { easy: 'آسان', medium: 'متوسط', hard: 'سخت' }
const DIFFICULTY_FA_TO_LEVEL: Record<string, DifficultyLevel> = { آسان: 'easy', متوسط: 'medium', سخت: 'hard' }

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function buildWorkbook(headers: string[], rows: (string | number)[][], sheetName: string): ArrayBuffer {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = headers.map(() => ({ wch: 22 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

export function downloadQuestionBankTemplate(): void {
  const arrayBuffer = buildWorkbook(TEMPLATE_HEADERS, TEMPLATE_SAMPLE_ROWS, 'بانک سوال')
  triggerBlobDownload(
    new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'قالب-بانک-سوال.xlsx',
  )
}

export function exportQuestionsToExcel(questions: Question[], fileName: string): void {
  const rows: (string | number)[][] = questions.map((q) => [
    q.text,
    TYPE_LABEL_FA[q.type],
    q.options[0] ?? '',
    q.options[1] ?? '',
    q.options[2] ?? '',
    q.options[3] ?? '',
    q.correctAnswer,
    q.courseId,
    q.grade,
    DIFFICULTY_LABEL_FA[q.difficulty],
    q.tags.join(','),
    q.suggestedScore,
  ])
  const arrayBuffer = buildWorkbook(TEMPLATE_HEADERS, rows, 'بانک سوال')
  triggerBlobDownload(
    new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${fileName}.xlsx`,
  )
}

function parseType(value: unknown): QuestionType {
  return TYPE_FA_TO_TYPE[String(value ?? '').trim()] ?? 'multiple-choice'
}

function parseDifficulty(value: unknown): DifficultyLevel {
  return DIFFICULTY_FA_TO_LEVEL[String(value ?? '').trim()] ?? 'medium'
}

export async function parseQuestionBankFile(file: File): Promise<QuestionImportRow[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
  const dataRows = rows.slice(1)

  return dataRows
    .map((row): QuestionImportRow | null => {
      const text = String(row[0] ?? '').trim()
      if (!text) return null
      const options = [row[2], row[3], row[4], row[5]].map((v) => String(v ?? '').trim()).filter(Boolean)
      return {
        text,
        type: parseType(row[1]),
        options,
        correctAnswer: String(row[6] ?? '').trim(),
        courseId: String(row[7] ?? '').trim(),
        grade: Number(row[8]) || 1,
        difficulty: parseDifficulty(row[9]),
        tags: String(row[10] ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        suggestedScore: Number(row[11]) || 1,
      }
    })
    .filter((row): row is QuestionImportRow => row !== null)
}
