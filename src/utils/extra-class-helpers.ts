import type { Enrollment, ExtraClass } from '../types'

function toMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
}

/** بازه‌ی تاریخی خالی یعنی نامحدود (بدون تاریخ شروع/پایان مشخص). */
function dateRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aFrom = aStart || '0000-00-00'
  const aTo = aEnd || '9999-99-99'
  const bFrom = bStart || '0000-00-00'
  const bTo = bEnd || '9999-99-99'
  return aFrom <= bTo && bFrom <= aTo
}

/** دو کلاس وقتی تداخل دارند که حداقل یک روز هفته‌ی مشترک، هم‌پوشانی ساعت و هم‌پوشانی بازه‌ی تاریخی داشته باشند. */
export function classesOverlap(a: ExtraClass, b: ExtraClass): boolean {
  const sharesDay = a.dayIndexes.some((day) => b.dayIndexes.includes(day))
  if (!sharesDay) return false
  if (!timeRangesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) return false
  return dateRangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)
}

/** ثبت‌نام‌های فعال و غیر از لیست انتظار (یعنی جایگاه واقعی کلاس را اشغال می‌کنند). */
export function activeEnrollmentsOf(extraClassId: string, enrollments: Enrollment[]): Enrollment[] {
  return enrollments.filter((e) => e.extraClassId === extraClassId && e.status === 'active' && !e.waitlisted)
}

/** لیست انتظار همان کلاس، به ترتیب زمان ثبت‌نام. */
export function waitlistOf(extraClassId: string, enrollments: Enrollment[]): Enrollment[] {
  return enrollments
    .filter((e) => e.extraClassId === extraClassId && e.status === 'active' && e.waitlisted)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function remainingCapacityOf(extraClass: ExtraClass, enrollments: Enrollment[]): number {
  return Math.max(0, extraClass.capacity - activeEnrollmentsOf(extraClass.id, enrollments).length)
}

export function isClassFull(extraClass: ExtraClass, enrollments: Enrollment[]): boolean {
  return remainingCapacityOf(extraClass, enrollments) <= 0
}

/** آیا دانش‌آموز در کلاس دیگری (غیر از لیست انتظار) با تداخل زمانی با extraClass ثبت‌نام فعال دارد؟ */
export function findStudentTimeConflict(
  studentId: string,
  extraClass: ExtraClass,
  allClasses: ExtraClass[],
  enrollments: Enrollment[],
  excludeEnrollmentId?: string,
): ExtraClass | null {
  const studentActiveEnrollments = enrollments.filter(
    (e) => e.studentId === studentId && e.status === 'active' && !e.waitlisted && e.id !== excludeEnrollmentId,
  )
  for (const enrollment of studentActiveEnrollments) {
    const otherClass = allClasses.find((c) => c.id === enrollment.extraClassId)
    if (otherClass && otherClass.id !== extraClass.id && classesOverlap(otherClass, extraClass)) return otherClass
  }
  return null
}

/** آیا معلم در کلاس دیگری با تداخل زمانی با extraClass تدریس می‌کند؟ */
export function findTeacherTimeConflict(
  teacherId: string,
  extraClass: ExtraClass,
  allClasses: ExtraClass[],
  excludeClassId?: string,
): ExtraClass | null {
  return (
    allClasses.find(
      (c) => c.id !== extraClass.id && c.id !== excludeClassId && c.teacherId === teacherId && classesOverlap(c, extraClass),
    ) ?? null
  )
}

export interface TeacherEnrollmentReportRow {
  teacherId: string
  classCount: number
  enrollmentCount: number
}

/** گزارش تعداد کلاس و تعداد ثبت‌نامی به ازای هر معلم. */
export function reportByTeacher(classes: ExtraClass[], enrollments: Enrollment[]): TeacherEnrollmentReportRow[] {
  const map = new Map<string, TeacherEnrollmentReportRow>()
  for (const klass of classes) {
    if (!klass.teacherId) continue
    if (!map.has(klass.teacherId)) {
      map.set(klass.teacherId, { teacherId: klass.teacherId, classCount: 0, enrollmentCount: 0 })
    }
    const row = map.get(klass.teacherId)!
    row.classCount += 1
    row.enrollmentCount += activeEnrollmentsOf(klass.id, enrollments).length
  }
  return Array.from(map.values())
}

/** شکل عمومی یک آیتم روی تخته‌ی هفتگی؛ توسط WeeklyCalendarBoard.vue استفاده می‌شود. */
export interface WeeklyBoardItem {
  id: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  badge?: string
}

/** یک ExtraClass با چند روز هفته را به چند آیتم تخته (یکی برای هر روز) تبدیل می‌کند. */
export function toWeeklyBoardItems(
  klass: ExtraClass,
  build: (klass: ExtraClass) => Omit<WeeklyBoardItem, 'id' | 'dayIndex'>,
): WeeklyBoardItem[] {
  return klass.dayIndexes.map((dayIndex) => ({
    id: `${klass.id}-${dayIndex}`,
    dayIndex,
    ...build(klass),
  }))
}
