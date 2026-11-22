<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { ATTENDANCE_GUIDE_STEPS } from "@/config/attendance-guide.config";
import { SERVICE_GUIDE_STEPS } from "@/config/service-guide.config";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";

interface GuideStep {
  title: string;
  body: string;
}

interface GuideSection {
  id: string;
  category: "schedule" | "classes" | "exam" | "operations" | "learning";
  title: string;
  shortTitle: string;
  badge: string;
  icon: string;
  steps: GuideStep[];
}

const steps: GuideStep[] = [
  {
    title: "۱. انتخاب مخاطب",
    body: "در صفحه شروع مشخص می‌کنید برنامه را برای خودتان به‌عنوان یک معلم (پایه ابتدایی) می‌سازید یا برای کل مدرسه. اگر برای مدرسه باشد، نام مدرسه هم گرفته می‌شود تا در عنوان و خروجی چاپی نمایش داده شود.",
  },
  {
    title: "۲. انتخاب دوره و پایه",
    body: "دوره تحصیلی (ابتدایی، متوسطه اول یا متوسطه دوم) و سپس یک یا چند پایه از همان دوره را انتخاب می‌کنید. درس‌ها و ساعت هفتگی هر پایه از قبل بر اساس اسناد رسمی وزارت آموزش‌وپرورش در برنامه تعریف شده و قابل ویرایش است.",
  },
  {
    title: "۳. تنظیم شیفت و زمان‌بندی",
    body: "شیفت صبح یا ظهر را انتخاب می‌کنید. مقادیر پیش‌فرض (شروع، پایان، طول زنگ ۴۵ دقیقه، تفریح ۱۵ دقیقه) از قبل پر شده‌اند اما همه قابل ویرایش هستند؛ از جمله فعال‌کردن زنگ تفریح ناهار برای شیفت‌های طولانی‌تر.",
  },
  {
    title: "۴. معرفی معلم‌ها",
    body: "در ابتدایی، نام معلم اصلی هر پایه (و در صورت نیاز معلم جداگانه ورزش) را وارد می‌کنید. در متوسطه اول و دوم، برای هر درس می‌توانید یک یا چند معلم ثبت کنید؛ نام‌های قبلاً واردشده در سیستم ذخیره می‌شوند و در دفعات بعدی به‌صورت پیشنهاد در دسترس هستند.",
  },
  {
    title: "۵. بازبینی قوانین چیدمان",
    body: "قبل از ساخت نهایی، فهرست کامل قوانینی که برنامه بر اساس آن‌ها چیده می‌شود (عدم تکرار درس، جایگاه قرآن، چسبیدن انشا/املا به فارسی و...) نمایش داده می‌شود؛ می‌توانید هرکدام را فعال یا غیرفعال کنید.",
  },
  {
    title: "۶. ساخت خودکار برنامه",
    body: "با کلیک روی «ساخت برنامه هفتگی»، موتور هوشمند برنامه را می‌چیند. قوانینی که همواره پایش می‌شوند: عدم تکرار درس در یک روز، عدم تکرار در زنگ مشابه در روزهای مختلف، قرارگیری درس قرآن در ساعت مناسب و توزیع عادلانه ساعات بین معلمان.",
  },
  {
    title: "۷. ویرایش دستی نتیجه",
    body: "بعد از ساخت، دکمه «ویرایش برنامه» را بزنید. برای جابجایی دو زنگ، یکی را بکشید (Drag) و روی دیگری رها کنید؛ برای تغییر درس یا معلم یک زنگ خاص، روی همان خانه کلیک کنید و در پایان ذخیره نمایید.",
  },
  {
    title: "۸. چاپ، خروجی تصویر و ذخیره",
    body: "با دکمه «چاپ / PDF» خروجی استاندارد افقی A4 دریافت کنید. با «دانلود تصویر» فایل باکیفیت جدول را ذخیره کنید. تمام برنامه‌های ساخته‌شده در سوابق ذخیره و هر زمان قابل ویرایش مجدد هستند.",
  },
];

