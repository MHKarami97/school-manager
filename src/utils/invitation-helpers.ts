import type { Invitation, InvitationRecipient, Student, Teacher } from '../types'
import { gradeLabel } from '../config/levels.config'
import { formatTeacherName } from './teacher-format'
import { isoStringToJalaali, formatJalaaliDate } from './jalaali'

export interface InvitationPlaceholder {
  key: string
  label: string
}

export const INVITATION_PLACEHOLDERS: InvitationPlaceholder[] = [
  { key: 'عنوان', label: 'عنوان' },
  { key: 'تاریخ', label: 'تاریخ' },
  { key: 'ساعت', label: 'ساعت' },
  { key: 'مکان', label: 'مکان' },
  { key: 'نام_دانش‌آموز', label: 'نام دانش‌آموز' },
  { key: 'پایه', label: 'پایه' },
  { key: 'مهلت_پاسخ', label: 'مهلت پاسخ' },
  { key: 'تلفن', label: 'تلفن' },
  { key: 'خطاب', label: 'خطاب' },
]

/** فاصله، زیرخط و نیم‌فاصله را حذف می‌کند تا تایپ دستی جاگذاری‌ها هم کار کند. */
function normalizeKey(key: string): string {
  return key.replace(/[\s_\u200c]/g, '')
}

const WEEKDAY_BY_JS_DAY = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

export function todayIsoString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}

/** مثلاً «شنبه ۱۴۰۵/۰۷/۲۰» - روز هفته از تاریخ میلادی ISO محاسبه می‌شود. */
export function eventDateLabel(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return jalaaliDateLabel(iso)
  const weekday = WEEKDAY_BY_JS_DAY[new Date(year, month - 1, day).getDay()]
  return `${weekday} ${jalaaliDateLabel(iso)}`
}

export function salutationFor(invitation: Invitation, recipient: InvitationRecipient | null): string {
  if (!recipient) {
    if (invitation.audience === 'parents') return 'اولیای گرامی'
    if (invitation.audience === 'teachers') return 'همکاران گرامی'
    if (invitation.audience === 'students') return 'دانش‌آموزان عزیز'
    return 'مدعوین گرامی'
  }
  if (invitation.audience === 'parents') {
    return recipient.kind === 'custom' ? `${recipient.name} گرامی` : `اولیای گرامی دانش‌آموز ${recipient.name}`
  }
  if (invitation.audience === 'students') return `${recipient.name} عزیز`
  return `${recipient.name} گرامی`
}

/** جاگذاری‌های {{...}} را برای یک مدعو (یا حالت عمومی بدون مدعو) با مقدار واقعی عوض می‌کند. */
export function renderInvitationText(text: string, invitation: Invitation, recipient: InvitationRecipient | null): string {
  const studentName = recipient && recipient.kind === 'student' ? recipient.name : 'فرزند شما'
  const grade = recipient && recipient.grade ? gradeLabel(recipient.grade) : ''
  const values: Record<string, string> = {
    [normalizeKey('خطاب')]: salutationFor(invitation, recipient),
    [normalizeKey('عنوان')]: invitation.title,
    [normalizeKey('تاریخ')]: eventDateLabel(invitation.eventDate) || '—',
    [normalizeKey('ساعت')]: invitation.eventTime || '—',
    [normalizeKey('مکان')]: invitation.location || '—',
    [normalizeKey('نام_دانش‌آموز')]: studentName,
    [normalizeKey('پایه')]: grade || '—',
    [normalizeKey('مهلت_پاسخ')]: invitation.rsvpDeadline ? jalaaliDateLabel(invitation.rsvpDeadline) : '—',
    [normalizeKey('تلفن')]: invitation.contactPhone || '—',
  }
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match: string, key: string) => values[normalizeKey(key)] ?? match)
}

export function buildStudentRecipients(
  students: Student[],
  grades: number[],
  existing: InvitationRecipient[],
): InvitationRecipient[] {
  const existingRefs = new Set(existing.filter((r) => r.kind === 'student').map((r) => r.refId))
  const additions: InvitationRecipient[] = students
    .filter((s) => grades.includes(s.grade) && !existingRefs.has(s.id))
    .sort((a, b) => a.grade - b.grade || a.lastName.localeCompare(b.lastName, 'fa') || a.firstName.localeCompare(b.firstName, 'fa'))
    .map((s) => ({
      id: crypto.randomUUID(),
      kind: 'student' as const,
      refId: s.id,
      name: `${s.firstName} ${s.lastName}`,
      grade: s.grade,
      rsvp: 'pending' as const,
      guestsCount: 0,
      note: '',
    }))
  return [...existing, ...additions]
}

export function buildTeacherRecipients(teachers: Teacher[], existing: InvitationRecipient[]): InvitationRecipient[] {
  const existingRefs = new Set(existing.filter((r) => r.kind === 'teacher').map((r) => r.refId))
  const additions: InvitationRecipient[] = teachers
    .filter((t) => !existingRefs.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
    .map((t) => ({
      id: crypto.randomUUID(),
      kind: 'teacher' as const,
      refId: t.id,
      name: formatTeacherName(t),
      grade: null,
      rsvp: 'pending' as const,
      guestsCount: 0,
      note: '',
    }))
  return [...existing, ...additions]
}

export interface RsvpSummary {
  total: number
  attending: number
  declined: number
  pending: number
  guests: number
  expectedAttendees: number
}

export function rsvpSummary(recipients: InvitationRecipient[]): RsvpSummary {
  const attendingList = recipients.filter((r) => r.rsvp === 'attending')
  const guests = attendingList.reduce((sum, r) => sum + Math.max(0, r.guestsCount), 0)
  return {
    total: recipients.length,
    attending: attendingList.length,
    declined: recipients.filter((r) => r.rsvp === 'declined').length,
    pending: recipients.filter((r) => r.rsvp === 'pending').length,
    guests,
    expectedAttendees: attendingList.length + guests,
  }
}

/** مهلت پاسخ گذشته ولی هنوز مدعوینی بی‌پاسخ مانده‌اند؟ (برای هشدار یادآوری) */
export function isRsvpOverdue(invitation: Invitation): boolean {
  if (!invitation.requireRsvp || !invitation.rsvpDeadline || invitation.status === 'closed') return false
  if (invitation.rsvpDeadline >= todayIsoString()) return false
  return rsvpSummary(invitation.recipients).pending > 0
}

export function isUpcoming(invitation: Invitation): boolean {
  return !!invitation.eventDate && invitation.eventDate >= todayIsoString() && invitation.status !== 'closed'
}
