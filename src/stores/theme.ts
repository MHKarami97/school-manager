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
 * مدیریت حالت روشن/تیره/سیستم. پیش‌فرض همیشه «روشن» است (نه سیستم)، مگر اینکه
 * کاربر قبلاً خودش حالتی را انتخاب کرده باشد که در localStorage نگه‌داری می‌شود.
 */
export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'light',
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
