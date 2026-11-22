<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const router = useRouter()
const dismissed = ref(false)
const isUpdating = ref(false)
let swRegistration: ServiceWorkerRegistration | undefined
let checkInterval: number | undefined

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[PWA] New update available, prompting user.')
    dismissed.value = false
  },
  onOfflineReady() {
    console.info('[PWA] App is ready for use.')
  },
  onRegisteredSW(swUrl, registration) {
    console.info('[PWA] Service worker registered:', swUrl)
    swRegistration = registration

    if (registration) {
      // 1. If worker is already waiting in background, notify immediately
      if (registration.waiting) {
        needRefresh.value = true
        dismissed.value = false
      }

      // 2. Listen to state changes
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              needRefresh.value = true
              dismissed.value = false
            }
          })
        }
      })

      // 3. Periodic update check every 60 seconds
      checkInterval = window.setInterval(() => {
        void registration.update().catch(() => {})
      }, 60 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('[PWA] SW registration failed:', error)
  },
})

function checkForUpdate(): void {
  if (swRegistration) {
    void swRegistration.update().catch(() => {})
  }
}

// Check for updates on route transitions
const removeRouteHook = router.afterEach(() => {
  checkForUpdate()
})

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    checkForUpdate()
  }
}

onMounted(() => {
  window.addEventListener('focus', checkForUpdate)
  document.addEventListener('visibilitychange', onVisibilityChange)
  // Check after 2 seconds from startup
  setTimeout(checkForUpdate, 2000)
})

onUnmounted(() => {
  window.removeEventListener('focus', checkForUpdate)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  removeRouteHook()
  if (checkInterval !== undefined) {
    clearInterval(checkInterval)
  }
})

async function refreshApp(): Promise<void> {
  isUpdating.value = true
  try {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    await updateServiceWorker(true)
  } catch (err) {
    console.error('[PWA] Error updating SW:', err)
  } finally {
    // Force reload if not reloaded automatically
    setTimeout(() => {
      window.location.reload()
    }, 400)
  }
}

function dismiss(): void {
  dismissed.value = true
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh && !dismissed"
      class="fixed inset-x-0 bottom-20 z-50 flex justify-center px-3 pb-2 sm:bottom-4 sm:justify-end sm:px-6 sm:pb-0"
      role="status"
      aria-live="polite"
    >
      <div class="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-brand-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-brand-500/30 dark:bg-ink-900/95 sm:max-w-md sm:p-4">
        <div class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5 animate-spin" style="animation-duration: 8s;">
            <path d="M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 13.9 3.4M19.5 9A8 8 0 0 0 5.6 5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
        </div>

        <div class="min-w-0 flex-1 text-right">
          <p class="text-xs font-bold text-ink-900 dark:text-ink-100 sm:text-sm">نسخه جدید مدیریار منتشر شد</p>
          <p class="mt-0.5 text-[11px] leading-5 text-ink-500 dark:text-ink-300 sm:text-xs">
            جهت بارگذاری آخرین امکانات و بهبودها، به‌روزرسانی کنید.
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            :disabled="isUpdating"
            class="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95 disabled:opacity-60"
            @click="refreshApp"
          >
            <span v-if="isUpdating">در حال اعمال...</span>
            <span v-else>به‌روزرسانی</span>
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            title="بستن موقت"
            aria-label="بستن"
            @click="dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
