import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { planCascade } from '@/data-manager/cascade'
import { applyFormValues, parseNumberList, toFormValues, validateRecord } from '@/data-manager/record-form'
import { getPath, setPath } from '@/data-manager/record-path'
import { TABLES, tableDef } from '@/data-manager/table-registry'

describe('مسیر فیلد', () => {
  it('خواندن و نوشتن مسیر تو در تو', () => {
    const record: Record<string, unknown> = {}
    setPath(record, 'address.city', 'کرج')
    assert.equal(getPath(record, 'address.city'), 'کرج')
    assert.equal(getPath(record, 'address.street'), undefined)
  })
})

describe('فرم رکورد', () => {
  const students = tableDef('students')

  it('ساخت دانش‌آموز: سطح تحصیلی از پایه می‌آید و ارقام فارسی خوانده می‌شود', () => {
    const base = students.create()
    const { record, errors } = applyFormValues(students, base, { firstName: 'علی', lastName: 'رضایی', grade: '۸', gender: 'male' }, 'create')
    assert.deepEqual(errors, [])
    assert.equal(record.grade, 8)
    assert.equal(record.levelId, 'lower_secondary')
    assert.deepEqual(validateRecord(students, record), [])
  })

  it('فیلد الزامی خالی و عدد نامعتبر', () => {
    const { record, errors } = applyFormValues(students, students.create(), { firstName: '', lastName: 'x', grade: 'abc' }, 'create')
    assert.equal(errors.length, 1)
    assert.ok(validateRecord(students, record).some((message) => message.includes('نام')))
  })

  it('بخش‌های کلید در ویرایش تغییر نمی‌کنند', () => {
    const table = tableDef('attMembers')
    const base = { id: 'c|s', classroomId: 'c', studentId: 's', createdAt: 1 }
    const { record } = applyFormValues(table, base, { classroomId: 'other', studentId: 'other' }, 'update')
    assert.equal(record.classroomId, 'c')
  })

  it('شیء اختیاری خالی حذف می‌شود (شماره‌ی دوم والدین)', () => {
    const table = tableDef('attProfiles')
    const base = table.create()
    base.studentId = 's1'
    const { record } = applyFormValues(table, base, { 'primaryParent.phone': '09123456789', 'secondaryParent.phone': '', 'secondaryParent.relation': '' }, 'create')
    assert.equal('secondaryParent' in record, false)
    assert.equal(getPath(record, 'primaryParent.phone'), '09123456789')
  })

  it('رفت‌وبرگشت فهرست عددی', () => {
    const table = tableDef('svcDrivers')
    const values = toFormValues(table.fields ?? [], table.create())
    assert.equal(values['seatLayout.rows'], '1، 3')
    assert.deepEqual(parseNumberList('1, ۳').values, [1, 3])
    assert.deepEqual(parseNumberList('1, x').invalid, ['x'])
  })
})

describe('حذف آبشاری', () => {
  it('حذف دانش‌آموز، وابسته‌ها را حذف و گروه‌ها را اصلاح می‌کند', () => {
    const relations = tableDef('students').relations
    const plan = planCascade(relations, new Set(['s1']), {
      attMembers: { keyPath: 'id', records: [{ id: 'c|s1', studentId: 's1' }, { id: 'c|s2', studentId: 's2' }] },
      svcStudents: { keyPath: 'studentId', records: [{ studentId: 's1' }] },
      studentGroups: { keyPath: 'id', records: [{ id: 'g', studentIds: ['s1', 's2'] }, { id: 'g2', studentIds: ['s2'] }] },
    })
    assert.deepEqual(plan.deletes.map((item) => `${item.table}:${item.key}`).sort(), ['attMembers:c|s1', 'svcStudents:s1'])
    assert.equal(plan.updates.length, 1)
    assert.deepEqual(plan.updates[0].record.studentIds, ['s2'])
  })

  it('حذف معلم، ارجاع‌ها را خالی می‌کند و چیزی حذف نمی‌کند', () => {
    const plan = planCascade(tableDef('teachers').relations, new Set(['t1']), {
      attClassrooms: { keyPath: 'id', records: [{ id: 'c', teacherId: 't1' }] },
    })
    assert.equal(plan.deletes.length, 0)
    assert.equal(plan.updates[0].record.teacherId, null)
  })
})

describe('رجیستری', () => {
  it('نام جدول‌ها یکتاست و هر فیلد ref به جدولی اشاره می‌کند که در رجیستری هست', () => {
    const names = new Set(TABLES.map((table) => table.name))
    assert.equal(names.size, TABLES.length)
    for (const table of TABLES) {
      for (const field of table.fields ?? []) if (field.type === 'ref') assert.ok(field.ref && names.has(field.ref), `${table.name}.${field.key}`)
      for (const relation of table.relations) assert.ok(names.has(relation.child), `${table.name} → ${relation.child}`)
    }
  })

  it('جدول ناشناخته به‌صورت JSON قابل مدیریت است', () => {
    assert.equal(tableDef('futureStore').fields, null)
  })
})
