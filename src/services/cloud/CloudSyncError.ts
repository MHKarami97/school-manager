export type CloudSyncErrorCode =
  | 'AUTH'
  | 'NETWORK'
  | 'QUOTA'
  | 'RATE_LIMIT'
  | 'API'
  | 'PASSPHRASE_REQUIRED'
  | 'PASSPHRASE_INVALID'
  | 'KEY_MISSING'
  | 'INVALID_BACKUP'
  | 'NOT_CONNECTED'

export class CloudSyncError extends Error {
  constructor(
    public readonly code: CloudSyncErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'CloudSyncError'
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof CloudSyncError) return error.message
  if (error instanceof TypeError) return 'ارتباط با Google Drive برقرار نشد.'
  if (error instanceof Error && error.message) return error.message
  return 'خطای ناشناخته در همگام‌سازی.'
}
