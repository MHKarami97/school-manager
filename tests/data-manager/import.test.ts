import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildPreview, matrixToRows, studentNaturalKey, type ImportContext, type ImportOptions, type RowData } from '@/data-manager/import/import-core'
import { IMPORT_TEMPLATES, importTemplate } from '@/data-manager/import/templates'

const options: ImportOptions = { onExisting: 'update', defaultGender: 'male', sameGenderForAll: true, planId: 'p' }

function emptyCtx(overrides: Partial<ImportContext> = {}): ImportContext {
  return {
    students: new Map(),
    studentsById: new Map(),
    profiles: new Map(),
    svcProfiles: new Map(),
    classrooms: new Map(),
    members: new Set(),
    teachers: new Map(),
    drivers: new Map(),
    driversByPlate: new Map(),
    plan: null,
    assignments: new Map(),
    driverLoad: new Map(),
    seatsTaken: new Map(),
    ...overrides,
  }
}

function rowOf(id: string, values: Record<string, string>): RowData {
  const template = importTemplate(id)
  assert.ok(template)
  return Object.fromEntries(template.columns.map((column) => [column.key, values[column.key] ?? '']))
}

const student = { id: 's1', firstName: 'علی', lastName: 'رضایی', grade: 3 }

describe('قالب دانش‌آموزان (چندجدولی)', () => {
  const template = importTemplate('students-full')!

  it('یک ردیف، چهار جدول را با ارجاع درست می‌سازد', () => {
    const ctx = emptyCtx({ classrooms: new Map([['سوم الف', { id: 'c1', name: 'سوم الف', createdAt: 5 }]]) })
    const result = template.parseRow(
      rowOf('students-full', { firstName: 'علی', lastName: 'رضایی', grade: '۳', phone1: '09123456789', city: 'کرج', region: '5', className: 'سوم الف' }),
      ctx,
      options,
    )
    assert.deepEqual(result.errors, [])
    assert.deepEqual(result.ops.map((op) => op.table), ['students', 'attProfiles', 'svcStudents', 'attMembers'])
    const created = result.ops[0].record
    assert.equal(result.ops[1].record.studentId, created.id)
    assert.equal(result.ops[2].record.studentId, created.id)
    assert.equal(result.ops[3].record.studentId, created.id)
    assert.equal(result.ops[3].record.classroomId, 'c1')
  })

  it('بدون آدرس و بدون «سرویس دارد» رکورد سرویس نمی‌سازد؛ شماره‌ی نامعتبر هشدار است', () => {
    const result = template.parseRow(rowOf('students-full', { firstName: 'سارا', lastName: 'احمدی', grade: '2', phone1: '0912' }), emptyCtx(), options)
    assert.deepEqual(result.ops.map((op) => op.table), ['students'])
    assert.equal(result.warnings.length, 1)
  })

  it('دانش‌آموز تکراری در همان فایل، دوباره ساخته نمی‌شود', () => {
    const ctx = emptyCtx()
    const first = template.parseRow(rowOf('students-full', { firstName: 'علی', lastName: 'رضایی', grade: '3' }), ctx, options)
    const second = template.parseRow(rowOf('students-full', { firstName: 'علی', lastName: 'رضایی', grade: '3', gpa: '19' }), ctx, options)
    assert.equal(first.ops[0].kind, 'create')
    assert.equal(second.ops[0].kind, 'update')
    assert.equal(second.ops[0].record.id, first.ops[0].record.id)
  })

  it('ردیف نامعتبر خطا می‌دهد', () => {
    assert.ok(template.parseRow(rowOf('students-full', { firstName: 'علی', lastName: '', grade: '3' }), emptyCtx(), options).errors.length)
    assert.ok(template.parseRow(rowOf('students-full', { firstName: 'علی', lastName: 'رضایی', grade: '13' }), emptyCtx(), options).errors.length)
  })
})

