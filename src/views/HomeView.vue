<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useWizardStore } from '@/stores/wizard'

const router = useRouter()
const wizardStore = useWizardStore()
const canContinue = ref(false)

onMounted(() => {
  canContinue.value = wizardStore.hasInProgressSession
})

function startFresh(): void {
  wizardStore.reset()
  router.push('/wizard')
}

function continueSession(): void {
  wizardStore.restore()
  router.push('/wizard')
}

const features = [
  {
    title: 'چیدمان خودکار و قانون‌مند',
    desc: 'برنامه با رعایت دقیق قوانین آموزشی مثل عدم تکرار طولی و عرضی درس‌ها، جایگاه ثابت قرآن در زنگ اول و استثنای ورزش ساخته می‌شود.',
    icon: 'M9 3v18M15 3v18M3 9h18M3 15h18',
  },
  {
    title: 'کاملاً قابل تنزیم',
    desc: 'پایه‌ها، درس‌ها، ساعت هفتگی هر درس، شیفت صبح/ظهر، طول زنگ و تفریح، همه به‌صورت کانفیگ و قابل ویرایش هستند.',
    icon: 'M4 6h16M4 12h10M4 18h6',
  },
  {
    title: 'مناسب ابتدایی و متوسطه',
    desc: 'در ابتدایی برنامه با محوریت یک معلم و در متوسطه اول/دوم با چند معلم تخصصی و توزیع عادلانه ساعت تدریس چیده می‌شود.',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0v7',
  },
  {
    title: 'ویرایش دستی نتیجه',
    desc: 'بعد از چیدمان خودکار، هر خانه از جدول قابل جابجایی و ویرایش دستی است تا نتیجه دقیقاً مطابق نیاز شما باشد.',
    icon: 'M4 20h4l10-10-4-4L4 16v4z',
  },
  {
    title: 'خروجی PDF و تصویر',
    desc: 'برنامه نهایی را با ظاهر مرتب و فارسی به‌صورت PDF (از طریق چاپ مرورگر) یا فایل تصویری دریافت کنید.',
    icon: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
  },
  {
    title: 'نصب روی گوشی و کامپیوتر',
    desc: 'مدیریار یک وب‌اپلیکیشن نصب‌شونده (PWA) است؛ حتی بدون اینترنت هم روی دستگاه شما اجرا می‌شود.',
    icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
]

const steps = [
  { title: 'انتخاب مخاطب', desc: 'مشخص می‌کنید برنامه را برای خودتان به‌عنوان یک معلم می‌سازید یا برای کل مدرسه.' },
  { title: 'انتخاب دوره و پایه', desc: 'ابتدایی، متوسطه اول یا دوم را انتخاب و پایه‌های مورد نظر را مشخص می‌کنید.' },
  { title: 'تنظیم شیفت و زمان‌بندی', desc: 'شیفت صبح/ظهر، ساعت شروع و پایان، طول زنگ و تفریح را تایید یا ویرایش می‌کنید.' },
  { title: 'معرفی معلم‌ها', desc: 'در ابتدایی نام معلم و در متوسطه لیست معلم‌های هر درس را وارد می‌کنید (با تکمیل خودکار از سابقه).' },
  { title: 'ساخت، ویرایش و چاپ', desc: 'برنامه به‌صورت خودکار ساخته می‌شود؛ آن را ویرایش، ذخیره و در نهایت چاپ یا خروجی تصویر بگیرید.' },
]
</script>

<template>
  <div class="min-h-screen bg-ink-50">
    <AppHeader />

    <main>
      <section class="relative overflow-hidden">
        <div class="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-transparent"></div>
        <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div class="mx-auto max-w-3xl text-center">
            <span class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              مخصوص مدیران، معاونان و معلمان
            </span>
            <h1 class="mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
              برنامه هفتگی کلاس را در چند دقیقه، قانون‌مند و بی‌نقص بچینید
            </h1>
            <p class="mt-4 text-base leading-7 text-ink-500 sm:text-lg">
              مدیریار برای دوره‌های ابتدایی، متوسطه اول و متوسطه دوم، برنامه هفتگی را بر اساس قوانین رسمی آموزشی
              می‌سازد؛ شما فقط پایه، شیفت و معلم‌ها را مشخص می‌کنید.
            </p>
            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                class="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 sm:w-auto"
                @click="startFresh"
              >
                شروع ساخت برنامه جدید
              </button>
              <button
                v-if="canContinue"
                type="button"
                class="w-full rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-700 transition hover:border-brand-300 sm:w-auto"
                @click="continueSession"
              >
                ادامه‌ی برنامه‌ی نیمه‌کاره
              </button>
              <RouterLink
                v-else
                to="/schedules"
                class="w-full rounded-xl border border-ink-200 bg-white px-6 py-3 text-center text-sm font-semibold text-ink-700 transition hover:border-brand-300 sm:w-auto"
              >
                مشاهده‌ی برنامه‌های ذخیره‌شده
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-bold text-ink-900 sm:text-3xl">همه‌چیز برای یک برنامه‌ریزی دقیق</h2>
          <p class="mt-3 text-ink-500">امکاناتی که ساخت و مدیریت برنامه هفتگی مدرسه را ساده و سریع می‌کند.</p>
        </div>

        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                <path :d="feature.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="mt-4 text-base font-semibold text-ink-800">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-ink-500">{{ feature.desc }}</p>
          </div>
        </div>
      </section>

      <section id="guide" class="bg-white py-16">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-2xl font-bold text-ink-900 sm:text-3xl">راهنمای استفاده در ۵ گام</h2>
            <p class="mt-3 text-ink-500">از انتخاب پایه تا دریافت خروجی چاپی، مسیری کوتاه و بدون پیچیدگی.</p>
          </div>

          <ol class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="relative rounded-2xl border border-ink-100 p-5"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {{ index + 1 }}
              </span>
              <h3 class="mt-4 text-sm font-semibold text-ink-800">{{ step.title }}</h3>
              <p class="mt-2 text-xs leading-6 text-ink-500">{{ step.desc }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="about" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div class="grid gap-10 rounded-3xl bg-ink-900 p-8 sm:p-12 md:grid-cols-2">
          <div>
            <h2 class="text-2xl font-bold text-white sm:text-3xl">درباره مدیریار</h2>
            <p class="mt-4 leading-7 text-ink-300">
              مدیریار برای کاهش ساعت‌ها کار دستی مدیران و معاونان اجرایی مدارس در چیدن برنامه هفتگی طراحی شده است.
              تمام محاسبات در همان مرورگر شما انجام می‌شود؛ نیازی به سرور یا اتصال دائم به اینترنت نیست و
              اطلاعات معلم‌ها و برنامه‌های ذخیره‌شده فقط روی دستگاه شما باقی می‌مانند.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-6 self-center">
            <div class="rounded-2xl bg-white/5 p-5 text-center">
              <p class="text-3xl font-extrabold text-white">۳</p>
              <p class="mt-1 text-xs text-ink-300">دوره تحصیلی پشتیبانی‌شده</p>
            </div>
            <div class="rounded-2xl bg-white/5 p-5 text-center">
              <p class="text-3xl font-extrabold text-white">۲</p>
              <p class="mt-1 text-xs text-ink-300">شیفت صبح و ظهر</p>
            </div>
            <div class="rounded-2xl bg-white/5 p-5 text-center">
              <p class="text-3xl font-extrabold text-white">۱۰۰٪</p>
              <p class="mt-1 text-xs text-ink-300">اجرا در مرورگر، بدون سرور</p>
            </div>
            <div class="rounded-2xl bg-white/5 p-5 text-center">
              <p class="text-3xl font-extrabold text-white">آزاد</p>
              <p class="mt-1 text-xs text-ink-300">متن‌باز روی گیت‌هاب</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>
