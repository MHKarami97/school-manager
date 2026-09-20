import { defineStore } from 'pinia'
import type { WizardState, ShiftId, ShiftTimeConfig, LessonCell, Audience, LevelId } from '@/types'
import { cloneDefaultShiftConfigs } from '@/config/schedule-defaults.config'

const STORAGE_KEY = 'school-manager:wizard-state'

function createInitialState(): WizardState {
  return {
    step: 1,
    audience: null,
    schoolName: '',
    levelId: null,
    selectedGrades: [],
    shiftId: 'morning',
    shiftConfigs: cloneDefaultShiftConfigs(),
    teacherSelections: {},
    lockedSportCells: {},
    updatedAt: Date.now(),
  }
}

export const useWizardStore = defineStore('wizard', {
  state: (): WizardState => createInitialState(),
  getters: {
    hasInProgressSession(): boolean {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw) as WizardState
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
        const parsed = JSON.parse(raw) as WizardState
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
    setAudience(audience: Audience): void {
      this.audience = audience
      this.persist()
    },
    setSchoolName(name: string): void {
      this.schoolName = name
      this.persist()
    },
    setLevel(levelId: LevelId): void {
      this.levelId = levelId
      this.selectedGrades = []
      this.persist()
    },
    setSelectedGrades(grades: number[]): void {
      this.selectedGrades = grades
      this.persist()
    },
    setShiftId(shiftId: ShiftId): void {
      this.shiftId = shiftId
      this.persist()
    },
    updateShiftConfig(shiftId: ShiftId, patch: Partial<ShiftTimeConfig>): void {
      this.shiftConfigs = {
        ...this.shiftConfigs,
        [shiftId]: { ...this.shiftConfigs[shiftId], ...patch },
      }
      this.persist()
    },
    setTeacherSelection(key: string, teacherIds: string[]): void {
      this.teacherSelections = { ...this.teacherSelections, [key]: teacherIds }
      this.persist()
    },
    setLockedSportCells(grade: number, cells: LessonCell[]): void {
      this.lockedSportCells = { ...this.lockedSportCells, [grade]: cells }
      this.persist()
    },
  },
})
