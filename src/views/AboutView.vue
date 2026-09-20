<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const principles = [
  { title: 'مبتنی بر اسناد رسمی', body: 'ساعت هفتگی درس‌های هر پایه بر اساس جدول‌های مصوب رسمی وارد شده است.' },
  { title: 'حریم خصوصی داده‌ها', body: 'هیچ بک‌اندی وجود ندارد؛ همه‌چیز فقط روی دستگاه شما ذخیره می‌شود.' },
  { title: 'رعایت دقیق قوانین چیدمان', body: 'قوانین عدم تکرار و استثناها رعایت می‌شوند.' },
  { title: 'متن‌باز و رایگان', body: 'کد کامل روی گیت‌هاب موجود است.' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 sm:pb-0">
    <AppHeader />
    <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl dark:text-ink-50">درباره مدیریار</h1>
        <p class="mt-3 text-ink-500 dark:text-ink-400">چرا این ابزار ساخته شد و بر چه اصولی تکیه دارد.</p>
      </div>
      <div class="rounded-2xl border border-ink-100 bg-white p-6 leading-7 text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
        <p>چیدن برنامه هفتگی یک کلاس یا یک مدرسه - کاری زمان‌بر و پرخطاست است. <strong>مدیریار</strong> این فرایند را به یک ویزارد چنددقیقه‌ای تبدیل می‌کند.</p>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div v-for="item in principles" :key="item.title" class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <h2 class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ item.title }}</h2>
          <p class="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">{{ item.body }}</p>
        </div>
      </div>
      <div class="mt-8 rounded-2xl bg-ink-900 p-6 text-center text-white">
        <p class="text-sm leading-7 text-ink-200">مدیریار توسط <a href="https://mhkarami97.ir" target="_blank" rel="noopener" class="font-semibold text-white hover:underline">محمدحسین کرمی</a> طراحی و توسعه داده شده است.</p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>
