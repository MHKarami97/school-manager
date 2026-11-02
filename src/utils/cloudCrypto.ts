export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function hexToBuffer(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex
  const length = clean.length / 2
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length)
  globalThis.crypto.getRandomValues(array)
  return array
}

export function newSaltHex(length = 16): string {
  return bufferToHex(getRandomBytes(length))
}

export async function hashSha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  return bufferToHex(hashBuffer)
}

export async function deriveKey(passphrase: string, saltHex: string, iterations: number): Promise<CryptoKey> {
  const subtle = globalThis.crypto.subtle
  const salt = hexToBuffer(saltHex)
  const passwordBuffer = new TextEncoder().encode(passphrase.normalize('NFKC'))
  const keyMaterial = await subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptWithKey(plainText: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = getRandomBytes(12)
  const data = new TextEncoder().encode(plainText)
  const cipher = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    key,
    data
  )
  return { ciphertext: bufferToHex(cipher), iv: bufferToHex(iv) }
}

export async function decryptWithKey(ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  const iv = hexToBuffer(ivHex)
  const cipher = hexToBuffer(ciphertextHex)
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    key,
    cipher.buffer.slice(cipher.byteOffset, cipher.byteOffset + cipher.byteLength) as ArrayBuffer
  )
  return new TextDecoder().decode(plain)
}

// Deterministic JSON (sorted keys) so equal data always yields an equal hash across devices.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return '[' + value.map((item) => stableStringify(item)).join(',') + ']'
  const record = value as Record<string, unknown>
  const parts: string[] = []
  for (const key of Object.keys(record).sort()) {
    if (record[key] === undefined) continue
    parts.push(JSON.stringify(key) + ':' + stableStringify(record[key]))
  }
  return '{' + parts.join(',') + '}'
}
