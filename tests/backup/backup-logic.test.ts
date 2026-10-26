import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BackupError } from '@/backup/backup-format'
import { parsePayload, shouldOverwrite } from '@/backup/backup-restore'
import { collectAssets, planAssets } from '@/backup/backup-snapshot'

const dataUrl = (chars: number): string => `data:image/png;base64,${'A'.repeat(chars)}`

describe('تصاویر و فایل‌های بزرگ', () => {
  it('فقط data URL بزرگ‌تر از آستانه دارایی حساب می‌شود، حتی تو در تو', () => {
    const record = { id: 'r1', attachmentDataUrl: dataUrl(5000), small: dataUrl(10), note: 'x', nested: { photo: dataUrl(3000) } }
    const found = collectAssets('transactions', 'r1', record)
    assert.deepEqual(found.map((item) => item.field).sort(), ['attachmentDataUrl', 'nested.photo'])
  })

  it('بدون گزینه‌ی تصاویر هیچ‌کدام وارد نمی‌شود', () => {
    assert.equal(planAssets([3000, 4000], { includeLarge: false, maxLargeBytes: 1e9 }).size, 0)
  })

  it('سقف حجم: کوچک‌ترها اول و بقیه کنار گذاشته می‌شوند', () => {
    const included = planAssets([5000, 2000, 4000, 3000], { includeLarge: true, maxLargeBytes: 7000 })
    assert.deepEqual(Array.from(included).sort(), [1, 3])
  })
})

describe('ادغام', () => {
  it('سیاست‌های تداخل', () => {
    assert.equal(shouldOverwrite('keep-existing', { updatedAt: 1 }, { updatedAt: 9 }), false)
    assert.equal(shouldOverwrite('use-backup', { updatedAt: 9 }, { updatedAt: 1 }), true)
    assert.equal(shouldOverwrite('keep-newer', { updatedAt: 1 }, { updatedAt: 2 }), true)
    assert.equal(shouldOverwrite('keep-newer', { updatedAt: 2 }, { updatedAt: 1 }), false)
    assert.equal(shouldOverwrite('keep-newer', {}, { updatedAt: 1 }), true)
    assert.equal(shouldOverwrite('keep-newer', { updatedAt: 1 }, {}), false)
  })
})

describe('اعتبارسنجی محتوا', () => {
  it('محتوای معتبر و فقط کلیدهای مجاز localStorage', () => {
    const payload = parsePayload(JSON.stringify({
      app: 'school-manager',
      formatVersion: 1,
      dbName: 'x',
      dbVersion: 14,
      createdAt: '2026-10-26T00:00:00Z',
      stores: { students: [{ id: 'a' }] },
      localStorage: { 'school-manager:theme': 'dark', other: 'bad' },
    }))
    assert.deepEqual(Object.keys(payload.localStorage), ['school-manager:theme'])
    assert.equal(payload.stores.students.length, 1)
  })

  it('محتوای نامعتبر رد می‌شود', () => {
    const bad = ['not json', '{"app":"other"}', '{"app":"school-manager","formatVersion":1,"stores":{"a":[1]}}', '{"app":"school-manager","formatVersion":99,"stores":{}}']
    for (const text of bad) assert.throws(() => parsePayload(text), (error: unknown) => error instanceof BackupError)
  })
})
