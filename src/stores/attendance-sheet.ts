import { defineStore } from 'pinia'
import { attendanceRepository, type RecordWrite } from '@/db/attendance-db'
import type { AttendanceSink } from '@/services/attendance-input'
import type {
  AttendanceRecord,
  AttendanceStatus,
  AuditEntry,
  DraftEntry,
  ExitInfo,
  FollowUp,
  FollowUpStatus,
  MarkResult,
  StudentIdentifier,
} from '@/types'
import {
  AttendanceDomainError,
  applyDraft,
  auditActionFor,
  draftFromRecord,
  emptyDraft,
  generateGuid,
  isDraftChanged,
  recordKey,
  snapshotOf,
  summarizeSheet,
  toggleAbsentStatus,
  validateDraft,
  validateExit,
  type SheetSummary,
} from '@/utils/attendance-domain'

interface SheetState {
  classroomId: string
  date: string
  memberIds: string[]
  records: Record<string, AttendanceRecord>
  drafts: Record<string, DraftEntry>
  followUps: Record<string, FollowUp>
  audit: AuditEntry[]
  isLoading: boolean
  isSaving: boolean
}

export const useAttendanceSheetStore = defineStore('attendanceSheet', {
  state: (): SheetState => ({
    classroomId: '',
    date: '',
    memberIds: [],
    records: {},
    drafts: {},
    followUps: {},
    audit: [],
    isLoading: false,
    isSaving: false,
  }),
  getters: {
    dirtyIds(state): string[] {
      return state.memberIds.filter((id) => isDraftChanged(state.drafts[id] ?? emptyDraft(), state.records[id]))
    },
    isDirty(): boolean {
      return this.dirtyIds.length > 0
    },
    summary(state): SheetSummary {
      return summarizeSheet(state.memberIds, (id) => state.drafts[id]?.status ?? null)
    },
  },
  actions: {
    async open(classroomId: string, date: string): Promise<void> {
      this.isLoading = true
      try {
        const [members, records, followUps, audit] = await Promise.all([
          attendanceRepository.listMembers(classroomId),
          attendanceRepository.getRecordsForDay(classroomId, date),
          attendanceRepository.getFollowUps(classroomId, date, date),
          attendanceRepository.getAudit(classroomId, date),
        ])
        this.classroomId = classroomId
        this.date = date
        this.memberIds = members.map((member) => member.studentId)
        this.records = Object.fromEntries(records.map((record) => [record.studentId, record]))
        this.followUps = Object.fromEntries(followUps.map((item) => [item.studentId, item]))
        this.audit = audit
        this.drafts = Object.fromEntries(this.memberIds.map((id) => [id, draftFromRecord(this.records[id])]))
      } finally {
        this.isLoading = false
      }
    },

    syncMembers(memberIds: string[]): void {
      this.memberIds = memberIds
      for (const id of memberIds) {
        if (!this.drafts[id]) this.drafts[id] = draftFromRecord(this.records[id])
      }
    },

    discardChanges(): void {
      this.drafts = Object.fromEntries(this.memberIds.map((id) => [id, draftFromRecord(this.records[id])]))
    },

    draftOf(studentId: string): DraftEntry {
      if (!this.drafts[studentId]) this.drafts[studentId] = emptyDraft()
      return this.drafts[studentId]
    },

    setStatus(studentId: string, status: AttendanceStatus | null): void {
      this.draftOf(studentId).status = status
    },

    toggleAbsent(studentId: string): void {
      const draft = this.draftOf(studentId)
      draft.status = toggleAbsentStatus(draft.status, !!this.records[studentId])
    },

    markAllUnrecordedPresent(): void {
      for (const id of this.memberIds) {
        const draft = this.draftOf(id)
        if (draft.status === null) draft.status = 'present'
      }
    },

    async resolveStudentId(identifier: StudentIdentifier): Promise<string | null> {
      if (identifier.kind === 'student-id') return identifier.value
      if (identifier.kind === 'guid') return attendanceRepository.findStudentIdByGuid(identifier.value)
      return attendanceRepository.findStudentIdByNfc(identifier.value)
    },

    async markPresent(identifier: StudentIdentifier): Promise<MarkResult> {
      if (!this.classroomId) return { ok: false, reason: 'no-sheet' }
      const studentId = await this.resolveStudentId(identifier)
      if (!studentId) return { ok: false, reason: 'not-found' }
      if (!this.memberIds.includes(studentId)) return { ok: false, studentId, reason: 'not-in-class' }
      this.setStatus(studentId, 'present')
      return { ok: true, studentId }
    },

    asSink(): AttendanceSink {
      return { markPresent: (identifier) => this.markPresent(identifier) }
    },

    async save(actor: string, fillRemainingAsPresent = false): Promise<number> {
      if (fillRemainingAsPresent) this.markAllUnrecordedPresent()
      const ids = this.dirtyIds.filter((id) => this.draftOf(id).status !== null)
      for (const id of ids) {
        const problem = validateDraft(this.draftOf(id))
        if (problem) throw new AttendanceDomainError('BAD_DRAFT', problem)
      }
      const now = Date.now()
      const writes: RecordWrite[] = ids.map((id) => {
        const before = this.records[id]
        const record = applyDraft(
          before,
          { classroomId: this.classroomId, studentId: id, date: this.date },
          this.draftOf(id),
          'manual',
          now,
        )
        const audit: AuditEntry = {
          id: generateGuid(),
          classroomId: this.classroomId,
          studentId: id,
          date: this.date,
          at: now,
          actor,
          action: auditActionFor(before),
          before: before ? snapshotOf(before) : null,
          after: snapshotOf(record),
        }
        return { record, audit }
      })
      this.isSaving = true
      try {
        await attendanceRepository.saveWrites(writes)
      } finally {
        this.isSaving = false
      }
      for (const write of writes) {
        this.records[write.record.studentId] = write.record
        this.audit.unshift(write.audit)
        this.drafts[write.record.studentId] = draftFromRecord(write.record)
      }
      return writes.length
    },

    async setExit(studentId: string, exit: ExitInfo, actor: string): Promise<void> {
      const before = this.records[studentId]
      if (isDraftChanged(this.draftOf(studentId), before)) {
        throw new AttendanceDomainError('UNSAVED', 'ابتدا وضعیت حضور را ذخیره کنید.')
      }
      const problem = validateExit(exit, before)
      if (problem) throw new AttendanceDomainError('BAD_EXIT', problem)
      await this.writeExit(before, { ...exit, reason: exit.reason.trim(), receiver: exit.receiver.trim() }, actor, 'exit-set')
    },

    async removeExit(studentId: string, actor: string): Promise<void> {
      const before = this.records[studentId]
      if (!before || !before.exit) return
      await this.writeExit(before, null, actor, 'exit-remove')
    },

    async writeExit(
      before: AttendanceRecord,
      exit: ExitInfo | null,
      actor: string,
      action: 'exit-set' | 'exit-remove',
    ): Promise<void> {
      const now = Date.now()
      const record: AttendanceRecord = { ...before, exit, updatedAt: now }
      const audit: AuditEntry = {
        id: generateGuid(),
        classroomId: before.classroomId,
        studentId: before.studentId,
        date: before.date,
        at: now,
        actor,
        action,
        before: snapshotOf(before),
        after: snapshotOf(record),
      }
      await attendanceRepository.saveWrites([{ record, audit }])
      this.records[before.studentId] = record
      this.audit.unshift(audit)
    },

    async setFollowUp(studentId: string, status: FollowUpStatus, note: string): Promise<void> {
      const followUp: FollowUp = {
        id: recordKey(this.classroomId, studentId, this.date),
        classroomId: this.classroomId,
        studentId,
        date: this.date,
        status,
        note: note.trim(),
        updatedAt: Date.now(),
      }
      await attendanceRepository.putFollowUp(followUp)
      this.followUps[studentId] = followUp
    },
  },
})