const groupingSteps: GuideStep[] = [
  {
    title: "۱. ثبت دانش‌آموزان",
    body: "از صفحه «دانش‌آموزان»، برای هر پایه دانش‌آموزان را تکی یا با ورود گروهی (چند خط با نام، نام‌خانوادگی و جنسیت) ثبت کنید. معدل، امتیاز انضباط و ویژگی‌های علمی هر فرد نیز قابل تعیین است.",
  },
  {
    title: "۲. تعیین پارامترهای گروه‌بندی",
    body: "روی «گروه‌بندی عادلانه این پایه» کلیک کنید؛ جنسیت هدف، تعداد کلاس‌ها یا گروه‌ها، حداکثر ظرفیت و امتیاز سابقه معلم هر گروه را مشخص کنید.",
  },
  {
    title: "۳. بازبینی قوانین گروه‌بندی",
    body: "پیش از ساخت، قوانین (تفکیک جنسیتی، پرهیز از هم‌نامی، توازن معدل و انضباط، تخصیص دانش‌آموز نیازمند تلاش به معلم باتجربه‌تر) با وزن قابل تنظیم نمایش داده می‌شوند.",
  },
  {
    title: "۴. ساخت و ویرایش دستی",
    body: "موتور گروه‌بندی به‌صورت خودکار گروه‌ها را می‌سازد و آمار تفکیکی هر کلاس را نشان می‌دهد. با کشیدن یک دانش‌آموز و رها کردن روی کارت گروه دیگر، نتیجه را دستی اصلاح کنید.",
  },
  {
    title: "۵. ذخیره و ارتقای پایان سال",
    body: "با دکمه «ذخیره گروه‌ها» نتیجه نهایی ثبت می‌شود. در پایان سال تحصیلی، می‌توانید یک یا چند دانش‌آموز را انتخاب و «ارتقا به پایه بعد» را بزنید تا اطلاعات سال جدید آماده شود.",
  },
];

const lessonPlanSteps: GuideStep[] = [
  {
    title: "۱. ساخت طرح درس جدید",
    body: "از صفحه «طرح درس معلم‌ها» روی «طرح درس جدید» بزنید، معلم، درس، پایه و تاریخ جلسه را انتخاب و اهداف، روش تدریس، منابع و ارزشیابی را درج کنید.",
  },
  {
    title: "۲. زمان‌بندی جلسه تدریس",
    body: "در بخش «بخش‌های زمان‌بندی‌شده جلسه»، هر مرحله از تدریس (مقدمه، ارائه درس، کارورزی، تمرین، جمع‌بندی) را با مدت‌زمان تخمینی به دقیقه ثبت کنید.",
  },
  {
    title: "۳. کپی برای جلسه بعد",
    body: "روی دکمه «کپی برای جلسه بعد» بزنید تا محتوای طرح درس فعلی به‌عنوان الگو برای جلسه جدید کپی شود؛ فقط کافی است تاریخ و شماره هفته را به‌روزرسانی کنید.",
  },
  {
    title: "۴. تاریخچه و نسخه‌بندی",
    body: "هر بار که یک طرح درس را ویرایش و ذخیره می‌کنید، نسخه‌های قبلی آن در سوابق بایگانی می‌شوند و همواره می‌توانید تغییرات گذشته را مرور کنید.",
  },
  {
    title: "۵. خروجی استاندارد چاپ و PDF",
    body: "با انتخاب «خروجی PDF»، طرح درس در قالب استاندارد مصوب آموزش و پرورش جهت ارائه به مدیریت یا بایگانی کلاسی آماده چاپ می‌شود.",
  },
];

