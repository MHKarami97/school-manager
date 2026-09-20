import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'school-manager:theme'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: ThemeMode): void {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

/**
 * مدیریت حالت روشن/تیره/سیستم. انتخاب کاربر در localStorage نگه‌داری می‌شود تا
 * در بازدیدهای بعدی حفظ شود. رنگ‌های واقعی هر حالت در style.css با override کردن
 * متقیرهای CSS داخل کلاس .dark تعریف شده‌اند؛ این استور فقط همان کلاس را
 * روی <html> فعال/فیرفعال می‌کند.
 */
export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system',
  }),
  actions: {
    setMode(mode: ThemeMode): void {
      this.mode = mode
      localStorage.setItem(STORAGE_KEY, mode)
      applyTheme(mode)
    },
    init(): void {
      applyTheme(this.mode)
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.mode === 'system') applyTheme('system')
      })
    },
  },
})
