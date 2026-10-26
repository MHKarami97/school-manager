import { defineStore } from 'pinia'
import { attendanceRepository, type RecordWrite } from '@/db/attendance-db'
import type { AttendanceRecord, AttendanceStatus, AuditEntry, Classroom, DraftEntry } from '@/types'
import {
  AttendanceDomainError,
  applyDraft,
  auditActionFor,
  draftFromRecord,
  generateGuid,
  isDraftChanged,
  recordKey,
  snapshotOf,
  toggleAbsentStatus,
} from '@/utils/attendance-domain'

interface PrincipalState {
  date: string
  membersByClass: Record<string, string[]>
  records: Record<string, AttendanceRecord>
  drafts: Record<string, DraftEntry>
  isLoading: boolean
  isSaving: boolean
}

export const useAttendancePrincipalStore = defineStore('attendancePrincipal', {
  state: (): PrincipalState => ({
    date: '',
    membersByClass: {},
    records: {},
    drafts: {},
    isLoading: false,
    isSaving: false,
  }),
  getters: {
    statusOf: (state) => (classroomId: string, studentId: string): AttendanceStatus | null => {
      const key = recordKey(classroomId, studentId, state.date)
      return (state.drafts[key] ?? draftFromRecord(state.records[key])).status
    },
    dirtyKeys(state): string[] {
      return Object.keys(state.drafts).filter((key) => isDraftChanged(state.drafts[key], state.records[key]))
    },
    isDirty(): boolean {
      return this.dirtyKeys.length > 0
    },
  },
  actions: {
    async open(date: string, classrooms: Classroom[]): Promise<void> {
      this.isLoading = true
      try {
        const loaded = await Promise.all(
          classrooms.map(async (classroom) => {
            const [members, records] = await Promise.all([
              attendanceRepository.listMembers(classroom.id),
              attendanceRepository.getRecordsForDay(classroom.id, date),
            ])
            return { classroom, members, records }
          }),
        )
        this.date = date
        this.drafts = {}
        this.membersByClass = Object.fromEntries(
          loaded.map((item) => [item.classroom.id, item.members.map((member) => member.studentId)]),
        )
        this.records = Object.fromEntries(loaded.flatMap((item) => item.records).map((record) => [record.id, record]))
      } finally {
        this.isLoading = false
      }
    },

    toggleAbsent(classroomId: string, studentId: string): void {
      const key = recordKey(classroomId, studentId, this.date)
      const draft = this.drafts[key] ?? draftFromRecord(this.records[key])
      this.drafts[key] = { ...draft, status: toggleAbsentStatus(draft.status, !!this.records[key]) }
    },

    markRestPresent(classroomId: string): void {
      for (const studentId of this.membersByClass[classroomId] ?? []) {
        if (this.statusOf(classroomId, studentId) !== null) continue
        this.drafts[recordKey(classroomId, studentId, this.date)] = { status: 'present', arrivalTime: '', excuseReason: '' }
      }
    },

    discardChanges(): void {
      this.drafts = {}
    },

    async save(actor: string): Promise<number> {
      const now = Date.now()
      const writes: RecordWrite[] = []
      for (const key of this.dirtyKeys) {
        const draft = this.drafts[key]
        if (draft.status === null) continue
        const [classroomId, studentId] = key.split('|')
        const before = this.records[key]
        const record = applyDraft(before, { classroomId, studentId, date: this.date }, draft, 'manual', now)
        const audit: AuditEntry = {
          id: generateGuid(),
          classroomId,
          studentId,
          date: this.date,
          at: now,
          actor,
          action: auditActionFor(before),
          before: before ? snapshotOf(before) : null,
          after: snapshotOf(record),
        }
        writes.push({ record, audit })
      }
      this.isSaving = true
      try {
        await attendanceRepository.saveWrites(writes)
      } catch (error) {
        throw error instanceof AttendanceDomainError ? error : new AttendanceDomainError('SAVE_FAILED', 'ذخیره انجام نشد.')
      } finally {
        this.isSaving = false
      }
      for (const write of writes) {
        this.records[write.record.id] = write.record
        delete this.drafts[write.record.id]
      }
      return writes.length
    },
  },
})
