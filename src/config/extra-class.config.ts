import type { Enrollment, ExtraClass, ExtraClassType } from '../types'

export const EXTRA_CLASS_TYPE_LABELS: Record<ExtraClassType, string> = {
  reinforcement: 'تقویتی',
  extracurricular: 'فوق‌برنامه',
}

export const EXTRA_CLASS_TYPES: ExtraClassType[] = ['reinforcement', 'extracurricular']

export const EXTRA_CLASS_TYPE_BADGE_CLASSES: Record<ExtraClassType, string> = {
  reinforcement: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  extracurricular: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export function createEmptyExtraClass(): ExtraClass {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    type: 'reinforcement',
    relatedCourseId: null,
    teacherId: null,
    capacity: 15,
    dayIndexes: [],
    startTime: '14:00',
    endTime: '15:30',
    startDate: '',
    endDate: '',
    allowedGrades: [],
    cost: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyEnrollment(extraClassId: string, studentId: string, waitlisted: boolean): Enrollment {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    extraClassId,
    studentId,
    enrollmentDate: '',
    status: 'active',
    waitlisted,
    createdAt: now,
    updatedAt: now,
  }
}
