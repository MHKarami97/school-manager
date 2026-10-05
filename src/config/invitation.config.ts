import type {
  Invitation,
  InvitationAudience,
  InvitationRecipient,
  InvitationStatus,
  InvitationTheme,
  InvitationType,
  RsvpStatus,
} from '../types'

export const INVITATION_TYPE_LABELS: Record<InvitationType, string> = {
  'parent-meeting': 'جلسه اولیا و مربیان',
  ceremony: 'جشن و مراسم',
  election: 'انتخابات شورا/انجمن',
  'report-card': 'اعلام نتایج و کارنامه',
  'field-trip': 'اردو و بازدید',
  general: 'دعوت‌نامه عمومی',
}

export const INVITATION_TYPES: InvitationType[] = [
  'parent-meeting',
  'ceremony',
  'election',
  'report-card',
  'field-trip',
  'general',
]

export const INVITATION_AUDIENCE_LABELS: Record<InvitationAudience, string> = {
  parents: 'اولیای دانش‌آموزان',
  teachers: 'همکاران (معلمان)',
  students: 'دانش‌آموزان',
  general: 'عمومی (بدون فهرست مدعوین)',
}

export const INVITATION_AUDIENCES: InvitationAudience[] = ['parents', 'teachers', 'students', 'general']

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  draft: 'پیش‌نویس',
  sent: 'ارسال‌شده',
  closed: 'پایان‌یافته',
}

export const INVITATION_STATUS_BADGE_CLASSES: Record<InvitationStatus, string> = {
  draft: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  closed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: 'در انتظار پاسخ',
  attending: 'حضور دارد',
  declined: 'حضور ندارد',
}

export const RSVP_STATUSES: RsvpStatus[] = ['pending', 'attending', 'declined']

