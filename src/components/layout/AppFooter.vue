<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer id="contact" class="border-t border-ink-100 bg-white transition-colors dark:border-ink-800 dark:bg-ink-950">
    <!-- ۱. نمای اختصاصی اپلیکیشن برای موبایل (کاملاً مینیمال، سبک و حذف ظاهر وب‌سایتی سنتی برای نسخه APK) -->
    <div class="block md:hidden px-4 py-5 pb-24 text-center">
      <div class="flex items-center justify-center gap-2">
        <AppLogo size="sm" />
        <span class="text-sm font-extrabold text-ink-900 dark:text-white">مدیریار</span>
        <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          نسخه ۱.۰
        </span>
      </div>
      <p class="mt-1 text-[11px] text-ink-400 dark:text-ink-400">
        سامانه هوشمند و یکپارچه آموزشگاهی
      </p>

      <!-- پیوندهای دسترسی سریع مینیمال -->
      <div class="mt-3 flex items-center justify-center gap-2 text-xs">
        <RouterLink
          to="/guide"
          class="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300"
        >
          راهنما
        </RouterLink>
        <span class="text-slate-300 dark:text-ink-700">·</span>
        <RouterLink
          to="/about"
          class="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300"
        >
          درباره برنامه
        </RouterLink>
        <span class="text-slate-300 dark:text-ink-700">·</span>
        <RouterLink
          to="/contact"
          class="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300"
        >
          پشتیبانی
        </RouterLink>
      </div>

      <div class="mt-3 text-[10px] text-ink-400 dark:text-ink-400">
        © {{ year }} سامانه هوشمند مدیریار
      </div>
    </div>

    <!-- ۲. نمای کامل دایرکتوری و ستون‌های پیوند برای نمایش در دسکتاپ و تبلت -->
    <div class="hidden md:block">
      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <!-- ستون ۱: معرفی مدیریار -->
          <div class="space-y-4">
            <div class="flex items-center gap-2.5">
              <AppLogo size="md" />
              <div class="flex flex-col">
                <span class="text-base font-extrabold text-ink-900 dark:text-white">مدیریار</span>
                <span class="text-10px font-medium text-ink-400 dark:text-ink-400">سامانه هوشمند و یکپارچه مدارس</span>
              </div>
            </div>
            <p class="text-xs leading-6 text-ink-500 dark:text-ink-400">
              سامانه جامع و امن برای برنامه‌ریزی امور آموزشی، مدیریت اجرایی مدرسه، و ایجاد محیطی تعاملی برای آزمایش و یادگیری دانش‌آموزان.
            </p>
          </div>

          <!-- ستون ۲: ابزارهای مدیریت مدرسه -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">مدیریت و امور مدرسه</h3>
            <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
              <li>
                <RouterLink to="/wizard" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  چیدمان خودکار برنامه هفتگی
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/students" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  گروه‌بندی عادلانه کلاس‌ها
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/teaching-plans/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  چارت و تخصیص معلمان به کلاس
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/exam-seating/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  چیدمان ضدتقلب صندلی‌های امتحان
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/attendance" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  حضور و غیاب دانش‌آموزان
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/service/drivers" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  مدیریت سرویس مدارس و رانندگان
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/budget" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  بودجه و مالی مدرسه
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- ستون ۳: معلمان، اولیا و دانش‌آموزان -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">آموزش و تعامل</h3>
            <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
              <li>
                <RouterLink to="/experiments" class="flex items-center gap-1.5 font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400">
                  <span>آزمایشگاه مجازی علوم</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/tools" class="flex items-center gap-1.5 font-semibold text-purple-600 transition hover:text-purple-700 dark:text-purple-400">
                  <span>بازی‌های یادگیری درسی</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/lesson-plans/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  طرح درس الکترونیک معلم
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/exams/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  بانک سوال و آزمون‌ساز
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/invitations/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  سامانه دعوت‌نامه و جلسات اولیا
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/elections/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  انتخابات شورای دانش‌آموزی و انجمن
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/extra-classes/new" class="transition hover:text-brand-600 dark:hover:text-brand-400">
                  کلاس‌های تقویتی و فوق‌برنامه
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- ستون ۴: ارتباط و دسترسی -->
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-200">ارتباط و دسترسی</h3>
            <ul class="mt-4 space-y-2.5 text-xs text-ink-500 dark:text-ink-400">
              <li>
                وب‌سایت:
                <a href="https://mhkarami97.ir" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                  mhkarami97.ir
                </a>
              </li>
              <li>
                ایمیل:
                <a href="mailto:mhkarami97@gmail.com" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                  mhkarami97@gmail.com
                </a>
              </li>
              <li>
                تلگرام:
                <a href="https://t.me/mhkarami_97" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                  @mhkarami_97
                </a>
              </li>
              <li class="pt-2">
                <div class="flex items-center gap-2">
                  <RouterLink to="/guide" class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:text-white">
                    راهنمای سامانه
                  </RouterLink>
                  <RouterLink to="/about" class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:text-white">
                    درباره ما
                  </RouterLink>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- نوار پایین فوتر دسکتاپ -->
      <div class="border-t border-ink-100 py-5 dark:border-ink-800">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p class="text-center text-xs text-ink-400 dark:text-ink-400 sm:text-right">
            © {{ year }} سامانه مدیریار · تمامی حقوق محفوظ است.
          </p>

          <div class="flex items-center gap-4 text-xs text-ink-500 dark:text-ink-400">
            <RouterLink to="/guide" class="transition hover:text-brand-600 dark:hover:text-brand-300">راهنمای سامانه</RouterLink>
            <span class="text-ink-300 dark:text-ink-700">·</span>
            <RouterLink to="/about" class="transition hover:text-brand-600 dark:hover:text-brand-300">درباره ما</RouterLink>
            <span class="text-ink-300 dark:text-ink-700">·</span>
            <RouterLink to="/contact" class="transition hover:text-brand-600 dark:hover:text-brand-300">تماس با ما</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
