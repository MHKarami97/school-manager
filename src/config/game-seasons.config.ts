import type { DailyChallenge, GameMedal, GameSeasonKey, GameStage, MotivationalQuote } from '@/types'

export interface SeasonInfo {
  key: GameSeasonKey
  name: string
  title: string
  subtitle: string
  monthsName: string
  icon: string
  accentColor: string
  bgCanvasDark: string
  bgCanvasLight: string
  pathColorDark: string
  pathColorLight: string
  description: string
}

export const GAME_SEASONS: Record<GameSeasonKey, SeasonInfo> = {
  autumn: {
    key: 'autumn',
    name: 'پاییز دانایی',
    title: 'فصل اول: پاییز طلایی و آغاز مأموریت',
    subtitle: 'شروع سال تحصیلی، یادگیری مبانی و تثبیت آموخته‌ها',
    monthsName: 'مهر، آبان، آذر',
    icon: '🍂',
    accentColor: '#f59e0b',
    bgCanvasDark: '#1c1917',
    bgCanvasLight: '#fef3c7',
    pathColorDark: '#44403c',
    pathColorLight: '#fde68a',
    description: 'تم گرم پاییزی با برگ‌های کهربایی و انرژی آغازین سال تحصیلی',
  },
  winter: {
    key: 'winter',
    name: 'زمستان بلورین',
    title: 'فصل دوم: زمستان برفی و آزمون‌های نوبت اول',
    subtitle: 'عمق‌بخشی به مفاهیم، ایستگاه آزمون نوبت اول و تسلط بر حل مسئله',
    monthsName: 'دی، بهمن، اسفند',
    icon: '❄️',
    accentColor: '#38bdf8',
    bgCanvasDark: '#0f172a',
    bgCanvasLight: '#e0f2fe',
    pathColorDark: '#1e293b',
    pathColorLight: '#bae6fd',
    description: 'تم خنک بلورین با دانه‌های برف و تمرکز ذهنی بالا',
  },
  spring: {
    key: 'spring',
    name: 'بهار شکوفایی',
    title: 'فصل سوم: بهار سبز و آمادگی امتحانات نهایی',
    subtitle: 'تثبیت جامع دروس، شکوفایی خلاقیت و جمع‌بندی سالانه',
    monthsName: 'فروردین، اردیبهشت، خرداد',
    icon: '🌸',
    accentColor: '#10b981',
    bgCanvasDark: '#064e3b',
    bgCanvasLight: '#ecfdf5',
    pathColorDark: '#065f46',
    pathColorLight: '#a7f3d0',
    description: 'تم شاداب بهاری با جوانه‌های سبز و گل‌های شکوفا',
  },
  summer: {
    key: 'summer',
    name: 'تابستان پویا',
    title: 'فصل چهارم: لیگ تابستانه و یادآوری هوشمند',
    subtitle: 'تثبیت ماندگار آموخته‌ها، مسابقات مهارتی و آمادگی سال بعد',
    monthsName: 'تیر، مرداد، شهریور',
    icon: '☀️',
    accentColor: '#eab308',
    bgCanvasDark: '#172554',
    bgCanvasLight: '#fefce8',
    pathColorDark: '#1e3a8a',
    pathColorLight: '#fef08a',
    description: 'تم پرانرژی آفتابی و چالش‌های تقویت حافظه',
  },
}