export const RSVP_BADGE_CLASSES: Record<RsvpStatus, string> = {
  pending: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  attending: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  declined: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

/** رنگ‌ها inline هستند (نه کلاس Tailwind) تا در چاپ/PDF هم دقیقاً همین رنگ‌ها بیایند. */
export interface InvitationThemeStyle {
  label: string
  accent: string
  border: string
  headerBg: string
  headerColor: string
  soft: string
}

export const INVITATION_THEMES: Record<InvitationTheme, InvitationThemeStyle> = {
  classic: {
    label: 'کلاسیک',
    accent: '#262b3d',
    border: '3px double #262b3d',
    headerBg: 'transparent',
    headerColor: '#262b3d',
    soft: '#f6f7f9',
  },
  modern: {
    label: 'مدرن',
    accent: '#1c5fe0',
    border: '1px solid #b8d9ff',
    headerBg: '#1c5fe0',
    headerColor: '#ffffff',
    soft: '#eef6ff',
  },
  festive: {
    label: 'جشن',
    accent: '#b45309',
    border: '3px solid #d97706',
    headerBg: '#fef3c7',
    headerColor: '#92400e',
    soft: '#fffbeb',
  },
}

export const INVITATION_THEME_KEYS: InvitationTheme[] = ['classic', 'modern', 'festive']

export interface InvitationPreset {
  title: string
  audience: InvitationAudience
  body: string
  agenda: string[]
  requirements: string[]
  requireRsvp: boolean
}

/**
 * متن‌های پیش‌فرض هر نوع دعوت‌نامه. جاگذاری‌ها با {{...}} نوشته می‌شوند و هنگام
 * نمایش/چاپ برای هر مدعو جداگانه جایگزین می‌شوند (خطاب در بالای کارت خودکار
 * اضافه می‌شود، پس لازم نیست در متن بیاید).
 */
export const INVITATION_PRESETS: Record<InvitationType, InvitationPreset> = {
  'parent-meeting': {
    title: 'جلسه اولیا و مربیان',
    audience: 'parents',
    body:
      'با سلام و احترام،\n' +
      'بدین‌وسیله از شما دعوت می‌شود در «{{عنوان}}» که در تاریخ {{تاریخ}} ساعت {{ساعت}} در {{مکان}} برگزار می‌شود حضور به هم رسانید.\n' +
      'مشارکت شما در کنار مجموعه‌ی مدرسه، نقش مهمی در پیشرفت تحصیلی و تربیتی {{نام_دانش‌آموز}} دارد.',
    agenda: ['استقبال و ثبت حضور', 'گزارش وضعیت تحصیلی و تربیتی', 'پرسش و پاسخ با معلمان'],
    requirements: [],
    requireRsvp: true,
  },
  ceremony: {
    title: 'جشن و مراسم',
    audience: 'parents',
    body:
      'با سلام و احترام،\n' +
      'مفتخریم که شما را به «{{عنوان}}» در تاریخ {{تاریخ}} ساعت {{ساعت}} در {{مکان}} دعوت کنیم.\n' +
      'حضور گرم شما مایه‌ی دلگرمی ماست.',
    agenda: [],
    requirements: [],
    requireRsvp: false,
  },
  election: {
    title: 'انتخابات شورا و انجمن اولیا',
    audience: 'parents',
    body:
      'با سلام و احترام،\n' +
      'به اطلاع می‌رساند «{{عنوان}}» در تاریخ {{تاریخ}} ساعت {{ساعت}} در {{مکان}} برگزار می‌شود.\n' +
      'مشارکت شما در انتخاب نمایندگان، نقش مهمی در پیشبرد امور مدرسه دارد.',
    agenda: [],
    requirements: ['همراه داشتن کارت شناسایی'],
    requireRsvp: false,
  },
  'report-card': {
    title: 'تحویل کارنامه',
    audience: 'parents',
    body:
      'با سلام و احترام،\n' +
      'کارنامه‌ی تحصیلی {{نام_دانش‌آموز}} ({{پایه}}) در تاریخ {{تاریخ}} ساعت {{ساعت}} در {{مکان}} تحویل داده می‌شود.\n' +
      'حضور ولی دانش‌آموز الزامی است.',
    agenda: [],
    requirements: ['همراه داشتن کارت شناسایی ولی'],
    requireRsvp: false,
  },
  'field-trip': {
    title: 'اردو و بازدید',
    audience: 'parents',
    body:
      'با سلام و احترام،\n' +
      'اردوی «{{عنوان}}» در تاریخ {{تاریخ}} با حرکت از مدرسه در ساعت {{ساعت}} برگزار می‌شود.\n' +
      'لطفاً رضایت‌نامه‌ی شرکت {{نام_دانش‌آموز}} را حداکثر تا {{مهلت_پاسخ}} تکمیل و به مدرسه تحویل دهید.',
    agenda: [],
    requirements: ['لباس و کفش مناسب', 'همراه داشتن ناهار و آب'],
    requireRsvp: true,
  },
  general: {
    title: '',
    audience: 'general',
    body:
      'با سلام و احترام،\n' +
      'از شما دعوت می‌شود در «{{عنوان}}» در تاریخ {{تاریخ}} ساعت {{ساعت}} در {{مکان}} حضور به هم رسانید.',
    agenda: [],
    requirements: [],
    requireRsvp: false,
  },
}

export function createEmptyInvitation(): Invitation {
  const now = Date.now()
  const preset = INVITATION_PRESETS['parent-meeting']
  return {
    id: crypto.randomUUID(),
    title: preset.title,
    schoolName: '',
    type: 'parent-meeting',
    audience: preset.audience,
    theme: 'modern',
    status: 'draft',
    body: preset.body,
    agenda: [...preset.agenda],
    requirements: [...preset.requirements],
    eventDate: '',
    eventTime: '',
    location: '',
    rsvpDeadline: '',
    contactPhone: '',
    senderName: '',
    senderTitle: 'مدیر مدرسه',
    targetGrades: [],
    requireRsvp: preset.requireRsvp,
    showRsvpSlip: preset.requireRsvp,
    recipients: [],
    sentDate: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function createCustomRecipient(name: string): InvitationRecipient {
  return {
    id: crypto.randomUUID(),
    kind: 'custom',
    refId: null,
    name,
    grade: null,
    rsvp: 'pending',
    guestsCount: 0,
    note: '',
  }
}
