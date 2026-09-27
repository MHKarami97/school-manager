import type {
  LevelId,
  Teacher,
  ShiftTimeConfig,
  SportClassDefinition,
  SportFacility,
  SportSlot,
} from '../types'
import { WEEK_DAYS } from '../types'
import { buildBellSchedule } from '../config/schedule-defaults.config'

export interface SportScheduleRequest {
  levelId: LevelId
  classes: SportClassDefinition[]
  periodsPerWeekByClass: Record<string, number>
  shiftConfig: ShiftTimeConfig
  teachers: Teacher[]
  facilities: SportFacility[]
}

export interface SportScheduleResult {
  slots: SportSlot[]
  unassignedClassIds: string[]
  warnings: string[]
}

interface BellPeriod {
  start: string
  end: string
}

interface SingleTeacherAssignment {
  teacher: Teacher
  coveredSlots: { day: number; periodIdx: number }[]
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** آیا معلم اجازه‌ی تدریس در این مقطع را دارد؟ (levelIds خالی یعنی «همه‌ی مقاطع») */
function canTeachLevel(teacher: Teacher, levelId: LevelId): boolean {
  return !teacher.levelIds || teacher.levelIds.length === 0 || teacher.levelIds.includes(levelId)
}

/** آیا معلم در این روز/بازه‌ی زمانی، طبق availability ثبت‌شده‌اش، در دسترس است؟ */
function isTeacherAvailable(teacher: Teacher, dayIndex: number, startTime: string, endTime: string): boolean {
  if (!teacher.availability || !teacher.availability.length) return true
  const slotStart = toMinutes(startTime)
  const slotEnd = toMinutes(endTime)
  return teacher.availability.some(
    (a) => a.dayIndex === dayIndex && toMinutes(a.startTime) <= slotStart && toMinutes(a.endTime) >= slotEnd,
  )
}

function formatTeacherName(teacher: Teacher): string {
  if (teacher.gender === 'male') return `آقای ${teacher.name}`
  if (teacher.gender === 'female') return `خانم ${teacher.name}`
  return teacher.name
}

/**
 * موتور تخصیص ساعات ورزش به کلاس‌ها.
 *
 * دو قانون سخت (اجباری):
 * ۱) هر کلاس فقط و فقط با یک معلم واحد تکمیل می‌شود — هیچ‌وقت بخشی از زنگ‌های یک
 *    کلاس به یک معلم و بخش دیگر به معلم دیگر داده نمی‌شود.
 * ۲) اگر فضای ورزشی (facility) تعریف شده باشد، در یک روز/زنگ مشخص، تعداد کلاس‌هایی
 *    که هم‌زمان ورزش دارند هرگز از مجموع ظرفیت هم‌زمانِ فضاهای موجود بیشتر نمی‌شود.
 *    یعنی اگر فقط یک زمین با ظرفیت ۱ وجود دارد، در هیچ روز/زنگی دو کلاس مختلف
 *    هم‌زمان به آن تخصیص نمی‌گیرند؛ به‌جایش آن بازه برای کلاس دوم «پر» در نظر
 *    گرفته می‌شود و باید در بازه‌ی دیگری برایش زنگ پیدا شود.
 */
export class SportSchedulerEngine {
  private readonly teacherWeeklyLoad = new Map<string, number>()
  private readonly teacherBusyByDayPeriod = new Set<string>() // `${teacherId}-${day}-${period}`
  private readonly facilityUsageByDayPeriod = new Map<string, number>() // `${facilityId}-${day}-${period}`

