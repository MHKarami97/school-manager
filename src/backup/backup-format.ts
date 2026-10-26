export const BACKUP_APP_ID = 'school-manager'
export const BACKUP_FORMAT_VERSION = 1
export const BACKUP_FILE_EXTENSION = 'smbackup'
export const BACKUP_MAGIC = [0x53, 0x4d, 0x42, 0x4b] // "SMBK"

export const FLAG_GZIP = 1
export const SALT_BYTES = 16
export const IV_BYTES = 12
export const HEADER_BYTES = 4 + 1 + 1 + 4 + SALT_BYTES + IV_BYTES

/** OWASP: PBKDF2-HMAC-SHA256 با ۶۰۰٬۰۰۰ تکرار. */
export const PBKDF2_ITERATIONS = 600_000
export const MIN_ITERATIONS = 1_000
export const MAX_ITERATIONS = 5_000_000
export const MIN_PASSWORD_LENGTH = 8

export type BackupErrorCode =
  | 'NO_CRYPTO'
  | 'NOT_BACKUP'
  | 'UNSUPPORTED_VERSION'
  | 'CORRUPT'
  | 'WRONG_PASSWORD'
  | 'NO_DECOMPRESSION'
  | 'NEWER_BACKUP'
  | 'RESTORE_FAILED'
  | 'BAD_PASSWORD'

export class BackupError extends Error {
  readonly code: BackupErrorCode

  constructor(code: BackupErrorCode, message: string) {
    super(message)
    this.name = 'BackupError'
    this.code = code
  }
}

export interface BackupHeader {
  version: number
  flags: number
  iterations: number
  salt: Uint8Array
  iv: Uint8Array
}

export function encodeHeader(header: BackupHeader): Uint8Array {
  const bytes = new Uint8Array(HEADER_BYTES)
  bytes.set(BACKUP_MAGIC, 0)
  bytes[4] = header.version
  bytes[5] = header.flags
  new DataView(bytes.buffer).setUint32(6, header.iterations, false)
  bytes.set(header.salt, 10)
  bytes.set(header.iv, 10 + SALT_BYTES)
  return bytes
}

export function decodeHeader(bytes: Uint8Array): BackupHeader {
  if (bytes.length < HEADER_BYTES) throw new BackupError('NOT_BACKUP', 'این فایل، پشتیبان این برنامه نیست.')
  for (let index = 0; index < BACKUP_MAGIC.length; index += 1) {
    if (bytes[index] !== BACKUP_MAGIC[index]) throw new BackupError('NOT_BACKUP', 'این فایل، پشتیبان این برنامه نیست.')
  }
  const version = bytes[4]
  if (version > BACKUP_FORMAT_VERSION) {
    throw new BackupError('UNSUPPORTED_VERSION', 'این پشتیبان با نسخه‌ی جدیدتری از برنامه ساخته شده است؛ برنامه را به‌روزرسانی کنید.')
  }
  const iterations = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(6, false)
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new BackupError('CORRUPT', 'سرآیند فایل پشتیبان معتبر نیست.')
  }
  return {
    version,
    flags: bytes[5],
    iterations,
    salt: bytes.slice(10, 10 + SALT_BYTES),
    iv: bytes.slice(10 + SALT_BYTES, HEADER_BYTES),
  }
}

export function backupFileName(date: Date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `school-backup-${stamp}.${BACKUP_FILE_EXTENSION}`
}
