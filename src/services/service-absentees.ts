import { attendanceRepository } from '@/db/attendance-db'
import type { Classroom } from '@/types'

export async function absentStudentIdsOn(date: string, classrooms: Classroom[]): Promise<Set<string>> {
  const lists = await Promise.all(classrooms.map((classroom) => attendanceRepository.getRecordsForDay(classroom.id, date)))
  const absent = new Set<string>()
  for (const records of lists) {
    for (const record of records) if (record.status === 'absent') absent.add(record.studentId)
  }
  return absent
}
