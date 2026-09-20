export type LevelId = 'elementary' | 'lower_secondary' | 'upper_secondary'

export type ShiftId = 'morning' | 'noon'

export type SpecialRule = 'quran-first' | 'sport-fixed' | 'none'

export interface Level {
  id: LevelId
  name: string
  grades: number[]
  /** آیا در این دوره برنامه توسط هر معلم چیده می‌شود (ابتدایی) یا توسط کادر (متوسطه) */
  schedulingMode: 'single-teacher' | 'subject-teachers'
}

export interface CourseDefinition {
  id: string
  name: string
  /** قانون ویژه برای این درس */
  specialRule: SpecialRule
  color: string
  /** اگر true باشد توسط کاربر افزوده شده و قابل حذف است */
  isCustom?: boolean
}

/** ساعت هفتگی هر درس به ازای شناسه درس برای هر (levelId -> grade -> courseId -> hours) */
export type CurriculumMap = Record<string, Record<number, Record<string, number>>>

export interface BellPeriod {
  index: number
  type: 'lesson' | 'break' | 'lunch'
  start: string
  end: string
  durationMinutes: number
}

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
  courseIds: string[]
  /** فقط برای دوره‌های متوسطه: ساعت موردنیاز در هفته به ازای courseId */
  weeklyHoursByCourse?: Record<string, number>
  createdAt: number
}

export type Audience = 'self' | 'school'

export interface WizardState {
  step: number
  audience: Audience | null
  levelId: LevelId | null
  selectedGrades: number[]
  shiftId: ShiftId
  shiftConfigs: Record<ShiftId, ShiftTimeConfig>
  teacherName: string
  assignedTeacherIds: string[]
  schoolName: string
  updatedAt: number
}

export interface LessonCell {
  dayIndex: number
  periodIndex: number
  courseId: string | null
  teacherId: string | null
  isLocked?: boolean
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
  createdAt: number
  updatedAt: number
}

export const WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'] as const
