import type {
  ServiceAssignment,
  ServiceDriver,
  ServiceDriverState,
  ServicePayment,
  ServicePlan,
  ServiceStudentProfile,
} from "@/types";
import { getDb } from "./db";
import {
  STORE_SVC_ASSIGNMENTS,
  STORE_SVC_DRIVERS,
  STORE_SVC_DRIVER_STATES,
  STORE_SVC_PAYMENTS,
  STORE_SVC_PLANS,
  STORE_SVC_STUDENTS,
} from "./service-schema";

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class ServiceRepository {
  async listDrivers(): Promise<ServiceDriver[]> {
    const db = await getDb();
    const all = (await db.getAll(STORE_SVC_DRIVERS)) as ServiceDriver[];
    return all.sort((a, b) => a.fullName.localeCompare(b.fullName, "fa"));
  }

  async putDriver(driver: ServiceDriver): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SVC_DRIVERS, toPlain(driver));
  }

  async deleteDriver(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_SVC_DRIVERS, id);
  }

  async countAssignmentsOfDriver(driverId: string): Promise<number> {
    const db = await getDb();
    return db.countFromIndex(STORE_SVC_ASSIGNMENTS, "by-driver", driverId);
  }

  async listStudentProfiles(): Promise<ServiceStudentProfile[]> {
    const db = await getDb();
    return (await db.getAll(STORE_SVC_STUDENTS)) as ServiceStudentProfile[];
  }

  async putStudentProfile(profile: ServiceStudentProfile): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SVC_STUDENTS, toPlain(profile));
  }

  async putStudentProfiles(profiles: ServiceStudentProfile[]): Promise<void> {
    if (!profiles.length) return;
    const db = await getDb();
    const tx = db.transaction(STORE_SVC_STUDENTS, "readwrite");
    for (const profile of profiles) await tx.store.put(toPlain(profile));
    await tx.done;
  }

  async listPlans(): Promise<ServicePlan[]> {
    const db = await getDb();
    const all = (await db.getAll(STORE_SVC_PLANS)) as ServicePlan[];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async putPlan(plan: ServicePlan): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SVC_PLANS, toPlain(plan));
  }

  async deletePlan(planId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(
      [STORE_SVC_PLANS, STORE_SVC_ASSIGNMENTS, STORE_SVC_DRIVER_STATES, STORE_SVC_PAYMENTS],
      "readwrite",
    );
    const purge = async (storeName: string): Promise<void> => {
      const store = tx.objectStore(storeName);
      const keys = await store.index("by-plan").getAllKeys(planId);
      await Promise.all(keys.map((key) => store.delete(key)));
    };
    await tx.objectStore(STORE_SVC_PLANS).delete(planId);
    await purge(STORE_SVC_ASSIGNMENTS);
    await purge(STORE_SVC_DRIVER_STATES);
    await purge(STORE_SVC_PAYMENTS);
    await tx.done;
  }

  async listAssignments(planId: string): Promise<ServiceAssignment[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(STORE_SVC_ASSIGNMENTS, "by-plan", planId)) as ServiceAssignment[];
  }

  async saveAssignments(planId: string, removeIds: string[], upserts: ServiceAssignment[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_SVC_ASSIGNMENTS, "readwrite");
    for (const id of removeIds) await tx.store.delete(id);
    for (const item of upserts) {
      if (item.planId !== planId) continue;
      await tx.store.put(toPlain(item));
    }
    await tx.done;
  }

  async listDriverStates(planId: string): Promise<ServiceDriverState[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(STORE_SVC_DRIVER_STATES, "by-plan", planId)) as ServiceDriverState[];
  }

  async putDriverState(state: ServiceDriverState): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SVC_DRIVER_STATES, toPlain(state));
  }

  async listPayments(planId: string): Promise<ServicePayment[]> {
    const db = await getDb();
    return (await db.getAllFromIndex(STORE_SVC_PAYMENTS, "by-plan", planId)) as ServicePayment[];
  }

  async putPayment(payment: ServicePayment): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SVC_PAYMENTS, toPlain(payment));
  }

  async deletePayment(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_SVC_PAYMENTS, id);
  }
}

export const serviceRepository = new ServiceRepository();
