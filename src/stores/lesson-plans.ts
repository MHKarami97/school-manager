import { defineStore } from 'pinia'
import type { LessonPlan, LessonPlanSnapshot, LevelId } from '../types'
import { getAllLessonPlans, putLessonPlan, deleteLessonPlan } from '../db/db'
import { toLessonPlanSnapshot } from '../config/lesson-plan.config'

interface LessonPlansState {
  items: LessonPlan[]
  isLoaded: boolean
}

export const useLessonPlansStore = defineStore('lessonPlans', {
  state: (): LessonPlansState => ({
    items: [],
    isLoaded: false,
  }),

  getters: {
    byId: (state) => (id: string) => state.items.find((p) => p.id === id),
    byTeacher: (state) => (teacherId: string) =>
      state.items.filter((p) => p.teacherId === teacherId),
    byGrade: (state) => (grade: number) => state.items.filter((p) => p.grade === grade),
    byWeek: (state) => (weekNumber: number) =>
      state.items.filter((p) => p.weekNumber === weekNumber),
  },

  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllLessonPlans()
      this.isLoaded = true
    },

    /**
     * ذخیره‌ی طرح درس. اگر رکورد از قبل وجود داشته باشد، وضعیت فعلیِ آن
     * (قبل از اعمال تغییرات) به history اضافه می‌شود تا نسخه‌بندی حفظ شود.
     */
    async save(plan: LessonPlan): Promise<void> {
      const existingIndex = this.items.findIndex((p) => p.id === plan.id)
      const now = Date.now()

      if (existingIndex >= 0) {
        const previous = this.items[existingIndex]
        const previousSnapshot: LessonPlanSnapshot = toLessonPlanSnapshot(previous)
        const nextVersionNumber = (previous.history.at(-1)?.versionNumber ?? 0) + 1

        plan.history = [
          ...previous.history,
          { versionNumber: nextVersionNumber, savedAt: now, snapshot: previousSnapshot },
        ]
        plan.createdAt = previous.createdAt
        plan.updatedAt = now
        this.items[existingIndex] = plan
      } else {
        plan.history = plan.history ?? []
        plan.createdAt = plan.createdAt || now
        plan.updatedAt = now
        this.items.unshift(plan)
      }

      await putLessonPlan(plan)
    },

    /** ایجاد یک طرح درس جدید (پیش‌نویس خام) و ذخیره‌ی آن */
    async createDraft(input: {
      teacherId: string
      courseId: string
      grade: number
      levelId: LevelId
    }): Promise<LessonPlan> {
      const now = Date.now()
      const plan: LessonPlan = {
        id: crypto.randomUUID(),
        title: '',
        teacherId: input.teacherId,
        courseId: input.courseId,
        grade: input.grade,
        levelId: input.levelId,
        sessionDate: '',
        weekNumber: 1,
        objectives: '',
        teachingMethod: '',
        resources: '',
        assessment: '',
        blocks: [],
        status: 'draft',
        history: [],
        createdAt: now,
        updatedAt: now,
      }
      this.items.unshift(plan)
      await putLessonPlan(plan)
      return plan
    },

    /**
     * کپیِ یک طرح درس موجود به‌عنوان قالب برای جلسه‌ی بعد.
     * همه‌ی محتوا کپی می‌شود اما تاریخ/وضعیت و history از نو شروع می‌شوند.
     */
    async duplicateAsTemplate(sourceId: string): Promise<LessonPlan | null> {
      const source = this.byId(sourceId)
      if (!source) return null

      const now = Date.now()
      const duplicated: LessonPlan = {
        ...toLessonPlanSnapshot(source),
        id: crypto.randomUUID(),
        sessionDate: '',
        status: 'draft',
        history: [],
        createdAt: now,
        updatedAt: now,
      }
      this.items.unshift(duplicated)
      await putLessonPlan(duplicated)
      return duplicated
    },

    async remove(id: string): Promise<void> {
      this.items = this.items.filter((p) => p.id !== id)
      await deleteLessonPlan(id)
    },
  },
})
