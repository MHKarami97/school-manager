import type {
  AttendanceRecord,
  AttendanceSnapshot,
  AttendanceSource,
  AttendanceStatus,
  AuditAction,
  DraftEntry,
  ExitInfo,
  StudentAttendanceProfile,
  TrendGranularity,
} from '@/types'
import { bucketKey, bucketLabel, isValidTime, weekdayIndex } from '@/utils/attendance-date'

type CryptoLike = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>

export class AttendanceDomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AttendanceDomainError'
    this.code = code
  }
}

export function generateGuid(source: CryptoLike | undefined = globalThis.crypto): string {
  if (!source) throw new AttendanceDomainError('NO_CRYPTO', 'مرورگر از تولید شناسه امن پشتیبانی نمی‌کند.')
  if (typeof source.randomUUID === 'function') return source.randomUUID()
  const bytes = source.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidGuid(value: string): boolean {
  return GUID_PATTERN.test(value)
}

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
}

export function normalizeIranMobile(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-()+]/g, '')
  if (digits.startsWith('0098')) digits = `0${digits.slice(4)}`
  else if (digits.startsWith('98') && digits.length === 12) digits = `0${digits.slice(2)}`
  else if (/^9\d{9}$/.test(digits)) digits = `0${digits}`
  return /^09\d{9}$/.test(digits) ? digits : null
}

export function recordKey(classroomId: string, studentId: string, date: string): string {
  return `${classroomId}|${studentId}|${date}`
}

export function memberKey(classroomId: string, studentId: string): string {
  return `${classroomId}|${studentId}`
}

export function emptyDraft(): DraftEntry {
  return { status: null, arrivalTime: '', excuseReason: '' }
}

export function draftFromRecord(record: AttendanceRecord | undefined): DraftEntry {
  if (!record) return emptyDraft()
  return { status: record.status, arrivalTime: record.arrivalTime, excuseReason: record.excuseReason }
}

export function normalizeDraft(draft: DraftEntry): DraftEntry {
  return {
    status: draft.status,
    arrivalTime: draft.status === 'late' ? draft.arrivalTime : '',
    excuseReason: draft.status === 'excused' ? draft.excuseReason.trim() : '',
  }
}

export function isDraftChanged(draft: DraftEntry, record: AttendanceRecord | undefined): boolean {
  if (!record) return draft.status !== null
  const normalized = normalizeDraft(draft)
  return (
    normalized.status !== record.status ||
    normalized.arrivalTime !== record.arrivalTime ||
    normalized.excuseReason !== record.excuseReason
  )
}

export function validateDraft(draft: DraftEntry): string | null {
  if (draft.status === 'late' && draft.arrivalTime && !isValidTime(draft.arrivalTime)) {
    return 'ساعت ورود معتبر نیست.'
  }
  return null
}

export function toggleAbsentStatus(current: AttendanceStatus | null, hasSavedRecord: boolean): AttendanceStatus | null {
  if (current === 'absent') return hasSavedRecord ? 'present' : null
  return 'absent'
}

export function snapshotOf(record: AttendanceRecord): AttendanceSnapshot {
  return {
    status: record.status,
    arrivalTime: record.arrivalTime,
    excuseReason: record.excuseReason,
    exit: record.exit ? { ...record.exit } : null,
  }
}

export interface RecordKeyParts {
  classroomId: string
  studentId: string
  date: string
}

