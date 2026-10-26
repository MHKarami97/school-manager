import type {
  AttendanceRecord,
  AuditEntry,
  Classroom,
  ClassroomMember,
  FollowUp,
  StudentAttendanceProfile,
} from "@/types";
import {
  AttendanceDomainError,
  backfillProfiles,
  generateGuid,
  memberKey,
} from "@/utils/attendance-domain";
import { getDb } from "./db";
import {
  STORE_AUDIT,
  STORE_CLASSROOMS,
  STORE_FOLLOW_UPS,
  STORE_MEMBERS,
  STORE_PROFILES,
  STORE_RECORDS,
} from "./attendance-schema";

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isConstraintError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "ConstraintError";
}

const DUPLICATE_NFC = "این شماره‌ی NFC برای دانش‌آموز دیگری ثبت شده است.";

export interface RecordWrite {
  record: AttendanceRecord;
  audit: AuditEntry;
}

export class AttendanceRepository {
  private revisionCounter = 0;

  get revision(): number {
    return this.revisionCounter;
  }

  async listClassrooms(): Promise<Classroom[]> {
    const db = await getDb();
    const all = (await db.getAll(STORE_CLASSROOMS)) as Classroom[];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async putClassroom(classroom: Classroom): Promise<void> {
    const db = await getDb();
    await db.put(STORE_CLASSROOMS, toPlain(classroom));
  }

  async deleteClassroom(classroomId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(
      [STORE_CLASSROOMS, STORE_MEMBERS, STORE_RECORDS, STORE_FOLLOW_UPS, STORE_AUDIT],
      "readwrite",
    );
    const purge = async (storeName: string, indexName: string, range: IDBKeyRange): Promise<void> => {
      const store = tx.objectStore(storeName);
      const keys = await store.index(indexName).getAllKeys(range);
      await Promise.all(keys.map((key) => store.delete(key)));
    };
    const dayRange = IDBKeyRange.bound([classroomId, ""], [classroomId, "\uffff"]);
    await tx.objectStore(STORE_CLASSROOMS).delete(classroomId);
    await purge(STORE_MEMBERS, "by-class", IDBKeyRange.only(classroomId));
    await purge(STORE_RECORDS, "by-class-date", dayRange);
    await purge(STORE_FOLLOW_UPS, "by-class-date", dayRange);
    await purge(STORE_AUDIT, "by-class-date", dayRange);
    await tx.done;
    this.revisionCounter += 1;
  }

  async listMembers(classroomId: string): Promise<ClassroomMember[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(STORE_MEMBERS, "by-class", classroomId)) as ClassroomMember[];
  }

  async countMembers(classroomId: string): Promise<number> {
    const db = await getDb();
    return db.countFromIndex(STORE_MEMBERS, "by-class", classroomId);
  }

  async addMembers(classroomId: string, studentIds: string[]): Promise<number> {
    const db = await getDb();
    const tx = db.transaction(STORE_MEMBERS, "readwrite");
    let added = 0;
    for (const studentId of studentIds) {
      const id = memberKey(classroomId, studentId);
      if (await tx.store.get(id)) continue;
      const member: ClassroomMember = { id, classroomId, studentId, createdAt: Date.now() };
      await tx.store.put(member);
      added += 1;
    }
    await tx.done;
    return added;
  }

