import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildFeeTable, monthKeyLabel } from '@/utils/service-fees-export'

describe('خروجی هزینه‌ی سرویس', () => {
  it('برچسب ماه شمسی', () => {
    assert.equal(monthKeyLabel('1405-07'), 'مهر 1405')
    assert.equal(monthKeyLabel('1406-03', false), 'خرداد')
  })

  it('جدول: سرستون، ستون هر ماه، جمع و مانده', () => {
    const table = buildFeeTable(['1405-07', '1405-08'], [
      { name: 'علی رضایی', grade: 'سوم', driver: 'رضا', monthlyFee: 1000, monthPaid: [1000, 400], totalPaid: 1400, balance: 600 },
    ])
    assert.equal(table.length, 2)
    assert.equal(table[0].length, 8)
    assert.deepEqual(table[1], ['علی رضایی', 'سوم', 'رضا', 1000, 1000, 400, 1400, 600])
    assert.equal(table[0][4], 'مهر 1405')
  })
})
