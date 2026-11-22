<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const iframeUrl = 'https://experiment.mhkarami97.ir/'
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeLoading = ref(true)
const isFullscreen = ref(false)
const isPortraitMobile = ref(false)
const dismissWarning = ref(false)

function checkOrientation(): void {
  if (typeof window === 'undefined') return
  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const isSmallScreen = window.innerWidth <= 1024
  isPortraitMobile.value = isPortrait && isSmallScreen
}

function handleIframeLoad(): void {
  iframeLoading.value = false
}

function reloadIframe(): void {
  if (iframeRef.value) {
    iframeLoading.value = true
    iframeRef.value.src = iframeUrl
  }
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
      // تلاش برای قفل چرخش روی لنداسکیپ در مرورگرهای سازگار (اندروید)
      if ('orientation' in screen && 'lock' in (screen.orientation as unknown as { lock: (mode: string) => Promise<void> })) {
        try {
          await (screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape')
        } catch {
          // در صورت عدم پشتیبانی مرورگر نادیده گرفته می‌شود
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
      isFullscreen.value = false
    }
  } catch (err) {
    console.warn('Fullscreen toggle failed:', err)
  }
}

async function requestLandscapeAndFullscreen(): Promise<void> {
  await toggleFullscreen()
  dismissWarning.value = true
}

function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement
  checkOrientation()
}

onMounted(() => {
  checkOrientation()
  window.addEventListener('resize', checkOrientation)
  window.addEventListener('orientationchange', checkOrientation)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOrientation)
  window.removeEventListener('orientationchange', checkOrientation)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div class="relative flex h-screen w-screen flex-col overflow-hidden bg-ink-950 text-white">
    <!-- هدر یکپارچه آزمایشگاه -->
    <header class="flex h-14 shrink-0 items-center justify-between border-b border-ink-800 bg-ink-900/95 px-3 sm:px-6 backdrop-blur">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800/80 px-2.5 py-1.5 text-xs font-medium text-ink-200 transition hover:border-brand-500 hover:text-white"
          title="بازگشت به مدیریار"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">بازگشت به مدیریار</span>
          <span class="sm:hidden">بازگشت</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h1 class="text-sm font-bold text-white sm:text-base">آزمایشگاه مجازی علوم</h1>
            <p class="hidden text-10px text-ink-400 sm:block">شبیه‌سازی‌های تعاملی، دقیق و زنده فیزیک و شیمی</p>
          </div>
          <span class="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 md:inline-block">
            محیط تعاملی و یکپارچه
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- دکمه هشدار چرخش گوشی در صورت نیاز -->
        <button
          v-if="isPortraitMobile && dismissWarning"
          type="button"
          class="flex items-center gap-1 rounded-xl bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
          title="راهنمای افقی کردن گوشی"
          @click="dismissWarning = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-2M4 16v2a2 2 0 002 2h4M9 14l-3 3m0 0l3 3m-3-3h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">چرخش افقی</span>
        </button>

        <!-- بارگذاری مجدد -->
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-800 bg-ink-800/80 text-ink-300 transition hover:bg-ink-700 hover:text-white"
          title="بارگذاری مجدد آزمایشگاه"
          @click="reloadIframe"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- حالت تمام صفحه -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-ink-800 bg-ink-800/80 px-2.5 py-1.5 text-xs font-medium text-ink-200 transition hover:bg-ink-700 hover:text-white"
          :title="isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'"
          @click="toggleFullscreen"
        >
          <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M9 4v4H5m10-4v4h4M9 20v-4H5m10 4v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">{{ isFullscreen ? 'خروج' : 'تمام‌صفحه' }}</span>
        </button>

        <!-- باز کردن در تب جدید (پشتیبان) -->
        <a
          :href="iframeUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-800 bg-ink-800/80 text-ink-400 transition hover:bg-ink-700 hover:text-white"
          title="باز کردن در پنجره مستقل"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </div>
    </header>

    <!-- کانتینر اصلی آزمایشگاه -->
    <main class="relative flex-1 overflow-hidden bg-ink-950">
      <!-- نشانگر بارگذاری -->
      <div
        v-if="iframeLoading"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink-950 text-ink-400"
      >
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        <p class="mt-4 text-sm font-medium text-ink-300">در حال بارگذاری شبیه‌سازهای آزمایشگاه علوم...</p>
        <span class="mt-1 text-xs text-ink-500">محیط تعاملی و پویا</span>
      </div>

      <!-- فریم شبیه‌ساز تعبیه شده -->
      <iframe
        ref="iframeRef"
        :src="iframeUrl"
        title="آزمایشگاه مجازی علوم"
        class="h-full w-full border-0 bg-ink-950"
        allow="fullscreen; accelerometer; gyroscope"
        @load="handleIframeLoad"
      ></iframe>

      <!-- لایه هشدار چرخش گوشی به افقی (Landscape Guard) -->
      <Transition name="fade">
        <div
          v-if="isPortraitMobile && !dismissWarning"
          class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink-950/95 p-6 text-center backdrop-blur-md"
        >
          <!-- انیمیشن چرخاندن گوشی -->
          <div class="relative mb-6 flex h-24 w-24 items-center justify-center">
            <div class="absolute inset-0 animate-ping rounded-full bg-brand-500/20"></div>
            <div class="phone-rotate-anim flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-brand-400 bg-brand-500/10 text-brand-400 shadow-xl shadow-brand-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-10 w-10">
                <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" stroke-width="2" />
                <path d="M12 18h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              </svg>
            </div>
            <!-- فلش چرخش -->
            <div class="absolute -bottom-2 -left-2 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin-slow">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <h2 class="text-lg font-bold text-white sm:text-xl">
            لطفاً گوشی خود را افقی (Landscape) بچرخانید 🔄
          </h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-ink-300">
            شبیه‌سازی‌ها و ابزارهای آزمایشگاه مجازی برای نمایش دقیق و تعاملی، نیازمند صفحه عریض هستند.
          </p>

          <div class="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-200">
            💡 اگر صفحه به طور خودکار نچرخید، <b>«قفل چرخش خودکار» (Auto-Rotate)</b> را در تنظیمات سریع گوشی خود روشن کنید.
          </div>

          <div class="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
              @click="requestLandscapeAndFullscreen"
            >
              چرخش و حالت تمام‌صفحه
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-700 bg-ink-800/80 px-4 py-2.5 text-xs font-medium text-ink-300 transition hover:text-white"
              @click="dismissWarning = true"
            >
              مشاهده در حالت عمودی (اجباری)
            </button>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
@keyframes phoneRotate {
  0%, 15% {
    transform: rotate(0deg);
  }
  45%, 85% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.phone-rotate-anim {
  animation: phoneRotate 3s ease-in-out infinite;
}

@keyframes spinSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spinSlow 8s linear infinite;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
