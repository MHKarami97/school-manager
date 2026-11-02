import { onDbMutation } from '@/db/db'
import { CLOUD_CONFIG } from '@/config/cloudConfig'
import type { BackupPayload } from '@/backup/backup-snapshot'
import type {
  CloudDecisionKind,
  CloudPendingDecision,
  CloudRestoreMode,
  CloudSyncPersistedState,
  CloudSyncSnapshot,
  CloudSyncStatus,
  RemoteBackupInfo,
} from '@/types/cloud-sync'
import type { BackupService } from '@/backup/backup-service'
import { deriveKey, newSaltHex } from '@/utils/cloudCrypto'
import type { CloudBackupCodec, LocalSnapshot } from './CloudBackupCodec'
import type { CloudKeyVault } from './CloudKeyVault'
import type { CloudSyncStateStorage } from './CloudSyncStateStorage'
import { CloudSyncError, toUserMessage } from './CloudSyncError'
import type { DriveAppDataClient } from './DriveAppDataClient'
import type { GoogleAuthService } from './GoogleAuthService'

type Listener = (snapshot: CloudSyncSnapshot) => void
type BackupTrigger = 'auto' | 'manual'

export interface CloudSyncDependencies {
  auth: GoogleAuthService
  drive: DriveAppDataClient
  codec: CloudBackupCodec
  vault: CloudKeyVault
  storage: CloudSyncStateStorage
  backup: BackupService
}

export class CloudSyncService {
  private readonly auth: GoogleAuthService
  private readonly drive: DriveAppDataClient
  private readonly codec: CloudBackupCodec
  private readonly vault: CloudKeyVault
  private readonly storage: CloudSyncStateStorage
  private readonly backup: BackupService

  private state: CloudSyncPersistedState
  private status: CloudSyncStatus
  private decision: CloudPendingDecision | null = null
  private hasRollback = false
  private readonly listeners = new Set<Listener>()
  private readonly dismissedRemoteIds = new Set<string>()
  private debounceTimer: number | undefined
  private running = false
  private rerunRequested = false
  private suppressDirty = false
  private started = false
  private lastSilentAttemptAt = 0
  private onDataRestored: () => Promise<void> = async () => {}

  constructor(deps: CloudSyncDependencies) {
    this.auth = deps.auth
    this.drive = deps.drive
    this.codec = deps.codec
    this.vault = deps.vault
    this.storage = deps.storage
    this.backup = deps.backup
    this.state = this.storage.load()
    this.status = this.state.connected ? 'idle' : 'disconnected'
  }

  setDataRestoredHandler(handler: () => Promise<void>): void {
    this.onDataRestored = handler
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): CloudSyncSnapshot {
    return { ...this.state, status: this.status, hasRollbackSnapshot: this.hasRollback, decision: this.decision }
  }

  async start(): Promise<void> {
    if (this.started) return
    this.started = true
    this.installDirtyHooks()
    this.installConnectivityListeners()
    this.hasRollback = (await this.vault.getSnapshot()) !== null
    this.emit()
    if (this.isOnline()) this.preload()

    if (!this.state.connected || !this.isOnline()) return
    if (!(await this.ensureAuthorized('silent'))) {
      this.setStatus('needs-reconnect')
      return
    }
    await this.guarded(() => this.reconcile())
  }

  preload(): void {
    this.auth.preload()
  }

  async connect(): Promise<void> {
    const granted = this.auth.isAuthorized || (await this.auth.requestAccess('interactive'))
    if (!granted) {
      throw new CloudSyncError('AUTH', 'اتصال به Google انجام نشد یا دسترسی داده نشد.')
    }
    this.patch({ connected: true, lastError: null })
    await this.guarded(() => this.reconcile())
  }

  async disconnect(deleteRemote: boolean): Promise<void> {
    window.clearTimeout(this.debounceTimer)
    if (deleteRemote) {
      try {
        if (await this.ensureAuthorized('interactive')) {
          const files = await this.drive.list()
          for (const file of files) await this.drive.remove(file.id)
        }
      } catch {
        // Remote cleanup is best-effort
      }
    }
    try {
      await this.auth.revoke()
    } catch {
      this.auth.clear()
    }
    this.decision = null
    this.patch({
      connected: false,
      lastSyncedHash: null,
      lastRemoteModifiedTime: null,
      lastError: null,
      dirtyAt: null,
      forceUpload: false,
    })
    this.setStatus('disconnected')
  }

