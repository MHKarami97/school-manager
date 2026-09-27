export interface SiteFeature {
  id: string
  title: string
  shortTitle: string
  description: string
  icon: string
  startPath: string
  startLabel: string
  historyPath: string
  historyLabel: string
}

export const SITE_FEATURES: SiteFeature[] = [
  {
    id: 'scheduling',
    title: 'چیدمان برنامه هفتگی',
    shortTitle: 'برنامه هفتگی',
    description:
      'برنامه هفتگی کلاس را بر اساس قوانین آموزشی رسمی (جایگاه ثابت قرآن در زنگ اول، عدم تکرار طولی و عرضی درس‌ها، استثنای ورزش) به‌صورت خودکار بچینید و در صورت نیاز دستی ویرایش کنید.',
    icon: 'M9 3v18M15 3v18M3 9h18M3 15h18',
    startPath: '/wizard',
    startLabel: 'شروع ساخت برنامه',
    historyPath: '/schedules',
    historyLabel: 'برنامه‌های ذخیره‌شده',
  },
  {
    id: 'student-grouping',
    title: 'گروه‌بندی عادلانه دانش‌آموزان',
    shortTitle: 'گروه‌بندی دانش‌آموزان',
    description:
      'دانش‌آموزان هر پایه را با رعایت تفکیک جنسیتی، توازن معدل و انضباط، و تخصیص هدفمند دانش‌آموزان ضعیف به معلم قوی‌تر، به‌صورت خودکار بین چند کلاس تقسیم کنید.',
    icon: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    startPath: '/students',
    startLabel: 'شروع گروه‌بندی',
    historyPath: '/students/groups',
    historyLabel: 'گروه‌بندی‌های ذخیره‌شده',
  },
  {
    id: 'lesson-plan',
    title: 'طرح درس معلم‌ها',
    shortTitle: 'طرح درس',
    description:
      'برای هر جلسه، طرح درس معلم را با اهداف آموزشی، روش تدریس، منابع و زمان‌بندی ثبت کنید؛ با آرشیو قابل‌جستجو، نسخه‌بندی ویرایش‌ها و خروجی PDF.',
    icon: 'M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    startPath: '/lesson-plans/new',
    startLabel: 'شروع طرح درس جدید',
    historyPath: '/lesson-plans',
    historyLabel: 'آرشیو طرح درس‌ها',
  },
]
