import {
  BackupError,
  FLAG_GZIP,
  HEADER_BYTES,
  IV_BYTES,
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_BYTES,
  BACKUP_FORMAT_VERSION,
  decodeHeader,
  encodeHeader,
} from './backup-format'

export interface EncryptOptions {
  compress: boolean
  iterations?: number
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new BackupError('NO_CRYPTO', 'رمزگذاری فقط در اتصال امن (HTTPS) و مرورگرهای جدید در دسترس است.')
  }
  return subtle
}

export function isCompressionSupported(): boolean {
  return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'
}

async function pipeThrough(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const response = new Response(new Blob([toBuffer(data)]).stream().pipeThrough(stream))
  return new Uint8Array(await response.arrayBuffer())
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const subtle = getSubtle()
  const material = await subtle.importKey('raw', toBuffer(new TextEncoder().encode(password.normalize('NFKC'))), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toBuffer(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `رمز باید حداقل ${MIN_PASSWORD_LENGTH} نویسه باشد.`
  return null
}

export async function encryptBytes(plain: Uint8Array, password: string, options: EncryptOptions): Promise<Uint8Array> {
  const problem = validatePassword(password)
  if (problem) throw new BackupError('BAD_PASSWORD', problem)
  const compress = options.compress && isCompressionSupported()
  const iterations = options.iterations ?? PBKDF2_ITERATIONS
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const header = encodeHeader({ version: BACKUP_FORMAT_VERSION, flags: compress ? FLAG_GZIP : 0, iterations, salt, iv })
  const data = compress ? await pipeThrough(plain, new CompressionStream('gzip')) : plain
  const key = await deriveKey(password, salt, iterations)
  const cipher = new Uint8Array(
    await getSubtle().encrypt({ name: 'AES-GCM', iv: toBuffer(iv), additionalData: toBuffer(header) }, key, toBuffer(data)),
  )
  const output = new Uint8Array(header.length + cipher.length)
  output.set(header, 0)
  output.set(cipher, header.length)
  return output
}

export async function decryptBytes(file: Uint8Array, password: string): Promise<Uint8Array> {
  const header = decodeHeader(file)
  const headerBytes = file.slice(0, HEADER_BYTES)
  const key = await deriveKey(password, header.salt, header.iterations)
  let plain: Uint8Array
  try {
    plain = new Uint8Array(
      await getSubtle().decrypt({ name: 'AES-GCM', iv: toBuffer(header.iv), additionalData: toBuffer(headerBytes) }, key, toBuffer(file.slice(HEADER_BYTES))),
    )
  } catch {
    throw new BackupError('WRONG_PASSWORD', 'رمز اشتباه است یا فایل پشتیبان آسیب دیده است.')
  }
  if (header.flags & FLAG_GZIP) {
    if (!isCompressionSupported()) {
      throw new BackupError('NO_DECOMPRESSION', 'این مرورگر از باز کردن فایل فشرده پشتیبانی نمی‌کند؛ مرورگر را به‌روزرسانی کنید.')
    }
    try {
      return await pipeThrough(plain, new DecompressionStream('gzip'))
    } catch {
      throw new BackupError('CORRUPT', 'محتوای فایل پشتیبان آسیب دیده است.')
    }
  }
  return plain
}
