import type { IDBPDatabase } from "idb";

export const STORE_SVC_DRIVERS = "svcDrivers";
export const STORE_SVC_STUDENTS = "svcStudents";
export const STORE_SVC_PLANS = "svcPlans";
export const STORE_SVC_ASSIGNMENTS = "svcAssignments";
export const STORE_SVC_DRIVER_STATES = "svcDriverStates";
export const STORE_SVC_PAYMENTS = "svcPayments";

export function createServiceStores(db: IDBPDatabase): void {
  if (!db.objectStoreNames.contains(STORE_SVC_DRIVERS)) {
    db.createObjectStore(STORE_SVC_DRIVERS, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(STORE_SVC_STUDENTS)) {
    db.createObjectStore(STORE_SVC_STUDENTS, { keyPath: "studentId" });
  }
  if (!db.objectStoreNames.contains(STORE_SVC_PLANS)) {
    const store = db.createObjectStore(STORE_SVC_PLANS, { keyPath: "id" });
    store.createIndex("by-year", "academicYear");
  }
  if (!db.objectStoreNames.contains(STORE_SVC_ASSIGNMENTS)) {
    const store = db.createObjectStore(STORE_SVC_ASSIGNMENTS, { keyPath: "id" });
    store.createIndex("by-plan", "planId");
    store.createIndex("by-plan-driver", ["planId", "driverId"]);
    store.createIndex("by-driver", "driverId");
  }
  if (!db.objectStoreNames.contains(STORE_SVC_DRIVER_STATES)) {
    const store = db.createObjectStore(STORE_SVC_DRIVER_STATES, { keyPath: "id" });
    store.createIndex("by-plan", "planId");
  }
  if (!db.objectStoreNames.contains(STORE_SVC_PAYMENTS)) {
    const store = db.createObjectStore(STORE_SVC_PAYMENTS, { keyPath: "id" });
    store.createIndex("by-plan", "planId");
    store.createIndex("by-plan-student", ["planId", "studentId"]);
  }
}