const sportPlanSteps: GuideStep[] = [
  {
    title: "۱. شروع برنامه ورزش",
    body: "از بخش «برنامه ورزش» ساخت برنامه جدید را انتخاب کنید. مقطع تحصیلی، پایه‌ها، تعداد کلاس‌ها و شیفت مدرسه را تعیین کنید.",
  },
  {
    title: "۲. انتخاب معلمان ورزش",
    body: "یک یا چند معلم ورزش را انتخاب کنید. سیستم ساعات حضور، سقف ساعات و دروس مجاز را بررسی می‌کند.",
  },
  {
    title: "۳. سالن یا زمین ورزشی",
    body: "امکان ثبت حیاط مشترک یا سالن‌های ورزشی با ظرفیت مجزا وجود دارد تا تداخل‌های مکانی بررسی شود.",
  },
  {
    title: "۴. بازبینی زنگ‌های ورزش",
    body: "تعداد زنگ‌های ورزش هفتگی هر کلاس را بر اساس سرفصل رسمی بررسی و در صورت نیاز ویرایش نمایید.",
  },
  {
    title: "۵. قانون مهم عدم هم‌زمانی",
    body: "سیستم مانع از تداخل هم‌زمان کلاس‌ها در حیاط یا سالن ورزشی مشترک می‌شود تا ایمنی و کیفیت کلاس حفظ شود.",
  },
  {
    title: "۶. ساخت خودکار، ویرایش دستی و چاپ",
    body: "برنامه با یک کلیک چیده می‌شود و در صورت نیاز از طریق درگ و دراپ قابل جابه‌جایی است. نسخه افقی A4 چاپ آماده دریافت است.",
  },
];

const attendanceSteps: GuideStep[] = ATTENDANCE_GUIDE_STEPS.map((step) => ({
  title: step.title,
  body: step.body,
}));

const serviceSteps: GuideStep[] = SERVICE_GUIDE_STEPS.map((step) => ({
  title: step.title,
  body: step.body,
}));

const celebrationSteps: GuideStep[] = [
  {
    title: "۱. ثبت جشن و رویداد جدید",
    body: "از صفحه «برنامه‌ریزی جشن‌ها» روی «جشن جدید» بزنید و عنوان، تاریخ شمسی، مکان برگزاری و همکار مسئول را وارد کنید.",
  },
  {
    title: "۲. چک‌لیست و بورد وظایف",
    body: "کارها را در ستون‌های «انجام‌نشده»، «در حال انجام» و «انجام‌شده» ثبت کرده و با کشیدن و رها کردن پیشرفت را مدیریت کنید.",
  },
  {
    title: "۳. سررسید و هشدارهای زمانی",
    body: "برای هر وظیفه موعد سررسید مشخص کنید؛ سیستم وظایف نزدیک به زمان برگزاری را با رنگ هشدار متمایز می‌کند.",
  },
  {
    title: "۴. برآورد و کنترل بودجه رویداد",
    body: "هزینه تخمینی و هزینه نهایی را ثبت کنید تا مغایرت‌های مالی بلافاصله محاسبه شوند.",
  },
  {
    title: "۵. تقویم سالانه و چاپ گزارش",
    body: "جشن‌های دوازده ماه سال شمسی را در نمای تقویم سالانه ببینید و گزارش خروجی چاپی دریافت کنید.",
  },
];

const electionSteps: GuideStep[] = [
  {
    title: "۱. تعریف انتخابات",
    body: "نوع رویداد (شورای دانش‌آموزی، انجمن اولیا و مربیان)، سال تحصیلی، بازه زمانی و تعداد کرسی‌های منتخب را مشخص کنید.",
  },
  {
    title: "۲. ثبت‌نام و پروفایل نامزدها",
    body: "مشخصات، عکس، کلاس و خلاصه اهداف و برنامه‌های هر نامزد انتخاباتی را درج کنید.",
  },
  {
    title: "۳. شمارش و ثبت آرا",
    body: "آرای مأخوذه را با شمارشگر افزایشی یا ورود مستقیم ثبت کنید؛ درصد آرا به صورت خودکار محاسبه می‌شود.",
  },
  {
    title: "۴. نمودار نتایج و صورت‌جلسه رسمی",
    body: "نمودار میله‌ای نتایج و فهرست منتخبین بر اساس سقف کرسی‌ها نمایش داده شده و خروجی صورت‌جلسه برای تابلو اعلانات تولید می‌شود.",
  },
];