  async backupNow(trigger: BackupTrigger): Promise<void> {
    if (!this.state.connected || this.decision) return
    if (!this.isOnline()) return
    const mode: 'interactive' | 'silent' = trigger === 'manual' ? 'interactive' : 'silent'
    if (!(await this.ensureAuthorized(mode))) {
      this.setStatus('needs-reconnect')
      return
    }
    await this.guarded(() => this.uploadIfChanged())
  }

  async resolveRestore(mode: CloudRestoreMode, passphrase?: string): Promise<void> {
    const pending = this.decision
    if (!pending) return
    if (!(await this.ensureAuthorized('interactive'))) {
      throw new CloudSyncError('AUTH', 'برای ادامه باید دسترسی Google را تأیید کنید.')
    }

    await this.guarded(async () => {
      const content = await this.drive.read(pending.remote.id)
      const payload = await this.codec.open(content, passphrase)

      await this.vault.saveSnapshot(JSON.stringify(await this.backup.buildPayload()))
      this.hasRollback = true

      await this.withoutDirtyTracking(() => this.backup.restoreCloudPayload(payload, mode))
      await this.onDataRestored()
      this.decision = null
      if (await this.vault.getKey()) this.patch({ encryptionEnabled: true })

      const remoteHash = pending.remote.appProperties?.contentHash ?? null
      if (mode === 'merge') {
        const merged = await this.codec.snapshotLocal()
        await this.upload(merged, this.state.encryptionEnabled, await this.drive.list())
      } else {
        const local = await this.codec.snapshotLocal()
        this.markSuccess(remoteHash ?? local.fingerprint.contentHash, pending.remote.modifiedTime)
      }
    }, true)
  }

  async resolveKeepLocal(): Promise<void> {
    if (!this.decision) return
    if (!(await this.ensureAuthorized('interactive'))) {
      throw new CloudSyncError('AUTH', 'برای ادامه باید دسترسی Google را تأیید کنید.')
    }
    await this.guarded(async () => {
      const local = await this.codec.snapshotLocal()
      const remotes = await this.drive.list()
      this.decision = null
      await this.upload(local, this.state.encryptionEnabled, remotes)
    })
  }

  dismissDecision(): void {
    if (!this.decision) return
    this.dismissedRemoteIds.add(this.decision.remote.id)
    this.decision = { ...this.decision, dismissed: true }
    this.emit()
  }

  reopenDecision(): void {
    if (!this.decision) return
    this.decision = { ...this.decision, dismissed: false }
    this.emit()
  }

  async rollbackLastRestore(): Promise<void> {
    const json = await this.vault.getSnapshot()
    if (!json) throw new CloudSyncError('INVALID_BACKUP', 'نسخه‌ی قبل از بازیابی موجود نیست.')
    const payload = JSON.parse(json) as BackupPayload
    await this.withoutDirtyTracking(() => this.backup.restoreCloudPayload(payload, 'replace'))
    await this.vault.clearSnapshot()
    this.hasRollback = false
    await this.onDataRestored()
    this.emit()
    this.markDirty()
  }

  async enableEncryption(passphrase: string): Promise<void> {
    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError('PASSPHRASE_INVALID', `رمز عبور باید حداقل ${CLOUD_CONFIG.minPassphraseLength} نویسه باشد.`)
    }

    const previous = await this.vault.getKey()
    let verified = false
    if (this.state.connected && this.isOnline() && this.auth.isAuthorized) {
      const latest = (await this.drive.list())[0]
      if (latest?.appProperties?.encrypted === '1') {
        await this.vault.clearKey()
        try {
          await this.codec.open(await this.drive.read(latest.id), passphrase)
          verified = true
        } catch (error) {
          if (previous) await this.vault.saveKey(previous.key, previous.saltHex, previous.iterations)
          throw error
        }
      }
    }

