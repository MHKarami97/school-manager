export type LevelId = "elementary" | "lower_secondary" | "upper_secondary";

export type ShiftId = "morning" | "noon";

export type SpecialRule = "quran-first" | "sport-fixed" | "none";

export type TeacherGender = "male" | "female";

export interface Level {
  id: LevelId;
  name: string;
  grades: number[];
  schedulingMode: "single-teacher" | "subject-teachers";
}

export interface CourseDefinition {
  id: string;
  name: string;
  specialRule: SpecialRule;
  color: string;
  isCustom?: boolean;
}

export type CurriculumMap = Record<
  string,
  Record<number, Record<string, number>>
>;

export interface ShiftTimeConfig {
  id: ShiftId;
  name: string;
  startTime: string;
  endTime: string;
  lessonDurationMinutes: number;
  breakDurationMinutes: number;
  hasLunchBreak: boolean;
  lunchDurationMinutes: number;
  lunchAfterPeriod: number;
  periodsCount: number;
}

export interface TeacherAvailabilitySlot {
  dayIndex: number;
  startTime: string;
  endTime: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: TeacherGender | null;
  courseIds: string[];
  weeklyHoursByCourse?: Record<string, number>;
  availability?: TeacherAvailabilitySlot[];
  maxWeeklyHours?: number;
  levelIds?: LevelId[];
  createdAt: number;
}

export type Audience = "self" | "school";

export interface LessonCell {
  dayIndex: number;
  periodIndex: number;
  courseId: string | null;
  teacherId: string | null;
  secondaryCourseId?: string | null;
  secondaryTeacherId?: string | null;
  isLocked?: boolean;
}

export interface RuleToggles {
  noSameDayRepeat: boolean;
  noSameColumnRepeat: boolean;
  quranAlwaysFirstPeriod: boolean;
  persianWritingAdjacency: boolean;
}

export interface WizardState {
  step: number;
  audience: Audience | null;
  schoolName: string;
  levelId: LevelId | null;
  selectedGrades: number[];
  shiftId: ShiftId;
  shiftConfigs: Record<ShiftId, ShiftTimeConfig>;
  teacherSelections: Record<string, string[]>;
  lockedSportCells: Record<number, LessonCell[]>;
  ruleToggles: RuleToggles;
  updatedAt: number;
}

export interface GradeSchedule {
  grade: number;
  levelId: LevelId;
  shiftId: ShiftId;
  cells: LessonCell[];
}

export interface SavedSchedule {
  id: string;
  title: string;
  audience: Audience;
  levelId: LevelId;
  schoolName?: string;
  shiftId: ShiftId;
  shiftConfig: ShiftTimeConfig;
  grades: GradeSchedule[];
  teachers: Teacher[];
  ruleToggles: RuleToggles;
  createdAt: number;
  updatedAt: number;
}

export const WEEK_DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
] as const;

export type Gender = "male" | "female";
export type ElementaryGpaBand =
  | "excellent"
  | "good"
  | "acceptable"
  | "needs-effort";

