import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ServiceAssignment, ServiceDriver } from '@/types'
import { absenteeMessage, buildSheetPayload, seatLabelOf } from '@/utils/service-print'

const driver = {
  id: 'd1',
  fullName: 'رضا کریمی',
  gender: 'male',
  phone: '09120000000',
  vehicleKind: 'sedan',
  vehicleModel: 'پژو ۴۰۵',
  vehicleYear: null,
  vehicleColor: 'سفید',
  plate: '۱۲ ب ۳۴۵',
  seatLayout: { rows: [1, 3] },
  coverageRegions: [],
  baseLocation: null,
  note: '',
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
} as ServiceDriver

function assignment(studentId: string, seatId: string | null): ServiceAssignment {
  return { id: `p|${studentId}`, planId: 'p', studentId, driverId: 'd1', seatId, status: 'draft', monthlyFee: 0, createdAt: 1, updatedAt: 1 }
}

const sources = {
  nameOf: (id: string) => `نام ${id}`,
  gradeOf: () => 'سوم',
  phonesOf: () => '09123456789',
  addressOf: () => '',
  pickupOf: () => '07:15',
}

describe('چاپ و پیام سرویس', () => {
  it('برچسب صندلی', () => {
    assert.equal(seatLabelOf('0-0'), 'جلو 1')
    assert.equal(seatLabelOf('1-2'), 'ردیف 2، صندلی 3')
    assert.equal(seatLabelOf(null), 'بدون صندلی')
  })

  it('فهرست راننده بر اساس صندلی مرتب می‌شود و بدون صندلی آخر می‌آید', () => {
    const payload = buildSheetPayload('roster', 't', 's', [driver], [assignment('c', null), assignment('b', '1-0'), assignment('a', '0-0')], sources)
    assert.deepEqual(payload.sections[0].rows.map((row) => row.name), ['نام a', 'نام b', 'نام c'])
  })

  it('حالت غایبین فقط غایب‌ها را می‌آورد و راننده‌ی بدون غایب حذف می‌شود', () => {
    const list = [assignment('a', '0-0'), assignment('b', '1-0')]
    const payload = buildSheetPayload('absentees', 't', 's', [driver], list, sources, new Set(['b']))
    assert.equal(payload.sections.length, 1)
    assert.equal(payload.sections[0].rows.length, 1)
    assert.equal(buildSheetPayload('absentees', 't', 's', [driver], list, sources, new Set()).sections.length, 0)
  })

  it('متن پیام غایبین', () => {
    assert.equal(absenteeMessage(driver, ['علی', 'سارا'], 'شنبه ۳ آبان'), 'غایبین شنبه ۳ آبان - رضا کریمی\n1. علی\n2. سارا')
  })
})