const extraClassSteps: GuideStep[] = [
  {
    title: "۱. ایجاد کلاس تقویتی و فوق‌برنامه",
    body: "عنوان، معلم مدرس، ظرفیت، پایه‌های مجاز، روزها و ساعت و شهریه دوره را تعیین کنید.",
  },
  {
    title: "۲. ثبت‌نام دانش‌آموزان و لیست انتظار",
    body: "دانش‌آموزان را به کلاس اضافه کنید؛ در صورت تکمیل ظرفیت، افراد به صورت خودکار در لیست انتظار قرار می‌گیرند.",
  },
  {
    title: "۳. پایش تداخل زمانی",
    body: "سامانه تداخل ساعت دانش‌آموز با سایر کلاس‌های ثبت‌نامی و برنامه هفتگی را کنترل می‌کند.",
  },
  {
    title: "۴. برنامه زمانی هفتگی و گزارش کلاسی",
    body: "تقویم هفتگی کلاس‌ها و لیست امضای دانش‌آموزان برای دبیر با یک کلیک چاپ می‌شود.",
  },
];

const budgetSteps: GuideStep[] = [
  {
    title: "۱. تعریف سال مالی و سقف بودجه",
    body: "سال تحصیلی را انتخاب و برآورد بودجه کلی مدرسه را مشخص کنید.",
  },
  {
    title: "۲. سرفصل‌ها و دسته‌بندی هزینه‌ها",
    body: "سرفصل‌هایی چون تجهیزات آموزشی، تعمیرات و نگهداری، بهداشت، رویدادها و امور اداری را با سهمیه سالانه تعریف کنید.",
  },
  {
    title: "۳. ثبت دریافت‌ها و پرداخت‌ها",
    body: "تراکنش‌های روزانه را با مبلغ، تاریخ شمسی، کد پیگیری و پیوست تصویر فاکتور ذخیره کنید.",
  },
  {
    title: "۴. نمودارهای تحلیلی و گزارش تراز مالی",
    body: "نمودارهای توازن بودجه و گزارش رسمی هزینه‌کرد دوره‌ای را در فرمت A4 چاپ کنید.",
  },
];

const questionBankSteps: GuideStep[] = [
  {
    title: "۱. ثبت انواع سوال در بانک سوالات",
    body: "سوالات چهارگزینه‌ای، تشریحی، جای‌خالی و صحیح/غلط را با درس، پایه، سطح دشواری و بارم درج کنید.",
  },
  {
    title: "۲. دسته‌بندی و فیلتر موضوعی",
    body: "سوالات را بر اساس مبحث کتاب درسی، میزان سختی و واژگان کلیدی فیلتر و جستجو نمایید.",
  },
  {
    title: "۳. انتقال با اکسل (Import / Export)",
    body: "قالب اکسل استاندارد را بارگیری، تکمیل و سوالات را به صورت یکجا وارد بانک کنید.",
  },
  {
    title: "۴. چیدمان آزمون و تولید نسخه‌های ضدتقلب",
    body: "سوالات را دستی یا با قالب درصدی به آزمون اضافه کرده و نسخه‌های چندگانه (تیپ‌های A و B) با گزینه‌های تصادفی تولید کنید.",
  },
  {
    title: "۵. چاپ برگه سوال و پاسخ‌نامه تشریحی",
    body: "برگه آزمون را با سربرگ رسمی مدرسه همراه یا بدون کلید پاسخ‌ها دریافت نمایید.",
  },
];

const invitationSteps: GuideStep[] = [
  {
    title: "۱. انتخاب الگوی رویداد",
    body: "الگوهای جلسه اولیا، جشن، دعوت به انتخابات، کارنامه یا اردوی تفریحی را با متن پیش‌فرض انتخاب کنید.",
  },
  {
    title: "۲. اطلاعات برگزاری و شخصی‌سازی متن",
    body: "تاریخ شمسی، ساعت، مکان و متغیرهایی نظیر نام دانش‌آموز یا کلاس را در متن بگنجانید تا برای هر نفر به صورت اختصاصی چاپ شود.",
  },
  {
    title: "۳. انتخاب مدعوین و برگه‌های بازخورد",
    body: "با یک کلیک کلیه دانش‌آموزان پایه یا کلاس را اضافه کرده و فیش پاسخگویی همراه را چاپ کنید.",
  },
  {
    title: "۴. لیست حضور و غیاب جلسه",
    body: "لیست الفبایی مدعوین همراه با جای امضا برای نظارت در روز جلسه آماده چاپ است.",
  },
];

