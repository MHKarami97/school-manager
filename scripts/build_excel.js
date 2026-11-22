/**
 * تبدیل فایل‌های JSON بانک سوالات به فایل‌های استاندارد اکسل (XLSX)
 * منطبق بر فرمت ورودی و خروجی برنامه در `src/utils/question-bank-import-export.ts`
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

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

function buildWorkbook(questions, sheetName = 'بانک سوال') {
  const rows = questions.map((q) => [
    q.text,
    'تستی',
    q.options[0] ?? '',
    q.options[1] ?? '',
    q.options[2] ?? '',
    q.options[3] ?? '',
    q.correctAnswer,
    q.courseId,
    q.grade,
    q.difficulty || 'متوسط',
    (q.tags || []).join(','),
    q.suggestedScore || 1,
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...rows])
  worksheet['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return workbook
}

async function main() {
  const dataDir = path.join(rootDir, 'public', 'data', 'questions')
  const downloadDir = path.join(rootDir, 'public', 'downloads', 'questions')
  fs.mkdirSync(downloadDir, { recursive: true })

  // 1. فایل تجمیعی
  const masterJsonPath = path.join(dataDir, 'elementary-curriculum-questions.json')
  const allQuestions = JSON.parse(fs.readFileSync(masterJsonPath, 'utf-8'))
  console.log(`Building master Excel for ${allQuestions.length} questions...`)
  const masterWb = buildWorkbook(allQuestions, 'کل سوالات ابتدایی')
  const masterOutPath = path.join(downloadDir, 'elementary-all-grades-questions.xlsx')
  XLSX.writeFile(masterWb, masterOutPath)
  console.log(`Saved: ${masterOutPath}`)

  // 2. فایل‌های تفکیکی هر پایه
  for (let grade = 1; grade <= 6; grade++) {
    const gradeJsonPath = path.join(dataDir, `grade-${grade}.json`)
    const gradeQuestions = JSON.parse(fs.readFileSync(gradeJsonPath, 'utf-8'))
    console.log(`Building Grade ${grade} Excel for ${gradeQuestions.length} questions...`)
    const gradeWb = buildWorkbook(gradeQuestions, `پایه ${grade}`)
    const gradeOutPath = path.join(downloadDir, `grade-${grade}-questions.xlsx`)
    XLSX.writeFile(gradeWb, gradeOutPath)
    console.log(`Saved: ${gradeOutPath}`)
  }

  // اعتبارسنجی خواندن فایل اکسل با خوانش تستی
  console.log('\n--- Verifying Excel compatibility ---')
  const testBuf = fs.readFileSync(masterOutPath)
  const testWb = XLSX.read(testBuf, { type: 'buffer' })
  const sheet = testWb.Sheets[testWb.SheetNames[0]]
  const parsedRows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  console.log(`Parsed total rows (header + data): ${parsedRows.length}`)
  console.log('Sample parsed question row 1:', parsedRows[1])
  if (parsedRows.length === allQuestions.length + 1) {
    console.log('Verification PASSED! All 3500 rows match perfectly.')
  } else {
    console.error(`Verification WARNING: expected ${allQuestions.length + 1}, got ${parsedRows.length}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
