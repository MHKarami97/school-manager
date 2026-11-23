import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
    meta: {
      title: "سامانه جامع مدیریت و برنامه‌ریزی هوشمند مدارس",
      description:
        "سامانه جامع مدارس مدیریار: چیدمان برنامه هفتگی، بانک ۳۴۰+ طرح درس آماده، بانک ۱۸,۷۰۰+ سوال و آزمون‌ساز آنلاین، حضور و غیاب، گروه‌بندی و آزمایشگاه مجازی علوم.",
    },
  },
  {
    path: "/tools",
    alias: ["/features", "/capabilities"],
    name: "tools",
    component: () => import("@/views/ToolsView.vue"),
    meta: {
      title: "همه امکانات و بخش‌های سامانه مدارس",
      description:
        "لیست کامل ابزارهای مدیریار ویژه مدیران، معلمان، اولیا و دانش‌آموزان با دسترسی سریع به تمام امکانات آموزشی و اجرایی.",
    },
  },
  {
    path: "/history",
    name: "history",
    component: () => import("@/views/HistoryView.vue"),
    meta: {
      title: "تاریخچه و پرونده‌های ثبت‌شده",
      description: "مشاهده سوابق و آرشیو عملیات انجام‌شده در سامانه مدیریار.",
    },
  },
  {
    path: "/experiments",
    alias: "/lab",
    name: "experiments",
    component: () => import("@/views/ExperimentsView.vue"),
    meta: {
      title: "آزمایشگاه مجازی علوم (فیزیک، شیمی، زیست)",
      description:
        "شبیه‌سازهای تعاملی و جذاب آزمایش‌های علوم تجربی دوره‌های ابتدایی و متوسطه، بدون نیاز به مواد و تجهیزات آزمایشگاهی.",
    },
  },
  {
    path: "/games",
    alias: ["/games-hub", "/chogan"],
    name: "games-hub",
    component: () => import("@/views/games/GamesHubView.vue"),
    meta: {
      title: "باشگاه بازی‌های آموزشی و یادگیری درسی",
      description:
        "مجموعه بازی‌های فکری، پازل و مهارتی پیوندخورده با سوالات کتاب‌های درسی برای یادگیری عمیق و جذاب دانش‌آموزان.",
    },
  },
  {
    path: "/games/play/:id",
    name: "game-play",
    component: () => import("@/views/games/ChoganGameView.vue"),
    meta: {
      title: "اجرای بازی آموزشی",
      description: "بازی آموزشی و علمی در باشگاه بازی‌های دانایی مدیریار.",
    },
  },
  {
    path: "/games/rocket",
    name: "game-rocket",
    component: () => import("@/views/games/RocketGameView.vue"),
    meta: {
      title: "بازی نبرد موشکی علمی",
      description: "بازی تعاملی شلیک موشک با حل سوالات درسی و آموزش نکات کلیدی کتاب‌ها.",
    },
  },
  {
    path: "/games/tower-defense",
    name: "game-tower-defense",
    component: () => import("@/views/games/TowerDefenseGameView.vue"),
    meta: {
      title: "بازی برج دفاعی دانایی",
      description: "بازی استراتژیک دفاع از قلعه دانش با پاسخ به چالش‌ها و تست‌های کتاب درسی.",
    },
  },
  {
    path: "/games/speed-race",
    name: "game-speed-race",
    component: () => import("@/views/games/SpeedRaceGameView.vue"),
    meta: {
      title: "بازی مسابقه سرعت ریاضی و کلمات",
      description: "رانندگی پرسرعت در پیست گرندپری دانش با حل سریع ضرب و محاسبات ذهنی.",
    },
  },
  {
    path: "/games/conquest",
    name: "game-conquest",
    component: () => import("@/views/games/ConquestGameView.vue"),
    meta: {
      title: "بازی فتح قلمروهای دانش",
      description: "کشف و فتح نقشه ایران و جهان با پاسخ به سوالات جغرافیا، تاریخ و علوم.",
    },
  },
  {
    path: "/guide",
    name: "guide",
    component: () => import("@/views/GuideView.vue"),
    meta: {
      title: "راهنمای جامع کار با سامانه مدیریار",
      description:
        "راهنمای تصویری و گام به گام استفاده از تمام ابزارهای سامانه هوشمند مدارس مدیریار.",
    },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/AboutView.vue"),
    meta: {
      title: "درباره سامانه هوشمند مدیریار",
      description: "معرفی اهداف، چشم‌انداز و قابلیت‌های نرم‌افزار جامع مدیریت مدارس مدیریار.",
    },
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("@/views/ContactView.vue"),
    meta: {
      title: "تماس و پشتیبانی سامانه مدیریار",
      description: "راه‌های ارتباطی، ثبت پیشنهادات و پشتیبانی فنی سامانه هوشمند مدارس.",
    },
  },
  {
    path: "/wizard",
    name: "wizard",
    component: () => import("@/views/WizardView.vue"),
    meta: {
      title: "چیدمان هوشمند برنامه هفتگی مدارس",
      description:
        "ساخت خودکار و هوشمند برنامه هفتگی مدارس ابتدایی، متوسطه اول و دوم با رعایت ضوابط رسمی آموزش و پرورش.",
    },
  },
  {
    path: "/schedules",
    name: "schedules",
    component: () => import("@/views/SavedSchedulesView.vue"),
    meta: {
      title: "برنامه‌های هفتگی ذخیره‌شده مدرسه",
      description: "مشاهده، ویرایش و چاپ برنامه‌های کلاسی هفتگی ذخیره‌شده مدرسه.",
    },
  },
  {
    path: "/schedules/:id",
    name: "schedule-editor",
    component: () => import("@/views/ScheduleEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایشگر برنامه هفتگی کلاس",
      description: "ویرایش تعاملی و چیدمان دستی زنگ‌های آموزشی کلاس درس.",
    },
  },
  {
    path: "/students",
    name: "students",
    component: () => import("@/views/StudentsView.vue"),
    meta: {
      title: "گروه‌بندی و کلاس‌بندی عادلانه دانش‌آموزان",
      description:
        "کلاس‌بندی هوشمند دانش‌آموزان بر اساس معدل، انضباط، توازن کلاسی و تفکیک جنسیتی.",
    },
  },
  {
    path: "/students/groups",
    name: "student-groups-list",
    component: () => import("@/views/StudentGroupsListView.vue"),
    meta: {
      title: "لیست کلاس‌بندی‌های ذخیره‌شده",
      description: "آرشیو گروه‌بندی‌ها و لیست‌های کلاسی ثبت‌شده آموزشگاه.",
    },
  },
  {
    path: "/students/grouping",
    name: "students-grouping",
    component: () => import("@/views/GroupingView.vue"),
    meta: {
      title: "انجام گروه‌بندی هوشمند کلاس",
      description: "تقسیم عادلانه و هدفمند دانش‌آموزان بین کلاس‌های موازی هر پایه.",
    },
  },
  {
    path: "/lesson-plans",
    name: "lesson-plans",
    component: () => import("@/views/LessonPlansView.vue"),
    meta: {
      title: "بانک جامع طرح درس‌های آماده مدارس (تمامی پایه‌ها)",
      description:
        "بانک جامع ۳۴۰+ طرح درس استاندارد مصوب کشوری برای پایه‌های اول تا دوازدهم با دسترسی به تمام دروس و فصول با قابلیت ویرایش آنلاین.",
    },
  },
  {
    path: "/lesson-plans/new",
    name: "lesson-plan-new",
    component: () => import("@/views/LessonPlanEditorView.vue"),
    meta: {
      title: "تدوین و ویرایش طرح درس کلاسی",
      description:
        "طراحی گام به گام طرح درس استاندارد کلاسی بر اساس اهداف رفتاری، روش تدریس، زمان‌بندی و ارزشیابی.",
    },
  },
  {
    path: "/lesson-plans/:id",
    name: "lesson-plan-editor",
    component: () => import("@/views/LessonPlanEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش طرح درس معلم",
      description: "ویرایش و دریافت خروجی PDF طرح درس استاندارد کلاسی.",
    },
  },
  {
    path: "/sport",
    name: "sport-plans",
    component: () => import("@/views/SportPlansView.vue"),
    meta: {
      title: "برنامه‌ریزی درس ورزش مدارس",
      description:
        "تخصیص ساعات درس ورزش کلاس‌ها با رعایت ظرفیت حیاط، سالن ورزشی و ساعات حضور دبیران ورزش.",
    },
  },
  {
    path: "/sport/new",
    name: "sport-wizard",
    component: () => import("@/views/SportWizardView.vue"),
    meta: {
      title: "طراحی برنامه ورزش جدید",
      description: "چیدمان خودکار ساعات درس تربیت‌بدنی آموزشگاه.",
    },
  },
  {
    path: "/sport/:id",
    name: "sport-plan-editor",
    component: () => import("@/views/SportPlanEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش برنامه ورزش مدرسه",
      description: "ویرایش جدول توزیع ساعات ورزش و تربیت‌بدنی کلاس‌ها.",
    },
  },
  {
    path: "/celebrations",
    name: "celebrations",
    component: () => import("../views/CelebrationsView.vue"),
    meta: {
      title: "برنامه‌ریزی جشن‌ها و مناسبت‌های مدرسه",
      description: "تقویم رویدادهای ملی، مذهبی و جشن‌های آموزشگاه با چک‌لیست وظایف کادر.",
    },
  },
  {
    path: "/celebrations/new",
    name: "celebration-new",
    component: () => import("../views/CelebrationEditorView.vue"),
    meta: {
      title: "ثبت رویداد و مراسم جدید مدرسه",
      description: "برنامه‌ریزی مراسم، برآورد هزینه‌ها و تعیین مسئولان اجرایی.",
    },
  },
  {
    path: "/celebrations/:id",
    name: "celebration-editor",
    component: () => import("../views/CelebrationEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش مراسم مدرسه",
      description: "مدیریت جزئیات جشن یا مناسبت مدرسه‌ای.",
    },
  },
  {
    path: "/elections",
    name: "elections",
    component: () => import("../views/ElectionsView.vue"),
    meta: {
      title: "انتخابات انجمن اولیا و شورای دانش‌آموزی",
      description:
        "سامانه برگزاری انتخابات، ثبت‌نام نامزدها، شمارش آرا و صدور صورت‌جلسه رسمی.",
    },
  },
  {
    path: "/elections/new",
    name: "election-new",
    component: () => import("../views/ElectionEditorView.vue"),
    meta: {
      title: "برگزاری انتخابات جدید در مدرسه",
      description: "تعریف انتخابات شورای دانش‌آموزی یا انجمن اولیا و مربیان.",
    },
  },
  {
    path: "/elections/:id",
    name: "election-editor",
    component: () => import("../views/ElectionEditorView.vue"),
    props: true,
    meta: {
      title: "مدیریت و نتایج انتخابات",
      description: "شمارش آرا و مشاهده آمار مشارکت‌کنندگان انتخابات.",
    },
  },
  {
    path: "/extra-classes",
    name: "extra-classes",
    component: () => import("../views/ExtraClassesView.vue"),
    meta: {
      title: "کلاس‌های تقویتی و فوق‌برنامه مدرسه",
      description:
        "مدیریت دوره‌های تقویتی، مهارت‌آموزی و تیزهوشان با لیست ثبت‌نام دانش‌آموزان.",
    },
  },
  {
    path: "/extra-classes/new",
    name: "extra-class-new",
    component: () => import("../views/ExtraClassEditorView.vue"),
    meta: {
      title: "تعریف دوره و کلاس فوق‌برنامه جدید",
      description: "ثبت کلاس تقویتی، هزینه، ظرفیت و زمان‌بندی جلسات.",
    },
  },
  {
    path: "/extra-classes/:id",
    name: "extra-class-editor",
    component: () => import("../views/ExtraClassEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش کلاس فوق‌برنامه",
      description: "مدیریت دانش‌آموزان و جلسات کلاس تقویتی.",
    },
  },
  {
    path: "/budget",
    name: "budget",
    component: () => import("../views/BudgetView.vue"),
    meta: {
      title: "بودجه و حسابداری مالی مدرسه",
      description:
        "برنامه‌ریزی بودجه سالانه آموزشگاه، ثبت دریافت‌ها و پرداخت‌ها با سرفصل‌های مصوب مالی.",
    },
  },
  {
    path: "/question-bank",
    name: "question-bank",
    component: () => import("../views/QuestionBankView.vue"),
    meta: {
      title: "بانک جامع سوالات مدارس (۱۸,۷۰۰+ سوال استاندارد)",
      description:
        "بانک جامع ۱۸,۷۷۲ سوال چهارگزینه‌ای استاندارد برای تمامی پایه‌ها (۱ تا ۱۲) و ۸۹ عنوان درسی با کلید پاسخ و فیلترهای دقیق.",
    },
  },
  {
    path: "/question-bank/new",
    name: "question-new",
    component: () => import("../views/QuestionEditorView.vue"),
    meta: {
      title: "افزودن سوال جدید به بانک سوالات",
      description: "ثبت سوال امتحانی جدید همراه با گزینه‌ها، کلید و درجه سختی.",
    },
  },
  {
    path: "/question-bank/:id",
    name: "question-editor",
    component: () => import("../views/QuestionEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش سوال امتحانی",
      description: "ویرایش متن سوال، گزینه‌ها و پاسخ تشریحی.",
    },
  },
  {
    path: "/exams",
    name: "exams",
    component: () => import("../views/ExamsListView.vue"),
    meta: {
      title: "آرشیو آزمون‌های طراحی‌شده مدرسه",
      description: "مشاهده و چاپ برگه‌های امتحانی ساخته‌شده با سربرگ رسمی.",
    },
  },
  {
    path: "/exams/new",
    name: "exam-new",
    component: () => import("../views/ExamBuilderView.vue"),
    meta: {
      title: "آزمون‌ساز آنلاین مدارس (طراحی فوری برگه امتحان)",
      description:
        "طراحی خودکار و نیمه‌خودکار برگه امتحان با سربرگ رسمی، بارم‌بندی، کلید پاسخ و خروجی چاپی در چند ثانیه.",
    },
  },
  {
    path: "/exams/:id",
    name: "exam-builder",
    component: () => import("../views/ExamBuilderView.vue"),
    props: true,
    meta: {
      title: "ویرایشگر آزمون و برگه امتحان",
      description: "ویرایش چیدمان سوالات، بارم‌ها و سربرگ رسمی برگه امتحانی.",
    },
  },
  {
    path: "/invitations",
    name: "invitations",
    component: () => import("../views/InvitationsView.vue"),
    meta: {
      title: "سامانه دعوت‌نامه‌های رسمی جلسات اولیا و مربیان",
      description:
        "تولید خودکار دعوت‌نامه‌های شخصی‌سازی‌شده جلسات اولیا با پیگیری اعلام حضور و خروجی چاپی.",
    },
  },
  {
    path: "/invitations/new",
    name: "invitation-new",
    component: () => import("../views/InvitationEditorView.vue"),
    meta: {
      title: "صدور دعوت‌نامه جلسه جدید",
      description: "تنظیم متن دعوت‌نامه، دستور جلسه و مخاطبان.",
    },
  },
  {
    path: "/invitations/:id",
    name: "invitation-editor",
    component: () => import("../views/InvitationEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش دعوت‌نامه جلسه",
      description: "مدیریت وضعیت دریافت و اعلام حضور اولیا در جلسه.",
    },
  },
  {
    path: "/exam-seating",
    name: "exam-seating",
    component: () => import("../views/ExamSeatingView.vue"),
    meta: {
      title: "چیدمان صندلی امتحان و سالن امتحانات (ضدتقلب)",
      description:
        "چیدمان هوشمند و ضدتقلب صندلی‌های آزمون با تفکیک پایه‌ها، چاپ شماره صندلی، کارت ورود و لیست ناظران.",
    },
  },
  {
    path: "/exam-seating/rooms",
    name: "exam-rooms",
    component: () => import("../views/ExamRoomsView.vue"),
    meta: {
      title: "تعریف سالن‌ها و حوزه‌های امتحانی",
      description: "ثبت ظرفیت سالن‌ها و کلاس‌های برگزاری آزمون آموزشگاه.",
    },
  },
  {
    path: "/exam-seating/new",
    name: "exam-seating-new",
    component: () => import("../views/ExamSeatingEditorView.vue"),
    meta: {
      title: "ساخت چیدمان صندلی امتحان جدید",
      description: "چیدمان تصادفی و ضدتقلب صندلی‌های آزمون برای کلاس‌های مختلف.",
    },
  },
  {
    path: "/exam-seating/:id",
    name: "exam-seating-editor",
    component: () => import("../views/ExamSeatingEditorView.vue"),
    props: true,
    meta: {
      title: "مشاهده و چاپ نقشه صندلی‌های امتحان",
      description: "نقشه بصری صندلی‌ها و چاپ برچسب‌های شماره صندلی آزمون.",
    },
  },
  {
    path: "/teaching-plans",
    name: "teaching-plans",
    component: () => import("../views/TeachingPlansView.vue"),
    meta: {
      title: "چارت تدریس و تخصیص معلمان به کلاس",
      description:
        "ساخت چارت هفتگی تدریس بر اساس سرفصل، محدودیت‌های معلمان و خروجی ابلاغ رسمی ساعات.",
    },
  },
  {
    path: "/teaching-plans/teachers",
    name: "teacher-constraints",
    component: () => import("../views/TeacherConstraintsView.vue"),
    meta: {
      title: "محدودیت‌های حضور معلمان در مدرسه",
      description: "ثبت روزهای غیرقابل‌تدریس و سقف ساعات حضور هر دبیر.",
    },
  },
  {
    path: "/teaching-plans/new",
    name: "teaching-plan-new",
    component: () => import("../views/TeachingPlanEditorView.vue"),
    meta: {
      title: "ساخت چارت تدریس جدید",
      description: "تخصیص درس‌ها و پایه‌ها به کادر آموزشی مدرسه.",
    },
  },
  {
    path: "/teaching-plans/:id",
    name: "teaching-plan-editor",
    component: () => import("../views/TeachingPlanEditorView.vue"),
    props: true,
    meta: {
      title: "ویرایش چارت تدریس معلمان",
      description: "ویرایش تصویری جدول ساعات هفتگی معلمان.",
    },
  },
  {
    path: "/attendance",
    name: "attendance",
    component: () => import("@/views/AttendanceClassesView.vue"),
    meta: {
      title: "دفتر حضور و غیاب هوشمند دانش‌آموزان",
      description:
        "ثبت روزانه وضعیت حضور دانش‌آموزان، مدیریت غایبین با دسترسی سریع به شماره اولیا و گزارش‌های جامع.",
    },
  },
  {
    path: "/attendance/principal",
    name: "attendance-principal",
    component: () => import("@/views/AttendancePrincipalView.vue"),
    meta: {
      title: "داشبورد حضور و غیاب مدیر مدرسه",
      description: "نمای کلی وضعیت حضور و غیاب تمام کلاس‌های مدرسه در یک نگاه.",
    },
  },
  {
    path: "/attendance/absentees",
    name: "attendance-absentees",
    component: () => import("@/views/AttendanceAbsenteesView.vue"),
    meta: {
      title: "مدیریت غایبین روزانه آموزشگاه",
      description: "لیست غایبان امروز مدرسه با امکان تماس مستقیم و ثبت علت غیبت.",
    },
  },
  {
    path: "/attendance/reports",
    name: "attendance-reports",
    component: () => import("@/views/AttendanceReportsView.vue"),
    meta: {
      title: "گزارش‌های آماری حضور و غیاب",
      description: "نمودارها و گزارش‌های تحلیلی ماهانه و فصلی حضور و غیاب آموزشگاه.",
    },
  },
  {
    path: "/attendance/guide",
    name: "attendance-guide",
    component: () => import("@/views/AttendanceGuideView.vue"),
    meta: {
      title: "راهنمای دفتر حضور و غیاب الکترونیک",
      description: "آموزش نحوه ثبت حضور و غیاب و گزارش‌گیری برای معلمان و معاونان.",
    },
  },
  {
    path: "/attendance/classes/:id",
    name: "attendance-sheet",
    component: () => import("@/views/AttendanceSheetView.vue"),
    props: true,
    meta: {
      title: "دفتر نمره و حضور غیاب کلاسی",
      description: "ثبت حضور و غیاب روزانه دانش‌آموزان در کلاس.",
    },
  },
  {
    path: "/service",
    redirect: "/service/assign",
  },
  {
    path: "/service/drivers",
    name: "service-drivers",
    component: () => import("@/views/ServiceDriversView.vue"),
    meta: {
      title: "مدیریت سرویس مدارس و رانندگان",
      description: "ثبت مشخصات رانندگان سرویس، ظرفیت خودروها و مدارک مورد نیاز.",
    },
  },
  {
    path: "/service/students",
    name: "service-students",
    component: () => import("@/views/ServiceStudentsView.vue"),
    meta: {
      title: "دانش‌آموزان متقاضی سرویس مدرسه",
      description: "ثبت آدرس، شماره تماس و ایستگاه سوار شدن دانش‌آموزان.",
    },
  },
  {
    path: "/service/assign",
    name: "service-assign",
    component: () => import("@/views/ServiceAssignView.vue"),
    meta: {
      title: "تخصیص هوشمند صندلی سرویس مدارس",
      description: "چیدمان بصری صندلی خودروها و تخصیص دانش‌آموزان به مسیرهای سرویس.",
    },
  },
  {
    path: "/service/absentees",
    name: "service-absentees",
    component: () => import("@/views/ServiceAbsenteesView.vue"),
    meta: {
      title: "ثبت غیبت در سرویس مدرسه",
      description: "اطلاع‌رسانی غیبت روزانه دانش‌آموز در سرویس برای راننده و اولیا.",
    },
  },
  {
    path: "/service/payments",
    name: "service-payments",
    component: () => import("@/views/ServicePaymentsView.vue"),
    meta: {
      title: "حسابداری و شهریه سرویس مدارس",
      description: "مدیریت و پیگیری اقساط و واریزی‌های شهریه سرویس دانش‌آموزان.",
    },
  },
  {
    path: "/service/guide",
    name: "service-guide",
    component: () => import("@/views/ServiceGuideView.vue"),
    meta: {
      title: "راهنمای مدیریت سرویس مدارس",
      description: "آموزش گام به گام مدیریت ناوگان و سرویس دانش‌آموزی.",
    },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/SettingsView.vue"),
    meta: {
      title: "تنظیمات سامانه مدیریار",
      description: "تنظیمات تم، اعلان‌ها و پیکربندی سامانه مدرسه.",
    },
  },
  {
    path: "/settings/data",
    name: "settings-data",
    component: () => import("@/views/DataManagerView.vue"),
    meta: {
      title: "مدیریت داده‌ها و پشتیبان‌گیری",
      description: "تهیه نسخه پشتیبان (Backup) از اطلاعات مدرسه و بازیابی داده‌ها.",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0 };
  },
});