  run(request: SportScheduleRequest): SportScheduleResult {
    const periods = buildBellSchedule(request.shiftConfig).filter((p) => p.type === 'lesson')
    const dayCount = WEEK_DAYS.length
    const slots: SportSlot[] = []
    const warnings: string[] = []
    const unassignedClassIds: string[] = []

    const eligibleTeachers = request.teachers.filter(
      (t) => t.courseIds.includes('sport') && canTeachLevel(t, request.levelId),
    )
    for (const teacher of eligibleTeachers) this.teacherWeeklyLoad.set(teacher.id, 0)

    if (!eligibleTeachers.length) {
      return {
        slots: [],
        unassignedClassIds: request.classes.map((c) => c.id),
        warnings: ['هیچ معلم ورزشی واجد شرایط این مقطع ثبت نشده؛ اول از مرحله‌ی «معلمان» یک معلم اضافه کن.'],
      }
    }

    // کلاس‌هایی که به زنگ بیشتری نیاز دارند اول تخصیص بگیرند (Most-Constrained-First)
    const orderedClasses = [...request.classes].sort(
      (a, b) => (request.periodsPerWeekByClass[b.id] ?? 0) - (request.periodsPerWeekByClass[a.id] ?? 0),
    )

    for (const klass of orderedClasses) {
      const needed = request.periodsPerWeekByClass[klass.id] ?? 0
      if (needed <= 0) continue

      const assignment = this.pickSingleTeacherForClass(eligibleTeachers, request.facilities, periods, dayCount, needed)

      if (!assignment || assignment.coveredSlots.length === 0) {
        unassignedClassIds.push(klass.id)
        warnings.push(
          `برای «${klass.label}» هیچ ترکیب معلم/فضای ورزشی آزادی پیدا نشد. یک معلم جدید اضافه کن، ساعات حضور معلمان فعلی را بازبینی کن، یا اگر فقط یک زمین/سالن داری، ظرفیت هم‌زمانش را بررسی کن.`,
        )
        continue
      }

      const { teacher, coveredSlots } = assignment

      for (const { day, periodIdx } of coveredSlots) {
        const facility = this.findFreeFacility(request.facilities, day, periodIdx)
        slots.push({
          classId: klass.id,
          dayIndex: day,
          periodIndex: periodIdx,
          teacherId: teacher.id,
          facilityId: facility?.id ?? null,
        })
        this.markTeacherBusy(teacher.id, day, periodIdx)
        if (facility) this.markFacilityUsed(facility.id, day, periodIdx)
      }

      if (coveredSlots.length < needed) {
        unassignedClassIds.push(klass.id)
        warnings.push(
          `«${klass.label}»: فقط ${coveredSlots.length} از ${needed} زنگ با معلم ثابت (${formatTeacherName(teacher)}) پر شد. علت می‌تواند کمبود ساعت حضور معلم یا اشغال‌بودن فضای ورزشی در بازه‌های دیگر باشد؛ برای تکمیل، دستی تنظیم کن.`,
        )
      }
    }

    return { slots, unassignedClassIds, warnings }
  }

  /**
   * از بین معلمان واجد شرایط، همان یک معلمی را برمی‌گرداند که بیشترین تعداد از
   * زنگ‌های مورد نیاز این کلاس را می‌تواند پوشش دهد — بدون تداخل با کلاس‌های قبلی،
   * بدون عبور از سقف ساعت هفتگی‌اش، و فقط در بازه‌هایی که واقعاً یک فضای ورزشی
   * آزاد هم برایشان وجود دارد (در صورتی که فضایی تعریف شده باشد). هرگز دو معلم را
   * برای یک کلاس ترکیب نمی‌کند.
   */
  private pickSingleTeacherForClass(
    teachers: Teacher[],
    facilities: SportFacility[],
    periods: BellPeriod[],
    dayCount: number,
    needed: number,
  ): SingleTeacherAssignment | null {
    let best: SingleTeacherAssignment | null = null

    for (const teacher of teachers) {
      const currentLoad = this.teacherWeeklyLoad.get(teacher.id) ?? 0
      const remainingCapacity =
        teacher.maxWeeklyHours != null ? teacher.maxWeeklyHours - currentLoad : Number.POSITIVE_INFINITY
      if (remainingCapacity <= 0) continue

      const covered: { day: number; periodIdx: number }[] = []

      for (let day = 0; day < dayCount; day += 1) {
        for (let periodIdx = 0; periodIdx < periods.length; periodIdx += 1) {
          if (covered.length >= needed || covered.length >= remainingCapacity) break
          if (this.teacherBusyByDayPeriod.has(`${teacher.id}-${day}-${periodIdx}`)) continue
          const period = periods[periodIdx]
          if (!isTeacherAvailable(teacher, day, period.start, period.end)) continue
          // قید سخت: اگر فضای ورزشی تعریف شده، در این روز/زنگ باید حداقل یک فضای
          // آزاد (با ظرفیت هم‌زمان خالی) وجود داشته باشد؛ وگرنه این بازه رد می‌شود
          // تا هیچ‌وقت دو کلاس مختلف هم‌زمان روی یک زمین/سالن قرار نگیرند.
          if (facilities.length && !this.findFreeFacility(facilities, day, periodIdx)) continue
          covered.push({ day, periodIdx })
        }
        if (covered.length >= needed || covered.length >= remainingCapacity) break
      }

      if (!covered.length) continue

      const isBetter =
        !best ||
        covered.length > best.coveredSlots.length ||
        (covered.length === best.coveredSlots.length && currentLoad < (this.teacherWeeklyLoad.get(best.teacher.id) ?? 0))

      if (isBetter) best = { teacher, coveredSlots: covered }
    }

    return best
  }

