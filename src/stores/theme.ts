import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'school-manager:theme'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function updateThemeColorMeta(isDark: boolean): void {
  const targetColor = isDark ? '#0a0d14' : '#ffffff'

  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  if (metas.length > 0) {
    metas.forEach((meta) => {
      meta.setAttribute('content', targetColor)
      if (meta.hasAttribute('media')) {
        meta.removeAttribute('media')
      }
    })
  } else {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = targetColor
    document.head.appendChild(meta)
  }

  let appleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (!appleMeta) {
    appleMeta = document.createElement('meta')
    appleMeta.name = 'apple-mobile-web-app-status-bar-style'
    document.head.appendChild(appleMeta)
  }
  appleMeta.setAttribute('content', isDark ? 'black-translucent' : 'default')
}

function applyTheme(mode: ThemeMode): void {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  updateThemeColorMeta(isDark)
}

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
