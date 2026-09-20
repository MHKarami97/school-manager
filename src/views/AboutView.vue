<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const principles = [
  {
    title: 'مبتنی بر اسناد رسمی',
    body: 'ساعت هفتگی درس‌های هر پایه بر اساس جدول‌های مصوب رسمی (دوره ابتدایی، دوره اول متوسطه و مصوبه شورای عالی آموزش و پرورش برای دوره دوم متوسطه) وارد شده و در کد پروژه به‌صورت شفاف و قابل ویرایش نگه‌داری می‌شود.',
  },
  {
    title: 'حریم خصوصی داده‌ها',
    body: 'مدیریار هیچ بک‌اند یا سروری برای ذخیره اطلاعات ندارد. نام معلم‌ها و برنامه‌های ساخته‌شده فقط در حافظه مرورگر همان دستگاه (IndexedDB) نگه‌داری می‌شوند و هیچ‌گاه به بیرون ارسال نمی‌شوند.',
  },
  {
    title: 'رعایت دقیق قوانین چیدمان',
    body: 'موتور چیدمان به‌گونه‌ای طراحی شده که قوانین عدم تکرار طولی و عرضی درس‌ها، استثنای قرآن در زنگ اول و استثنای ورزش را رعایت کند، و در متوسطه اول/دوم بار تدریس را عادلانه بین معلم‌های هر درس تقسیم کند.',
  },
  {
    title: 'متن‌باز و رایگان',
    body: 'کد کامل پروژه روی گیت‌هاب منتشر شده تا مدیران، معاونان و معلمان بتوانند آزادانه آن را برای شرایط خاص مدرسه خودشان (رشته تحصیلی، ساعت‌بندی ویژه) شخصی‌سازی کنند.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50">
    <AppHeader />

    <main class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div class="mb-10 text-center">
        <h1 class="text-2xl font-bold text-ink-900 sm:text-3xl">درباره مدیریار</h1>
        <p class="mt-3 text-ink-500">چرا این ابزار ساخته شد و بر چه اصولی تکیه دارد.</p>
      </div>

      <div class="rounded-2xl border border-ink-100 bg-white p-6 leading-7 text-ink-700">
        <p>
          چیدن برنامه هفتگی یک کلاس یا یک مدرسه - با رعایت قوانین آموزشی، جلوگیری از تداخل و تکرار درس‌ها، و توزیع
          عادلانه ساعت تدریس بین چند معلم - کاری زمان‌بر و قُرخطاست که معمولاً به‌صورت دستی روی کاژذ یا اکسل
          انجام می‌شود. <strong>مدیریار</strong> این فرایند را به یک ویزارد چند دقیقه‌ای تبدیل می‌کند: شما فقط دوره، پایه،
          شیفت و معلم‌ها را مشخص می‌کنید و موتور داخلی برنامه، نسخه اول برنامه را می‌سازد؛ سپس با ویرایشگر
          درگودراپ می‌توانید هر جزئیاتی را دستی اصلاح کنید.
        </p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div v-for="item in principles" :key="item.title" class="rounded-2xl border border-ink-100 bg-white p-5">
          <h2 class="text-sm font-semibold text-ink-800">{{ item.title }}</h2>
          <p class="mt-2 text-sm leading-6 text-ink-500">{{ item.body }}</p>
        </div>
      </div>

      <div class="mt-8 rounded-2xl bg-ink-900 p-6 text-center text-white">
        <p class="text-sm leading-7 text-ink-200">
          مدیریار توسط
          <a href="https://mhkarami97.ir" target="_blank" rel="noopener" class="font-semibold text-white hover:underline">
            محمدحسین کرمی
          </a>
          طراحی و توسعه داده شده است.
        </p>        
      </div>
    </main>

    <AppFooter />
  </div>
</template>