// ۱۶ مرحله تحصیلی توزیع‌شده در طول ۴ فصل سال
export const GAME_STAGES: GameStage[] = [
  // پاییز (مراحل ۱ تا ۴)
  {
    id: 'stage-1',
    season: 'autumn',
    stageNumber: 1,
    title: 'گام نخست در پاییز طلایی',
    description: 'آشنایی با میدان نبرد و پاسخ به تست‌های مقدماتی',
    targetScore: 400,
    wavesCount: 3,
    recommendedCourses: ['math', 'science'],
    themeKey: 'autumn-leaves',
  },
  {
    id: 'stage-2',
    season: 'autumn',
    stageNumber: 2,
    title: 'کوچهٔ یادگیری مهرماه',
    description: 'مهارت در حل مسائل چندمفهومی با دقت بالا',
    targetScore: 700,
    wavesCount: 4,
    recommendedCourses: ['math', 'persian-reading'],
    themeKey: 'autumn-park',
  },
  {
    id: 'stage-3',
    season: 'autumn',
    stageNumber: 3,
    title: 'دژ استوار آبان',
    description: 'رویارویی با موج‌های پرسرعت شیاطین نادانی',
    targetScore: 1100,
    wavesCount: 5,
    recommendedCourses: ['science', 'social-studies'],
    themeKey: 'autumn-fortress',
  },
  {
    id: 'stage-4',
    season: 'autumn',
    stageNumber: 4,
    title: 'آزمون میانی قلعه آذر',
    description: 'غلبه بر غول مرحلهٔ پاییز و اثبات آمادگی نوبت اول',
    targetScore: 1600,
    wavesCount: 6,
    recommendedCourses: ['math', 'science', 'heaven-gifts'],
    themeKey: 'autumn-boss',
  },

  // زمستان (مراحل ۵ تا ۸)
  {
    id: 'stage-5',
    season: 'winter',
    stageNumber: 5,
    title: 'درهٔ بلورهای دی‌ماه',
    description: 'ایستگاه امتحانات نوبت اول؛ تمرکز در شرایط یخبندان',
    targetScore: 2000,
    wavesCount: 5,
    recommendedCourses: ['math', 'science'],
    themeKey: 'winter-valley',
  },
  {
    id: 'stage-6',
    season: 'winter',
    stageNumber: 6,
    title: 'قلهٔ برفی بهمن',
    description: 'تسلط بر استدلال‌های مفهومی و سوالات عمیق کتاب',
    targetScore: 2500,
    wavesCount: 6,
    recommendedCourses: ['science', 'persian-reading'],
    themeKey: 'winter-mountain',
  },
  {
    id: 'stage-7',
    season: 'winter',
    stageNumber: 7,
    title: 'پل دانشمندان اسفند',
    description: 'مسابقه سرعت عمل و دقت در برابر دشمنان نامرئی',
    targetScore: 3000,
    wavesCount: 7,
    recommendedCourses: ['math', 'social-studies'],
    themeKey: 'winter-bridge',
  },
  {
    id: 'stage-8',
    season: 'winter',
    stageNumber: 8,
    title: 'برج یخی نوبت اول',
    description: 'پایان موفقیت‌آمیز نیم‌سال اول و کسب تاج زمستان',
    targetScore: 3600,
    wavesCount: 8,
    recommendedCourses: ['math', 'science', 'quran'],
    themeKey: 'winter-boss',
  },

  // بهار (مراحل ۹ تا ۱۲)
  {
    id: 'stage-9',
    season: 'spring',
    stageNumber: 9,
    title: 'نسیم نوروزی فروردین',
    description: 'یادآوری سریع و باطراوت مفاهیم پس از تعطیلات',
    targetScore: 4200,
    wavesCount: 5,
    recommendedCourses: ['math', 'persian-reading'],
    themeKey: 'spring-blossom',
  },
  {
    id: 'stage-10',
    season: 'spring',
    stageNumber: 10,
    title: 'باغستان علم اردیبهشت',
    description: 'ترکیب مهارت‌های تفکر و علوم در طبیعت شکوفا',
    targetScore: 4800,
    wavesCount: 6,
    recommendedCourses: ['science', 'thinking-research'],
    themeKey: 'spring-garden',
  },
  {
    id: 'stage-11',
    season: 'spring',
    stageNumber: 11,
    title: 'موج خروشان خرداد',
    description: 'آمادگی کامل برای امتحانات نهایی پایان سال',
    targetScore: 5500,
    wavesCount: 7,
    recommendedCourses: ['math', 'science', 'heaven-gifts'],
    themeKey: 'spring-waterfall',
  },
  {
    id: 'stage-12',
    season: 'spring',
    stageNumber: 12,
    title: 'تاج‌گذاری سالانه علم',
    description: 'پایان پیروزمندانه سال تحصیلی و دریافت لوح زرین',
    targetScore: 6500,
    wavesCount: 9,
    recommendedCourses: ['math', 'science', 'persian-reading'],
    themeKey: 'spring-boss',
  },

  // تابستان (مراحل ۱۳ تا ۱۶)
  {
    id: 'stage-13',
    season: 'summer',
    stageNumber: 13,
    title: 'ساحل خرد و پژوهش',
    description: 'شروع لیگ تابستانی برای حفظ پویایی ذهن',
    targetScore: 7200,
    wavesCount: 5,
    recommendedCourses: ['science', 'work-tech'],
    themeKey: 'summer-beach',
  },
  {
    id: 'stage-14',
    season: 'summer',
    stageNumber: 14,
    title: 'آفتاب زرین محاسبات',
    description: 'مسابقات ذهنی و سرعت تفکر در ایام فراغت',
    targetScore: 8000,
    wavesCount: 6,
    recommendedCourses: ['math', 'social-studies'],
    themeKey: 'summer-sun',
  },
  {
    id: 'stage-15',
    season: 'summer',
    stageNumber: 15,
    title: 'واحهٔ کاشفان جوان',
    description: 'پروژه‌های مهارتی و تست‌های کاربردی زندگی',
    targetScore: 9000,
    wavesCount: 7,
    recommendedCourses: ['science', 'thinking-research'],
    themeKey: 'summer-oasis',
  },
  {
    id: 'stage-16',
    season: 'summer',
    stageNumber: 16,
    title: 'پل طلایی سال جدید',
    description: 'آمادگی نهایی و درخشش برای ورود به مقطع بالاتر',
    targetScore: 10000,
    wavesCount: 10,
    recommendedCourses: ['math', 'science', 'persian-reading'],
    themeKey: 'summer-boss',
  },
]