    if (!verified) {
      const saltHex = newSaltHex()
      const key = await deriveKey(passphrase, saltHex, CLOUD_CONFIG.pbkdf2Iterations)
      await this.vault.saveKey(key, saltHex, CLOUD_CONFIG.pbkdf2Iterations)
    }

    this.patch({ encryptionEnabled: true, forceUpload: this.state.connected })
    if (this.state.connected) this.scheduleBackup(500)
  }

  async disableEncryption(): Promise<void> {
    await this.vault.clearKey()
    this.patch({ encryptionEnabled: false, forceUpload: this.state.connected })
    if (this.state.connected) this.scheduleBackup(500)
  }

  setNotifyFailures(value: boolean): void {
    this.patch({ notifyFailures: value })
  }

  markDirty(): void {
    this.patch({ dirtyAt: new Date().toISOString() })
    if (this.state.connected && !this.decision) this.scheduleBackup(CLOUD_CONFIG.autoBackupDebounceMs)
  }

  private scheduleBackup(delayMs: number): void {
    window.clearTimeout(this.debounceTimer)
    this.debounceTimer = window.setTimeout(() => void this.backupNow('auto'), delayMs)
  }

  private async reconcile(): Promise<void> {
    const local = await this.codec.snapshotLocal()
    const remotes = await this.drive.list()
    const latest = remotes[0]

    if (!latest) {
      if (local.fingerprint.recordsCount > 0) await this.upload(local, this.state.encryptionEnabled, [])
      else this.markSuccess(local.fingerprint.contentHash, null)
      return
    }

    const remoteHash = latest.appProperties?.contentHash ?? null
    const localHash = local.fingerprint.contentHash

    if (remoteHash === localHash && !this.state.forceUpload) {
      this.markSuccess(localHash, latest.modifiedTime)
      return
    }
    if (local.fingerprint.recordsCount === 0) {
      this.raiseDecision('remote-only', latest, local)
      return
    }

    const lastHash = this.state.lastSyncedHash
    const remoteUnchanged = !!lastHash && remoteHash === lastHash
    const localUnchanged = !!lastHash && localHash === lastHash

    if (remoteUnchanged) {
      await this.upload(local, this.state.encryptionEnabled, remotes)
      return
    }
    this.raiseDecision(localUnchanged ? 'remote-newer' : 'conflict', latest, local)
  }

  private async uploadIfChanged(): Promise<void> {
    const local = await this.codec.snapshotLocal()
    const localHash = local.fingerprint.contentHash
    if (!this.state.forceUpload && localHash === this.state.lastSyncedHash) {
      this.markSuccess(localHash, this.state.lastRemoteModifiedTime)
      return
    }

    const remotes = await this.drive.list()
    const latest = remotes[0]
    if (latest) {
      const remoteHash = latest.appProperties?.contentHash ?? null
      if (remoteHash === localHash && !this.state.forceUpload) {
        this.markSuccess(localHash, latest.modifiedTime)
        return
      }
      if (remoteHash !== this.state.lastSyncedHash) {
        this.raiseDecision('conflict', latest, local)
        return
      }
    }
    await this.upload(local, this.state.encryptionEnabled, remotes)
  }

  private async upload(local: LocalSnapshot, encrypt: boolean, existing: RemoteBackupInfo[]): Promise<void> {
    const content = await this.codec.serialize(local, encrypt)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const created = await this.drive.create(`${CLOUD_CONFIG.backupFilePrefix}${stamp}.json`, content, {
      contentHash: local.fingerprint.contentHash,
      recordsCount: String(local.fingerprint.recordsCount),
      encrypted: encrypt ? '1' : '0',
      schema: '1',
      deviceId: this.getDeviceId(),
    })
    await this.prune([created, ...existing])
    this.markSuccess(local.fingerprint.contentHash, created.modifiedTime)
  }

  private async prune(files: RemoteBackupInfo[]): Promise<void> {
    const sorted = [...files].sort((a, b) => (a.modifiedTime < b.modifiedTime ? 1 : -1))
    for (const stale of sorted.slice(CLOUD_CONFIG.keepVersions)) {
      try {
        await this.drive.remove(stale.id)
      } catch {
        // Cleanup error is non-fatal
      }
    }
  }

  private raiseDecision(kind: CloudDecisionKind, remote: RemoteBackupInfo, local: LocalSnapshot): void {
    this.decision = {
      kind,
      remote,
      remoteRecordsCount: Number(remote.appProperties?.recordsCount ?? 0),
      localRecordsCount: local.fingerprint.recordsCount,
      remoteEncrypted: remote.appProperties?.encrypted === '1',
      dismissed: this.dismissedRemoteIds.has(remote.id),
    }
    this.setStatus('decision-pending')
  }

  private async guarded(task: () => Promise<void>, rethrowPassphraseErrors = false): Promise<void> {
    if (this.running) {
      this.rerunRequested = true
      return
    }
    this.running = true
    this.setStatus('syncing')
    try {
      await task()
      if (this.status === 'syncing') this.setStatus(this.decision ? 'decision-pending' : 'idle')
    } catch (error) {
      const isPassphrase =
        error instanceof CloudSyncError &&
        (error.code === 'PASSPHRASE_REQUIRED' || error.code === 'PASSPHRASE_INVALID')
      if (isPassphrase && rethrowPassphraseErrors) {
        this.setStatus(this.decision ? 'decision-pending' : 'idle')
        throw error
      }
      this.fail(error)
    } finally {
      this.running = false
      if (this.rerunRequested) {
        this.rerunRequested = false
        this.scheduleBackup(1000)
      }
    }
  }

  private fail(error: unknown): void {
    const needsReconnect = error instanceof CloudSyncError && error.code === 'AUTH'
    this.patch({ lastError: toUserMessage(error) })
    this.setStatus(needsReconnect ? 'needs-reconnect' : 'error')
  }

  private markSuccess(hash: string, remoteModifiedTime: string | null): void {
    this.patch({
      lastSyncedHash: hash,
      lastRemoteModifiedTime: remoteModifiedTime,
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      dirtyAt: null,
      forceUpload: false,
    })
    this.setStatus('success')
  }

  private async ensureAuthorized(mode: 'interactive' | 'silent'): Promise<boolean> {
    if (this.auth.isAuthorized) return true
    if (mode === 'interactive') return this.auth.requestAccess('interactive')

    const now = Date.now()
    if (now - this.lastSilentAttemptAt < CLOUD_CONFIG.silentRetryCooldownMs) return false
    this.lastSilentAttemptAt = now
    return this.auth.requestAccess('silent')
  }

  private async withoutDirtyTracking<T>(action: () => Promise<T>): Promise<T> {
    this.suppressDirty = true
    try {
      return await action()
    } finally {
      this.suppressDirty = false
    }
  }

  private installDirtyHooks(): void {
    onDbMutation(() => {
      if (this.suppressDirty) return
      window.setTimeout(() => this.markDirty(), 0)
    })
  }

  private installConnectivityListeners(): void {
    window.addEventListener('online', () => void this.syncSoon())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state.dirtyAt) void this.syncSoon()
    })
  }

  private async syncSoon(): Promise<void> {
    if (!this.state.connected || this.decision || !this.isOnline()) return
    if (this.state.dirtyAt || this.status === 'error') this.scheduleBackup(1000)
  }

  private isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine
  }

  private getDeviceId(): string {
    try {
      const existing = localStorage.getItem(CLOUD_CONFIG.deviceIdStorageKey)
      if (existing) return existing
      const created = crypto.randomUUID().slice(0, 8)
      localStorage.setItem(CLOUD_CONFIG.deviceIdStorageKey, created)
      return created
    } catch {
      return 'unknown'
    }
  }

  private setStatus(status: CloudSyncStatus): void {
    this.status = status
    this.emit()
  }

  private patch(partial: Partial<CloudSyncPersistedState>): void {
    this.state = { ...this.state, ...partial }
    this.storage.save(this.state)
    this.emit()
  }

  private emit(): void {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}
