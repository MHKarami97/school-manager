import type { IDBPDatabase } from "idb";

export const STORE_CLASSROOMS = "attClassrooms";
export const STORE_MEMBERS = "attMembers";
export const STORE_PROFILES = "attProfiles";
export const STORE_RECORDS = "attRecords";
export const STORE_FOLLOW_UPS = "attFollowUps";
export const STORE_AUDIT = "attAudit";

export function createAttendanceStores(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains(STORE_CLASSROOMS)) {
    const store = db.createObjectStore(STORE_CLASSROOMS, { keyPath: "id" });
    store.createIndex("by-teacher", "teacherId");
  }
  if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
    const store = db.createObjectStore(STORE_MEMBERS, { keyPath: "id" });
    store.createIndex("by-class", "classroomId");
    store.createIndex("by-student", "studentId");
  }
  if (!db.objectStoreNames.contains(STORE_PROFILES)) {
    const store = db.createObjectStore(STORE_PROFILES, { keyPath: "studentId" });
    store.createIndex("by-guid", "guid", { unique: true });
    store.createIndex("by-nfc", "nfcSerial", { unique: true });
  }
  if (!db.objectStoreNames.contains(STORE_RECORDS)) {
    const store = db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
    store.createIndex("by-class-date", ["classroomId", "date"]);
    store.createIndex("by-student-date", ["studentId", "date"]);
    store.createIndex("by-slot", ["classroomId", "studentId", "date"], { unique: true });
  }
  if (!db.objectStoreNames.contains(STORE_FOLLOW_UPS)) {
    const store = db.createObjectStore(STORE_FOLLOW_UPS, { keyPath: "id" });
    store.createIndex("by-class-date", ["classroomId", "date"]);
  }
  if (!db.objectStoreNames.contains(STORE_AUDIT)) {
    const store = db.createObjectStore(STORE_AUDIT, { keyPath: "id" });
    store.createIndex("by-class-date", ["classroomId", "date"]);
  }
}