const examSeatingSteps: GuideStep[] = [
  {
    title: "۱. تعریف سالن‌های آزمون",
    body: "ردیف‌ها و ستون‌های صندلی‌ها را مشخص کرده و جایگاه ستون‌ها یا فضاهای خالی را علامت بزنید.",
  },
  {
    title: "۲. افزودن داوطلبان و تعیین پایه‌ها",
    body: "دانش‌آموزان پایه‌های مختلف را جهت چیدمان تلفیقی به سالن اختصاص دهید.",
  },
  {
    title: "۳. قوانین ضدتقلب و تفکیک هم‌پایه‌ها",
    body: "سیستم دانش‌آموزان هم‌پایه را به صورت شطرنجی یا ستونی پخش می‌کند تا امکان تقلب به صفر برسد.",
  },
  {
    title: "۴. کارت صندلی و نقشه سالن",
    body: "کارت ورود به جلسه الصاقی روی صندلی و نقشه چاپی ورودی سالن بلافاصله آماده خروجی است.",
  },
];

const teachingPlanSteps: GuideStep[] = [
  {
    title: "۱. ثبت مشخصات معلمان و ساعات تدریس",
    body: "دروس تخصصی، پایه‌های مجاز و روزهای حضور و سقف ساعت هفتگی هر همکار را ثبت نمایید.",
  },
  {
    title: "۲. تعریف نیازمندی دروس پایه‌ها",
    body: "ساعات مصوب درسی هر کلاس را بر اساس سرفصل آموزشی تعیین کنید.",
  },
  {
    title: "۳. موتور هوشمند تخصیص",
    body: "سیستم بهینه‌ترین ترکیب معلمان برای کلاس‌ها را با رعایت سقف ساعات و ترجیحات پیشنهاد می‌دهد.",
  },
  {
    title: "۴. ویرایش روی چارت و خروجی ابلاغ",
    body: "ابلاغ تدریس کلاسی هر دبیر و جدول تجمیعی مدرسه را به صورت تفکیک‌شده چاپ کنید.",
  },
];

const learningSteps: GuideStep[] = [
  {
    title: "۱. آزمایشگاه مجازی علوم تجربی",
    body: "آزمایشگاه شبیه‌سازی علوم با بیش از ۱۶ آزمایش تعاملی در فیزیک، شیمی، زیست و زمین‌شناسی؛ مناسب ارائه‌های هوشمند کلاسی یا یادگیری در منزل.",
  },
  {
    title: "۲. بازی‌های یادگیری و مسابقات درسی",
    body: "چهار بازی آموزشی تعاملی شامل پرتاب موشک محاسباتی، برج دفاعی دانایی، مسابقه سرعت کلمات و فتح قلمروهای دانش، همراه با رتبه‌بندی و مدال‌های فصلی.",
  },
  {
    title: "۳. پروفایل دانش‌آموز و چالش‌های روزانه",
    body: "امکان ثبت چند دانش‌آموز در یک دستگاه، کسب امتیاز تجربه، بازگشایی مدال‌های سال تحصیلی و نمودارهای پیشرفت هفتگی و ماهانه.",
  },
];