  async removeMember(classroomId: string, studentId: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_MEMBERS, memberKey(classroomId, studentId));
  }

  async getProfiles(studentIds: string[]): Promise<Map<string, StudentAttendanceProfile>> {
    const db = await getDb();
    const tx = db.transaction(STORE_PROFILES, "readonly");
    const found = await Promise.all(
      studentIds.map((id) => tx.store.get(id) as Promise<StudentAttendanceProfile | undefined>),
    );
    await tx.done;
    const result = new Map<string, StudentAttendanceProfile>();
    for (const profile of found) if (profile) result.set(profile.studentId, profile);
    return result;
  }

  async ensureProfiles(studentIds: string[]): Promise<Map<string, StudentAttendanceProfile>> {
    const db = await getDb();
    const tx = db.transaction(STORE_PROFILES, "readwrite");
    const existing = new Map<string, StudentAttendanceProfile>();
    for (const id of studentIds) {
      const profile = (await tx.store.get(id)) as StudentAttendanceProfile | undefined;
      if (profile) existing.set(id, profile);
    }
    const created = backfillProfiles(studentIds, existing, generateGuid, Date.now());
    for (const profile of created) {
      await tx.store.put(profile);
      existing.set(profile.studentId, profile);
    }
    await tx.done;
    return existing;
  }

  async putProfile(profile: StudentAttendanceProfile): Promise<void> {
    const db = await getDb();
    if (profile.nfcSerial) {
      const owner = (await db.getFromIndex(STORE_PROFILES, "by-nfc", profile.nfcSerial)) as
        | StudentAttendanceProfile
        | undefined;
      if (owner && owner.studentId !== profile.studentId) {
        throw new AttendanceDomainError("DUPLICATE_NFC", DUPLICATE_NFC);
      }
    }
    try {
      await db.put(STORE_PROFILES, toPlain(profile));
    } catch (error) {
      if (isConstraintError(error)) throw new AttendanceDomainError("DUPLICATE_NFC", DUPLICATE_NFC);
      throw error;
    }
  }

  async findStudentIdByGuid(guid: string): Promise<string | null> {
    const db = await getDb();
    const profile = (await db.getFromIndex(STORE_PROFILES, "by-guid", guid)) as
      | StudentAttendanceProfile
      | undefined;
    return profile ? profile.studentId : null;
  }

  async findStudentIdByNfc(serial: string): Promise<string | null> {
    const db = await getDb();
    const profile = (await db.getFromIndex(STORE_PROFILES, "by-nfc", serial.trim().toLowerCase())) as
      | StudentAttendanceProfile
      | undefined;
    return profile ? profile.studentId : null;
  }

  async getRecordsForDay(classroomId: string, date: string): Promise<AttendanceRecord[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(STORE_RECORDS, "by-class-date", [classroomId, date])) as AttendanceRecord[];
  }

  async getRecordsInRange(classroomId: string, from: string, to: string): Promise<AttendanceRecord[]> {
    const db = await getDb();
    const range = IDBKeyRange.bound([classroomId, from], [classroomId, to]);
    return (await db.getAllFromIndex(STORE_RECORDS, "by-class-date", range)) as AttendanceRecord[];
  }

  async getRecordsOfStudent(studentId: string, from: string, to: string): Promise<AttendanceRecord[]> {
    const db = await getDb();
    const range = IDBKeyRange.bound([studentId, from], [studentId, to]);
    return (await db.getAllFromIndex(STORE_RECORDS, "by-student-date", range)) as AttendanceRecord[];
  }

  async saveWrites(writes: RecordWrite[]): Promise<void> {
    if (!writes.length) return;
    const db = await getDb();
    const tx = db.transaction([STORE_RECORDS, STORE_AUDIT], "readwrite");
    const records = tx.objectStore(STORE_RECORDS);
    const audit = tx.objectStore(STORE_AUDIT);
    for (const write of writes) {
      await records.put(toPlain(write.record));
      await audit.put(toPlain(write.audit));
    }
    await tx.done;
    this.revisionCounter += 1;
  }

  async getFollowUps(classroomId: string, from: string, to: string): Promise<FollowUp[]> {
    const db = await getDb();
    const range = IDBKeyRange.bound([classroomId, from], [classroomId, to]);
    return (await db.getAllFromIndex(STORE_FOLLOW_UPS, "by-class-date", range)) as FollowUp[];
  }

  async putFollowUp(followUp: FollowUp): Promise<void> {
    const db = await getDb();
    await db.put(STORE_FOLLOW_UPS, toPlain(followUp));
  }

  async getAudit(classroomId: string, date: string): Promise<AuditEntry[]> {
    const db = await getDb();
    const entries = (await db.getAllFromIndex(STORE_AUDIT, "by-class-date", [classroomId, date])) as AuditEntry[];
    return entries.sort((a, b) => b.at - a.at);
  }
}

export const attendanceRepository = new AttendanceRepository();
