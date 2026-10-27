import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveRestoreTargets } from '@/backup/backup-restore'
import type { BackupPayload } from '@/backup/backup-snapshot'
import { dependentTables, withDependents } from '@/data-manager/dependencies'

function payload(scope: 'full' | 'partial', names: string[]): BackupPayload {
  return {
    app: 'school-manager',
    formatVersion: 1,
    scope,
    dbName: 'x',
    dbVersion: 14,
    createdAt: '',
    options: { includeLarge: true, maxLargeBytes: 1 },
    stores: Object.fromEntries(names.map((name) => [name, []])),
    localStorage: {},
    skippedAssets: [],
  }
}

describe('بازیابی جزئی', () => {
  const known = new Set(['students', 'teachers', 'attRecords'])

  it('پشتیبان کامل با همه‌ی جدول‌ها = بازیابی کامل (پاک‌سازی همه + تنظیمات)', () => {
    const result = resolveRestoreTargets(payload('full', ['students', 'teachers', 'attRecords']), known)
    assert.equal(result.isWhole, true)
    assert.equal(result.targets.length, 3)
  })

  it('انتخاب بخشی از پشتیبان کامل، بازیابی کامل نیست', () => {
    const result = resolveRestoreTargets(payload('full', ['students', 'teachers']), known, ['students'])
    assert.equal(result.isWhole, false)
    assert.deepEqual(result.targets, ['students'])
  })

  it('پشتیبان جزئی هرگز «کامل» حساب نمی‌شود و جدول ناشناخته کنار می‌رود', () => {
    const result = resolveRestoreTargets(payload('partial', ['students', 'unknownStore']), known)
    assert.equal(result.isWhole, false)
    assert.deepEqual(result.targets, ['students'])
  })
})

describe('جدول‌های وابسته', () => {
  it('وابسته‌های دانش‌آموز و معلم', () => {
    const students = dependentTables('students')
    for (const name of ['attMembers', 'attProfiles', 'attRecords', 'svcStudents', 'svcAssignments', 'svcPayments', 'enrollments']) assert.ok(students.includes(name), name)
    assert.ok(withDependents(['teachers']).includes('attClassrooms'))
    assert.ok(withDependents(['teachers']).includes('attRecords'))
  })

  it('خودش را وابسته‌ی خودش نمی‌کند', () => {
    assert.equal(dependentTables('students').includes('students'), false)
  })
})
