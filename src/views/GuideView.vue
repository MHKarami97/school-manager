<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const steps = [
  { title: '۱. انتخاب مخاطب', body: 'در صفحه شروع مشخص می‌کنید برنامه را برای خودتان به‌عنوان یک معلم (پایه ابتدایی) می‌سازید یا برای کل مدرسه.' },
  { title: '۲. انتخاب دوره و پایه', body: 'دوره تحصیلی و سپس یک یا چند پایه از همان دوره را انتخاب می‌کنید.' },
  { title: '۳. تنظیم شیفت و زمان‌بندی', body: 'شیفت صبح یا ظهر را انتخاب می‌کنید و مقادیر زنگ/تفریح را تایید یا ویرایش می‌کنید.' },
  { title: '۴. معرفی معلم‌ها', body: 'نام معلم‌ها را به‌همراه جنسیت (برای نمایش خودکار «آقای/خانم») وارد می‌کنید.' },
  { title: '۵. ساخت خودکار برنامه', body: 'موتور داخلی برنامه را با رعایت قوانین عدم تکرار و جایگاه ثابت قرآن می‌چیند.' },
  { title: '۶. ویرایش دستی نتیجه', body: 'با درگ‌ودراپ خانه‌ها را جابجا کنید و در پایان «ذخیره تفییرات» را بزنید.' },
  { title: '۷. چاپ، خروجی تصویر و ذخیره', body: 'با دکمه «چاپ / PDF» یا «دانلود تصویر» برنامه را دریافت کنید.' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 sm:pb-0">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-50">راهنمای کامل استفاده از مدیریار</h1>
        <p class="mt-3 text-ink-500 dark:text-ink-400">از انتخاب پایه تا دریافت خروجی چاپی - مرحله‌به‌مرحله.</p>
      </div>
      <ol class="space-y-6">
        <li v-for="step in steps" :key="step.title" class="rounded-2xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <h2 class="text-base font-semibold text-ink-800 dark:text-ink-100">{{ step.title }}</h2>
          <p class="mt-2 text-sm leading-7 text-ink-600 dark:text-ink-300">{{ step.body }}</p>
        </li>
      </ol>
      <div class="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <p class="font-semibold">پرسش‌های پرتکرار</p>
        <p class="mt-2"><strong>اطلاعات من کجا ذخیره می‌شود؟</strong> همه‌چیز فقط در سیستم همان دستگاه شما ذخیره می‌شود؛ هیچ داده‌ای به سرور ارسال نمی‌شود.</p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
