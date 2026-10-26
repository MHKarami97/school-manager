import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ServiceAssignment, ServicePayment } from '@/types'
import {
  absentRidersByDriver,
  capacityOf,
  defaultLayoutFor,
  defaultPlanMonths,
  feeSummary,
  formatAddress,
  emptyAddress,
  isFrontSeatWarning,
  normalizeRegion,
  parseLocationInput,
  seatsOf,
  suggestSeats,
  validateLayout,
} from '@/utils/service-domain'

function assignment(studentId: string, driverId: string): ServiceAssignment {
  return { id: `p|${studentId}`, planId: 'p', studentId, driverId, seatId: null, status: 'draft', monthlyFee: 0, createdAt: 1, updatedAt: 1 }
}

describe('ظرفیت و صندلی‌ها', () => {
  it('سواری پیش‌فرض ۴ صندلی دانش‌آموزی دارد: ۱ جلو + ۳ عقب', () => {
    const layout = defaultLayoutFor('sedan')
    assert.equal(capacityOf(layout), 4)
    const seats = seatsOf(layout)
    assert.equal(seats.filter((seat) => seat.isFront).length, 1)
    assert.equal(seats.filter((seat) => !seat.isFront).length, 3)
    assert.equal(seats[0].id, '0-0')
  })

  it('اعتبارسنجی چیدمان', () => {
    assert.equal(validateLayout({ rows: [1, 3] }), null)
    assert.notEqual(validateLayout({ rows: [] }), null)
    assert.notEqual(validateLayout({ rows: [0, 3] }), null)
    assert.notEqual(validateLayout({ rows: [7] }), null)
  })

  it('هشدار زرد فقط برای پایه‌ی پایین روی صندلی جلو', () => {
    assert.equal(isFrontSeatWarning('0-0', 3), true)
    assert.equal(isFrontSeatWarning('0-0', 8), false)
    assert.equal(isFrontSeatWarning('1-0', 3), false)
    assert.equal(isFrontSeatWarning(null, 3), false)
  })

  it('پیشنهاد صندلی: بزرگ‌تر جلو، کوچک‌ترها عقب', () => {
    const layout = defaultLayoutFor('sedan')
    const result = suggestSeats(layout, new Set(), [
      { studentId: 'a', grade: 2 },
      { studentId: 'b', grade: 8 },
      { studentId: 'c', grade: 3 },
    ])
    assert.equal(result.get('b'), '0-0')
    assert.equal(result.get('a')?.startsWith('1-'), true)
    assert.equal(result.get('c')?.startsWith('1-'), true)
  })

  it('اگر همه کوچک باشند و عقب پر شود، نفر چهارم ناچار جلو می‌نشیند', () => {
    const layout = defaultLayoutFor('sedan')
    const result = suggestSeats(layout, new Set(), [1, 2, 3, 4].map((grade) => ({ studentId: `s${grade}`, grade })))
    assert.equal(Array.from(result.values()).filter((seat) => seat.startsWith('0-')).length, 1)
  })
})

describe('منطقه و موقعیت', () => {
  it('منطقه یکسان‌سازی می‌شود', () => {
    assert.equal(normalizeRegion('منطقه ۵'), normalizeRegion('منطقه5'))
    assert.equal(normalizeRegion(' 5 '), '5')
  })

  it('مختصات از متن و لینک نقشه خوانده می‌شود', () => {
    assert.deepEqual(parseLocationInput('35.8327, 51.0123'), { lat: 35.8327, lng: 51.0123 })
    assert.deepEqual(parseLocationInput('https://www.google.com/maps/@35.8327,51.0123,17z'), { lat: 35.8327, lng: 51.0123 })
    assert.deepEqual(parseLocationInput('https://x.ir/?lat=35.8&lng=51.0'), { lat: 35.8, lng: 51 })
    assert.equal(parseLocationInput('بدون مختصات'), null)
    assert.equal(parseLocationInput('95.1, 10.2'), null)
  })

  it('آدرس اختیاری فقط بخش‌های پرشده را می‌نویسد', () => {
    const address = { ...emptyAddress(), city: 'کرج', street: 'طالقانی', plaque: '12' }
    assert.equal(formatAddress(address), 'کرج، طالقانی، پلاک 12')
    assert.equal(formatAddress(emptyAddress()), '')
  })
})

describe('هزینه و پرداخت', () => {
  it('ماه‌های پیش‌فرض مهر تا خرداد ۹ ماه است', () => {
    const months = defaultPlanMonths(1405)
    assert.equal(months.length, 9)
    assert.equal(months[0], '1405-07')
    assert.equal(months[8], '1406-03')
  })

  it('وضعیت پرداخت هر ماه و مانده', () => {
    const months = ['1405-07', '1405-08', '1405-09']
    const payments = [
      { id: '1', planId: 'p', studentId: 's', month: '1405-07', amount: 1000, paidAt: '2026-09-23', method: 'cash', note: '', createdAt: 1 },
      { id: '2', planId: 'p', studentId: 's', month: '1405-08', amount: 400, paidAt: '2026-10-23', method: 'card', note: '', createdAt: 2 },
    ] as ServicePayment[]
    const summary = feeSummary(1000, months, payments)
    assert.deepEqual(summary.months.map((item) => item.state), ['paid', 'partial', 'unpaid'])
    assert.equal(summary.totalDue, 3000)
    assert.equal(summary.totalPaid, 1400)
    assert.equal(summary.balance, 1600)
  })
})

describe('غایبین هر راننده', () => {
  it('فقط دانش‌آموزان غایبِ هر راننده گروه‌بندی می‌شوند', () => {
    const list = [assignment('s1', 'd1'), assignment('s2', 'd1'), assignment('s3', 'd2')]
    const result = absentRidersByDriver(list, new Set(['s2', 's3', 'x']))
    assert.deepEqual(result.get('d1')?.map((item) => item.studentId), ['s2'])
    assert.deepEqual(result.get('d2')?.map((item) => item.studentId), ['s3'])
    assert.equal(result.size, 2)
  })
})
