<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const senderName = ref('')
const senderContact = ref('')
const messageSubject = ref('پیشنهاد قابلیت جدید')
const messageBody = ref('')
const copySuccess = ref(false)

const channels = [
  {
    title: 'پیام‌رسان تلگرام',
    value: '@mhkarami_97',
    href: 'https://t.me/mhkarami_97',
    badge: 'پاسخگویی سریع',
    iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    icon: 'M21.198 2.433a2.242 2.242 0 00-1.022.215l-18.6 7.494a1.75 1.75 0 00.126 3.262l4.89 1.745 2.1 6.55a1.75 1.75 0 002.833.68l3.12-2.82 4.98 3.65a1.75 1.75 0 002.73-1.05l3.24-17.43a1.75 1.75 0 00-2.397-2.296zM8.7 13.91l7.85-6.85-6.31 8.24-.34 2.97-1.2-4.36z',
  },
  {
    title: 'پست الکترونیک (ایمیل)',
    value: 'mhkarami97@gmail.com',
    href: 'mailto:mhkarami97@gmail.com',
    badge: 'پشتیبانی رسمی',
    iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    title: 'وب‌سایت شخصی توسعه‌دهنده',
    value: 'mhkarami97.ir',
    href: 'https://mhkarami97.ir',
    badge: 'رزومه و پروژه‌ها',
    iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a15 15 0 003.5-9A15 15 0 0012 3m0 18a15 15 0 01-3.5-9A15 15 0 0112 3m-9 9h18',
  },
]

function sendViaEmail(): void {
  const subject = encodeURIComponent(`[مدیریار - ${messageSubject.value}] از طرف ${senderName.value || 'کاربر سامانه'}`)
  const body = encodeURIComponent(
    `نام و نام خانوادگی: ${senderName.value || '-'}\nاطلاعات تماس: ${senderContact.value || '-'}\nموضوع: ${messageSubject.value}\n\nمتن پیام:\n${messageBody.value}`
  )
  window.open(`mailto:mhkarami97@gmail.com?subject=${subject}&body=${body}`, '_blank')
}

async function copyMessage(): Promise<void> {
  const fullText = `[پیام مدیریار]\nموضوع: ${messageSubject.value}\nفرستنده: ${senderName.value || '-'}\nتماس: ${senderContact.value || '-'}\n\nمتن:\n${messageBody.value}`
  try {
    await navigator.clipboard.writeText(fullText)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors">
    <AppHeader />

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <!-- سربرگ تماس -->
      <div class="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-10 text-center">
        <div class="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>پاسخگویی و ارتباط مستقیم</span>
        </div>

        <h1 class="mt-4 text-3xl font-black text-ink-900 sm:text-4xl dark:text-ink-100">
          تماس با ما و ارسال بازخورد
        </h1>
        <p class="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          نظرات، پیشنهادات سازنده و گزارش‌های احتمالی شما عزیزان، الهام‌بخش پیشرفت و بهبود مستمر امکانات سامانه مدیریار است.
        </p>
      </div>

      <!-- ۳ کانال ارتباطی اصلی با کارت‌های جذاب -->
      <div class="mt-8 grid gap-5 sm:grid-cols-3">
        <a
          v-for="ch in channels"
          :key="ch.title"
          :href="ch.href"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-500/40"
        >
          <div>
            <div class="flex items-center justify-between">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105" :class="ch.iconColor">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <path :d="ch.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <span class="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {{ ch.badge }}
              </span>
            </div>

            <h3 class="mt-4 text-base font-extrabold text-ink-900 dark:text-ink-100">
              {{ ch.title }}
            </h3>
            <p class="mt-1 text-xs font-mono font-medium text-ink-500 dark:text-ink-400 break-all dir-ltr text-right">
              {{ ch.value }}
            </p>
          </div>

          <div class="mt-6 flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
            <span>ارتباط مستقیم</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-3.5 w-3.5 transition group-hover:translate-x-[-3px]">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </a>
      </div>

      <!-- فرم ثبت پیام و بازخورد تعاملی -->
      <div class="mt-10 rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <div class="flex items-center gap-3 border-b border-ink-100 pb-5 dark:border-ink-800">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-ink-900 dark:text-ink-100">فرم ارسال پیام یا گزارش خطا</h2>
            <p class="text-xs text-ink-500 dark:text-ink-400">می‌توانید پیام خود را تنظیم کرده و مستقیماً ارسال کنید یا متن آن را کپی نمایید.</p>
          </div>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="sendViaEmail">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">نام و نام خانوادگی (اختیاری)</label>
              <input
                v-model="senderName"
                type="text"
                placeholder="مثال: علی رضایی"
                class="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3.5 py-2.5 text-xs text-ink-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">شماره تماس یا آیدی پیام‌رسان (جهت پاسخ)</label>
              <input
                v-model="senderContact"
                type="text"
                placeholder="مثال: ۰۹۱۲... یا @username"
                class="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3.5 py-2.5 text-xs text-ink-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">موضوع پیام</label>
            <select
              v-model="messageSubject"
              class="w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3.5 py-2.5 text-xs text-ink-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            >
              <option value="پیشنهاد قابلیت جدید">پیشنهاد قابلیت یا ایده جدید برای سامانه</option>
              <option value="گزارش خطا در چیدمان">گزارش مشکل یا خطا در ساخت برنامه هفتگی یا امتحانات</option>
              <option value="سوال درباره سرفصل و قوانین">سوال یا ابهام درباره تطابق با قوانین درسی</option>
              <option value="همکاری یا سایر موارد">سایر موارد و پیشنهادات عمومی</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-ink-700 dark:text-ink-300 mb-1.5">متن پیام یا شرح گزارش</label>
            <textarea
              v-model="messageBody"
              rows="4"
              required
              placeholder="توضیحات خود را اینجا بنویسید..."
              class="w-full rounded-xl border border-ink-200 bg-ink-50/50 p-3.5 text-xs leading-6 text-ink-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            ></textarea>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div class="flex items-center gap-2">
              <button
                type="submit"
                class="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>ارسال مستقیم از طریق ایمیل</span>
              </button>

              <button
                type="button"
                class="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                @click="copyMessage"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>کپی متن پیام</span>
              </button>
            </div>

            <span v-if="copySuccess" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
              ✓ متن پیام با موفقیت در کلیپ‌بورد کپی شد.
            </span>
          </div>
        </form>
      </div>

      <!-- جعبه راهنمایی سریع -->
      <div class="mt-8 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 text-xs leading-6 text-ink-500 dark:text-ink-400">
        <strong class="text-ink-800 dark:text-ink-200">نکته درباره پاسخگویی:</strong> کلیه پیام‌های دریافتی از طریق تلگرام و ایمیل در کوتاه‌ترین زمان ممکن توسط تیم توسعه بررسی و پاسخ داده خواهند شد.
      </div>
    </main>

    <AppFooter />
  </div>
</template>
