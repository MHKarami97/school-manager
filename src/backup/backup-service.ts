import { BackupError, backupFileName } from './backup-format'
import { decryptBytes, encryptBytes, isCompressionSupported } from './backup-crypto'
import {
  applyRestore,
  buildPreview,
  parsePayload,
  type RestoreOptions,
  type RestorePreview,
  type RestoreResult,
} from './backup-restore'
import { createPayload, scanDatabase, type BackupOptions, type BackupPayload, type ScanResult } from './backup-snapshot'

export type BackupPhase = 'reading' | 'serializing' | 'encrypting' | 'decrypting' | 'parsing' | 'restoring'

export interface BackupSummary {
  fileName: string
  bytes: number
  records: number
  skippedAssets: number
  compressed: boolean
}

export interface LoadedBackup {
  payload: BackupPayload
  preview: RestorePreview
}

type ProgressHandler = (phase: BackupPhase) => void

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export class BackupService {
  scan(): Promise<ScanResult> {
    return scanDatabase()
  }

  async createBackup(options: BackupOptions, password: string, onProgress: ProgressHandler = () => undefined): Promise<BackupSummary> {
    onProgress('reading')
    const payload = await createPayload(options)
    onProgress('serializing')
    const plain = new TextEncoder().encode(JSON.stringify(payload))
    onProgress('encrypting')
    const compress = isCompressionSupported()
    const encrypted = await encryptBytes(plain, password, { compress })
    const fileName = backupFileName()
    triggerDownload(new Blob([encrypted.buffer.slice(encrypted.byteOffset, encrypted.byteOffset + encrypted.byteLength) as ArrayBuffer], { type: 'application/octet-stream' }), fileName)
    const records = Object.values(payload.stores).reduce((sum, list) => sum + list.length, 0)
    return {
      fileName,
      bytes: encrypted.length,
      records,
      skippedAssets: payload.skippedAssets.length,
      compressed: compress,
    }
  }

  async loadBackup(file: File, password: string, onProgress: ProgressHandler = () => undefined): Promise<LoadedBackup> {
    onProgress('decrypting')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const plain = await decryptBytes(bytes, password)
    onProgress('parsing')
    const payload = parsePayload(new TextDecoder().decode(plain))
    const preview = await buildPreview(payload)
    return { payload, preview }
  }

  async restore(
    loaded: LoadedBackup,
    options: RestoreOptions,
    safety: { backupCurrentFirst: boolean; password: string },
    onProgress: ProgressHandler = () => undefined,
  ): Promise<RestoreResult> {
    if (options.mode === 'replace' && safety.backupCurrentFirst) {
      if (!safety.password) throw new BackupError('BAD_PASSWORD', 'برای نسخه‌ی ایمنی، رمز لازم است.')
      await this.createBackup({ includeLarge: true, maxLargeBytes: Number.MAX_SAFE_INTEGER }, safety.password, onProgress)
    }
    onProgress('restoring')
    return applyRestore(loaded.payload, options)
  }
}

export const backupService = new BackupService()
