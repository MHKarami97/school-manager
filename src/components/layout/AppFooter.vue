<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer id="contact" class="border-t border-ink-100 bg-white">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">م</span>
          <span class="text-base font-bold text-ink-800">مدیریار</span>
        </div>
        <p class="mt-3 text-sm leading-6 text-ink-500">
          ابزار رایگان و آفلاین برای چیدن، ویرایش و چاپ برنامه هفتگی کلاس‌های ابتدایی، متوسطه اول و دوم.
          تمام داده‌ها فقط در مرورگر شما ذخیره می‌شود.
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-ink-800">تماس با ما</h3>
        <ul class="mt-3 space-y-2 text-sm text-ink-500">
          <li>
            ایمیل:
            <a href="mailto:mhkarami97@gmail.com" class="text-brand-600 hover:underline">mhkarami97@gmail.com</a>
          </li>
          <li>
            وب‌سایت:
            <a href="https://mhkarami97.ir" target="_blank" rel="noopener" class="text-brand-600 hover:underline">mhkarami97.ir</a>
          </li>
          <li>
            تلگرام:
            <a href="https://t.me/mhkarami_97" target="_blank" rel="noopener" class="text-brand-600 hover:underline">@mhkarami_97</a>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-ink-800">دسترسی سریع</h3>
        <ul class="mt-3 space-y-2 text-sm text-ink-500">
          <li><a href="#features" class="hover:text-brand-600">امکانات</a></li>
          <li><a href="#guide" class="hover:text-brand-600">راهنمای استفاده</a></li>
          <li><a href="#about" class="hover:text-brand-600">درباره ما</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
      © {{ year }} مدیریار — تمام حقوق محفوظ است.
    </div>
  </footer>
</template>
