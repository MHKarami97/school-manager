import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  dedupeRows,
  parseBulkStudentLines,
  parseImportMatrix,
  studentIdentityKey,
} from '@/utils/attendance-student-import'

describe('افزودن گروهی (متن)', () => {
  it('فرمت‌های مختلف خط و شماره‌ی والدین را می‌خواند', () => {
    const { rows, invalidLines } = parseBulkStudentLines(
      'علی, رضایی, 09123456789\nسارا، احمدی، f، ۰۹۳۵۱۲۳۴۵۶۷، 09121112233\nمحمد حسینی\nتک\n\n',
      'male',
    )
    assert.equal(rows.length, 3)
    assert.equal(rows[0].primaryPhone, '09123456789')
    assert.equal(rows[1].gender, 'female')
    assert.equal(rows[1].primaryPhone, '09351234567')
    assert.equal(rows[1].secondaryPhone, '09121112233')
    assert.equal(rows[2].lastName, 'حسینی')
    assert.equal(invalidLines, 1)
  })

  it('جنسیت یکسان برای همه، حرف جنسیت ردیف را نادیده می‌گیرد', () => {
    const same = parseBulkStudentLines('سارا, احمدی, f\nمریم, کریمی', 'male', true)
    assert.deepEqual(same.rows.map((row) => row.gender), ['male', 'male'])
    const mixed = parseBulkStudentLines('سارا, احمدی, f\nمریم, کریمی', 'male', false)
    assert.deepEqual(mixed.rows.map((row) => row.gender), ['female', 'male'])
  })

  it('شماره‌ی نامعتبر شمرده می‌شود ولی دانش‌آموز حذف نمی‌شود', () => {
    const result = parseBulkStudentLines('علی, رضایی, 0912345', 'male')
    assert.equal(result.rows.length, 1)
    assert.equal(result.rows[0].primaryPhone, undefined)
    assert.equal(result.invalidPhones, 1)
  })
})

describe('افزودن از فایل (ماتریس اکسل)', () => {
  it('ستون‌ها را از روی عنوان پیدا می‌کند و صفر ابتدای موبایل عددی را برمی‌گرداند', () => {
    const matrix = [
      ['نام', 'نام‌خانوادگی', 'شماره‌ی والدین', 'جنسیت'],
      ['علی', 'رضایی', 9123456789, 'دختر'],
    ]
    const different = parseImportMatrix(matrix, { defaultGender: 'male', sameGenderForAll: false })
    assert.equal(different.rows[0].primaryPhone, '09123456789')
    assert.equal(different.rows[0].gender, 'female')
    const same = parseImportMatrix(matrix, { defaultGender: 'male', sameGenderForAll: true })
    assert.equal(same.rows[0].gender, 'male')
  })

  it('قالب قدیمی (بدون ستون شماره) هنوز خوانده می‌شود', () => {
    const matrix = [
      ['نام', 'نام‌خانوادگی', 'جنسیت (پسر/دختر)', 'معدل (اختیاری)', 'امتیاز انضباطی (اختیاری)'],
      ['علی', 'رضایی', 'پسر', '18.5', '19'],
    ]
    const { rows } = parseImportMatrix(matrix, { defaultGender: 'male', sameGenderForAll: false })
    assert.equal(rows[0].gpa, 18.5)
    assert.equal(rows[0].disciplineScore, 19)
    assert.equal(rows[0].primaryPhone, undefined)
  })

  it('شماره‌ی دوم و نسبت و شماره‌ی نامعتبر', () => {
    const matrix = [
      ['نام', 'نام‌خانوادگی', 'جنسیت', 'معدل', 'انضباط', 'شماره‌ی والدین', 'شماره‌ی دوم', 'نسبت'],
      ['سارا', 'احمدی', '', '', '', '09351234567', '123', 'مادر'],
    ]
    const result = parseImportMatrix(matrix, { defaultGender: 'female', sameGenderForAll: true })
    assert.equal(result.rows[0].secondaryPhone, undefined)
    assert.equal(result.rows[0].relation, 'مادر')
    assert.equal(result.invalidPhones, 1)
  })
})

describe('جلوگیری از تکرار', () => {
  it('تکراری‌ها (حتی با ی/ک عربی و نیم‌فاصله) حذف می‌شوند', () => {
    const existing = new Set([studentIdentityKey('علی', 'رضایی', 7)])
    const rows = [
      { firstName: 'علي', lastName: 'رضايي', gender: 'male' as const },
      { firstName: 'سارا', lastName: 'احمدی', gender: 'female' as const },
      { firstName: 'سارا', lastName: 'احمدی', gender: 'female' as const },
    ]
    const { fresh, duplicates } = dedupeRows(rows, 7, existing)
    assert.equal(fresh.length, 1)
    assert.equal(duplicates, 2)
  })
})