// گارد مسیریابی برای به‌روزرسانی لحظه‌ای تایتل، متا دیسکریپشن، اپن‌گراف و تگ کنونیکال
router.afterEach((to) => {
  const defaultTitle = "سامانه جامع مدیریت و برنامه‌ریزی هوشمند مدارس";
  const defaultDesc =
    "سامانه جامع و رایگان مدارس مدیریار: چیدمان برنامه هفتگی، بانک ۳۴۰+ طرح درس آماده، بانک ۱۸,۷۰۰+ سوال و آزمون‌ساز آنلاین، حضور و غیاب، گروه‌بندی و آزمایشگاه مجازی علوم.";

  const pageTitle = to.meta.title ? `${to.meta.title} | مدیریار` : `${defaultTitle} | مدیریار`;
  document.title = pageTitle;

  const pageDesc = (to.meta.description as string) || defaultDesc;

  // ۱. به‌روزرسانی meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", pageDesc);

  // ۲. به‌روزرسانی تگ‌های OpenGraph برای اشتراک‌گذاری در ایتا، بله، تلگرام و واتساپ
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", pageTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", pageDesc);

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute("content", pageTitle);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute("content", pageDesc);

  // ۳. به‌روزرسانی تگ Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  const cleanPath = to.path === "/" ? "" : `#${to.path}`;
  canonical.setAttribute("href", `https://school.mhkarami97.ir/${cleanPath}`);
});

export default router;
