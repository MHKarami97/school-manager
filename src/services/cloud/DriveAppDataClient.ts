import type { RemoteBackupInfo } from '@/types/cloud-sync'
import { CLOUD_CONFIG } from '@/config/cloudConfig'
import { CloudSyncError } from './CloudSyncError'
import type { GoogleAuthService } from './GoogleAuthService'

const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FILE_FIELDS = 'id,name,modifiedTime,size,appProperties'

export class DriveAppDataClient {
  constructor(
    private readonly auth: GoogleAuthService,
    private readonly namePrefix: string
  ) {}

  async list(): Promise<RemoteBackupInfo[]> {
    const query = encodeURIComponent(`name contains '${this.namePrefix}' and trashed = false`)
    const url =
      `${API}?spaces=appDataFolder&q=${query}&orderBy=modifiedTime desc&pageSize=50` +
      `&fields=files(${FILE_FIELDS})`
    const response = await this.request(url)
    const body = await response.json()
    return (body.files ?? []) as RemoteBackupInfo[]
  }

  async read(fileId: string): Promise<string> {
    const response = await this.request(`${API}/${fileId}?alt=media`)
    return response.text()
  }

  async create(name: string, content: string, appProperties: Record<string, string>): Promise<RemoteBackupInfo> {
    const metadata = { name, parents: ['appDataFolder'], mimeType: 'application/json', appProperties }
    const size = new Blob([content]).size
    return size <= CLOUD_CONFIG.inlineUploadLimitBytes
      ? this.createMultipart(metadata, content)
      : this.createResumable(metadata, content)
  }

  async remove(fileId: string): Promise<void> {
    await this.request(`${API}/${fileId}`, { method: 'DELETE' })
  }

  private async createMultipart(metadata: object, content: string): Promise<RemoteBackupInfo> {
    const boundary = 'school_' + Math.random().toString(36).slice(2)
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n`,
      content,
      `\r\n--${boundary}--`,
    ])
    const response = await this.request(`${UPLOAD}?uploadType=multipart&fields=${FILE_FIELDS}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    })
    return response.json()
  }

  private async createResumable(metadata: object, content: string): Promise<RemoteBackupInfo> {
    const start = await this.request(`${UPLOAD}?uploadType=resumable&fields=${FILE_FIELDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })
    const sessionUrl = start.headers.get('Location')
    if (!sessionUrl) throw new CloudSyncError('API', 'نشست آپلود Google Drive ایجاد نشد.')

    const response = await fetch(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    })
    if (!response.ok) throw await this.toError(response)
    return response.json()
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${this.auth.getToken()}`)
    const response = await fetch(url, { ...init, headers })
    if (!response.ok) throw await this.toError(response)
    return response
  }

  private async toError(response: Response): Promise<CloudSyncError> {
    let reason = ''
    try {
      const body = await response.json()
      reason = body?.error?.errors?.[0]?.reason || body?.error?.status || ''
    } catch {
      reason = ''
    }

    if (response.status === 401) {
      this.auth.clear()
      return new CloudSyncError('AUTH', 'نشست Google منقضی شده است؛ دوباره متصل شوید.')
    }
    if (reason === 'storageQuotaExceeded') {
      return new CloudSyncError('QUOTA', 'فضای Google Drive شما پر است.')
    }
    if (response.status === 429 || reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
      return new CloudSyncError('RATE_LIMIT', 'تعداد درخواست‌ها به Google Drive زیاد بود؛ کمی بعد دوباره تلاش می‌شود.')
    }
    if (response.status === 403) {
      return new CloudSyncError('AUTH', 'دسترسی به Google Drive مجاز نیست؛ اتصال را دوباره برقرار کنید.')
    }
    return new CloudSyncError('API', `خطای Google Drive (کد ${response.status}).`)
  }
}
