import { openDB, type IDBPDatabase } from "idb";
import type {
  Teacher,
  SavedSchedule,
  Student,
  StudentGroup,
  LessonPlan,
  SportFacility,
  SportPlan,
  Celebration,
  Election,
  Enrollment,
  ExtraClass,
  Transaction,
  AnnualPlan,
  BudgetCategory,
  Question,
  Exam,
  ExamTemplate,
  ExamVersion,
  Invitation,
} from "@/types";

const DB_NAME = "school-manager-db";

const DB_VERSION = 10;

export const STORE_TEACHERS = "teachers";
export const STORE_SCHEDULES = "schedules";
export const STORE_STUDENTS = "students";
export const STORE_STUDENT_GROUPS = "studentGroups";
export const STORE_LESSON_PLANS = "lessonPlans";
export const STORE_SPORT_FACILITIES = "sportFacilities";
export const STORE_SPORT_PLANS = "sportPlans";
export const STORE_CELEBRATIONS = "celebrations";
export const STORE_ELECTIONS = "elections";
export const STORE_EXTRA_CLASSES = "extraClasses";
export const STORE_ENROLLMENTS = "enrollments";
export const STORE_ANNUAL_PLANS = "annualPlans";
export const STORE_BUDGET_CATEGORIES = "budgetCategories";
export const STORE_TRANSACTIONS = "transactions";
export const STORE_QUESTIONS = "questions";
export const STORE_EXAMS = "exams";
export const STORE_EXAM_TEMPLATES = "examTemplates";
export const STORE_EXAM_VERSIONS = "examVersions";
export const STORE_INVITATIONS = "invitations";

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_TEACHERS)) {
          const store = db.createObjectStore(STORE_TEACHERS, { keyPath: "id" });
          store.createIndex("by-name", "name");
        }
        if (!db.objectStoreNames.contains(STORE_SCHEDULES)) {
          const store = db.createObjectStore(STORE_SCHEDULES, {
            keyPath: "id",
          });
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
          const store = db.createObjectStore(STORE_STUDENTS, { keyPath: "id" });
          store.createIndex("by-grade", "grade");
          store.createIndex("by-group", "currentGroupId");
        }
        if (!db.objectStoreNames.contains(STORE_STUDENT_GROUPS)) {
          const store = db.createObjectStore(STORE_STUDENT_GROUPS, {
            keyPath: "id",
          });
          store.createIndex("by-grade", "grade");
        }
        if (!db.objectStoreNames.contains(STORE_LESSON_PLANS)) {
          const store = db.createObjectStore(STORE_LESSON_PLANS, {
            keyPath: "id",
          });
          store.createIndex("by-teacher", "teacherId");
          store.createIndex("by-grade", "grade");
          store.createIndex("by-date", "sessionDate");
        }
        if (!db.objectStoreNames.contains(STORE_SPORT_FACILITIES)) {
          db.createObjectStore(STORE_SPORT_FACILITIES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_SPORT_PLANS)) {
          const store = db.createObjectStore(STORE_SPORT_PLANS, {
            keyPath: "id",
          });
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_CELEBRATIONS)) {
          const store = db.createObjectStore(STORE_CELEBRATIONS, {
            keyPath: "id",
          });
          store.createIndex("by-date", "date");
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_ELECTIONS)) {
          const store = db.createObjectStore(STORE_ELECTIONS, {
            keyPath: "id",
          });
          store.createIndex("by-status", "status");
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_EXTRA_CLASSES)) {
          const store = db.createObjectStore(STORE_EXTRA_CLASSES, {
            keyPath: "id",
          });
          store.createIndex("by-teacher", "teacherId");
          store.createIndex("by-day", "dayIndex");
        }
        if (!db.objectStoreNames.contains(STORE_ENROLLMENTS)) {
          const store = db.createObjectStore(STORE_ENROLLMENTS, {
            keyPath: "id",
          });
          store.createIndex("by-class", "extraClassId");
          store.createIndex("by-student", "studentId");
        }
        if (!db.objectStoreNames.contains(STORE_ANNUAL_PLANS)) {
          db.createObjectStore(STORE_ANNUAL_PLANS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_BUDGET_CATEGORIES)) {
          const store = db.createObjectStore(STORE_BUDGET_CATEGORIES, {
            keyPath: "id",
          });
          store.createIndex("by-plan", "planId");
        }
        if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
          const store = db.createObjectStore(STORE_TRANSACTIONS, {
            keyPath: "id",
          });
          store.createIndex("by-plan", "planId");
          store.createIndex("by-category", "categoryId");
          store.createIndex("by-date", "date");
        }
        if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
          const store = db.createObjectStore(STORE_QUESTIONS, {
            keyPath: "id",
          });
          store.createIndex("by-course", "courseId");
          store.createIndex("by-grade", "grade");
          store.createIndex("by-difficulty", "difficulty");
        }
        if (!db.objectStoreNames.contains(STORE_EXAMS)) {
          const store = db.createObjectStore(STORE_EXAMS, { keyPath: "id" });
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE_EXAM_TEMPLATES)) {
          db.createObjectStore(STORE_EXAM_TEMPLATES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_EXAM_VERSIONS)) {
          const store = db.createObjectStore(STORE_EXAM_VERSIONS, {
            keyPath: "id",
          });
          store.createIndex("by-exam", "examId");
        }
        if (!db.objectStoreNames.contains(STORE_INVITATIONS)) {
          const store = db.createObjectStore(STORE_INVITATIONS, {
            keyPath: "id",
          });
          store.createIndex("by-status", "status");
          store.createIndex("by-updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const db = await getDb();
  return db.getAll(STORE_TEACHERS);
}
export async function putTeacher(teacher: Teacher): Promise<void> {
  const db = await getDb();
  await db.put(STORE_TEACHERS, toPlain(teacher));
}
export async function deleteTeacher(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_TEACHERS, id);
}

