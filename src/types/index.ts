export type LevelId = 'elementary' | 'lower_secondary' | 'upper_secondary'

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

export const WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'] as const

// ===================== ماژول دانش‌آموزان و گروه‌بندی عادلانه =====================

export type Gender = 'male' | 'female'

/** برای دوره ابتدایی که معدل عددی نیست، بلکه رتبه کیفی است */
export type ElementaryGpaBand = 'excellent' | 'good' | 'acceptable' | 'needs-effort'

export interface StudentYearlyRecord {
  /** سال تحصیلی (مثلاً 1403) */
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
  /** فقط برای متوسطه اول/دوم: عدد صفر تا بیست */
  gpa: number | null
  /** فقط برای ابتدایی */
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
  /** امتیاز ذهنی قدرت/تجربه معلم گروه، بین ۱ تا ۵؛ در الگوریتم برای تخصیص دانش‌آموزان ضعیف/بی‌انضباط استفاده می‌شود */
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
