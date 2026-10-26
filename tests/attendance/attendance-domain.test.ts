import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AttendanceRecord, StudentAttendanceProfile } from '@/types'
import { weekdayIndex } from '@/utils/attendance-date'
import {
  applyDraft,
  attendanceRate,
  backfillProfiles,
  emptyTally,
  generateGuid,
  isDraftChanged,
  isValidGuid,
  normalizeIranMobile,
  recordKey,
  tallyAll,
  toggleAbsentStatus,
  trendOf,
  validateExit,
  weekdayStats,
} from '@/utils/attendance-domain'

const parts = { classroomId: 'c1', studentId: 's1', date: '2026-10-25' }

function record(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: recordKey(parts.classroomId, parts.studentId, parts.date),
    ...parts,
    status: 'present',
    arrivalTime: '',
    excuseReason: '',
    source: 'manual',
    exit: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('ثبت idempotent', () => {
  it('کلید رکورد برای (کلاس، دانش‌آموز، تاریخ) یکتا و ثابت است', () => {
    const first = applyDraft(undefined, parts, { status: 'present', arrivalTime: '', excuseReason: '' }, 'manual', 10)
    const second = applyDraft(first, parts, { status: 'present', arrivalTime: '', excuseReason: '' }, 'manual', 20)
    assert.equal(first.id, second.id)
    assert.equal(second.createdAt, 10)
    assert.equal(second.updatedAt, 20)
  })

  it('تغییرنکردن پیش‌نویس را تشخیص می‌دهد', () => {
    const saved = record()
    assert.equal(isDraftChanged({ status: 'present', arrivalTime: '', excuseReason: '' }, saved), false)
    assert.equal(isDraftChanged({ status: 'absent', arrivalTime: '', excuseReason: '' }, saved), true)
  })

  it('با غایب‌شدن، خروج قبلی حذف می‌شود', () => {
    const saved = record({ exit: { time: '10:00', reason: 'بیماری', receiver: '' } })
    const next = applyDraft(saved, parts, { status: 'absent', arrivalTime: '', excuseReason: '' }, 'manual', 5)
    assert.equal(next.exit, null)
  })
})

describe('حالت فقط غایبین', () => {
  it('toggle غایب', () => {
    assert.equal(toggleAbsentStatus(null, false), 'absent')
    assert.equal(toggleAbsentStatus('absent', false), null)
    assert.equal(toggleAbsentStatus('absent', true), 'present')
    assert.equal(toggleAbsentStatus('late', true), 'absent')
  })
})

describe('اعتبارسنجی خروج', () => {
  it('فقط برای حاضر یا تأخیر', () => {
    const exit = { time: '10:00', reason: 'بیماری', receiver: '' }
    assert.notEqual(validateExit(exit, record({ status: 'absent' })), null)
    assert.notEqual(validateExit(exit, undefined), null)
    assert.equal(validateExit(exit, record()), null)
  })

  it('ساعت خروج باید بعد از ورود باشد', () => {
    const late = record({ status: 'late', arrivalTime: '08:30' })
    assert.notEqual(validateExit({ time: '08:30', reason: 'x', receiver: '' }, late), null)
    assert.equal(validateExit({ time: '09:00', reason: 'x', receiver: '' }, late), null)
  })

  it('ساعت نامعتبر و دلیل خالی رد می‌شود', () => {
    assert.notEqual(validateExit({ time: '25:00', reason: 'x', receiver: '' }, record()), null)
    assert.notEqual(validateExit({ time: '10:00', reason: '  ', receiver: '' }, record()), null)
  })
})

describe('شماره‌ی موبایل و GUID', () => {
  it('فرمت‌های رایج موبایل ایران نرمال می‌شوند', () => {
    assert.equal(normalizeIranMobile('09123456789'), '09123456789')
    assert.equal(normalizeIranMobile('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789')
    assert.equal(normalizeIranMobile('+98 912 345 6789'), '09123456789')
    assert.equal(normalizeIranMobile('9123456789'), '09123456789')
    assert.equal(normalizeIranMobile('0212345678'), null)
  })

  it('fallback تولید GUID نسخه ۴ معتبر می‌سازد', () => {
    const fake = { getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      const bytes = array as unknown as Uint8Array
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 37 + 11) & 0xff
      return array
    } }
    assert.equal(isValidGuid(generateGuid(fake)), true)
  })
})

describe('migration پروفایل‌ها', () => {
  it('فقط برای دانش‌آموزان فاقد پروفایل GUID یکتا می‌سازد', () => {
    const existing = new Map<string, StudentAttendanceProfile>([
      ['s1', { studentId: 's1', guid: 'g-existing', primaryParent: { phone: '', relation: '' }, createdAt: 1, updatedAt: 1 }],
    ])
    let counter = 0
    const created = backfillProfiles(['s1', 's2', 's3'], existing, () => (counter++ < 1 ? 'g-existing' : `g-${counter}`), 99)
    assert.deepEqual(created.map((item) => item.studentId), ['s2', 's3'])
    assert.equal(new Set(created.map((item) => item.guid)).size, 2)
    assert.equal(created.some((item) => item.guid === 'g-existing'), false)
  })
})

describe('تجمیع گزارش', () => {
  const records = [
    record({ id: 'a', date: '2026-10-24', status: 'absent' }),
    record({ id: 'b', date: '2026-10-25', status: 'present' }),
    record({ id: 'c', date: '2026-10-25', studentId: 's2', status: 'late' }),
    record({ id: 'd', date: '2026-10-26', status: 'excused' }),
  ]

  it('نرخ حضور = (حاضر + تأخیر) / ثبت‌شده‌ها', () => {
    const tally = tallyAll(records)
    assert.equal(attendanceRate(tally), 2 / 4)
    assert.equal(attendanceRate(emptyTally()), null)
  })

  it('روز هفته: شنبه صفر است', () => {
    assert.equal(weekdayIndex('2026-10-24'), 0)
    assert.equal(weekdayStats(records)[0].absent, 1)
  })

  it('روند ماهانه با ماه شمسی گروه‌بندی می‌شود', () => {
    const trend = trendOf(records, 'month')
    assert.equal(trend.length, 1)
    assert.equal(trend[0].key, '1405-08')
    assert.equal(trend[0].recorded, 4)
  })
})