export async function getAllSchedules(): Promise<SavedSchedule[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_SCHEDULES);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getSchedule(
  id: string,
): Promise<SavedSchedule | undefined> {
  const db = await getDb();
  return db.get(STORE_SCHEDULES, id);
}
export async function putSchedule(schedule: SavedSchedule): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SCHEDULES, toPlain(schedule));
}
export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_SCHEDULES, id);
}

export async function getAllStudents(): Promise<Student[]> {
  const db = await getDb();
  return db.getAll(STORE_STUDENTS);
}
export async function putStudent(student: Student): Promise<void> {
  const db = await getDb();
  await db.put(STORE_STUDENTS, toPlain(student));
}
export async function putStudents(students: Student[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_STUDENTS, "readwrite");
  for (const student of students) {
    await tx.store.put(toPlain(student));
  }
  await tx.done;
}
export async function deleteStudent(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_STUDENTS, id);
}

export async function getAllStudentGroups(): Promise<StudentGroup[]> {
  const db = await getDb();
  return db.getAll(STORE_STUDENT_GROUPS);
}
export async function putStudentGroup(group: StudentGroup): Promise<void> {
  const db = await getDb();
  await db.put(STORE_STUDENT_GROUPS, toPlain(group));
}
export async function putStudentGroups(groups: StudentGroup[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_STUDENT_GROUPS, "readwrite");
  for (const group of groups) {
    await tx.store.put(toPlain(group));
  }
  await tx.done;
}
export async function deleteStudentGroup(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_STUDENT_GROUPS, id);
}

export async function getAllLessonPlans(): Promise<LessonPlan[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_LESSON_PLANS);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getLessonPlan(
  id: string,
): Promise<LessonPlan | undefined> {
  const db = await getDb();
  return db.get(STORE_LESSON_PLANS, id);
}
export async function putLessonPlan(plan: LessonPlan): Promise<void> {
  const db = await getDb();
  await db.put(STORE_LESSON_PLANS, toPlain(plan));
}
export async function deleteLessonPlan(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_LESSON_PLANS, id);
}

export async function getAllSportFacilities(): Promise<SportFacility[]> {
  const db = await getDb();
  return db.getAll(STORE_SPORT_FACILITIES);
}
export async function putSportFacility(facility: SportFacility): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SPORT_FACILITIES, toPlain(facility));
}
export async function deleteSportFacility(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_SPORT_FACILITIES, id);
}

export async function getAllSportPlans(): Promise<SportPlan[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_SPORT_PLANS);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getSportPlan(id: string): Promise<SportPlan | undefined> {
  const db = await getDb();
  return db.get(STORE_SPORT_PLANS, id);
}
export async function putSportPlan(plan: SportPlan): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SPORT_PLANS, toPlain(plan));
}
export async function deleteSportPlan(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_SPORT_PLANS, id);
}
export async function getAllCelebrations(): Promise<Celebration[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_CELEBRATIONS);
  return (all as Celebration[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getCelebration(
  id: string,
): Promise<Celebration | undefined> {
  const db = await getDb();
  return db.get(STORE_CELEBRATIONS, id);
}

export async function putCelebration(celebration: Celebration): Promise<void> {
  const db = await getDb();
  await db.put(STORE_CELEBRATIONS, toPlain(celebration));
}

export async function deleteCelebration(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_CELEBRATIONS, id);
}

export async function getAllElections(): Promise<Election[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_ELECTIONS);
  return (all as Election[]).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getElection(id: string): Promise<Election | undefined> {
  const db = await getDb();
  return db.get(STORE_ELECTIONS, id);
}

export async function putElection(election: Election): Promise<void> {
  const db = await getDb();
  await db.put(STORE_ELECTIONS, toPlain(election));
}

export async function deleteElection(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_ELECTIONS, id);
}

