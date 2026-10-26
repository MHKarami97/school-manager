import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AssignDriver, AssignStudent } from '@/utils/service-assign'
import { autoAssign } from '@/utils/service-assign'

function student(id: string, region: string, overrides: Partial<AssignStudent> = {}): AssignStudent {
  return { id, grade: 3, gender: 'male', region, location: null, ...overrides }
}

function driver(id: string, overrides: Partial<AssignDriver> = {}): AssignDriver {
  return { id, gender: 'male', freeSeats: 4, coverageRegions: [], baseLocation: null, existing: [], ...overrides }
}

const base = { mode: 'smart' as const, preferSameGender: false }

describe('تخصیص خودکار', () => {
  it('هم‌منطقه‌ای‌ها در یک ماشین می‌افتند', () => {
    const students = [student('s1', '5'), student('s2', '5'), student('s3', '5'), student('s4', '7'), student('s5', '7')]
    const result = autoAssign(students, [driver('d1'), driver('d2')], base)
    const byStudent = new Map(result.placements.map((item) => [item.studentId, item.driverId]))
    assert.equal(new Set(['s1', 's2', 's3'].map((id) => byStudent.get(id))).size, 1)
    assert.equal(new Set(['s4', 's5'].map((id) => byStudent.get(id))).size, 1)
    assert.notEqual(byStudent.get('s1'), byStudent.get('s4'))
    assert.equal(result.unassigned.length, 0)
  })

  it('از ظرفیت رد نمی‌شود و بقیه را بدون تخصیص گزارش می‌دهد', () => {
    const result = autoAssign([student('a', '1'), student('b', '1'), student('c', '1')], [driver('d1', { freeSeats: 2 })], base)
    assert.equal(result.placements.length, 2)
    assert.deepEqual(result.unassigned, ['c'])
    assert.equal(result.notes.length > 0, true)
  })

  it('منطقه‌ی تحت پوشش راننده اولویت دارد', () => {
    const result = autoAssign([student('s1', '5')], [driver('a'), driver('b', { coverageRegions: ['5'] })], base)
    assert.equal(result.placements[0].driverId, 'b')
  })

  it('حالت نقشه: نزدیک‌ها با هم، حتی بدون منطقه', () => {
    const students = [
      student('a1', '', { location: { lat: 35.83, lng: 50.99 } }),
      student('a2', '', { location: { lat: 35.84, lng: 51.0 } }),
      student('b1', '', { location: { lat: 35.7, lng: 51.4 } }),
      student('b2', '', { location: { lat: 35.71, lng: 51.41 } }),
    ]
    const result = autoAssign(students, [driver('d1', { freeSeats: 2 }), driver('d2', { freeSeats: 2 })], {
      mode: 'location',
      preferSameGender: false,
    })
    const byStudent = new Map(result.placements.map((item) => [item.studentId, item.driverId]))
    assert.equal(byStudent.get('a1'), byStudent.get('a2'))
    assert.equal(byStudent.get('b1'), byStudent.get('b2'))
    assert.notEqual(byStudent.get('a1'), byStudent.get('b1'))
  })

  it('ترجیح هم‌جنسیتی راننده (اختیاری)', () => {
    const girls = [student('g1', '1', { gender: 'female' }), student('g2', '1', { gender: 'female' })]
    const drivers = [driver('a', { gender: 'male' }), driver('b', { gender: 'female' })]
    assert.equal(autoAssign(girls, drivers, { mode: 'smart', preferSameGender: true }).placements[0].driverId, 'b')
    assert.equal(autoAssign(girls, drivers, { mode: 'smart', preferSameGender: false }).placements[0].driverId, 'a')
  })

  it('به صندلی‌های خالی باقی‌مانده‌ی راننده‌ی قبلی هم‌منطقه اولویت می‌دهد', () => {
    const drivers = [driver('a'), driver('b', { freeSeats: 2, existing: [{ region: '9', location: null }] })]
    const result = autoAssign([student('s1', '9')], drivers, base)
    assert.equal(result.placements[0].driverId, 'b')
  })
})
