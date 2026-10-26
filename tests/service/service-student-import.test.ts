import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseServiceBulkText, parseServiceMatrix } from '@/utils/service-student-import'

describe('ورود گروهی متنی دانش‌آموز سرویس', () => {
  it('آدرس به‌صورت کلید:مقدار و شماره‌ها خوانده می‌شوند', () => {
    const text = 'علی, رضایی, 09123456789, منطقه: 5, خیابان: طالقانی, پلاک: 12, ساعت: 7:15, لوکیشن: 35.8327,51.0123'
    const { rows, invalidLines } = parseServiceBulkText(text, 'male', true)
    assert.equal(invalidLines, 0)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].primaryPhone, '09123456789')
    assert.equal(rows[0].address.region, '5')
    assert.equal(rows[0].address.street, 'طالقانی')
    assert.equal(rows[0].pickupTime, '07:15')
  })

  it('آدرس اختیاری است و خط بدون نام نامعتبر شمرده می‌شود', () => {
    const { rows, invalidLines } = parseServiceBulkText('سارا, احمدی\nتک', 'female', true)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].address.city, '')
    assert.equal(rows[0].location, null)
    assert.equal(rows[0].gender, 'female')
    assert.equal(invalidLines, 1)
  })
})

describe('ورود از فایل اکسل دانش‌آموز سرویس', () => {
  it('ستون‌های آدرس از روی عنوان خوانده می‌شوند', () => {
    const matrix = [
      ['نام', 'نام‌خانوادگی', 'شماره‌ی والدین', 'منطقه (اختیاری)', 'خیابان (اختیاری)', 'ساعت سوار شدن', 'مختصات یا لینک نقشه'],
      ['علی', 'رضایی', 9123456789, '5', 'طالقانی', '7:30', 'https://maps.example/@35.8,51.0,15z'],
      ['', 'بدون نام', '', '', '', '', ''],
    ]
    const { rows } = parseServiceMatrix(matrix, { defaultGender: 'male', sameGenderForAll: true })
    assert.equal(rows.length, 1)
    assert.equal(rows[0].primaryPhone, '09123456789')
    assert.equal(rows[0].address.region, '5')
    assert.equal(rows[0].address.street, 'طالقانی')
    assert.equal(rows[0].pickupTime, '07:30')
    assert.deepEqual(rows[0].location, { lat: 35.8, lng: 51 })
  })
})
