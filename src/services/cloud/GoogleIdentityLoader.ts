import { CLOUD_CONFIG } from '@/config/cloudConfig'

export class GoogleIdentityLoader {
  private loading: Promise<void> | null = null

  load(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) return Promise.resolve()
    if (this.loading) return this.loading

    this.loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = CLOUD_CONFIG.gsiScriptUrl
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        script.remove()
        this.loading = null
        reject(new TypeError('Google Identity script failed to load'))
      }
      document.head.appendChild(script)
    })
    return this.loading
  }
}
