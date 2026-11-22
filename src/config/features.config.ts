export type FeatureAudience = 'admin' | 'teacher' | 'parent' | 'student';

export interface AudienceTab {
  id: 'all' | FeatureAudience;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const AUDIENCE_TABS: AudienceTab[] = [
  {
    id: 'all',
    label: 'همه بخش‌ها و امکانات',
    shortLabel: 'همه',
    description: 'مشاهده تمام ابزارها و خدمات سامانه مدیریار به صورت یکپارچه',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    id: 'admin',
    label: 'مدیران و معاونان',
    shortLabel: 'مدیر و معاون',
    description: 'ابزارهای برنامه‌ریزی، چیدمان، گروه‌بندی، امتحانات و مدیریت امور اجرایی مدرسه',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    id: 'teacher',
    label: 'معلمان',
    shortLabel: 'معلم',
    description: 'طرح درس، آزمون‌ساز، بانک سوالات، برنامه هفتگی و ابزارهای کمک‌آموزشی کلاسی',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    id: 'parent',
    label: 'اولیا و خانواده‌ها',
    shortLabel: 'اولیا',
    description: 'پیگیری سرویس مدرسه، دعوت‌نامه‌ها، جلسات و انتخابات انجمن اولیا و مربیان',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    id: 'student',
    label: 'دانش‌آموزان',
    shortLabel: 'دانش‌آموز',
    description: 'آزمایشگاه مجازی علوم، بازی‌های آموزشی درسی و رویدادهای دانش‌آموزی',
    icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

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
  audiences: FeatureAudience[];
  status?: 'active' | 'coming-soon';
  badge?: string;
  isNew?: boolean;
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
    audiences: ["admin", "teacher"],
    status: "active",
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
    audiences: ["admin"],
    status: "active",
  },
  {
    id: "virtual-lab",
    title: "آزمایشگاه مجازی علوم",
    shortTitle: "آزمایشگاه علوم",
    description:
      "شبیه‌سازی‌های تعاملی، دقیق و زنده برای آزمایش مفاهیم فیزیک، شیمی و زیست‌شناسی دوره‌های تحصیلی در محیطی روان، ایمن و کاربردی.",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    startPath: "/experiments",
    startLabel: "ورود به آزمایشگاه",
    historyPath: "/experiments",
    historyLabel: "آزمایشگاه مجازی",
    audiences: ["student", "teacher"],
    status: "active",
    badge: "تعاملی و زنده",
    isNew: true,
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
    audiences: ["teacher"],
    status: "active",
  },
  {
    id: "question-bank",
    title: "بانک سوال و آزمون‌ساز",
    shortTitle: "بانک سوال و آزمون",
    description:
      "ذخیره سوالات استاندارد دسته‌بندی‌شده بر اساس پایه و درس، تولید نیمه‌خودکار برگه امتحان با سربرگ رسمی و دریافت خروجی PDF با کلید پاسخ.",
    icon: "M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    startPath: "/exams/new",
    startLabel: "ساخت آزمون جدید",
    historyPath: "/question-bank",
    historyLabel: "مشاهده بانک سوال",
    audiences: ["teacher"],
    status: "active",
  },
  {
    id: "teaching-plans",
    title: "تخصیص معلم به کلاس",
    shortTitle: "چارت تدریس",
    description:
      "ساخت چارت هفتگی تدریس بر اساس سرفصل، درس‌ها و محدودیت‌های هر معلم، با ویرایش تصویری و روان و خروجی PDF استاندارد.",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    startPath: "/teaching-plans/new",
    startLabel: "ساخت چارت تدریس",
    historyPath: "/teaching-plans",
    historyLabel: "مشاهده چارت‌ها",
    audiences: ["admin"],
    status: "active",
  },
  {
    id: "sport-scheduling",
    title: "برنامه ورزش مدرسه",
    shortTitle: "برنامه ورزش",
    description:
      "ساعات درس ورزش را بین معلمان ورزش و کلاس‌ها، با رعایت ساعات حضور هر معلم، سقف ساعت هفتگی و جلوگیری از تداخل حیاط و سالن، تخصیص دهید.",
    icon: "M12 6V4m0 2a6 6 0 100 12 6 6 0 000-12zm0 0v2m6 4h2M6 12H4m12.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41",
    startPath: "/sport/new",
    startLabel: "شروع برنامه ورزش",
    historyPath: "/sport",
    historyLabel: "برنامه‌های ورزش ذخیره‌شده",
    audiences: ["admin", "teacher"],
    status: "active",
  },
  {
    id: "attendance",
    title: "حضور و غیاب هوشمند دانش‌آموزان",
    shortTitle: "حضور و غیاب",
    description:
      "ثبت روزانه وضعیت حضور دانش‌آموزان، مدیریت غایبین با دسترسی سریع به شماره اولیا، ثبت خروج زودهنگام و گزارش‌های آماری جامع ماهانه و فصلی.",
    icon: "M9 12l2 2 4-4M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z",
    startPath: "/attendance",
    startLabel: "شروع حضور و غیاب",
    historyPath: "/attendance/reports",
    historyLabel: "گزارش‌های حضور و غیاب",
    audiences: ["admin", "teacher"],
    status: "active",
  },
  {
    id: "school-service",
    title: "مدیریت سرویس مدارس",
    shortTitle: "سرویس مدارس",
    description:
      "ثبت مشخصات رانندگان و ظرفیت خودرو، نقشه مسیر دانش‌آموزان، تخصیص صندلی‌ها، ثبت غیبت روزانه در سرویس و حسابداری پرداخت‌ها.",
    icon: "M8 17h8M5 17H4a1 1 0 01-1-1V8a2 2 0 012-2h14a2 2 0 012 2v8a1 1 0 01-1 1h-1M7 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11h18",
    startPath: "/service/drivers",
    startLabel: "شروع سرویس مدارس",
    historyPath: "/service/assign",
    historyLabel: "تخصیص دانش‌آموزان",
    audiences: ["admin", "parent"],
    status: "active",
  },
  {
    id: "exam-seating",
    title: "چیدمان صندلی و سالن امتحان",
    shortTitle: "چیدمان صندلی امتحان",
    description:
      "چیدمان هوشمند و ضدتقلب صندلی‌های امتحان با تفکیک پایه‌ها و دانش‌آموزان هم‌کلاس، چاپ شماره صندلی، کارت ورود و لیست ناظران.",
    icon: "M4 6h16M4 12h16M4 18h16",
    startPath: "/exam-seating/new",
    startLabel: "ساخت جلسه امتحان",
    historyPath: "/exam-seating",
    historyLabel: "مشاهده جلسه‌ها",
    audiences: ["admin"],
    status: "active",
  },
  {
    id: "budget",
    title: "بودجه و حسابداری مالی مدرسه",
    shortTitle: "بودجه و مالی",
    description:
      "برنامه‌ریزی بودجه سالانه آموزشگاه، ثبت دریافت‌ها و هزینه‌ها، دسته‌بندی سرفصل‌های مصوب آموزش و پرورش و نمودارهای تحلیلی شفاف.",
    icon: "M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    startPath: "/budget",
    startLabel: "مدیریت بودجه",
    historyPath: "/budget",
    historyLabel: "مشاهده بودجه",
    audiences: ["admin"],
    status: "active",
  },
  {
    id: "invitations",
    title: "سامانه دعوت‌نامه و جلسات",
    shortTitle: "دعوت‌نامه‌ها",
    description:
      "تولید خودکار دعوت‌نامه‌های شخصی‌سازی‌شده برای جلسات اولیا و مربیان، کارگاه‌ها و جشن‌ها، پیگیری اعلام حضور و خروجی چاپی شکیل.",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    startPath: "/invitations/new",
    startLabel: "ساخت دعوت‌نامه",
    historyPath: "/invitations",
    historyLabel: "مشاهده دعوت‌نامه‌ها",
    audiences: ["admin", "parent"],
    status: "active",
  },
  {
    id: "elections",
    title: "انتخابات شورا و انجمن اولیا",
    shortTitle: "انتخابات شورا و انجمن",
    description:
      "ثبت‌نام نامزدهای دانش‌آموزی و اولیا، شمارش شفاف آرا، تهیه صورت‌جلسه رسمی و نمایش لحظه‌ای نتایج با نمودارهای تفکیکی.",
    icon: "M9 17V9m3 8V5m3 12v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    startPath: "/elections/new",
    startLabel: "ثبت انتخابات جدید",
    historyPath: "/elections",
    historyLabel: "مشاهده انتخابات‌ها",
    audiences: ["admin"],
    status: "active",
  },
  {
    id: "extra-classes",
    title: "کلاس‌های تقویتی و فوق‌برنامه",
    shortTitle: "کلاس‌های فوق‌برنامه",
    description:
      "برنامه‌ریزی دوره‌های مهارت‌آموزی، تقویتی و تیزهوشان، مدیریت ثبت‌نام دانش‌آموزان، لیست انتظار و زمان‌بندی هفتگی جلسات.",
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    startPath: "/extra-classes/new",
    startLabel: "ثبت کلاس جدید",
    historyPath: "/extra-classes",
    historyLabel: "مشاهده کلاس‌ها",
    audiences: ["admin", "teacher"],
    status: "active",
  },
  {
    id: "celebrations",
    title: "برنامه‌ریزی جشن‌ها و مناسبت‌ها",
    shortTitle: "جشن‌ها و مناسبت‌ها",
    description:
      "مدیریت تقویم رویدادهای ملی و مذهبی مدرسه، چک‌لیست دقیق وظایف کادر، برآورد هزینه و ثبت سابقه برنامه‌های اجرا شده.",
    icon: "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    startPath: "/celebrations/new",
    startLabel: "ثبت رویداد جدید",
    historyPath: "/celebrations",
    historyLabel: "مشاهده رویدادها",
    audiences: ["admin", "teacher"],
    status: "active",
  },
  // --- بازی‌های آموزشی (باشگاه ۹۵ بازی دانایی و مهارت) ---
  {
    id: "game-hub-95",
    title: "باشگاه ۹۵ بازی دانایی و مهارت",
    shortTitle: "باشگاه ۹۵ بازی",
    description:
      "مجموعه جامع ۹۵ بازی فکری، پازل، تخته‌ای، مهارتی و کارتی تلفیق‌شده با سوالات کتاب‌های درسی، سکه و لیگ قهرمانان.",
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    startPath: "/games",
    startLabel: "ورود به باشگاه ۹۵ بازی 🎮",
    historyPath: "/games",
    historyLabel: "باشگاه بازی‌ها",
    audiences: ["student"],
    status: "active",
    badge: "۹۵ بازی کامل",
    isNew: true,
  },
  {
    id: "game-rocket",
    title: "نبرد موشکی علمی",
    shortTitle: "نبرد موشکی",
    description:
      "بازی شلیک و نشانه‌گیری موشک؛ قبل از شلیک، سوال درسی حل می‌کنی و جواب درست شلیکت رو پرقدرت‌تر می‌کنه! جواب اشتباه هم با نکته آموزشی کمکت می‌کنه دوباره فکر کنی.",
    icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.45 14.9 14.9 0 01.06-.31",
    startPath: "/games/rocket",
    startLabel: "شروع نبرد موشکی 🚀",
    historyPath: "/games/rocket",
    historyLabel: "نبرد موشکی",
    audiences: ["student"],
    status: "active",
    badge: "بازی علمی",
    isNew: true,
  },
  {
    id: "game-tower-defense",
    title: "برج دفاعی دانایی",
    shortTitle: "برج دفاعی",
    description:
      "دفاع از قلعه علم در برابر امواج جهل؛ استقرار و ارتقای برج‌ها و سپرهای دفاعی با پاسخ صحیح به چالش‌ها و تست‌های کتاب درسی.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    startPath: "/games/tower-defense",
    startLabel: "شروع دفاع",
    historyPath: "",
    historyLabel: "",
    audiences: ["student"],
    status: "active",
    badge: "بازی استراتژیک",
    isNew: true,
  },
  {
    id: "game-speed-runner",
    title: "مسابقه سرعت ریاضی و کلمات",
    shortTitle: "مسابقه سرعت",
    description:
      "رانندگی پرهیجان در پیست گرندپری دانش؛ حل سریع ضرب، محاسبات ذهنی و املای واژگان برای کسب نیتروی پرسرعت و پیروزی در مسابقه.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    startPath: "/games/speed-race",
    startLabel: "شروع مسابقه",
    historyPath: "",
    historyLabel: "",
    audiences: ["student"],
    status: "active",
    badge: "بازی مسابقه‌ای",
    isNew: true,
  },
  {
    id: "game-conquest",
    title: "فتح قلمروهای دانش",
    shortTitle: "فتح قلمروها",
    description:
      "بازی استراتژیک کشف و فتح نقشه ایران و جهان بر پایه پاسخ به سوالات جغرافیا، تاریخ، مطالعات اجتماعی و علوم تجربی.",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    startPath: "/games/conquest",
    startLabel: "شروع فتح قلمروها",
    historyPath: "",
    historyLabel: "",
    audiences: ["student"],
    status: "active",
    badge: "بازی استراتژیک نقشه",
    isNew: true,
  },
];
