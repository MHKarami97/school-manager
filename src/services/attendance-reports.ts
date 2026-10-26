import { attendanceRepository, type AttendanceRepository } from '@/db/attendance-db'
import type { AttendanceRecord, Classroom, DateRange, FollowUp, FollowUpStatus, TrendGranularity } from '@/types'
import {
  rankByAbsence,
  recordKey,
  tallyAll,
  tallyByStudent,
  trendOf,
  weekdayStats,
  type RankedStudent,
  type Tally,
  type TrendPoint,
  type WeekdayStat,
} from '@/utils/attendance-domain'

export interface ClassReport {
  records: AttendanceRecord[]
  total: Tally
  byStudent: Map<string, Tally>
  weekday: WeekdayStat[]
  trend: TrendPoint[]
  topAbsentees: RankedStudent[]
  recordedDays: number
}

export interface StudentReport {
  records: AttendanceRecord[]
  total: Tally
  weekday: WeekdayStat[]
  monthly: TrendPoint[]
}

export interface OverviewRow {
  classroom: Classroom
  total: Tally
  recordedDays: number
}

export interface AbsenteeRow {
  record: AttendanceRecord
  followUp: FollowUp | null
}

export class AttendanceReportService {
  private readonly cache = new Map<string, unknown>()
  private cacheRevision = -1
  private readonly repository: AttendanceRepository

  constructor(repository: AttendanceRepository = attendanceRepository) {
    this.repository = repository
  }

  private async cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
    if (this.cacheRevision !== this.repository.revision) {
      this.cache.clear()
      this.cacheRevision = this.repository.revision
    }
    if (this.cache.has(key)) return this.cache.get(key) as T
    const value = await compute()
    this.cache.set(key, value)
    return value
  }

  classRecords(classroomId: string, range: DateRange): Promise<AttendanceRecord[]> {
    return this.cached(`records|${classroomId}|${range.from}|${range.to}`, () =>
      this.repository.getRecordsInRange(classroomId, range.from, range.to),
    )
  }

  async classReport(classroomId: string, range: DateRange, granularity: TrendGranularity): Promise<ClassReport> {
    const records = await this.classRecords(classroomId, range)
    const byStudent = tallyByStudent(records)
    return {
      records,
      total: tallyAll(records),
      byStudent,
      weekday: weekdayStats(records),
      trend: trendOf(records, granularity),
      topAbsentees: rankByAbsence(byStudent, 5),
      recordedDays: new Set(records.map((record) => record.date)).size,
    }
  }

  studentRecords(studentId: string, range: DateRange): Promise<AttendanceRecord[]> {
    return this.cached(`student|${studentId}|${range.from}|${range.to}`, () =>
      this.repository.getRecordsOfStudent(studentId, range.from, range.to),
    )
  }

  async studentReport(studentId: string, range: DateRange): Promise<StudentReport> {
    const records = (await this.studentRecords(studentId, range)).slice().sort((a, b) => a.date.localeCompare(b.date))
    return { records, total: tallyAll(records), weekday: weekdayStats(records), monthly: trendOf(records, 'month') }
  }

  async overview(classrooms: Classroom[], range: DateRange): Promise<OverviewRow[]> {
    const rows: OverviewRow[] = []
    for (const classroom of classrooms) {
      const records = await this.classRecords(classroom.id, range)
      rows.push({
        classroom,
        total: tallyAll(records),
        recordedDays: new Set(records.map((record) => record.date)).size,
      })
    }
    return rows
  }

  async saveFollowUp(record: AttendanceRecord, status: FollowUpStatus, note: string): Promise<FollowUp> {
    const followUp: FollowUp = {
      id: recordKey(record.classroomId, record.studentId, record.date),
      classroomId: record.classroomId,
      studentId: record.studentId,
      date: record.date,
      status,
      note: note.trim(),
      updatedAt: Date.now(),
    }
    await this.repository.putFollowUp(followUp)
    return followUp
  }

  async absenteesForDay(classroomIds: string[], date: string): Promise<AbsenteeRow[]> {
    const rows: AbsenteeRow[] = []
    for (const classroomId of classroomIds) {
      const [records, followUps] = await Promise.all([
        this.repository.getRecordsForDay(classroomId, date),
        this.repository.getFollowUps(classroomId, date, date),
      ])
      const followUpByStudent = new Map(followUps.map((item) => [item.studentId, item]))
      for (const record of records) {
        if (record.status !== 'absent') continue
        rows.push({ record, followUp: followUpByStudent.get(record.studentId) ?? null })
      }
    }
    return rows
  }
}

export const attendanceReportService = new AttendanceReportService()
