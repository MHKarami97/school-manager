import type { Teacher, TeachingPlan, TeachingSlot } from '../types'
import { BASE_COURSES, findCourse } from '../config/courses.config'
import { gradeLabel } from '../config/levels.config'
import {
  hoursToUnits,
  isQualified,
  isTeacherBlocked,
  isTeacherPresent,
  slotKey,
  teacherSlotKey,
} from './teaching-rules'
import type { PeriodTime } from './teaching-rules'
import { WEEK_DAYS } from '../types'

export type IssueSeverity = 'error' | 'warning'

export type IssueType =
  | 'teacher-conflict'
  | 'teacher-unavailable'
  | 'teacher-unqualified'
  | 'teacher-daily-limit'
  | 'teacher-weekly-limit'
  | 'no-teacher'
  | 'hours-shortage'
  | 'hours-excess'

export interface PlanIssue {
  id: string
  type: IssueType
  severity: IssueSeverity
  message: string
  classId?: string
  teacherId?: string
  slotKeys: string[]
}

export interface TeacherWorkload {
  teacherId: string
  weekly: number
  daily: number[]
  maxWeekly: number | null
  maxDaily: number | null
  overWeekly: boolean
  overDaily: boolean
}

export interface CurriculumDiff {
  classId: string
  courseId: string
  required: number
  placed: number
  diff: number
}

export interface PlanAnalysis {
  issues: PlanIssue[]
  flagged: Map<string, IssueSeverity>
  workloads: TeacherWorkload[]
  diffs: CurriculumDiff[]
}

function courseName(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}

