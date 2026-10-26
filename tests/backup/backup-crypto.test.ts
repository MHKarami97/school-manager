import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decryptBytes, encryptBytes } from '@/backup/backup-crypto'
import { BackupError, HEADER_BYTES, decodeHeader, encodeHeader } from '@/backup/backup-format'

const plain = new TextEncoder().encode(JSON.stringify({ note: 'داده‌ی حساس '.repeat(2000), n: 42 }))
const fast = { iterations: 1000 }

async function rejectsWith(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) => error instanceof BackupError && error.code === code)
}

describe('سرآیند فایل', () => {
  it('رفت‌وبرگشت', () => {
    const header = { version: 1, flags: 1, iterations: 600000, salt: new Uint8Array(16).fill(7), iv: new Uint8Array(12).fill(9) }
    const decoded = decodeHeader(encodeHeader(header))
    assert.equal(decoded.iterations, 600000)
    assert.equal(decoded.flags, 1)
    assert.deepEqual(Array.from(decoded.salt), Array.from(header.salt))
    assert.equal(encodeHeader(header).length, HEADER_BYTES)
  })

  it('فایل غیرپشتیبان رد می‌شود', () => {
    assert.throws(() => decodeHeader(new Uint8Array(100)), (error: unknown) => error instanceof BackupError && error.code === 'NOT_BACKUP')
    assert.throws(() => decodeHeader(new Uint8Array(3)), (error: unknown) => error instanceof BackupError && error.code === 'NOT_BACKUP')
  })
})

describe('رمزگذاری', () => {
  it('رفت‌وبرگشت با و بدون فشرده‌سازی (رمز فارسی)', async () => {
    for (const compress of [true, false]) {
      const file = await encryptBytes(plain, 'رمز-قوی ۱۲۳۴', { compress, ...fast })
      const back = await decryptBytes(file, 'رمز-قوی ۱۲۳۴')
      assert.equal(new TextDecoder().decode(back), new TextDecoder().decode(plain))
    }
  })

  it('متن ساده در فایل دیده نمی‌شود', async () => {
    const file = await encryptBytes(plain, 'password-123', { compress: false, ...fast })
    assert.equal(Buffer.from(file).includes(Buffer.from('داده‌ی حساس')), false)
  })

  it('رمز اشتباه', async () => {
    const file = await encryptBytes(plain, 'password-123', { compress: true, ...fast })
    await rejectsWith(decryptBytes(file, 'password-124'), 'WRONG_PASSWORD')
  })

  it('دستکاری سرآیند یا محتوا شناسایی می‌شود', async () => {
    const file = await encryptBytes(plain, 'password-123', { compress: true, ...fast })
    const header = file.slice()
    header[7] ^= 1
    await rejectsWith(decryptBytes(header, 'password-123'), 'WRONG_PASSWORD')
    const body = file.slice()
    body[body.length - 2] ^= 1
    await rejectsWith(decryptBytes(body, 'password-123'), 'WRONG_PASSWORD')
  })

  it('رمز کوتاه رد می‌شود', async () => {
    await rejectsWith(encryptBytes(plain, 'short', { compress: false, ...fast }), 'BAD_PASSWORD')
  })

  it('هر بار salt و iv متفاوت است', async () => {
    const a = await encryptBytes(plain, 'password-123', { compress: false, ...fast })
    const b = await encryptBytes(plain, 'password-123', { compress: false, ...fast })
    assert.notDeepEqual(Array.from(a.slice(10, 38)), Array.from(b.slice(10, 38)))
  })
})
