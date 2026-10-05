import type { LevelId, Teacher, TeachingClass, TeachingSlot } from '../types'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { hoursToUnits, isQualified, isTeacherFree, slotKey, teacherSlotKey } from './teaching-rules'
import type { DateRange, PeriodTime } from './teaching-rules'

export interface PlannerRequest {
  levelId: LevelId
  classes: TeachingClass[]
  curriculum: Record<number, Record<string, number>>
  periods: PeriodTime[]
  dayCount: number
  teachers: Teacher[]
  lockedSlots: TeachingSlot[]
  range: DateRange
}

export interface PlannerResult {
  slots: TeachingSlot[]
  warnings: string[]
}

interface Demand {
  classIndex: number
  cls: TeachingClass
  courseId: string
  units: number
  qualified: Teacher[]
  preferredTeacherId: string | null
}

/** وضعیت اشغال کلاس‌ها و معلم‌ها؛ add/remove برای آزمایش و بازگردانی (rollback) استفاده می‌شود. */
class Occupancy {
  private readonly classSlots = new Map<string, TeachingSlot>()
  private readonly teacherSlots = new Set<string>()
  private readonly teacherWeekly = new Map<string, number>()
  private readonly teacherDaily = new Map<string, number>()
  private readonly classDayLoad = new Map<string, number>()
  private readonly courseDay = new Map<string, number>()

  add(slot: TeachingSlot): void {
    this.classSlots.set(slotKey(slot.classId, slot.dayIndex, slot.periodIndex), slot)
    this.bump(this.classDayLoad, `${slot.classId}|${slot.dayIndex}`, 1)
    this.bump(this.courseDay, `${slot.classId}|${slot.courseId}|${slot.dayIndex}`, 1)
    if (slot.teacherId) {
      this.teacherSlots.add(teacherSlotKey(slot.teacherId, slot.dayIndex, slot.periodIndex))
      this.bump(this.teacherWeekly, slot.teacherId, 1)
      this.bump(this.teacherDaily, `${slot.teacherId}|${slot.dayIndex}`, 1)
    }
  }

  remove(slot: TeachingSlot): void {
    this.classSlots.delete(slotKey(slot.classId, slot.dayIndex, slot.periodIndex))
    this.bump(this.classDayLoad, `${slot.classId}|${slot.dayIndex}`, -1)
    this.bump(this.courseDay, `${slot.classId}|${slot.courseId}|${slot.dayIndex}`, -1)
    if (slot.teacherId) {
      this.teacherSlots.delete(teacherSlotKey(slot.teacherId, slot.dayIndex, slot.periodIndex))
      this.bump(this.teacherWeekly, slot.teacherId, -1)
      this.bump(this.teacherDaily, `${slot.teacherId}|${slot.dayIndex}`, -1)
    }
  }

  isClassFree(classId: string, day: number, period: number): boolean {
    return !this.classSlots.has(slotKey(classId, day, period))
  }
  isTeacherBusy(teacherId: string, day: number, period: number): boolean {
    return this.teacherSlots.has(teacherSlotKey(teacherId, day, period))
  }
  weekly(teacherId: string): number {
    return this.teacherWeekly.get(teacherId) ?? 0
  }
  daily(teacherId: string, day: number): number {
    return this.teacherDaily.get(`${teacherId}|${day}`) ?? 0
  }
  dayLoad(classId: string, day: number): number {
    return this.classDayLoad.get(`${classId}|${day}`) ?? 0
  }
  courseOnDay(classId: string, courseId: string, day: number): number {
    return this.courseDay.get(`${classId}|${courseId}|${day}`) ?? 0
  }

  private bump(map: Map<string, number>, key: string, delta: number): void {
    map.set(key, (map.get(key) ?? 0) + delta)
  }
}