// بانک مدال‌ها و افتخارات
export const GAME_MEDALS: GameMedal[] = [
  {
    id: 'medal-accuracy-100',
    title: 'دقت طلایی ۱۰۰٪',
    description: 'ثبت دقت کامل ۱۰۰٪ در یک بازی با حداقل ۴ سوال پاسخ داده شده',
    icon: '🏅',
    category: 'accuracy',
    requirementText: 'دقت ۱۰۰٪ در یک جلسه کامل',
    rewardScore: 300,
  },
  {
    id: 'medal-speed-reflex',
    title: 'تیر صاعقه‌آسا',
    description: 'پاسخ صحیح به یک سوال در کمتر از ۳ ثانیه',
    icon: '⚡',
    category: 'speed',
    requirementText: 'پاسخ درست در کمتر از ۳ ثانیه',
    rewardScore: 200,
  },
  {
    id: 'medal-shield-master',
    title: 'مدافع افسانه‌ای',
    description: 'پایان بازی بدون کم شدن حتی یک واحد از سلامت قلعه فرزانگی',
    icon: '🛡️',
    category: 'defense',
    requirementText: 'سلامت ۱۰۰٪ قلعه در پایان بازی',
    rewardScore: 400,
  },
  {
    id: 'medal-cosmic-sniper',
    title: 'تک‌تیرانداز کیهانی',
    description: 'شلیک دقیق و اصابت مستقیم موشک به مرکز دشمن در نبرد موشکی',
    icon: '🚀',
    category: 'accuracy',
    requirementText: 'دقت شلیک موشک بالای ۸۵٪',
    rewardScore: 250,
  },
  {
    id: 'medal-wisdom-streak',
    title: 'زنجیرهٔ دانایی',
    description: 'پاسخ صحیح به ۵ سوال پیاپی بدون کوچک‌ترین خطا',
    icon: '🔥',
    category: 'streak',
    requirementText: '۵ پاسخ درست پیاپی',
    rewardScore: 350,
  },
  {
    id: 'medal-polymath',
    title: 'استاد چندگانه',
    description: 'انجام موفق مأموریت با انتخاب همزمان حداقل ۳ درس مختلف',
    icon: '📚',
    category: 'curriculum',
    requirementText: 'مأموریت با ۳ درس همزمان',
    rewardScore: 250,
  },
  {
    id: 'medal-autumn-champion',
    title: 'قهرمان پاییز طلایی',
    description: 'تکمیل تمامی مراحل فصل پاییز با موفقیت',
    icon: '🍂',
    category: 'season',
    requirementText: 'فتح مراحل ۱ تا ۴',
    rewardScore: 500,
  },
  {
    id: 'medal-winter-guardian',
    title: 'نگهبان زمستان بلورین',
    description: 'تکمیل تمامی مراحل فصل زمستان با موفقیت',
    icon: '❄️',
    category: 'season',
    requirementText: 'فتح مراحل ۵ تا ۸',
    rewardScore: 500,
  },
  {
    id: 'medal-spring-herald',
    title: 'پیشتاز بهار شکوفا',
    description: 'تکمیل تمامی مراحل فصل بهار با نمرات درخشان',
    icon: '🌸',
    category: 'season',
    requirementText: 'فتح مراحل ۹ تا ۱۲',
    rewardScore: 500,
  },
  {
    id: 'medal-daily-streak-3',
    title: 'استمرار طلایی ۳ روزه',
    description: 'انجام بازی‌های آموزشی در ۳ روز مختلف',
    icon: '📅',
    category: 'streak',
    requirementText: 'بازی در ۳ روز متمایز',
    rewardScore: 450,
  },
]