describe('قالب تخصیص سرویس', () => {
  const template = importTemplate('service-assignments')!
  const driver = { id: 'd1', fullName: 'رضا کریمی', plate: '', seatLayout: { rows: [1, 1] } }
  const other = { id: 's2', firstName: 'سارا', lastName: 'احمدی', grade: 3 }

  function ctx(): ImportContext {
    return emptyCtx({
      plan: { id: 'p', defaultMonthlyFee: 100, months: ['1405-07'] },
      students: new Map([[studentNaturalKey('علی', 'رضایی', 3), student], [studentNaturalKey('سارا', 'احمدی', 3), other]]),
      drivers: new Map([['رضا کریمی', driver]]),
    })
  }

  it('صندلی و ظرفیت بررسی می‌شود و دانش‌آموز وارد سرویس می‌شود', () => {
    const context = ctx()
    const a = template.parseRow(rowOf('service-assignments', { firstName: 'علی', lastName: 'رضایی', grade: '3', driver: 'رضا کریمی', seat: 'جلو' }), context, options)
    assert.deepEqual(a.errors, [])
    assert.deepEqual(a.ops.map((op) => op.table), ['svcAssignments', 'svcStudents'])
    const sameSeat = template.parseRow(rowOf('service-assignments', { firstName: 'سارا', lastName: 'احمدی', grade: '3', driver: 'رضا کریمی', seat: '0-0' }), context, options)
    assert.ok(sameSeat.errors.length)
    const second = template.parseRow(rowOf('service-assignments', { firstName: 'سارا', lastName: 'احمدی', grade: '3', driver: 'رضا کریمی', seat: '1-0' }), context, options)
    assert.deepEqual(second.errors, [])
    const third = template.parseRow(rowOf('service-assignments', { firstName: 'علی', lastName: 'رضایی', grade: '3', driver: 'رضا کریمی' }), context, options)
    assert.deepEqual(third.errors, [])
  })

  it('راننده یا صندلی ناموجود', () => {
    assert.ok(template.parseRow(rowOf('service-assignments', { firstName: 'علی', lastName: 'رضایی', grade: '3', driver: 'ناشناس' }), ctx(), options).errors.length)
    assert.ok(template.parseRow(rowOf('service-assignments', { firstName: 'علی', lastName: 'رضایی', grade: '3', driver: 'رضا کریمی', seat: '5-5' }), ctx(), options).errors.length)
  })
})

describe('قالب پرداخت‌ها', () => {
  const template = importTemplate('service-payments')!
  const plan = { id: 'p', defaultMonthlyFee: 100, months: ['1405-07', '1405-08', '1405-09', '1405-10', '1405-11', '1405-12', '1406-01', '1406-02', '1406-03'] }
  const ctx = (): ImportContext => emptyCtx({ plan, students: new Map([[studentNaturalKey('علی', 'رضایی', 3), student]]) })

  it('نام ماه به کلید ماه طرح تبدیل می‌شود و تاریخ شمسی به میلادی', () => {
    const result = template.parseRow(rowOf('service-payments', { firstName: 'علی', lastName: 'رضایی', grade: '3', month: 'دی', amount: '۱٬۵۰۰٬۰۰۰', paidAt: '1405/07/20', method: 'کارت' }), ctx(), options)
    assert.deepEqual(result.errors, [])
    const record = result.ops[0].record
    assert.equal(record.month, '1405-10')
    assert.equal(record.amount, 1500000)
    assert.equal(record.method, 'card')
    assert.equal(record.paidAt, '2026-10-12')
  })

  it('ماه یا مبلغ نامعتبر', () => {
    assert.ok(template.parseRow(rowOf('service-payments', { firstName: 'علی', lastName: 'رضایی', grade: '3', month: 'نامعتبر', amount: '100' }), ctx(), options).errors.length)
    assert.ok(template.parseRow(rowOf('service-payments', { firstName: 'علی', lastName: 'رضایی', grade: '3', month: 'مهر', amount: '0' }), ctx(), options).errors.length)
  })
})

describe('خواندن فایل و پیش‌نمایش', () => {
  const template = importTemplate('teachers')!

  it('عنوان ستون‌ها با ستاره و (اختیاری) هم شناسایی می‌شود و ستون الزامی گم‌شده گزارش می‌شود', () => {
    const parsed = matrixToRows([['نام و نام خانوادگی *', 'جنسیت (اختیاری)'], ['مریم احمدی', 'خانم'], ['', '']], template)
    assert.equal(parsed.rows.length, 1)
    assert.equal(parsed.rows[0].rowNumber, 2)
    assert.deepEqual(matrixToRows([['چیز دیگر']], template).missingColumns, ['نام و نام خانوادگی'])
  })

  it('پیش‌نمایش: رکوردها شناسه و زمان می‌گیرند و ردیف‌های معیوب شمرده می‌شوند', () => {
    const parsed = matrixToRows([['نام و نام خانوادگی'], ['مریم احمدی'], ['علی کریمی']], template)
    const preview = buildPreview(template, parsed, emptyCtx(), options)
    assert.equal(preview.validRows, 2)
    assert.equal(preview.tableCounts.teachers.create, 2)
    assert.ok(typeof preview.rows[0].outcome.ops[0].record.id === 'string')
    assert.ok(Number(preview.rows[0].outcome.ops[0].record.createdAt) > 0)
  })

  it('هر قالب ستون الزامی و نمونه‌ی هم‌اندازه با ستون‌ها دارد', () => {
    for (const item of IMPORT_TEMPLATES) {
      assert.ok(item.columns.some((column) => column.required), item.id)
      for (const sample of item.sample) assert.equal(sample.length, item.columns.length, item.id)
    }
  })
})
