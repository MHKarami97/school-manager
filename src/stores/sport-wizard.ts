import { defineStore } from 'pinia'
import type { SportWizardState, ShiftId, LevelId } from '../types'
import { cloneDefaultShiftConfigs } from '../config/schedule-defaults.config'

const STORAGE_KEY = 'school-manager-sport-wizard-state'

function createInitialState(): SportWizardState {
  return {
    step: 1,
    levelId: null,
    selectedGrades: [],
    classesPerGrade: {},
    shiftId: 'morning',
    shiftConfigs: cloneDefaultShiftConfigs(),
    selectedTeacherIds: [],
    selectedFacilityIds: [],
    updatedAt: Date.now(),
  }
}

export const useSportWizardStore = defineStore('sportWizard', {
  state: (): SportWizardState => createInitialState(),

  getters: {
    hasInProgressSession(): boolean {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw) as SportWizardState
        return !!parsed.levelId && parsed.step > 1
      } catch {
        return false
      }
    },
  },

  actions: {
    persist(): void {
      this.updatedAt = Date.now()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },

    restore(): boolean {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw) as SportWizardState
        this.$patch(parsed)
        return true
      } catch {
        return false
      }
    },

    reset(): void {
      this.$patch(createInitialState())
      localStorage.removeItem(STORAGE_KEY)
    },

    goToStep(step: number): void {
      this.step = step
      this.persist()
    },
    nextStep(): void {
      this.step += 1
      this.persist()
    },
    prevStep(): void {
      this.step = Math.max(1, this.step - 1)
      this.persist()
    },

    setLevel(levelId: LevelId): void {
      this.levelId = levelId
      this.selectedGrades = []
      this.classesPerGrade = {}
      this.persist()
    },

    setSelectedGrades(grades: number[]): void {
      this.selectedGrades = grades
      for (const grade of grades) {
        if (!(grade in this.classesPerGrade)) this.classesPerGrade[grade] = 1
      }
      this.persist()
    },

    setClassesForGrade(grade: number, count: number): void {
      this.classesPerGrade = { ...this.classesPerGrade, [grade]: Math.max(1, count) }
      this.persist()
    },

    setShiftId(shiftId: ShiftId): void {
      this.shiftId = shiftId
      this.persist()
    },

    setSelectedTeacherIds(ids: string[]): void {
      this.selectedTeacherIds = ids
      this.persist()
    },

    setSelectedFacilityIds(ids: string[]): void {
      this.selectedFacilityIds = ids
      this.persist()
    },
  },
})
