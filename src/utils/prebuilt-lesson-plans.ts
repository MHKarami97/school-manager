import type { LessonPlan, LevelId } from '@/types'

let cachedPlans: LessonPlan[] | null = null

export interface PrebuiltPlanFilter {
  levelId?: LevelId | ''
  grade?: number | ''
  courseId?: string
  searchText?: string
}

/** بارگذاری طرح درس‌های آماده از فایل‌های استاتیک پروژه */
export async function fetchAllPrebuiltLessonPlans(): Promise<LessonPlan[]> {
  if (cachedPlans) return cachedPlans
  try {
    const res = await fetch('/data/lesson-plans/all-lesson-plans.json')
    if (!res.ok) throw new Error('خطا در دریافت فایل طرح درس‌های آماده')
    const data: LessonPlan[] = await res.json()
    cachedPlans = data
    return data
  } catch (err) {
    console.error('Failed to load prebuilt lesson plans:', err)
    return []
  }
}

/** بارگذاری طرح درس‌های آماده یک پایه خاص */
export async function fetchPrebuiltLessonPlansByGrade(grade: number): Promise<LessonPlan[]> {
  try {
    const res = await fetch(`/data/lesson-plans/grade-${grade}.json`)
    if (!res.ok) {
      const all = await fetchAllPrebuiltLessonPlans()
      return all.filter((p) => p.grade === grade)
    }
    const data: LessonPlan[] = await res.json()
    return data
  } catch {
    const all = await fetchAllPrebuiltLessonPlans()
    return all.filter((p) => p.grade === grade)
  }
}

/** فیلتر کردن طرح درس‌های آماده بر اساس مقطع، پایه، درس یا متن جست‌وجو */
export function filterPrebuiltPlans(plans: LessonPlan[], filters: PrebuiltPlanFilter): LessonPlan[] {
  const query = filters.searchText?.trim().toLowerCase()
  return plans.filter((plan) => {
    if (filters.levelId && plan.levelId !== filters.levelId) return false
    if (filters.grade && plan.grade !== filters.grade) return false
    if (filters.courseId && plan.courseId !== filters.courseId) return false
    if (!query) return true
    return (
      plan.title.toLowerCase().includes(query) ||
      (plan.chapter && plan.chapter.toLowerCase().includes(query)) ||
      (plan.lessonName && plan.lessonName.toLowerCase().includes(query)) ||
      plan.objectives.toLowerCase().includes(query) ||
      plan.teachingMethod.toLowerCase().includes(query)
    )
  })
}