export class TeachingPlanner {
  run(request: PlannerRequest): PlannerResult {
    const occupancy = new Occupancy()
    const slots: TeachingSlot[] = []
    const warnings: string[] = []
    const classIds = new Set(request.classes.map((c) => c.id))

    // ۱) خانه‌های قفل‌شده از قبل ثابت می‌شوند و بقیه دور آن‌ها چیده می‌شود.
    const locked = request.lockedSlots.filter(
      (s) => classIds.has(s.classId) && s.dayIndex < request.dayCount && s.periodIndex < request.periods.length,
    )
    for (const slot of locked) {
      const copy: TeachingSlot = { ...slot, isLocked: true }
      occupancy.add(copy)
      slots.push(copy)
    }

    // ۲) نیازها از curriculum استخراج می‌شود (منبع الزام).
    const demands = this.buildDemands(request, locked)
    const missingTeacherGroups = new Map<string, number>()

    for (const demand of demands) {
      let remaining = demand.units
      let guard = demand.qualified.length + 1

      while (remaining > 0 && guard > 0) {
        guard -= 1
        const best = this.pickBestTeacher(demand, remaining, request, occupancy)
        if (!best) break
        const placed = this.placeUnits(demand.cls, demand.courseId, remaining, best, request, occupancy)
        if (!placed.length) break
        slots.push(...placed)
        remaining -= placed.length
      }

      // اگر معلم واجدشرایط نبود یا ظرفیتش تمام شد، درس بدون معلم (فقط با خالی بودن کلاس) چیده می‌شود تا کسری مشخص بماند.
      if (remaining > 0) {
        const withoutTeacher = this.placeUnits(demand.cls, demand.courseId, remaining, null, request, occupancy)
        slots.push(...withoutTeacher)
        const unplaced = remaining - withoutTeacher.length

        if (!demand.qualified.length) {
          const key = `${demand.courseId}|${demand.cls.grade}`
          missingTeacherGroups.set(key, (missingTeacherGroups.get(key) ?? 0) + 1)
        } else if (withoutTeacher.length) {
          warnings.push(
            `کمبود معلم/زمان آزاد: ${demand.cls.label}، درس «${this.courseName(demand.courseId)}»: ${withoutTeacher.length} ساعت بدون معلم ماند.`,
          )
        }
        if (unplaced > 0) {
          warnings.push(
            `کلاس ${demand.cls.label} پر است؛ ${unplaced} ساعت از درس «${this.courseName(demand.courseId)}» جا نشد.`,
          )
        }
      }
    }

    for (const [key, classCount] of missingTeacherGroups) {
      const [courseId, grade] = key.split('|')
      warnings.unshift(
        `هیچ معلم واجدشرایطی برای درس «${this.courseName(courseId)}» در پایه ${grade} وجود ندارد (${classCount} کلاس).`,
      )
    }

    slots.sort(
      (a, b) =>
        a.classId.localeCompare(b.classId) || a.dayIndex - b.dayIndex || a.periodIndex - b.periodIndex,
    )
    return { slots, warnings }
  }

  private courseName(courseId: string): string {
    return findCourse(BASE_COURSES, courseId)?.name ?? courseId
  }

  private buildDemands(request: PlannerRequest, locked: TeachingSlot[]): Demand[] {
    const demands: Demand[] = []
    request.classes.forEach((cls, classIndex) => {
      const needs = request.curriculum[cls.grade] ?? {}
      for (const [courseId, hours] of Object.entries(needs)) {
        const required = hoursToUnits(hours)
        const lockedForThis = locked.filter((s) => s.classId === cls.id && s.courseId === courseId)
        const units = required - lockedForThis.length
        if (units <= 0) continue
        const qualified = request.teachers.filter((t) => isQualified(t, courseId, cls.grade, request.levelId))
        const lockedTeacher = lockedForThis.find((s) => s.teacherId)?.teacherId ?? null
        demands.push({ classIndex, cls, courseId, units, qualified, preferredTeacherId: lockedTeacher })
      }
    })

    return demands.sort(
      (a, b) =>
        Number(a.qualified.length === 0) - Number(b.qualified.length === 0) ||
        a.qualified.length - b.qualified.length ||
        b.units - a.units ||
        a.cls.grade - b.cls.grade ||
        a.classIndex - b.classIndex ||
        a.courseId.localeCompare(b.courseId),
    )
  }

