import type { LevelId, Teacher, ShiftTimeConfig, SportClassDefinition, SportFacility, SportSlot } from '../types'
import { WEEK_DAYS } from '../types'
import { buildBellSchedule } from '../config/schedule-defaults.config'

export interface SportScheduleRequest {
  levelId: LevelId
  classes: SportClassDefinition[]
  periodsPerWeekByClass: Record<string, number>
  shiftConfig: ShiftTimeConfig
  teachers: Teacher[]
  facilities: SportFacility[]
  noConsecutiveSportPeriods?: boolean
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

interface ScheduledCandidate {
  day: number
  periodIdx: number
  facilityId: string | null
}

interface SingleTeacherAssignment {
  teacher: Teacher
  coveredSlots: ScheduledCandidate[]
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function canTeachLevel(teacher: Teacher, levelId: LevelId): boolean {
  return !teacher.levelIds || teacher.levelIds.length === 0 || teacher.levelIds.includes(levelId)
}

function isTeacherAvailable(teacher: Teacher, dayIndex: number, startTime: string, endTime: string): boolean {
  if (!teacher.availability || !teacher.availability.length) return true
  const slotStart = toMinutes(startTime)
  const slotEnd = toMinutes(endTime)
  return teacher.availability.some(
    (availability) =>
      availability.dayIndex === dayIndex &&
      toMinutes(availability.startTime) <= slotStart &&
      toMinutes(availability.endTime) >= slotEnd,
  )
}

function formatTeacherName(teacher: Teacher): string {
  if (teacher.gender === 'male') return `آقای ${teacher.name}`
  if (teacher.gender === 'female') return `خانم ${teacher.name}`
  return teacher.name
}

export class SportSchedulerEngine {
  private readonly teacherWeeklyLoad = new Map<string, number>()
  private readonly teacherBusyByDayPeriod = new Set<string>()
  private readonly facilityUsageByDayPeriod = new Map<string, number>()
  /** day-periodIdx: هر زنگ مدرسه فقط یک کلاس می‌تواند ورزش داشته باشد. */
  private readonly occupiedSchoolPeriods = new Set<string>()

  run(request: SportScheduleRequest): SportScheduleResult {
    const periods = buildBellSchedule(request.shiftConfig).filter((period) => period.type === 'lesson')
    const dayCount = WEEK_DAYS.length
    const slots: SportSlot[] = []
    const warnings: string[] = []
    const unassignedClassIds: string[] = []

    this.teacherWeeklyLoad.clear()
    this.teacherBusyByDayPeriod.clear()
    this.facilityUsageByDayPeriod.clear()
    this.occupiedSchoolPeriods.clear()

    const eligibleTeachers = request.teachers.filter(
      (teacher) => teacher.courseIds.includes('sport') && canTeachLevel(teacher, request.levelId),
    )
    for (const teacher of eligibleTeachers) this.teacherWeeklyLoad.set(teacher.id, 0)

    if (!eligibleTeachers.length) {
      return {
        slots: [],
        unassignedClassIds: request.classes.map((klass) => klass.id),
        warnings: ['هیچ معلم ورزش واجد شرایطی انتخاب نشده است.'],
      }
    }

    const orderedClasses = [...request.classes].sort(
      (a, b) => (request.periodsPerWeekByClass[b.id] ?? 0) - (request.periodsPerWeekByClass[a.id] ?? 0),
    )

    for (const klass of orderedClasses) {
      const needed = request.periodsPerWeekByClass[klass.id] ?? 0
      if (needed === 0) continue

      const assignment = this.pickSingleTeacherForClass(
        eligibleTeachers,
        request.facilities,
        periods,
        dayCount,
        needed,
        request.noConsecutiveSportPeriods ?? false,
      )

      if (!assignment || assignment.coveredSlots.length === 0) {
        unassignedClassIds.push(klass.id)
        warnings.push(`${klass.label}: هیچ معلم آزادی برای این کلاس پیدا نشد.`)
        continue
      }

      const { teacher, coveredSlots } = assignment
      for (const { day, periodIdx, facilityId } of coveredSlots) {
        slots.push({ classId: klass.id, dayIndex: day, periodIndex: periodIdx, teacherId: teacher.id, facilityId })
        this.markTeacherBusy(teacher.id, day, periodIdx)
        this.occupiedSchoolPeriods.add(this.schoolPeriodKey(day, periodIdx))
        if (facilityId) this.markFacilityUsed(facilityId, day, periodIdx)
      }

      if (coveredSlots.length < needed) {
        unassignedClassIds.push(klass.id)
        warnings.push(
          `${klass.label}: فقط ${coveredSlots.length} از ${needed} زنگ با ${formatTeacherName(teacher)} پوشش داده شد.`,
        )
      }
    }

    return { slots, unassignedClassIds, warnings }
  }