  private findFreeFacility(facilities: SportFacility[], day: number, periodIdx: number): SportFacility | null {
    if (!facilities.length) return null
    return (
      facilities.find((facility) => {
        const usage = this.facilityUsageByDayPeriod.get(`${facility.id}-${day}-${periodIdx}`) ?? 0
        return usage < facility.concurrentCapacity
      }) ?? null
    )
  }

  private markTeacherBusy(teacherId: string, day: number, periodIdx: number): void {
    this.teacherBusyByDayPeriod.add(`${teacherId}-${day}-${periodIdx}`)
    this.teacherWeeklyLoad.set(teacherId, (this.teacherWeeklyLoad.get(teacherId) ?? 0) + 1)
  }

  private markFacilityUsed(facilityId: string, day: number, periodIdx: number): void {
    const key = `${facilityId}-${day}-${periodIdx}`
    this.facilityUsageByDayPeriod.set(key, (this.facilityUsageByDayPeriod.get(key) ?? 0) + 1)
  }
}

/**
 * اعتبارسنجی تداخل real-time برای ویرایش دستی: آیا این معلم در این روز/زنگ،
 * در یک کلاس دیگر از همین برنامه از قبل مشغول است؟
 */
export function findTeacherConflict(
  slots: SportSlot[],
  teacherId: string,
  dayIndex: number,
  periodIndex: number,
  excludeClassId: string,
): SportSlot | null {
  return (
    slots.find(
      (s) =>
        s.teacherId === teacherId &&
        s.dayIndex === dayIndex &&
        s.periodIndex === periodIndex &&
        s.classId !== excludeClassId,
    ) ?? null
  )
}

/** آیا این معلم از سقف ساعت هفتگی مجازش عبور کرده؟ (برای هشدار real-time در ویرایش دستی) */
export function teacherWeeklyLoad(slots: SportSlot[], teacherId: string): number {
  return slots.filter((s) => s.teacherId === teacherId).length
}

/**
 * لیست تمام معلمان متفاوتی که فعلاً روی زنگ‌های یک کلاس نشسته‌اند.
 * اگر طول این آرایه بیشتر از ۱ باشد، یعنی قانون «یک کلاس = یک معلم» رعایت نشده
 * (مثلاً بعد از ویرایش دستی) — از این تابع برای هشدار در UI استفاده کن.
 */
export function distinctTeacherIdsForClass(slots: SportSlot[], classId: string): string[] {
  const ids = new Set<string>()
  for (const slot of slots) {
    if (slot.classId === classId && slot.teacherId) ids.add(slot.teacherId)
  }
  return Array.from(ids)
}

/**
 * بررسی تداخل فضای ورزشی برای ویرایش دستی: آیا تعداد کلاس‌هایی که در این روز/زنگ
 * از این facility استفاده می‌کنند، از ظرفیت هم‌زمانش بیشتر شده؟
 */
export function findFacilityOvercapacity(
  slots: SportSlot[],
  facilities: SportFacility[],
  facilityId: string,
  dayIndex: number,
  periodIndex: number,
  excludeClassId: string,
): boolean {
  const facility = facilities.find((f) => f.id === facilityId)
  if (!facility) return false
  const usage = slots.filter(
    (s) =>
      s.facilityId === facilityId &&
      s.dayIndex === dayIndex &&
      s.periodIndex === periodIndex &&
      s.classId !== excludeClassId,
  ).length
  return usage >= facility.concurrentCapacity
}