export interface StudentYearlyRecord {
  year: number;
  grade: number;
  gpa: number | null;
  gpaBand: ElementaryGpaBand | null;
  disciplineScore: number | null;
  teacherId: string | null;
  groupId: string | null;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  grade: number;
  levelId: LevelId;
  gpa: number | null;
  gpaBand: ElementaryGpaBand | null;
  disciplineScore: number | null;
  isAcademicallyWeak: boolean;
  isDisruptive: boolean;
  statusTags: string[];
  currentGroupId: string | null;
  yearlyRecords: StudentYearlyRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface StudentGroup {
  id: string;
  title: string;
  grade: number;
  levelId: LevelId;
  gender: Gender;
  capacity: number;
  teacherId: string | null;
  teacherStrengthScore: number;
  studentIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface GroupingRuleConfig {
  ruleId: string;
  label: string;
  description: string;
  weight: number;
  enabled: boolean;
}

export interface GroupingRequest {
  grade: number;
  levelId: LevelId;
  gender: Gender;
  groupCount: number;
  maxCapacity: number;
}

export type LessonPlanStatus = "draft" | "final" | "executed";

export interface LessonPlanBlock {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface LessonPlanHistoryEntry {
  versionNumber: number;
  savedAt: number;
  snapshot: LessonPlanSnapshot;
}

export interface LessonPlanSnapshot {
  title: string;
  teacherId: string;
  courseId: string;
  grade: number;
  levelId: LevelId;
  sessionDate: string;
  weekNumber: number;
  objectives: string;
  teachingMethod: string;
  resources: string;
  assessment: string;
  blocks: LessonPlanBlock[];
  status: LessonPlanStatus;
}

export interface LessonPlan extends LessonPlanSnapshot {
  id: string;
  history: LessonPlanHistoryEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface SportFacility {
  id: string;
  name: string;
  concurrentCapacity: number;
  createdAt: number;
}

export interface SportClassDefinition {
  id: string;
  grade: number;
  label: string;
}

export interface SportSlot {
  classId: string;
  dayIndex: number;
  periodIndex: number;
  teacherId: string | null;
  facilityId: string | null;
  isLocked?: boolean;
}

export interface SportPlan {
  id: string;
  title: string;
  levelId: LevelId;
  grades: number[];
  classes: SportClassDefinition[];
  periodsPerWeekByClass: Record<string, number>;
  shiftId: ShiftId;
  shiftConfig: ShiftTimeConfig;
  slots: SportSlot[];
  teachers: Teacher[];
  facilities: SportFacility[];
  createdAt: number;
  updatedAt: number;
}

export interface SportWizardState {
  step: number;
  levelId: LevelId | null;
  selectedGrades: number[];
  classesPerGrade: Record<number, number>;
  shiftId: ShiftId;
  shiftConfigs: Record<ShiftId, ShiftTimeConfig>;
  selectedTeacherIds: string[];
  selectedFacilityIds: string[];
  updatedAt: number;
  noConsecutiveSportPeriods: boolean;
}

export type CelebrationStatus = "planned" | "in-progress" | "held";

export type CelebrationTaskStatus = "todo" | "in-progress" | "done";

export interface CelebrationTask {
  id: string;
  celebrationId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: CelebrationTaskStatus;
}

export interface CelebrationBudget {
  estimatedCost: number;
  actualCost: number;
}

export interface Celebration {
  id: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  status: CelebrationStatus;
  tasks: CelebrationTask[];
  budget: CelebrationBudget;
  createdAt: number;
  updatedAt: number;
}

export type ElectionType = "student-council" | "parent-association";
export type ElectionStatus = "candidacy" | "voting" | "counting" | "completed";
export type CandidateType = "student" | "parent";

export interface Candidate {
  id: string;
  electionId: string;
  name: string;
  type: CandidateType;
  gradeOrClass: string;
  statement: string;
  photoDataUrl: string | null;
  voteCount: number;
}

export interface Election {
  id: string;
  title: string;
  type: ElectionType;
  academicYear: string;
  votingStartDate: string;
  votingEndDate: string;
  status: ElectionStatus;
  seatsCount: number;
  candidates: Candidate[];
  createdAt: number;
  updatedAt: number;
}

// extra class

export type ExtraClassType = "reinforcement" | "extracurricular";
export type EnrollmentStatus = "active" | "cancelled";

export interface ExtraClass {
  id: string;
  title: string;
  type: ExtraClassType;
  relatedCourseId: string | null;
  teacherId: string | null;
  capacity: number;
  dayIndexes: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  allowedGrades: number[];
  cost: number;
  createdAt: number;
  updatedAt: number;
}

export interface Enrollment {
  id: string;
  extraClassId: string;
  studentId: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  waitlisted: boolean;
  createdAt: number;
  updatedAt: number;
}

// transaction

export type AnnualPlanStatus = "active" | "closed";
export type TransactionType = "expense" | "income";

export interface AnnualPlan {
  id: string;
  academicYear: string;
  totalBudget: number;
  status: AnnualPlanStatus;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetCategory {
  id: string;
  planId: string;
  title: string;
  annualBudget: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  planId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  attachmentDataUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

// question
export type QuestionType =
  | "multiple-choice"
  | "essay"
  | "fill-blank"
  | "true-false";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  courseId: string;
  grade: number;
  difficulty: DifficultyLevel;
  tags: string[];
  suggestedScore: number;
  createdAt: number;
  updatedAt: number;
}

export interface ExamQuestionRef {
  questionId: string;
  score: number;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  grade: number;
  date: string;
  durationMinutes: number;
  questionRefs: ExamQuestionRef[];
  createdAt: number;
  updatedAt: number;
}

export interface ExamTemplateRule {
  id: string;
  difficulty: DifficultyLevel;
  count: number;
  tag: string | null;
}

export interface ExamTemplate {
  id: string;
  title: string;
  courseId: string;
  grade: number;
  rules: ExamTemplateRule[];
  createdAt: number;
  updatedAt: number;
}

export interface ExamVersion {
  id: string;
  examId: string;
  label: string;
  questionOrder: string[];
  optionOrders: Record<string, number[]>;
  createdAt: number;
}

//Invitation
export type InvitationType =
  | "parent-meeting"
  | "ceremony"
  | "election"
  | "report-card"
  | "field-trip"
  | "general";
export type InvitationAudience =
  | "parents"
  | "teachers"
  | "students"
  | "general";
export type InvitationTheme = "classic" | "modern" | "festive";
export type InvitationStatus = "draft" | "sent" | "closed";
export type InvitationPageLayout = "full" | "half";
export type RsvpStatus = "pending" | "attending" | "declined";

export interface InvitationRecipient {
  id: string;
  kind: "student" | "teacher" | "custom";
  refId: string | null;
  name: string;
  grade: number | null;
  rsvp: RsvpStatus;
  guestsCount: number;
  note: string;
}

export interface Invitation {
  id: string;
  title: string;
  schoolName: string;
  type: InvitationType;
  audience: InvitationAudience;
  theme: InvitationTheme;
  status: InvitationStatus;
  body: string;
  agenda: string[];
  requirements: string[];
  eventDate: string;
  eventTime: string;
  location: string;
  rsvpDeadline: string;
  contactPhone: string;
  senderName: string;
  senderTitle: string;
  targetGrades: number[];
  requireRsvp: boolean;
  showRsvpSlip: boolean;
  recipients: InvitationRecipient[];
  sentDate: string;
  createdAt: number;
  updatedAt: number;
}

//Seating
export type SeatingStrategy = "spread" | "random" | "alphabetical";
export type SeatSpacing = "none" | "checkerboard" | "skip-columns";
export type SeatAdjacency = "side" | "cross" | "all";

export interface ExamRoom {
  id: string;
  name: string;
  rows: number;
  cols: number;
  blockedSeats: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SeparationPair {
  id: string;
  studentAId: string;
  studentBId: string;
}

export interface SeatAssignment {
  examSessionId: string;
  studentId: string;
  roomId: string;
  row: number;
  col: number;
}

export interface SeatingSettings {
  strategy: SeatingStrategy;
  spacing: SeatSpacing;
  adjacency: SeatAdjacency;
  avoidSameClass: boolean;
  seed: number;
}

export interface ExamSession {
  id: string;
  title: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  participantIds: string[];
  separationPairs: SeparationPair[];
  settings: SeatingSettings;
  assignments: SeatAssignment[];
  unseatedIds: string[];
  generatedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