// جملات انگیزشی، علمی و امیدبخش
export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 'q1',
    text: 'هر اشتباه یک پله برای یادگیری عمیق‌تر است؛ شجاعانه تلاش کن!',
    author: 'پیام فرزانگی',
    category: 'effort',
    icon: '🌟',
  },
  {
    id: 'q2',
    text: 'دانش بزرگ‌ترین گنجی است که هیچ‌کس نمی‌تواند آن را از تو بگیرد.',
    author: 'حکمت کهن',
    category: 'science',
    icon: '💎',
  },
  {
    id: 'q3',
    text: 'با هر مسئله‌ای که حل می‌کنی، ارتباطات عصبی جدیدی در مغزت ساخته می‌شود!',
    author: 'دانش مغز و یادگیری',
    category: 'science',
    icon: '🧠',
  },
  {
    id: 'q4',
    text: 'پشتکار و تمرین منظم، کلید طلایی تبدیل شدن به قهرمان است.',
    author: 'انگیزه تحصیلی',
    category: 'courage',
    icon: '🚀',
  },
  {
    id: 'q5',
    text: 'اگر امروز یک گام بیاموزی، فردا به قله‌های ناشناخته صعود خواهی کرد.',
    author: 'راز موفقیت',
    category: 'learning',
    icon: '🏔️',
  },
  {
    id: 'q6',
    text: 'علم و دانایی مانند نوری درخشان است که تاریکی جهل را از میان می‌برد.',
    author: 'پیام دانایی',
    category: 'science',
    icon: '☀️',
  },
  {
    id: 'q7',
    text: 'قهرمانان کسانی نیستند که هرگز شکست نمی‌خورند، بلکه کسانی هستند که دوباره برمی‌خیزند!',
    author: 'امید و تلاش',
    category: 'courage',
    icon: '🛡️',
  },
]

// تشخیص هوشمند فصل جاری سال تحصیلی بر اساس تاریخ
export function getCurrentSeasonKey(): GameSeasonKey {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12 (Gregorian)

  // نگاشت با تقویم تحصیلی ایران:
  // مهر تا آذر: ماه‌های سپتامبر (۹) تا دسامبر (۱۲) -> پاییز
  // دی تا اسفند: ماه‌های ژانویه (۱) تا مارس (۳) -> زمستان
  // فروردین تا خرداد: ماه‌های آوریل (۴) تا ژوئن (۶) -> بهار
  // تیر تا شهریور: ماه‌های جولای (۷) تا آگوست (۸) -> تابستان
  if (month >= 9 && month <= 11) return 'autumn'
  if (month === 12 || month === 1 || month === 2) return 'winter'
  if (month >= 3 && month <= 6) return 'spring'
  return 'summer'
}

// تولید چالش‌های روزانه بر اساس تاریخ روز
export function getDailyChallenges(dateStr: string): DailyChallenge[] {
  // تولید هش ساده از رشته تاریخ برای تصادفی‌سازی ثابت در طول یک روز
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  const seed = Math.abs(hash)

  return [
    {
      id: `daily-${dateStr}-q`,
      date: dateStr,
      title: 'چالش دانش‌آموز پژوهشگر',
      description: 'پاسخ صحیح به حداقل ۵ سوال کتاب درسی در بازی‌ها',
      icon: '🎯',
      targetCount: 5,
      currentCount: 0,
      isCompleted: false,
      rewardScore: 120,
      type: 'questions',
    },
    {
      id: `daily-${dateStr}-w`,
      date: dateStr,
      title: 'استقامت در میدان نبرد',
      description: 'دفع حداقل ۳ موج در بازی برج دفاعی یا نبرد موشکی',
      icon: '⚔️',
      targetCount: 3,
      currentCount: 0,
      isCompleted: false,
      rewardScore: 150,
      type: 'waves',
    },
    {
      id: `daily-${dateStr}-s`,
      date: dateStr,
      title: 'سرعت عمل ذهنی',
      description: 'ثبت حداقل یک پاسخ درست در کمتر از ۴ ثانیه',
      icon: '⚡',
      targetCount: 1,
      currentCount: 0,
      isCompleted: false,
      rewardScore: 100,
      type: 'speed',
    },
  ]
}
