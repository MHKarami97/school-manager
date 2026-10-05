export interface SiteFeature {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  startPath: string;
  startLabel: string;
  historyPath: string;
  historyLabel: string;
}

export const SITE_FEATURES: SiteFeature[] = [
  {
    id: "scheduling",
    title: "چیدمان برنامه هفتگی",
    shortTitle: "برنامه هفتگی",
    description:
      "برنامه هفتگی کلاس را بر اساس قوانین آموزشی رسمی (جایگاه ثابت قرآن در زنگ اول، عدم تکرار طولی و عرضی درس‌ها، استثنای ورزش) به‌صورت خودکار بچینید و در صورت نیاز دستی ویرایش کنید.",
    icon: "M9 3v18M15 3v18M3 9h18M3 15h18",
    startPath: "/wizard",
    startLabel: "شروع ساخت برنامه",
    historyPath: "/schedules",
    historyLabel: "برنامه‌های ذخیره‌شده",
  },
  {
    id: "student-grouping",
    title: "گروه‌بندی عادلانه دانش‌آموزان",
    shortTitle: "گروه‌بندی دانش‌آموزان",
    description:
      "دانش‌آموزان هر پایه را با رعایت تفکیک جنسیتی، توازن معدل و انضباط، و تخصیص هدفمند دانش‌آموزان ضعیف به معلم قوی‌تر، به‌صورت خودکار بین چند کلاس تقسیم کنید.",
    icon: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    startPath: "/students",
    startLabel: "شروع گروه‌بندی",
    historyPath: "/students/groups",
    historyLabel: "گروه‌بندی‌های ذخیره‌شده",
  },
  {
    id: "lesson-plan",
    title: "طرح درس معلم‌ها",
    shortTitle: "طرح درس",
    description:
      "برای هر جلسه، طرح درس معلم را با اهداف آموزشی، روش تدریس، منابع و زمان‌بندی ثبت کنید؛ با آرشیو قابل‌جستجو، نسخه‌بندی ویرایش‌ها و خروجی PDF.",
    icon: "M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    startPath: "/lesson-plans/new",
    startLabel: "شروع طرح درس جدید",
    historyPath: "/lesson-plans",
    historyLabel: "آرشیو طرح درس‌ها",
  },
  {
    id: "sport-scheduling",
    title: "برنامه ورزش مدرسه",
    shortTitle: "برنامه ورزش",
    description:
      "ساعات درس ورزش را بین معلمان ورزش و کلاس‌ها، با رعایت ساعات حضور هر معلم، سقف ساعت هفتگی و جلوگیری از تداخل زمانی، به‌صورت خودکار یا دستی تخصیص دهید.",
    icon: "M12 6V4m0 2a6 6 0 100 12 6 6 0 000-12zm0 0v2m6 4h2M6 12H4m12.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41",
    startPath: "/sport/new",
    startLabel: "شروع برنامه ورزش",
    historyPath: "/sport",
    historyLabel: "برنامه‌های ورزش ذخیره‌شده",
  },
  {
    id: "celebrations",
    title: "برنامه‌ریزی جشن‌ها",
    shortTitle: "جشن‌ها",
    description:
      "مدیریت رویدادها، چک‌لیست کارها، سررسیدها و بودجه هر جشن مدرسه.",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    startPath: "/celebrations/new",
    startLabel: "ثبت جشن جدید",
    historyPath: "/celebrations",
    historyLabel: "مشاهده جشن‌ها",
  },
  {
    id: "elections",
    title: "برگزاری انتخابات شورا و انجمن اولیا",
    shortTitle: "انتخابات",
    description:
      "ثبت‌نام نامزدها، شمارش دستی آرا توسط مدیر/معاون و اعلام نتایج با نمودار ستونی.",
    icon: "M9 17V9m3 8V5m3 12v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    startPath: "/elections/new",
    startLabel: "ثبت انتخابات جدید",
    historyPath: "/elections",
    historyLabel: "مشاهده انتخابات‌ها",
  },
  {
    id: "extra-classes",
    title: "کلاس تقویتی و فوق‌برنامه",
    shortTitle: "کلاس‌های فوق‌برنامه",
    description:
      "مدیریت کلاس‌های تقویتی/فوق‌برنامه، ثبت‌نام دانش‌آموز، لیست انتظار و تقویم هفتگی.",
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    startPath: "/extra-classes/new",
    startLabel: "ثبت کلاس جدید",
    historyPath: "/extra-classes",
    historyLabel: "مشاهده کلاس‌ها",
  },
  {
    id: "budget",
    title: "بودجه و برنامه مالی سالیانه",
    shortTitle: "بودجه مدرسه",
    description:
      "برنامه‌ریزی بودجه سالانه، ثبت تراکنش‌ها، نمودار توزیع هزینه و گزارش مالی PDF.",
    icon: "M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    startPath: "/budget",
    startLabel: "مدیریت بودجه",
    historyPath: "/budget",
    historyLabel: "مشاهده بودجه",
  },
  {
    id: "question-bank",
    title: "بانک سوال و آزمون‌ساز",
    shortTitle: "بانک سوال",
    description:
      "ذخیره سوالات دسته‌بندی‌شده، تولید نیمه‌خودکار آزمون از قالب و خروجی PDF با/بدون کلید پاسخ.",
    icon: "M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    startPath: "/exams/new",
    startLabel: "ساخت آزمون جدید",
    historyPath: "/question-bank",
    historyLabel: "مشاهده بانک سوال",
  },
  {
    id: "invitations",
    title: "دعوت‌نامه (اولیا، مراسم، جلسات)",
    shortTitle: "دعوت‌نامه",
    description:
      "ساخت دعوت‌نامه‌ی شخصی‌سازی‌شده برای اولیا و همکاران، پیگیری تأیید حضور و خروجی PDF.",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    startPath: "/invitations/new",
    startLabel: "ساخت دعوت‌نامه",
    historyPath: "/invitations",
    historyLabel: "مشاهده دعوت‌نامه‌ها",
  },
];
