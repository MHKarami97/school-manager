import { defineStore } from 'pinia'
import type { DailyChallenge, GameHistorySession, StudentGameProfile } from '@/types'
import { getAllGameProfiles, putGameProfile, deleteGameProfile } from '@/db/db'
import { GAME_MEDALS, getDailyChallenges } from '@/config/game-seasons.config'

const ACTIVE_PROFILE_STORAGE_KEY = 'school-manager:active-student-profile'

export const useGameProfilesStore = defineStore('gameProfiles', {
  state: () => ({
    profiles: [] as StudentGameProfile[],
    activeProfileId: localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || '',
    dailyChallenges: [] as DailyChallenge[],
    isLoaded: false,
  }),
  getters: {
    activeProfile: (state): StudentGameProfile | null => {
      if (!state.profiles.length) return null
      return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0]
    },
    unlockedMedalsCount: (state): number => {
      const active = state.profiles.find((p) => p.id === state.activeProfileId)
      return active ? active.unlockedMedalIds.length : 0
    },
    totalMedalsCount: (): number => GAME_MEDALS.length,
  },
  actions: {
    async load(): Promise<void> {
      if (this.isLoaded) return
      try {
        const fromDb = await getAllGameProfiles()
        if (fromDb.length > 0) {
          this.profiles = fromDb
        } else {
          // ایجاد اولین پروفایل پیش‌فرض در صورت خالی بودن
          const defaultProfile: StudentGameProfile = {
            id: crypto.randomUUID(),
            name: 'دانش‌آموز پویا',
            grade: 4,
            avatar: '🦁',
            colorTheme: '#06b6d4',
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            totalScore: 0,
            currentStreak: 1,
            lastPlayedDate: new Date().toISOString().slice(0, 10),
            unlockedMedalIds: [],
            completedChallengeIds: [],
            stageProgress: {},
          }
          this.profiles = [defaultProfile]
          await putGameProfile(defaultProfile)
        }

        if (!this.activeProfileId || !this.profiles.some((p) => p.id === this.activeProfileId)) {
          this.activeProfileId = this.profiles[0].id
          localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, this.activeProfileId)
        }

        this.refreshDailyChallenges()
        this.isLoaded = true
      } catch (e) {
        console.warn('Game profiles could not be loaded from DB:', e)
      }
    },

    setActiveProfile(id: string): void {
      if (this.profiles.some((p) => p.id === id)) {
        this.activeProfileId = id
        localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, id)
        this.refreshDailyChallenges()
      }
    },

    async createProfile(name: string, grade: number, avatar = '🌟', colorTheme = '#8b5cf6'): Promise<StudentGameProfile> {
      const newProfile: StudentGameProfile = {
        id: crypto.randomUUID(),
        name: name.trim() || 'دانش‌آموز',
        grade,
        avatar,
        colorTheme,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        totalScore: 0,
        currentStreak: 1,
        lastPlayedDate: new Date().toISOString().slice(0, 10),
        unlockedMedalIds: [],
        completedChallengeIds: [],
        stageProgress: {},
      }
      this.profiles.unshift(newProfile)
      this.setActiveProfile(newProfile.id)
      await putGameProfile(newProfile)
      return newProfile
    },

    async updateProfile(id: string, updates: Partial<StudentGameProfile>): Promise<void> {
      const idx = this.profiles.findIndex((p) => p.id === id)
      if (idx >= 0) {
        this.profiles[idx] = { ...this.profiles[idx], ...updates, lastActiveAt: Date.now() }
        await putGameProfile(this.profiles[idx])
      }
    },

    async removeProfile(id: string): Promise<void> {
      if (this.profiles.length <= 1) {
        alert('حداقل یک پروفایل دانش‌آموز باید در سیستم وجود داشته باشد.')
        return
      }
      this.profiles = this.profiles.filter((p) => p.id !== id)
      if (this.activeProfileId === id) {
        this.activeProfileId = this.profiles[0].id
        localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, this.activeProfileId)
      }
      await deleteGameProfile(id)
    },

    refreshDailyChallenges(): void {
      const todayStr = new Date().toISOString().slice(0, 10)
      const baseChallenges = getDailyChallenges(todayStr)
      const active = this.activeProfile
      if (active) {
        this.dailyChallenges = baseChallenges.map((c) => ({
          ...c,
          isCompleted: active.completedChallengeIds.includes(c.id),
        }))
      } else {
        this.dailyChallenges = baseChallenges
      }
    },

    // پردازش مأموریت پایان‌یافته و اهدای مدال‌ها، چالش‌ها و امتیازات
    async recordMissionOutcome(session: GameHistorySession): Promise<string[]> {
      const active = this.activeProfile
      if (!active) return []

      const newlyUnlockedMedals: string[] = []
      const todayStr = new Date().toISOString().slice(0, 10)

      // ۱. ثبت امتیاز
      active.totalScore += session.score
      active.lastActiveAt = Date.now()

      // ۲. محاسبه زنجیره روزهای بازی (Streak)
      if (active.lastPlayedDate !== todayStr) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        if (active.lastPlayedDate === yesterday) {
          active.currentStreak += 1
        } else {
          active.currentStreak = 1
        }
        active.lastPlayedDate = todayStr
      }

      // ۳. بررسی شرایط آنلاک مدال‌ها
      const hasMedal = (id: string) => active.unlockedMedalIds.includes(id)

      // مدال دقت ۱۰۰٪
      if (!hasMedal('medal-accuracy-100') && session.totalQuestionsAnswered >= 4 && session.accuracyPercentage === 100) {
        active.unlockedMedalIds.push('medal-accuracy-100')
        newlyUnlockedMedals.push('medal-accuracy-100')
      }

      // مدال سرعت زیر ۳ ثانیه
      if (!hasMedal('medal-speed-reflex') && session.answers.some((a) => a.isCorrect && a.durationSeconds <= 3.0)) {
        active.unlockedMedalIds.push('medal-speed-reflex')
        newlyUnlockedMedals.push('medal-speed-reflex')
      }

      // مدال پیاپی ۵ سوال درست
      if (!hasMedal('medal-wisdom-streak')) {
        let maxStreak = 0
        let curStreak = 0
        for (const a of session.answers) {
          if (a.isCorrect) {
            curStreak++
            if (curStreak > maxStreak) maxStreak = curStreak
          } else {
            curStreak = 0
          }
        }
        if (maxStreak >= 5) {
          active.unlockedMedalIds.push('medal-wisdom-streak')
          newlyUnlockedMedals.push('medal-wisdom-streak')
        }
      }

      // مدال تسلط چندگانه (۳ درس همزمان)
      if (!hasMedal('medal-polymath') && session.selectedCourses && session.selectedCourses.length >= 3) {
        active.unlockedMedalIds.push('medal-polymath')
        newlyUnlockedMedals.push('medal-polymath')
      }

      // مدال استمرار ۳ روزه
      if (!hasMedal('medal-daily-streak-3') && active.currentStreak >= 3) {
        active.unlockedMedalIds.push('medal-daily-streak-3')
        newlyUnlockedMedals.push('medal-daily-streak-3')
      }

      // ۴. بررسی چالش‌های روزانه
      for (const challenge of this.dailyChallenges) {
        if (!challenge.isCompleted) {
          let progressCount = challenge.currentCount
          if (challenge.type === 'questions') {
            progressCount += session.correctAnswersCount
          } else if (challenge.type === 'waves') {
            progressCount += session.wavesCleared
          } else if (challenge.type === 'speed') {
            if (session.answers.some((a) => a.isCorrect && a.durationSeconds <= 4.0)) {
              progressCount += 1
            }
          }

          challenge.currentCount = progressCount
          if (progressCount >= challenge.targetCount) {
            challenge.isCompleted = true
            if (!active.completedChallengeIds.includes(challenge.id)) {
              active.completedChallengeIds.push(challenge.id)
              active.totalScore += challenge.rewardScore
            }
          }
        }
      }

      // ۵. ثبت پیشرفت مرحله (در صورت وجود مرحله)
      if (session.stageId) {
        const currentBest = active.stageProgress[session.stageId]
        const stars = session.accuracyPercentage >= 90 ? 3 : session.accuracyPercentage >= 65 ? 2 : 1
        if (!currentBest || session.score > currentBest.bestScore) {
          active.stageProgress[session.stageId] = {
            stars,
            bestScore: session.score,
            clearedAt: Date.now(),
          }
        }
      }

      await putGameProfile(active)
      return newlyUnlockedMedals
    },
  },
})
