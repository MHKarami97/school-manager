export type LevelId = 'elementary' | 'lowersecondary' | 'uppersecondary'
export type ShiftId = 'morning' | 'noon'
export type SpecialRule = 'quran-first' | 'sport-fixed' | 'none'
export type TeacherGender = 'male' | 'female'

export interface Level {
  id: LevelId
  name: string
  grades: number[]
  schedulingMode: 'single-teacher' | 'subject-teachers'
}

export interface CourseDefinition {
  id: string
  name: string
  specialRule: SpecialRule
  color: string
  isCustom?: boolean
}

export type CurriculumMap = Record<string, Record<number, Record<string, number>>>

export interface ShiftTimeConfig {
  id: ShiftId
  name: string
  startTime: string
  endTime: string
  lessonDurationMinutes: number
  breakDurationMinutes: number
  hasLunchBreak: boolean
  lunchDurationMinutes: number
  lunchAfterPeriod: number
  periodsCount: number
}

export interface Teacher {
  id: string
  name: string
  gender: TeacherGender | null
  courseIds: string[]
  weeklyHoursByCourse?: Record<string, number>
  createdAt: number
}

export type Audience = 'self' | 'school'

export interface LessonCell {
  dayIndex: number
  periodIndex: number
  courseId: string | null
  teacherId: string | null
  secondaryCourseId?: string | null
  secondaryTeacherId?: string | null
  isLocked?: boolean
}

export interface RuleToggles {
  noSameDayRepeat: boolean
  noSameColumnRepeat: boolean
  quranAlwaysFirstPeriod: boolean
  persianWritingAdjacency: boolean
}

export interface WizardState {
  step: number
  audience: Audience | null
  schoolName: string
  levelId: LevelId | null
  selectedGrades: number[]
  shiftId: ShiftId
  shiftConfigs: Record<ShiftId, ShiftTimeConfig>
  teacherSelections: Record<string, string[]>
  lockedSportCells: Record<number, LessonCell[]>
  ruleToggles: RuleToggles
  updatedAt: number
}

export interface GradeSchedule {
  grade: number
  levelId: LevelId
  shiftId: ShiftId
  cells: LessonCell[]
}

export interface SavedSchedule {
  id: string
  title: string
  audience: Audience
  levelId: LevelId
  schoolName?: string
  shiftId: ShiftId
  shiftConfig: ShiftTimeConfig
  grades: GradeSchedule[]
  teachers: Teacher[]
  ruleToggles: RuleToggles
  createdAt: number
  updatedAt: number
}

export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'] as const

export type Gender = 'male' | 'female'
export type ElementaryGpaBand = 'excellent' | 'good' | 'acceptable' | 'needs-effort'

export interface StudentYearlyRecord {
  year: number
  grade: number
  gpa: number | null
  gpaBand: ElementaryGpaBand | null
  disciplineScore: number | null
  teacherId: string | null
  groupId: string | null
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  grade: number
  levelId: LevelId
  gpa: number | null
  gpaBand: ElementaryGpaBand | null
  disciplineScore: number | null
  isAcademicallyWeak: boolean
  isDisruptive: boolean
  statusTags: string[]
  currentGroupId: string | null
  yearlyRecords: StudentYearlyRecord[]
  createdAt: number
  updatedAt: number
}

export interface StudentGroup {
  id: string
  title: string
  grade: number
  levelId: LevelId
  gender: Gender
  capacity: number
  teacherId: string | null
  teacherStrengthScore: number
  studentIds: string[]
  createdAt: number
  updatedAt: number
}

export interface GroupingRuleConfig {
  ruleId: string
  label: string
  description: string
  weight: number
  enabled: boolean
}

export interface GroupingRequest {
  grade: number
  levelId: LevelId
  gender: Gender
  groupCount: number
  maxCapacity: number
}

/* ==========================================================================
 * Lesson Plan (طرح درس معلم‌ها)
 * ========================================================================== */

export type LessonPlanStatus = 'draft' | 'final' | 'executed'

/** یک بخش زمان‌بندی‌شده از جلسه (مثلاً "مقدمه ۵ دقیقه"، "تمرین ۱۵ دقیقه") */
export interface LessonPlanBlock {
  id: string
  title: string
  description: string
  estimatedMinutes: number
}

/** یک نسخه‌ی آرشیو شده از طرح درس، قبل از اعمال ویرایش جدید */
export interface LessonPlanHistoryEntry {
  versionNumber: number
  savedAt: number
  snapshot: LessonPlanSnapshot
}

/** تصویر لحظه‌ای از فیلدهای قابل‌ویرایش طرح درس (بدون id/history) برای آرشیو نسخه */
export interface LessonPlanSnapshot {
  title: string
  teacherId: string
  courseId: string
  grade: number
  levelId: LevelId
  sessionDate: string
  weekNumber: number
  objectives: string
  teachingMethod: string
  resources: string
  assessment: string
  blocks: LessonPlanBlock[]
  status: LessonPlanStatus
}

export interface LessonPlan extends LessonPlanSnapshot {
  id: string
  history: LessonPlanHistoryEntry[]
  createdAt: number
  updatedAt: number
}