const sections: GuideSection[] = [
  {
    id: "schedule",
    category: "schedule",
    title: "ساخت برنامه هفتگی مدرسه",
    shortTitle: "برنامه هفتگی",
    badge: "بخش ۱",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    steps,
  },
  {
    id: "grouping",
    category: "classes",
    title: "گروه‌بندی عادلانه کلاس‌ها",
    shortTitle: "گروه‌بندی",
    badge: "بخش ۲",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    steps: groupingSteps,
  },
  {
    id: "lesson-plan",
    category: "schedule",
    title: "طرح درس الکترونیک معلم",
    shortTitle: "طرح درس",
    badge: "بخش ۳",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    steps: lessonPlanSteps,
  },
  {
    id: "sport",
    category: "schedule",
    title: "برنامه‌ریزی درس ورزش",
    shortTitle: "ورزش",
    badge: "بخش ۴",
    icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    steps: sportPlanSteps,
  },
  {
    id: "attendance",
    category: "classes",
    title: "حضور و غیاب دانش‌آموزان",
    shortTitle: "حضور و غیاب",
    badge: "بخش ۵",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    steps: attendanceSteps,
  },
  {
    id: "service",
    category: "operations",
    title: "مدیریت سرویس مدرسه",
    shortTitle: "سرویس",
    badge: "بخش ۶",
    icon: "M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h15l1 5H4V9zm0 0V6a2 2 0 012-2h10a2 2 0 012 2v3",
    steps: serviceSteps,
  },
  {
    id: "budget",
    category: "operations",
    title: "بودجه و برنامه مالی مدرسه",
    shortTitle: "مالی و بودجه",
    badge: "بخش ۷",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    steps: budgetSteps,
  },
  {
    id: "celebration",
    category: "operations",
    title: "جشن‌ها، اردوها و مناسبت‌ها",
    shortTitle: "جشن‌ها",
    badge: "بخش ۸",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    steps: celebrationSteps,
  },
  {
    id: "election",
    category: "operations",
    title: "انتخابات شورا و انجمن اولیا",
    shortTitle: "انتخابات",
    badge: "بخش ۹",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    steps: electionSteps,
  },
  {
    id: "extra-class",
    category: "classes",
    title: "کلاس‌های تقویتی و فوق‌برنامه",
    shortTitle: "فوق‌برنامه",
    badge: "بخش ۱۰",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    steps: extraClassSteps,
  },
  {
    id: "question-bank",
    category: "exam",
    title: "بانک سوال و آزمون‌ساز",
    shortTitle: "بانک سوال",
    badge: "بخش ۱۱",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    steps: questionBankSteps,
  },
  {
    id: "invitation",
    category: "operations",
    title: "دعوت‌نامه و جلسات اولیا",
    shortTitle: "دعوت‌نامه",
    badge: "بخش ۱۲",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    steps: invitationSteps,
  },
  {
    id: "exam-seating",
    category: "exam",
    title: "چیدمان صندلی امتحان",
    shortTitle: "صندلی امتحان",
    badge: "بخش ۱۳",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    steps: examSeatingSteps,
  },
  {
    id: "teaching-plan",
    category: "schedule",
    title: "تخصیص معلم به کلاس",
    shortTitle: "تخصیص معلم",
    badge: "بخش ۱۴",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    steps: teachingPlanSteps,
  },
  {
    id: "learning",
    category: "learning",
    title: "آزمایشگاه علوم و بازی‌های آموزشی",
    shortTitle: "آموزش و بازی‌ها",
    badge: "بخش ۱۵",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    steps: learningSteps,
  },
];

const categoryTabs = [
  { id: "all", label: "همه بخش‌ها" },
  { id: "schedule", label: "چیدمان و برنامه هفتگی" },
  { id: "classes", label: "دانش‌آموزان و کلاس‌ها" },
  { id: "exam", label: "آزمون و ارزشیابی" },
  { id: "operations", label: "امور اجرایی و مالی" },
  { id: "learning", label: "آموزش و بازی‌ها" },
];

const selectedCategory = ref<string>("all");
const searchQuery = ref<string>("");
const expandedSections = ref<Set<string>>(new Set(["schedule"]));

function toggleSection(id: string): void {
  if (expandedSections.value.has(id)) {
    expandedSections.value.delete(id);
  } else {
    expandedSections.value.add(id);
  }
}

function expandAll(): void {
  expandedSections.value = new Set(sections.map((s) => s.id));
}

function collapseAll(): void {
  expandedSections.value.clear();
}

const filteredSections = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return sections.filter((sec) => {
    const matchCat =
      selectedCategory.value === "all" || sec.category === selectedCategory.value;
    if (!matchCat) return false;

    if (!query) return true;
    const titleMatch = sec.title.toLowerCase().includes(query);
    const stepMatch = sec.steps.some(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.body.toLowerCase().includes(query)
    );
    return titleMatch || stepMatch;
  });
});

