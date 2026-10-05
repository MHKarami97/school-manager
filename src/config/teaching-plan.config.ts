import type { LevelId, TeacherBlockedSlot, TeachingClass, TeachingPlan } from '../types'
import { cloneDefaultShiftConfigs } from './schedule-defaults.config'
import { getCurriculumForGrade } from './curriculum.config'
import { gradeLabel } from './levels.config'
import { hoursToUnits } from '../utils/teaching-rules'

export function classIdFor(grade: number, index: number): string {
  return `${grade}-${index}`
}

/** شناسه‌ی کلاس‌ها ثابت و قابل پیش‌بینی است تا با تغییر تعداد کلاس‌ها، برنامه‌ی بقیه‌ی کلاس‌ها حفظ شود. */
export function buildTeachingClasses(grades: number[], classCounts: Record<number, number>): TeachingClass[] {
  const list: TeachingClass[] = []
  for (const grade of [...grades].sort((a, b) => a - b)) {
    const count = classCounts[grade] ?? 1
    for (let i = 0; i < count; i += 1) {
      list.push({ id: classIdFor(grade, i), grade, label: `${gradeLabel(grade)} - ${i + 1}` })
    }
  }
  return list
}

/** curriculum پیش‌فرض یک پایه از سرفصل موجود پروژه؛ ساعت‌ها به زنگ صحیح گرد می‌شوند. */
export function defaultCurriculumForGrade(levelId: LevelId, grade: number): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [courseId, hours] of Object.entries(getCurriculumForGrade(levelId, grade))) {
    const units = hoursToUnits(hours)
    if (units > 0) result[courseId] = units
  }
  return result
}

export function createEmptyTeachingPlan(): TeachingPlan {
  const now = Date.now()
  const shiftConfigs = cloneDefaultShiftConfigs()
  return {
    id: crypto.randomUUID(),
    title: '',
    levelId: 'lowersecondary',
    grades: [],
    classCounts: {},
    classes: [],
    shiftId: 'morning',
    shiftConfig: shiftConfigs.morning,
    effectiveFrom: '',
    effectiveTo: '',
    curriculum: {},
    teacherIds: [],
    slots: [],
    generatedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyBlockedSlot(): TeacherBlockedSlot {
  return {
    id: crypto.randomUUID(),
    dayIndex: 0,
    startTime: '10:00',
    endTime: '11:00',
    reason: '',
    fromDate: '',
    toDate: '',
  }
}

export const ISSUE_SEVERITY_CLASSES = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300',
} as const
