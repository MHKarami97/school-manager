import { ATTENDANCE_STATUS_LABELS, FOLLOW_UP_LABELS } from '@/config/attendance.config'
import type {
  AttendanceRecord,
  Classroom,
  DateRange,
  PrintAbsenteeRow,
  PrintPayload,
  PrintStudentRow,
  PrintSummaryRow,
  StudentAttendanceProfile,
} from '@/types'
import type { AbsenteeRow } from '@/services/attendance-reports'
import { jalaliLabel } from '@/utils/attendance-date'
import { attendanceRate, emptyTally, formatRate, labelledPhonesOf, type Tally } from '@/utils/attendance-domain'

export function rangeText(range: DateRange): string {
  return range.from === range.to ? jalaliLabel(range.from) : `از ${jalaliLabel(range.from)} تا ${jalaliLabel(range.to)}`
}

function rowOf(name: string, tally: Tally): PrintSummaryRow {
  return {
    name,
    present: tally.present,
    absent: tally.absent,
    late: tally.late,
    excused: tally.excused,
    exits: tally.exits,
    rateText: formatRate(attendanceRate(tally)),
  }
}

export function buildSummaryPayload(
  classroom: Classroom,
  teacherName: string,
  range: DateRange,
  tallies: Map<string, Tally>,
  total: Tally,
  nameOf: (studentId: string) => string,
  memberIds: string[],
): PrintPayload {
  const rows = memberIds
    .map((id) => rowOf(nameOf(id), tallies.get(id) ?? emptyTally()))
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
  return {
    mode: 'summary',
    title: `نتیجه‌ی حضور و غیاب کلاس ${classroom.name}`,
    subtitle: rangeText(range),
    teacherName,
    summaryRows: rows,
    summaryTotals: rowOf('جمع', total),
    absenteeRows: [],
    studentRows: [],
    studentTotals: null,
  }
}

export function buildAbsenteesPayload(
  title: string,
  range: DateRange,
  teacherName: string,
  rows: AbsenteeRow[],
  classNameOf: (classroomId: string) => string,
  nameOf: (studentId: string) => string,
  profileOf: (studentId: string) => StudentAttendanceProfile | undefined,
): PrintPayload {
  const absenteeRows: PrintAbsenteeRow[] = rows.map((row) => ({
    date: jalaliLabel(row.record.date),
    className: classNameOf(row.record.classroomId),
    name: nameOf(row.record.studentId),
    phones: labelledPhonesOf(profileOf(row.record.studentId)),
    followUpText: FOLLOW_UP_LABELS[row.followUp?.status ?? 'none'],
    note: row.followUp?.note ?? '',
  }))
  return {
    mode: 'absentees',
    title,
    subtitle: rangeText(range),
    teacherName,
    summaryRows: [],
    summaryTotals: null,
    absenteeRows,
    studentRows: [],
    studentTotals: null,
  }
}

export function recordDetailText(record: AttendanceRecord): string {
  const parts: string[] = []
  if (record.status === 'late' && record.arrivalTime) parts.push(`ورود ${record.arrivalTime}`)
  if (record.status === 'excused' && record.excuseReason) parts.push(record.excuseReason)
  if (record.exit) {
    const receiver = record.exit.receiver ? ` (${record.exit.receiver})` : ''
    parts.push(`خروج ${record.exit.time} - ${record.exit.reason}${receiver}`)
  }
  return parts.join(' | ')
}

export function buildStudentPayload(
  studentName: string,
  range: DateRange,
  records: AttendanceRecord[],
  tally: Tally,
): PrintPayload {
  const rows: PrintStudentRow[] = records.map((record) => ({
    date: jalaliLabel(record.date),
    statusText: ATTENDANCE_STATUS_LABELS[record.status],
    detail: recordDetailText(record),
  }))
  return {
    mode: 'student',
    title: `گزارش حضور و غیاب ${studentName}`,
    subtitle: rangeText(range),
    teacherName: '',
    summaryRows: [],
    summaryTotals: null,
    absenteeRows: [],
    studentRows: rows,
    studentTotals: rowOf(studentName, tally),
  }
}
