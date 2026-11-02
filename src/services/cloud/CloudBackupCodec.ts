import type { BackupPayload } from '@/backup/backup-snapshot'
import type { BackupFingerprint } from '@/types/cloud-sync'
import type { BackupService } from '@/backup/backup-service'
import { hashSha256, decryptWithKey, deriveKey, encryptWithKey, stableStringify } from '@/utils/cloudCrypto'
import { CLOUD_CONFIG } from '@/config/cloudConfig'
import { CloudSyncError } from './CloudSyncError'
import type { CloudKeyVault } from './CloudKeyVault'

export interface LocalSnapshot {
  payload: BackupPayload
  fingerprint: BackupFingerprint
}

export interface EncryptedCloudBackupContainer {
  format: 'school-manager-encrypted-backup'
  version: '1.0'
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
  checksum: string
  meta: {
    createdAt: string
    approxRecordsCount: number
    contentHash: string
    source: 'cloud'
  }
}

export class CloudBackupCodec {
  constructor(
    private readonly backup: BackupService,
    private readonly vault: CloudKeyVault
  ) {}

  async snapshotLocal(): Promise<LocalSnapshot> {
    const payload = await this.backup.buildPayload()
    return { payload, fingerprint: await this.fingerprintOf(payload) }
  }

  async fingerprintOf(payload: BackupPayload): Promise<BackupFingerprint> {
    let recordsCount = 0
    const normalizedStores: Record<string, unknown[]> = {}
    for (const storeName of Object.keys(payload.stores ?? {}).sort()) {
      const records = payload.stores[storeName] ?? []
      recordsCount += records.length
      normalizedStores[storeName] = [...records].sort((a, b) => {
        const idA = String(a.id ?? '')
        const idB = String(b.id ?? '')
        return idA < idB ? -1 : idA > idB ? 1 : 0
      })
    }
    const contentHash = await hashSha256(
      stableStringify({
        stores: normalizedStores,
        localStorage: payload.localStorage ?? {},
      })
    )
    return { contentHash, recordsCount }
  }

  async serialize(snapshot: LocalSnapshot, encrypt: boolean): Promise<string> {
    const json = JSON.stringify(snapshot.payload)
    if (!encrypt) return json

    const record = await this.vault.getKey()
    if (!record) {
      throw new CloudSyncError('KEY_MISSING', 'کلید رمزنگاری روی این دستگاه موجود نیست؛ رمزنگاری را دوباره فعال کنید.')
    }

    const encrypted = await encryptWithKey(json, record.key)
    const container: EncryptedCloudBackupContainer = {
      format: 'school-manager-encrypted-backup',
      version: '1.0',
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations: record.iterations,
      salt: record.saltHex,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      checksum: await hashSha256(json),
      meta: {
        createdAt: snapshot.payload.createdAt,
        approxRecordsCount: snapshot.fingerprint.recordsCount,
        contentHash: snapshot.fingerprint.contentHash,
        source: 'cloud',
      },
    }
    return JSON.stringify(container)
  }

  async open(content: string, passphrase?: string): Promise<BackupPayload> {
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new CloudSyncError('INVALID_BACKUP', 'فایل پشتیبان ابری آسیب دیده است.')
    }

    if (parsed.format !== 'school-manager-encrypted-backup') {
      if (parsed.stores && typeof parsed.stores === 'object') return parsed as BackupPayload
      throw new CloudSyncError('INVALID_BACKUP', 'فرمت فایل پشتیبان ابری معتبر نیست.')
    }

    const container = parsed as EncryptedCloudBackupContainer
    const json = await this.decrypt(container, passphrase)
    if ((await hashSha256(json)) !== container.checksum) {
      throw new CloudSyncError('INVALID_BACKUP', 'یکپارچگی فایل پشتیبان ابری تأیید نشد.')
    }
    return JSON.parse(json) as BackupPayload
  }

  private async decrypt(container: EncryptedCloudBackupContainer, passphrase?: string): Promise<string> {
    if (!passphrase) {
      const record = await this.vault.getKey()
      const matches = !!record && record.saltHex === container.salt && record.iterations === container.iterations
      if (!record || !matches) {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
      try {
        return await decryptWithKey(container.ciphertext, container.iv, record.key)
      } catch {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
    }

    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور وارد شده کوتاه‌تر از حد مجاز است.')
    }

    const key = await deriveKey(passphrase, container.salt, container.iterations)
    try {
      const json = await decryptWithKey(container.ciphertext, container.iv, key)
      await this.vault.saveKey(key, container.salt, container.iterations)
      return json
    } catch {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.')
    }
  }
}
