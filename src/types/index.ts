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
