import type { AttendanceStatus, FollowUpStatus } from '@/types'

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غایب',
  late: 'تأخیر',
  excused: 'موجه',
}

export const ATTENDANCE_STATUS_ICONS: Record<AttendanceStatus, string> = {
  present: '✓',
  absent: '✕',
  late: '⏱',
  excused: '✎',
}

export const UNRECORDED_LABEL = 'ثبت‌نشده'

export const ATTENDANCE_STATUS_ACTIVE_CLASSES: Record<AttendanceStatus, string> = {
  present:
    'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  absent: 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300',
  late: 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  excused: 'border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
}

export const ATTENDANCE_STATUS_BADGE_CLASSES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  excused: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
}

export const EXIT_REASONS: string[] = ['آمدن اولیا', 'بیماری', 'نوبت پزشک', 'مراسم خانوادگی', 'دستور مدیریت']

export const PARENT_RELATIONS: string[] = ['پدر', 'مادر', 'سرپرست', 'سایر']

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ['none', 'called', 'no-answer']

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  none: 'پیگیری نشده',
  called: 'تماس گرفته شد',
  'no-answer': 'پاسخ نداد',
}

export const ACTIVE_TEACHER_STORAGE_KEY = 'school-manager-attendance-active-teacher'
export const PRINCIPAL_LABEL_STORAGE_KEY = 'school-manager-attendance-principal-label'
export const ALL_TEACHERS = ''
export const DEFAULT_PRINCIPAL_LABEL = 'مدیر مدرسه'