export function applyDraft(
  existing: AttendanceRecord | undefined,
  parts: RecordKeyParts,
  draft: DraftEntry,
  source: AttendanceSource,
  now: number,
): AttendanceRecord {
  const normalized = normalizeDraft(draft)
  if (normalized.status === null) {
    throw new AttendanceDomainError('NO_STATUS', 'وضعیت برای ثبت مشخص نشده است.')
  }
  const keepsExit = normalized.status === 'present' || normalized.status === 'late'
  return {
    id: recordKey(parts.classroomId, parts.studentId, parts.date),
    classroomId: parts.classroomId,
    studentId: parts.studentId,
    date: parts.date,
    status: normalized.status,
    arrivalTime: normalized.arrivalTime,
    excuseReason: normalized.excuseReason,
    source: existing ? existing.source : source,
    exit: keepsExit && existing ? existing.exit : null,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
}

export function auditActionFor(before: AttendanceRecord | undefined): AuditAction {
  return before ? 'update' : 'create'
}

export function validateExit(exit: ExitInfo, record: AttendanceRecord | undefined): string | null {
  if (!record || (record.status !== 'present' && record.status !== 'late')) {
    return 'خروج فقط برای دانش‌آموز حاضر یا دارای تأخیر قابل ثبت است.'
  }
  if (!isValidTime(exit.time)) return 'ساعت خروج معتبر نیست.'
  if (record.arrivalTime && exit.time <= record.arrivalTime) {
    return 'ساعت خروج باید بعد از ساعت ورود باشد.'
  }
  if (!exit.reason.trim()) return 'دلیل خروج را وارد کنید.'
  return null
}

export interface SheetSummary {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  unrecorded: number
}

export function summarizeSheet(
  memberIds: string[],
  statusOf: (studentId: string) => AttendanceStatus | null,
): SheetSummary {
  const summary: SheetSummary = { total: memberIds.length, present: 0, absent: 0, late: 0, excused: 0, unrecorded: 0 }
  for (const id of memberIds) {
    const status = statusOf(id)
    if (status === null) summary.unrecorded += 1
    else summary[status] += 1
  }
  return summary
}

export interface Tally {
  present: number
  absent: number
  late: number
  excused: number
  exits: number
}

export function emptyTally(): Tally {
  return { present: 0, absent: 0, late: 0, excused: 0, exits: 0 }
}

export function addToTally(tally: Tally, record: AttendanceRecord): void {
  tally[record.status] += 1
  if (record.exit) tally.exits += 1
}

export function recordedCount(tally: Tally): number {
  return tally.present + tally.absent + tally.late + tally.excused
}

export function attendanceRate(tally: Tally): number | null {
  const recorded = recordedCount(tally)
  if (!recorded) return null
  return (tally.present + tally.late) / recorded
}

export function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}٪`
}

export function tallyByStudent(records: AttendanceRecord[]): Map<string, Tally> {
  const result = new Map<string, Tally>()
  for (const record of records) {
    let tally = result.get(record.studentId)
    if (!tally) {
      tally = emptyTally()
      result.set(record.studentId, tally)
    }
    addToTally(tally, record)
  }
  return result
}

export function tallyAll(records: AttendanceRecord[]): Tally {
  const tally = emptyTally()
  for (const record of records) addToTally(tally, record)
  return tally
}

export interface WeekdayStat {
  index: number
  absent: number
  recorded: number
}

export function weekdayStats(records: AttendanceRecord[]): WeekdayStat[] {
  const stats: WeekdayStat[] = Array.from({ length: 7 }, (_, index) => ({ index, absent: 0, recorded: 0 }))
  for (const record of records) {
    const stat = stats[weekdayIndex(record.date)]
    stat.recorded += 1
    if (record.status === 'absent') stat.absent += 1
  }
  return stats
}

export interface TrendPoint {
  key: string
  label: string
  absent: number
  late: number
  recorded: number
}

export function trendOf(records: AttendanceRecord[], granularity: TrendGranularity): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>()
  for (const record of records) {
    const key = bucketKey(record.date, granularity)
    let point = buckets.get(key)
    if (!point) {
      point = { key, label: bucketLabel(key, granularity), absent: 0, late: 0, recorded: 0 }
      buckets.set(key, point)
    }
    point.recorded += 1
    if (record.status === 'absent') point.absent += 1
    if (record.status === 'late') point.late += 1
  }
  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key))
}

export interface RankedStudent {
  studentId: string
  tally: Tally
}

export function rankByAbsence(tallies: Map<string, Tally>, limit: number): RankedStudent[] {
  return Array.from(tallies, ([studentId, tally]) => ({ studentId, tally }))
    .filter((row) => row.tally.absent > 0)
    .sort((a, b) => b.tally.absent - a.tally.absent || b.tally.late - a.tally.late)
    .slice(0, limit)
}

export function backfillProfiles(
  studentIds: string[],
  existing: Map<string, StudentAttendanceProfile>,
  createGuid: () => string,
  now: number,
): StudentAttendanceProfile[] {
  const usedGuids = new Set(Array.from(existing.values(), (profile) => profile.guid))
  const created: StudentAttendanceProfile[] = []
  for (const studentId of studentIds) {
    if (existing.has(studentId)) continue
    let guid = createGuid()
    while (usedGuids.has(guid)) guid = createGuid()
    usedGuids.add(guid)
    created.push({ studentId, guid, primaryParent: { phone: '', relation: '' }, createdAt: now, updatedAt: now })
  }
  return created
}

export interface ProfileInput {
  primaryPhone: string
  primaryRelation: string
  secondaryPhone: string
  secondaryRelation: string
  nfcSerial: string
}

export function applyProfileInput(
  profile: StudentAttendanceProfile,
  input: ProfileInput,
  now: number,
): StudentAttendanceProfile {
  const primary = input.primaryPhone.trim() ? normalizeIranMobile(input.primaryPhone) : ''
  if (primary === null) {
    throw new AttendanceDomainError('BAD_PRIMARY_PHONE', 'شماره‌ی اصلی والدین معتبر نیست (مثال: 09123456789).')
  }
  const secondary = input.secondaryPhone.trim() ? normalizeIranMobile(input.secondaryPhone) : ''
  if (secondary === null) {
    throw new AttendanceDomainError('BAD_SECONDARY_PHONE', 'شماره‌ی دوم والدین معتبر نیست.')
  }
  const next: StudentAttendanceProfile = {
    studentId: profile.studentId,
    guid: profile.guid,
    primaryParent: { phone: primary, relation: input.primaryRelation },
    createdAt: profile.createdAt,
    updatedAt: now,
  }
  if (secondary) next.secondaryParent = { phone: secondary, relation: input.secondaryRelation }
  const serial = input.nfcSerial.trim().toLowerCase()
  if (serial) next.nfcSerial = serial
  return next
}

export function labelledPhonesOf(
  profile: StudentAttendanceProfile | undefined,
): { phone: string; relation: string }[] {
  if (!profile) return []
  return [profile.primaryParent, profile.secondaryParent]
    .filter((contact): contact is { phone: string; relation: string } => !!contact && !!contact.phone)
    .map((contact) => ({ phone: contact.phone, relation: contact.relation }))
}

export function toTelHref(phone: string): string {
  return `tel:${phone}`
}