//extra class
export async function getAllExtraClasses(): Promise<ExtraClass[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_EXTRA_CLASSES);
  return (all as ExtraClass[]).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function putExtraClass(extraClass: ExtraClass): Promise<void> {
  const db = await getDb();
  await db.put(STORE_EXTRA_CLASSES, toPlain(extraClass));
}
export async function deleteExtraClass(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_EXTRA_CLASSES, id);
}

export async function getAllEnrollments(): Promise<Enrollment[]> {
  const db = await getDb();
  return db.getAll(STORE_ENROLLMENTS);
}
export async function putEnrollment(enrollment: Enrollment): Promise<void> {
  const db = await getDb();
  await db.put(STORE_ENROLLMENTS, toPlain(enrollment));
}
export async function deleteEnrollment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_ENROLLMENTS, id);
}

// transaction
export async function getAllAnnualPlans(): Promise<AnnualPlan[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_ANNUAL_PLANS);
  return (all as AnnualPlan[]).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function putAnnualPlan(plan: AnnualPlan): Promise<void> {
  const db = await getDb();
  await db.put(STORE_ANNUAL_PLANS, toPlain(plan));
}
export async function deleteAnnualPlan(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_ANNUAL_PLANS, id);
}

export async function getAllBudgetCategories(): Promise<BudgetCategory[]> {
  const db = await getDb();
  return db.getAll(STORE_BUDGET_CATEGORIES);
}
export async function putBudgetCategory(
  category: BudgetCategory,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_BUDGET_CATEGORIES, toPlain(category));
}
export async function deleteBudgetCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_BUDGET_CATEGORIES, id);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAll(STORE_TRANSACTIONS);
}
export async function putTransaction(transaction: Transaction): Promise<void> {
  const db = await getDb();
  await db.put(STORE_TRANSACTIONS, toPlain(transaction));
}
export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_TRANSACTIONS, id);
}

// question
export async function getAllQuestions(): Promise<Question[]> {
  const db = await getDb();
  return db.getAll(STORE_QUESTIONS);
}
export async function putQuestion(question: Question): Promise<void> {
  const db = await getDb();
  await db.put(STORE_QUESTIONS, toPlain(question));
}
export async function putQuestions(questions: Question[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_QUESTIONS, "readwrite");
  for (const question of questions) await tx.store.put(toPlain(question));
  await tx.done;
}
export async function deleteQuestion(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_QUESTIONS, id);
}

export async function getAllExams(): Promise<Exam[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_EXAMS);
  return (all as Exam[]).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function putExam(exam: Exam): Promise<void> {
  const db = await getDb();
  await db.put(STORE_EXAMS, toPlain(exam));
}
export async function deleteExam(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_EXAMS, id);
}

export async function getAllExamTemplates(): Promise<ExamTemplate[]> {
  const db = await getDb();
  return db.getAll(STORE_EXAM_TEMPLATES);
}
export async function putExamTemplate(template: ExamTemplate): Promise<void> {
  const db = await getDb();
  await db.put(STORE_EXAM_TEMPLATES, toPlain(template));
}
export async function deleteExamTemplate(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_EXAM_TEMPLATES, id);
}

export async function getAllExamVersions(): Promise<ExamVersion[]> {
  const db = await getDb();
  return db.getAll(STORE_EXAM_VERSIONS);
}
export async function putExamVersion(version: ExamVersion): Promise<void> {
  const db = await getDb();
  await db.put(STORE_EXAM_VERSIONS, toPlain(version));
}
export async function deleteExamVersion(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_EXAM_VERSIONS, id);
}

//Invitation
export async function getAllInvitations(): Promise<Invitation[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_INVITATIONS);
  return (all as Invitation[]).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function putInvitation(invitation: Invitation): Promise<void> {
  const db = await getDb();
  await db.put(STORE_INVITATIONS, toPlain(invitation));
}
export async function deleteInvitation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_INVITATIONS, id);
}
