import { CLOUD_CONFIG } from '@/config/cloudConfig'
import { backupService } from '@/backup/backup-service'
import { CloudBackupCodec } from './CloudBackupCodec'
import { CloudKeyVault } from './CloudKeyVault'
import { CloudSyncService } from './CloudSyncService'
import { CloudSyncStateStorage } from './CloudSyncStateStorage'
import { DriveAppDataClient } from './DriveAppDataClient'
import { GoogleAuthService } from './GoogleAuthService'
import { GoogleIdentityLoader } from './GoogleIdentityLoader'

export * from './CloudSyncError'
export * from './CloudSyncService'
export * from './CloudBackupCodec'
export * from './CloudKeyVault'
export * from './DriveAppDataClient'
export * from './GoogleAuthService'

const loader = new GoogleIdentityLoader()
const auth = new GoogleAuthService(CLOUD_CONFIG.googleClientId, CLOUD_CONFIG.scope, loader)
const drive = new DriveAppDataClient(auth, CLOUD_CONFIG.backupFilePrefix)
const vault = new CloudKeyVault()
const codec = new CloudBackupCodec(backupService, vault)
const storage = new CloudSyncStateStorage()

export const cloudSyncService = new CloudSyncService({
  auth,
  drive,
  codec,
  vault,
  storage,
  backup: backupService,
})