  /** هر معلم واجدشرایط را آزمایشی امتحان می‌کند؛ بهترین = بیشترین ساعت جاگرفته، سپس کمترین بار هفتگی. */
  private pickBestTeacher(
    demand: Demand,
    remaining: number,
    request: PlannerRequest,
    occupancy: Occupancy,
  ): Teacher | null {
    let best: { teacher: Teacher; placed: number } | null = null
    for (const teacher of demand.qualified) {
      const trial = this.placeUnits(demand.cls, demand.courseId, remaining, teacher, request, occupancy)
      for (let i = trial.length - 1; i >= 0; i -= 1) occupancy.remove(trial[i])
      if (!trial.length) continue

      const candidate = { teacher, placed: trial.length }
      if (!best || this.isBetter(candidate, best, demand, occupancy)) best = candidate
    }
    return best?.teacher ?? null
  }

  private isBetter(
    a: { teacher: Teacher; placed: number },
    b: { teacher: Teacher; placed: number },
    demand: Demand,
    occupancy: Occupancy,
  ): boolean {
    if (a.placed !== b.placed) return a.placed > b.placed
    const aPreferred = a.teacher.id === demand.preferredTeacherId
    const bPreferred = b.teacher.id === demand.preferredTeacherId
    if (aPreferred !== bPreferred) return aPreferred
    const aLoad = occupancy.weekly(a.teacher.id)
    const bLoad = occupancy.weekly(b.teacher.id)
    if (aLoad !== bLoad) return aLoad < bLoad
    return a.teacher.id < b.teacher.id
  }

  /**
   * تا units ساعت از یک درس را برای یک کلاس می‌چیند (و در occupancy ثبت می‌کند).
   * امتیاز هر خانه: پرهیز از تکرار درس در یک روز، پخش بار کلاس، بدون فاصله‌ی خالی، و پخش بار روزانه‌ی معلم.
   */
  private placeUnits(
    cls: TeachingClass,
    courseId: string,
    units: number,
    teacher: Teacher | null,
    request: PlannerRequest,
    occupancy: Occupancy,
  ): TeachingSlot[] {
    const placed: TeachingSlot[] = []
    let allowed = units
    if (teacher && teacher.maxWeeklyHours != null) {
      allowed = Math.min(allowed, Math.max(0, Math.floor(teacher.maxWeeklyHours) - occupancy.weekly(teacher.id)))
    }

    for (let i = 0; i < allowed; i += 1) {
      let best: { day: number; period: number; score: number } | null = null

      for (let day = 0; day < request.dayCount; day += 1) {
        if (teacher && teacher.maxDailyHours != null && occupancy.daily(teacher.id, day) >= teacher.maxDailyHours) continue

        let firstFree = -1
        for (let p = 0; p < request.periods.length; p += 1) {
          if (occupancy.isClassFree(cls.id, day, p)) {
            firstFree = p
            break
          }
        }

        for (let p = 0; p < request.periods.length; p += 1) {
          if (!occupancy.isClassFree(cls.id, day, p)) continue
          if (teacher) {
            if (occupancy.isTeacherBusy(teacher.id, day, p)) continue
            if (!isTeacherFree(teacher, day, request.periods[p], request.range)) continue
          }
          const score =
            occupancy.courseOnDay(cls.id, courseId, day) * 100 +
            occupancy.dayLoad(cls.id, day) * 2 +
            (p - firstFree) * 3 +
            (teacher ? occupancy.daily(teacher.id, day) : 0)
          if (!best || score < best.score) best = { day, period: p, score }
        }
      }

      if (!best) break
      const slot: TeachingSlot = {
        classId: cls.id,
        dayIndex: best.day,
        periodIndex: best.period,
        courseId,
        teacherId: teacher ? teacher.id : null,
      }
      occupancy.add(slot)
      placed.push(slot)
    }
    return placed
  }
}
