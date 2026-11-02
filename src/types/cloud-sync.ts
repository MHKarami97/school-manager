export type CloudSyncStatus =
  | 'disconnected'
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'needs-reconnect'
  | 'decision-pending'

export type CloudRestoreMode = 'replace' | 'merge'

export interface CloudSyncPersistedState {
  connected: boolean
  encryptionEnabled: boolean
  notifyFailures: boolean
  lastSyncedHash: string | null
  lastSuccessAt: string | null
  lastRemoteModifiedTime: string | null
  lastError: string | null
  dirtyAt: string | null
  forceUpload: boolean
}

export const DEFAULT_CLOUD_STATE: CloudSyncPersistedState = {
  connected: false,
  encryptionEnabled: false,
  notifyFailures: true,
  lastSyncedHash: null,
  lastSuccessAt: null,
  lastRemoteModifiedTime: null,
  lastError: null,
  dirtyAt: null,
  forceUpload: false,
}

export interface RemoteBackupInfo {
  id: string
  name: string
  modifiedTime: string
  size?: string
  appProperties?: Record<string, string>
}

export interface BackupFingerprint {
  contentHash: string
  recordsCount: number
}

export type CloudDecisionKind = 'remote-only' | 'remote-newer' | 'conflict'

export interface CloudPendingDecision {
  kind: CloudDecisionKind
  remote: RemoteBackupInfo
  remoteRecordsCount: number
  localRecordsCount: number
  remoteEncrypted: boolean
  dismissed: boolean
}

export interface CloudSyncSnapshot extends CloudSyncPersistedState {
  status: CloudSyncStatus
  hasRollbackSnapshot: boolean
  decision: CloudPendingDecision | null
}
