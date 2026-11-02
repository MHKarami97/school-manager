const ENV_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''

export const CLOUD_CONFIG = {
  // Public identifier (not a secret). It is embedded in the bundle by design.
  googleClientId:
    ENV_CLIENT_ID || '627723972815-qrp35936cvbodbo2udkp4qeeh6sgoqms.apps.googleusercontent.com',
  scope: 'https://www.googleapis.com/auth/drive.appdata',
  gsiScriptUrl: 'https://accounts.google.com/gsi/client',
  // Must be unique per app because all apps share one Client ID.
  backupFilePrefix: 'school-manager.backup.',
  keepVersions: 3,
  autoBackupDebounceMs: 15000,
  silentRetryCooldownMs: 5 * 60 * 1000,
  minPassphraseLength: 8,
  // OWASP Password Storage Cheat Sheet recommendation for PBKDF2-HMAC-SHA256.
  pbkdf2Iterations: 600000,
  inlineUploadLimitBytes: 4 * 1024 * 1024,
  stateStorageKey: 'school-manager.cloudSync.v1',
  deviceIdStorageKey: 'school-manager.cloudSync.deviceId',
  vaultDatabaseName: 'SchoolManagerCloudDB',
} as const
