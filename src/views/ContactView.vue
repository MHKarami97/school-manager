<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const channels = [
  { title: 'ایمیل', value: 'mhkarami97@gmail.com', href: 'mailto:mhkarami97@gmail.com', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { title: 'وب‌سایت', value: 'mhkarami97.ir', href: 'https://mhkarami97.ir', icon: 'M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18' },
  { title: 'تلگرام', value: '@mhkarami_97', href: 'https://t.me/mhkarami_97', icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 00-6.2 0C7.5 3.9 6.4 4.2 6.4 4.2a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 005 10.6c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.1-.5 2V22' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 sm:pb-0">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-50">تماس با ما</h1>
        <p class="mt-3 text-ink-500 dark:text-ink-400">سوال، پیشنهاد یا گزارش خطا دارید؟ خوشحال می‌شویم از شما بشنویم.</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <a v-for="channel in channels" :key="channel.title" :href="channel.href" target="_blank" rel="noopener" class="rounded-2xl border border-ink-100 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-500/50">
          <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5"><path :d="channel.icon" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <p class="mt-3 text-sm font-semibold text-ink-800 dark:text-ink-100">{{ channel.title }}</p>
          <p class="mt-1 break-all text-xs text-ink-500 dark:text-ink-400">{{ channel.value }}</p>
        </a>
      </div>
      <div class="mt-8 rounded-2xl border border-ink-100 bg-white p-6 text-sm leading-7 text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
        <p class="font-semibold text-ink-800 dark:text-ink-100">راه سریع‌تر برای گزارش مشکل یا پیشنهاد ویژگی</p>
        <p class="mt-2">توسط راه‌های ارتباطی می‌توانید با ما در ارتباط باشید</p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