export function analyzePlan(plan: TeachingPlan, teachers: Teacher[], periods: PeriodTime[]): PlanAnalysis {
  const issues: PlanIssue[] = []
  const flagged = new Map<string, IssueSeverity>()
  const teacherMap = new Map(teachers.map((t) => [t.id, t]))
  const classMap = new Map(plan.classes.map((c) => [c.id, c]))
  const range = { from: plan.effectiveFrom, to: plan.effectiveTo }
  const dayCount = WEEK_DAYS.length

  function flag(keys: string[], severity: IssueSeverity): void {
    for (const key of keys) {
      if (severity === 'error' || !flagged.has(key)) flagged.set(key, severity)
    }
  }
  function addIssue(issue: PlanIssue): void {
    issues.push(issue)
    flag(issue.slotKeys, issue.severity)
  }

  // --- معلم هم‌زمان در دو کلاس ----------------------------------------------------
  const byTeacherSlot = new Map<string, TeachingSlot[]>()
  for (const slot of plan.slots) {
    if (!slot.teacherId) continue
    const key = teacherSlotKey(slot.teacherId, slot.dayIndex, slot.periodIndex)
    byTeacherSlot.set(key, [...(byTeacherSlot.get(key) ?? []), slot])
  }
  for (const [key, group] of byTeacherSlot) {
    if (group.length < 2) continue
    const teacher = teacherMap.get(group[0].teacherId!)
    const labels = group.map((s) => classMap.get(s.classId)?.label ?? s.classId).join(' و ')
    addIssue({
      id: `conflict-${key}`,
      type: 'teacher-conflict',
      severity: 'error',
      message: `${teacher?.name ?? 'معلم'} در ${WEEK_DAYS[group[0].dayIndex]} زنگ ${group[0].periodIndex + 1} هم‌زمان در ${labels} است.`,
      teacherId: group[0].teacherId!,
      slotKeys: group.map((s) => slotKey(s.classId, s.dayIndex, s.periodIndex)),
    })
  }

  // --- حضور / ساعت غیرقابل‌تدریس / صلاحیت ----------------------------------------
  for (const slot of plan.slots) {
    if (!slot.teacherId) continue
    const teacher = teacherMap.get(slot.teacherId)
    const cls = classMap.get(slot.classId)
    const key = slotKey(slot.classId, slot.dayIndex, slot.periodIndex)
    if (!teacher || !cls) continue
    const period = periods[slot.periodIndex]

    if (period && (!isTeacherPresent(teacher, slot.dayIndex, period) || isTeacherBlocked(teacher, slot.dayIndex, period, range))) {
      addIssue({
        id: `unavailable-${key}`,
        type: 'teacher-unavailable',
        severity: 'error',
        message: `${teacher.name} در ${WEEK_DAYS[slot.dayIndex]} زنگ ${slot.periodIndex + 1} حضور ندارد یا ساعت غیرقابل‌تدریس دارد (${cls.label}).`,
        classId: cls.id,
        teacherId: teacher.id,
        slotKeys: [key],
      })
    }
    if (!isQualified(teacher, slot.courseId, cls.grade, plan.levelId)) {
      addIssue({
        id: `unqualified-${key}`,
        type: 'teacher-unqualified',
        severity: 'warning',
        message: `${teacher.name} برای درس «${courseName(slot.courseId)}» در ${gradeLabel(cls.grade)} مجاز/واجد شرایط نیست (${cls.label}).`,
        classId: cls.id,
        teacherId: teacher.id,
        slotKeys: [key],
      })
    }
  }

  // --- بار تدریس و سقف‌ها --------------------------------------------------------
  const workloads: TeacherWorkload[] = []
  for (const teacherId of plan.teacherIds) {
    const teacher = teacherMap.get(teacherId)
    if (!teacher) continue
    const mine = plan.slots.filter((s) => s.teacherId === teacherId)
    const daily = Array.from({ length: dayCount }, (_, day) => mine.filter((s) => s.dayIndex === day).length)
    const maxWeekly = teacher.maxWeeklyHours != null ? Math.floor(teacher.maxWeeklyHours) : null
    const maxDaily = teacher.maxDailyHours ?? null
    const overWeekly = maxWeekly !== null && mine.length > maxWeekly
    const overDaily = maxDaily !== null && daily.some((count) => count > maxDaily)
    workloads.push({ teacherId, weekly: mine.length, daily, maxWeekly, maxDaily, overWeekly, overDaily })

    const keysOf = (list: TeachingSlot[]): string[] => list.map((s) => slotKey(s.classId, s.dayIndex, s.periodIndex))
    if (overWeekly) {
      addIssue({
        id: `weekly-${teacherId}`,
        type: 'teacher-weekly-limit',
        severity: 'warning',
        message: `${teacher.name}: ${mine.length} ساعت هفتگی از سقف ${maxWeekly} بیشتر است.`,
        teacherId,
        slotKeys: keysOf(mine),
      })
    }
    if (maxDaily !== null) {
      daily.forEach((count, day) => {
        if (count <= maxDaily) return
        addIssue({
          id: `daily-${teacherId}-${day}`,
          type: 'teacher-daily-limit',
          severity: 'warning',
          message: `${teacher.name}: ${count} ساعت در ${WEEK_DAYS[day]} از سقف روزانه ${maxDaily} بیشتر است.`,
          teacherId,
          slotKeys: keysOf(mine.filter((s) => s.dayIndex === day)),
        })
      })
    }
  }

  // --- درس‌های بدون معلم ---------------------------------------------------------
  const noTeacherGroups = new Map<string, TeachingSlot[]>()
  for (const slot of plan.slots) {
    if (slot.teacherId) continue
    const key = `${slot.classId}|${slot.courseId}`
    noTeacherGroups.set(key, [...(noTeacherGroups.get(key) ?? []), slot])
  }
  for (const [key, group] of noTeacherGroups) {
    const cls = classMap.get(group[0].classId)
    addIssue({
      id: `noteacher-${key}`,
      type: 'no-teacher',
      severity: 'warning',
      message: `${cls?.label ?? group[0].classId}: درس «${courseName(group[0].courseId)}» (${group.length} ساعت) معلم ندارد.`,
      classId: group[0].classId,
      slotKeys: group.map((s) => slotKey(s.classId, s.dayIndex, s.periodIndex)),
    })
  }

  // --- کسری / اضافه نسبت به curriculum ---------------------------------------------
  const diffs: CurriculumDiff[] = []
  for (const cls of plan.classes) {
    const needs = plan.curriculum[cls.grade] ?? {}
    const placedByCourse = new Map<string, TeachingSlot[]>()
    for (const slot of plan.slots) {
      if (slot.classId !== cls.id) continue
      placedByCourse.set(slot.courseId, [...(placedByCourse.get(slot.courseId) ?? []), slot])
    }
    const courseIds = new Set([...Object.keys(needs), ...placedByCourse.keys()])
    for (const courseId of courseIds) {
      const required = hoursToUnits(needs[courseId] ?? 0)
      const placedSlots = placedByCourse.get(courseId) ?? []
      const diff = placedSlots.length - required
      diffs.push({ classId: cls.id, courseId, required, placed: placedSlots.length, diff })
      if (diff === 0) continue
      addIssue({
        id: `hours-${cls.id}-${courseId}`,
        type: diff < 0 ? 'hours-shortage' : 'hours-excess',
        severity: 'warning',
        message:
          diff < 0
            ? `${cls.label}: درس «${courseName(courseId)}» ${Math.abs(diff)} ساعت کسری دارد (${placedSlots.length} از ${required}).`
            : `${cls.label}: درس «${courseName(courseId)}» ${diff} ساعت اضافه دارد (${placedSlots.length} از ${required}).`,
        classId: cls.id,
        slotKeys: placedSlots.map((s) => slotKey(s.classId, s.dayIndex, s.periodIndex)),
      })
    }
  }

  issues.sort((a, b) => Number(b.severity === 'error') - Number(a.severity === 'error') || a.message.localeCompare(b.message, 'fa'))
  return { issues, flagged, workloads, diffs }
}