const faqs = ref([
  {
    q: "چرا برنامه هفتگی من کامل ساخته نشد یا با هشدار همراه شد؟",
    a: "اگر مجموع ساعات هفتگی یک یا چند درس از تعداد روزها و زنگ‌های مجاز فراتر باشد، یا محدودیت روزهای حضور معلمان مانع شود، سامانه هشدار داده و بخش‌های باقی‌مانده را می‌توانید در ویرایشگر دستی قرار دهید.",
    open: true,
  },
  {
    q: "چرا در برنامه ورزش برخی زنگ‌ها خالی ماند؟",
    a: "در برنامه ورزش برای حفظ ایمنی و کیفیت، در هر زنگ تنها یک کلاس اجازه استفاده از فضای ورزشی مشترک را دارد. با افزایش تعداد ساعات آزاد یا افزودن سالن ورزشی اختصاصی، ظرفیت افزایش می‌یابد.",
    open: false,
  },
  {
    q: "داده‌های سامانه کجا ذخیره می‌شوند و چگونه منتقل می‌شوند؟",
    a: "کلیه اطلاعات با امنیت کامل در محیط مرورگر شما نگهداری می‌شود. از بخش «تنظیمات» می‌توانید در هر زمان فایل پشتیبان تهیه کنید یا از همگام‌سازی ابری امن برای دسترسی در سایر دستگاه‌ها استفاده نمایید.",
    open: false,
  },
  {
    q: "چگونه چیدمان ضدتقلب در صندلی‌های آزمون اعمال می‌شود؟",
    a: "موتور چیدمان صندلی‌ها با الگوریتم‌های شطرنجی و ستونی، داوطلبان پایه‌ها و کلاس‌های مختلف را به گونه‌ای ترکیب می‌کند که افراد دارای سوالات یکسان مجاور یکدیگر قرار نگیرند.",
    open: false,
  },
]);
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-0 dark:bg-ink-950 transition-colors">
    <AppHeader />

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <!-- سربرگ شیک و کاربردی -->
      <div class="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>دانشنامه جامع کاربری مدیریار</span>
          </div>

          <h1 class="mt-3 text-2xl font-black text-ink-900 sm:text-3xl dark:text-ink-100">
            راهنمای کامل گام‌به‌گام سامانه
          </h1>
          <p class="mx-auto mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-ink-500 dark:text-ink-400">
            راهنمای جامع کار با تمامی ابزارهای آموزشی، مدیریتی، مالی و آزمایشگاهی سامانه؛ از راه‌اندازی تا چاپ و بهره‌برداری.
          </p>

          <!-- جستجوگر سریع موضوعات -->
          <div class="mx-auto mt-6 max-w-lg">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="جستجو در موضوعات و دستورالعمل‌ها..."
                class="w-full rounded-2xl border border-ink-200 bg-ink-50/70 py-3 pe-4 ps-10 text-xs text-ink-800 placeholder-ink-400 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-800/90 dark:text-ink-100 dark:placeholder-ink-500 sm:text-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="absolute start-3.5 top-3.5 h-4 w-4 text-ink-400">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <button
                v-if="searchQuery"
                type="button"
                class="absolute end-3 top-3 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                @click="searchQuery = ''"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- فیلتر دسته‌بندی و دکمه‌های باز/بسته کردن همه -->
        <div class="mt-8 pt-6 border-t border-ink-100 dark:border-ink-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="tab in categoryTabs"
              :key="tab.id"
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
              :class="[
                selectedCategory === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700 dark:hover:text-white'
              ]"
              @click="selectedCategory = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 font-semibold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
              @click="expandAll"
            >
              باز کردن همه
            </button>
            <button
              type="button"
              class="rounded-lg border border-ink-200 bg-white px-2.5 py-1 font-semibold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
              @click="collapseAll"
            >
              بستن همه
            </button>
          </div>
        </div>
      </div>

      <!-- فهرست آکاردئونی بخش‌ها -->
      <div v-if="filteredSections.length > 0" class="mt-8 space-y-4">
        <div
          v-for="section in filteredSections"
          :key="section.id"
          class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xs transition duration-200 dark:border-ink-800 dark:bg-ink-900"
        >
          <!-- هدر کلیک‌خور بخش -->
          <button
            type="button"
            class="flex w-full items-center justify-between p-5 text-right transition hover:bg-ink-50/60 dark:hover:bg-ink-850/50"
            @click="toggleSection(section.id)"
          >
            <div class="flex items-center gap-3.5">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                  <path :d="section.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded bg-brand-100 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    {{ section.badge }}
                  </span>
                  <span class="text-xs text-ink-400 dark:text-ink-400">
                    {{ section.steps.length }} مرحله
                  </span>
                </div>
                <h2 class="mt-1 text-base font-extrabold text-ink-900 dark:text-ink-100">
                  {{ section.title }}
                </h2>
              </div>
            </div>

            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500 transition dark:bg-ink-800 dark:text-ink-400" :class="{ 'rotate-180': expandedSections.has(section.id) }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                <path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </button>

          <!-- محتوای مراحل -->
          <div v-show="expandedSections.has(section.id)" class="border-t border-ink-100 px-5 py-6 dark:border-ink-800/80">
            <ol class="space-y-4">
              <li
                v-for="(step, idx) in section.steps"
                :key="step.title"
                class="relative flex gap-3.5 rounded-xl border border-ink-100/80 bg-ink-50/50 p-4 transition dark:border-ink-800/60 dark:bg-ink-850/40"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white shadow-xs">
                  {{ idx + 1 }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-bold text-ink-900 dark:text-ink-100">
                    {{ step.title }}
                  </h3>
                  <p class="mt-1 text-xs leading-6 text-ink-600 dark:text-ink-300">
                    {{ step.body }}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- در صورت خالی بودن جستجو -->
      <div v-else class="mt-12 rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center dark:border-ink-800 dark:bg-ink-900">
        <h3 class="text-base font-bold text-ink-800 dark:text-ink-200">موردی یافت نشد</h3>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">
          برای عبارت «{{ searchQuery }}» عنوانی در راهنما پیدا نشد.
        </p>
        <button
          type="button"
          class="mt-4 rounded-xl bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
          @click="searchQuery = ''; selectedCategory = 'all'"
        >
          پاکسازی جستجو
        </button>
      </div>

      <!-- بخش پرسش‌های پرتکرار تعاملی -->
      <div class="mt-12 rounded-3xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-500/30 dark:bg-amber-500/10 sm:p-8">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-amber-900 dark:text-amber-200">پرسش‌های پرتکرار همکاران</h2>
            <p class="text-xs text-amber-700/80 dark:text-amber-300/80">پاسخ سریع به متداول‌ترین سوالات درباره چیدمان و عملکرد سیستم</p>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div
            v-for="(faq, fIdx) in faqs"
            :key="fIdx"
            class="rounded-xl border border-amber-200/80 bg-white/80 p-4 transition dark:border-amber-500/20 dark:bg-ink-900/80"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between text-right text-xs font-bold text-ink-900 transition dark:text-ink-100 sm:text-sm"
              @click="faq.open = !faq.open"
            >
              <span>{{ faq.q }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4 shrink-0 transition" :class="{ 'rotate-180': faq.open }">
                <path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <p v-show="faq.open" class="mt-2 text-xs leading-6 text-ink-600 dark:text-ink-300">
              {{ faq.a }}
            </p>
          </div>
        </div>
      </div>

      <!-- کادر تماس و پشتیبانی -->
      <div class="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-xs dark:border-ink-800 dark:bg-ink-900 sm:flex-row">
        <div>
          <h3 class="text-sm font-bold text-ink-900 dark:text-ink-100">سوالی دارید که در راهنما پیدا نکردید؟</h3>
          <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">تیم توسعه مدیریار همواره آماده دریافت پیشنهادات و راهنمایی همکاران محترم فرهنگی است.</p>
        </div>
        <RouterLink
          to="/contact"
          class="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          ارتباط با پشتیبانی
        </RouterLink>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