  private pickSingleTeacherForClass(
    teachers: Teacher[],
    facilities: SportFacility[],
    periods: BellPeriod[],
    dayCount: number,
    needed: number,
    noConsecutiveSportPeriods: boolean,
  ): SingleTeacherAssignment | null {
    let best: SingleTeacherAssignment | null = null

    for (const teacher of teachers) {
      const currentLoad = this.teacherWeeklyLoad.get(teacher.id) ?? 0
      const remainingCapacity =
        teacher.maxWeeklyHours != null ? teacher.maxWeeklyHours - currentLoad : Number.POSITIVE_INFINITY
      if (remainingCapacity <= 0) continue

      const coveredSlots: ScheduledCandidate[] = []
      /** روزهایی که برای همین کلاس، در همین تلاش، قبلاً یک زنگ در آن‌ها گذاشته شده. */
      const usedDaysForClass = new Set<number>()

      for (let day = 0; day < dayCount; day += 1) {
        for (let periodIdx = 0; periodIdx < periods.length; periodIdx += 1) {
          if (coveredSlots.length >= needed || coveredSlots.length >= remainingCapacity) break
          if (noConsecutiveSportPeriods && usedDaysForClass.has(day)) continue
          if (this.teacherBusyByDayPeriod.has(this.teacherPeriodKey(teacher.id, day, periodIdx))) continue
          if (this.occupiedSchoolPeriods.has(this.schoolPeriodKey(day, periodIdx))) continue

          const period = periods[periodIdx]
          if (!isTeacherAvailable(teacher, day, period.start, period.end)) continue

          const facility = facilities.length ? this.findFreeFacility(facilities, day, periodIdx) : null
          if (facilities.length && !facility) continue

          coveredSlots.push({ day, periodIdx, facilityId: facility?.id ?? null })
          if (noConsecutiveSportPeriods) usedDaysForClass.add(day)
        }
      }

      if (!coveredSlots.length) continue

      const isBetter =
        !best ||
        coveredSlots.length > best.coveredSlots.length ||
        (coveredSlots.length === best.coveredSlots.length && currentLoad < (this.teacherWeeklyLoad.get(best.teacher.id) ?? 0))
      if (isBetter) best = { teacher, coveredSlots }
    }

    return best
  }

  private findFreeFacility(facilities: SportFacility[], day: number, periodIdx: number): SportFacility | null {
    return (
      facilities.find((facility) => {
        const usage = this.facilityUsageByDayPeriod.get(this.facilityPeriodKey(facility.id, day, periodIdx)) ?? 0
        return usage < (facility.concurrentCapacity ?? 1)
      }) ?? null
    )
  }

  private markTeacherBusy(teacherId: string, day: number, periodIdx: number): void {
    this.teacherBusyByDayPeriod.add(this.teacherPeriodKey(teacherId, day, periodIdx))
    this.teacherWeeklyLoad.set(teacherId, (this.teacherWeeklyLoad.get(teacherId) ?? 0) + 1)
  }

  private markFacilityUsed(facilityId: string, day: number, periodIdx: number): void {
    const key = this.facilityPeriodKey(facilityId, day, periodIdx)
    this.facilityUsageByDayPeriod.set(key, (this.facilityUsageByDayPeriod.get(key) ?? 0) + 1)
  }

  private teacherPeriodKey(teacherId: string, day: number, periodIdx: number): string {
    return `${teacherId}-${day}-${periodIdx}`
  }

  private facilityPeriodKey(facilityId: string, day: number, periodIdx: number): string {
    return `${facilityId}-${day}-${periodIdx}`
  }

  private schoolPeriodKey(day: number, periodIdx: number): string {
    return `${day}-${periodIdx}`
  }
}

export function findTeacherConflict(
  slots: SportSlot[],
  teacherId: string,
  dayIndex: number,
  periodIndex: number,
  excludeClassId?: string,
): SportSlot | null {
  return (
    slots.find(
      (slot) =>
        slot.teacherId === teacherId &&
        slot.dayIndex === dayIndex &&
        slot.periodIndex === periodIndex &&
        slot.classId !== excludeClassId,
    ) ?? null
  )
}

export function teacherWeeklyLoad(slots: SportSlot[], teacherId: string): number {
  return slots.filter((slot) => slot.teacherId === teacherId).length
}

export function distinctTeacherIdsForClass(slots: SportSlot[], classId: string): string[] {
  const teacherIds = new Set<string>()
  for (const slot of slots) {
    if (slot.classId === classId && slot.teacherId) teacherIds.add(slot.teacherId)
  }
  return Array.from(teacherIds)
}

export function findFacilityOvercapacity(
  slots: SportSlot[],
  facilities: SportFacility[],
  facilityId: string,
  dayIndex: number,
  periodIndex: number,
  excludeClassId?: string,
): boolean {
  const facility = facilities.find((item) => item.id === facilityId)
  if (!facility) return false
  const usage = slots.filter(
    (slot) =>
      slot.facilityId === facilityId &&
      slot.dayIndex === dayIndex &&
      slot.periodIndex === periodIndex &&
      slot.classId !== excludeClassId,
  ).length
  return usage >= facility.concurrentCapacity
}
