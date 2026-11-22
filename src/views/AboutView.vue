<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const pillars = [
  {
    title: 'مبتنی بر استانداردهای رسمی',
    desc: 'ساعات هفتگی و سرفصل تمامی پایه‌های تحصیلی بر اساس آخرین مصوبات رسمی وزارت آموزش و پرورش برنامه‌ریزی شده است.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    badge: 'دقت قانونی',
  },
  {
    title: 'حفظ کامل حریم خصوصی و امنیت داده‌ها',
    desc: 'کلیه داده‌ها، برنامه‌ها و اطلاعات هویتی دانش‌آموزان و معلمان تحت مدیریت و کنترل کامل خود کاربر نگهداری می‌شوند و حریم شخصی کاملاً تضمین‌شده است.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    badge: 'امنیت بالا',
  },
  {
    title: 'هوشمندی و الگوریتم‌های چیدمان دقیق',
    desc: 'موتور داخلی چیدمان، صدها قانون شامل عدم تکرار درس، توزیع عادلانه ساعات بین معلمان و پیشگیری از خستگی دانش‌آموزان را اعمال می‌کند.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    badge: 'بهینه‌سازی هوشمند',
  },
  {
    title: 'رایگان، در دسترس و واکنش‌گرا',
    desc: 'سامانه به صورت رایگان، بدون تبلیغات مزاحم و سازگار با انواع دستگاه‌ها اعم از رایانه، تبلت و تلفن همراه در دسترس فرهنگیان عزیز است.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    badge: 'دسترسی همگانی',
  },
]

const featuresOverview = [
  { title: 'چیدمان برنامه هفتگی مدارس', desc: 'برنامه‌ریزی خودکار چندکلاسه با پیش‌بینی ساعات معلمان و درس ورزش' },
  { title: 'چیدمان ضدتقلب صندلی‌های آزمون', desc: 'توزیع متقاطع و شطرنجی داوطلبان پایه‌های مختلف در سالن‌های امتحان' },
  { title: 'بانک سوال و آزمون‌ساز هوشمند', desc: 'تولید آزمون‌های استاندارد تستی و تشریحی همراه با کلید تصحیح' },
  { title: 'طرح درس الکترونیک معلمان', desc: 'زمان‌بندی گام‌به‌گام تدریس و خروجی چاپی مطابق فرم‌های مصوب' },
  { title: 'حضور و غیاب و سرویس مدارس', desc: 'ثبت و پایش سریع تردد دانش‌آموزان، مدیریت رانندگان و هزینه‌ها' },
  { title: 'آزمایشگاه علوم و بازی‌های یادگیری', desc: 'محیط شبیه‌سازی علوم و بازی‌های تعاملی محاسباتی برای دانش‌آموزان' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors">
    <AppHeader />

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <!-- بنر اصلی معرفی با نشان نسخه -->
      <div class="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-10">
        <div class="flex flex-col items-center text-center">
          <div class="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <span class="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
            <span>سامانه یکپارچه مدیریار · نسخه ۲.۴</span>
          </div>

          <h1 class="mt-4 text-3xl font-black text-ink-900 sm:text-4xl dark:text-ink-100">
            هوشمندسازی و سهولت در مدیریت مدارس
          </h1>
          <p class="mx-auto mt-3 max-w-2xl text-xs sm:text-sm leading-7 text-ink-500 dark:text-ink-400">
            مدیریار با هدف ساده‌سازی، حذف خطاهای انسانی و صرفه‌جویی در زمان گران‌بهای مدیران، معاونان و معلمان گرامی سراسر کشور طراحی شده است تا پیچیده‌ترین محاسبات کلاسی و اداری را به چند کلیک ساده تبدیل کند.
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <RouterLink
              to="/tools"
              class="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95"
            >
              <span>مشاهده و شروع ابزارها</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>

            <RouterLink
              to="/guide"
              class="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-xs font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-ink-600"
            >
              <span>مطالعه راهنمای سامانه</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- کارت‌های ۴ ستون اصول اساسی مدیریار -->
      <div class="mt-10">
        <div class="text-center">
          <h2 class="text-xl font-bold text-ink-900 sm:text-2xl dark:text-ink-100">
            ارزش‌ها و اصول بنیادین
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-ink-500 dark:text-ink-400">
            چهار اصل محوری که تاروپود مدیریار بر اساس آن‌ها بنا شده است
          </p>
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-2">
          <div
            v-for="pillar in pillars"
            :key="pillar.title"
            class="flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-900"
          >
            <div>
              <div class="flex items-center justify-between">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                    <path :d="pillar.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <span class="rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  {{ pillar.badge }}
                </span>
              </div>
              <h3 class="mt-4 text-base font-extrabold text-ink-900 dark:text-ink-100">
                {{ pillar.title }}
              </h3>
              <p class="mt-2 text-xs leading-6 text-ink-600 dark:text-ink-300">
                {{ pillar.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- معرفی امکانات و چشم‌انداز -->
      <div class="mt-12 rounded-3xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <h2 class="text-lg font-bold text-ink-900 dark:text-ink-100">
          امکانات یکپارچه در خدمت مدرسه هوشمند
        </h2>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
          پوشش کامل نیازهای آموزشی، اجرایی، پرورشی و ارزشیابی مدرسه در یک محیط منسجم
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feat in featuresOverview"
            :key="feat.title"
            class="rounded-xl border border-ink-100 bg-ink-50/50 p-4 transition hover:bg-white dark:border-ink-800/70 dark:bg-ink-850/40 dark:hover:bg-ink-800/60"
          >
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <h3 class="text-xs font-bold text-ink-800 dark:text-ink-200">{{ feat.title }}</h3>
            </div>
            <p class="mt-2 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{{ feat.desc }}</p>
          </div>
        </div>
      </div>

      <!-- کارت معرفی توسعه‌دهنده -->
      <div class="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-brand-950 to-ink-900 p-6 text-white shadow-xl dark:border dark:border-ink-800 sm:p-8">
        <div class="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start text-center md:text-right">
          <div>
            <span class="inline-block rounded-lg bg-white/10 px-3 py-1 text-[11px] font-bold text-brand-200 backdrop-blur-sm">
              طراحی و توسعه
            </span>
            <h3 class="mt-3 text-xl font-extrabold sm:text-2xl text-white">
              محمدحسین کرمی
            </h3>
            <p class="mt-1 text-xs leading-6 text-ink-300 max-w-xl">
              توسعه‌دهنده وب و سامانه‌های هوشمند آموزشی. مدیریار حاصل ساعت‌ها پژوهش، طراحی و گفتگو با معلمان و مدیران زحمتکش مدارس کشور است تا تجربه‌ای لذت‌بخش و بی‌دغدغه در مدیریت تحصیلی خلق شود.
            </p>
          </div>

          <div class="flex flex-col gap-2.5 sm:flex-row md:flex-col">
            <a
              href="https://mhkarami97.ir"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>وب‌سایت شخصی (mhkarami97.ir)</span>
            </a>

            <RouterLink
              to="/contact"
              class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500"
            >
              <span>راه‌های ارتباط و بازخورد</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
