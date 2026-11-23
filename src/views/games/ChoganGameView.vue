<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { useGameHistoryStore } from '@/stores/game-history'
import { useGameProfilesStore } from '@/stores/game-profiles'
import { useThemeStore } from '@/stores/theme'
import { DEFAULT_CURRICULUM_QUESTIONS, type EducationalQuestion } from '@/config/default-questions.config'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { sfx } from '@/utils/sound-effects'
import { getCurrentSeasonKey, MOTIVATIONAL_QUOTES } from '@/config/game-seasons.config'
import { getChoganGameById, type ChoganGame } from '@/config/chogan-games.config'
import type { DifficultyLevel, GameHistorySession, QuestionAnswerRecord } from '@/types'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import GameProfileBar from '@/components/games/GameProfileBar.vue'
import GameJourneyModal from '@/components/games/GameJourneyModal.vue'
import GameMedalsModal from '@/components/games/GameMedalsModal.vue'
import GameAnalyticsModal from '@/components/games/GameAnalyticsModal.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const profilesStore = useGameProfilesStore()
const questionsStore = useQuestionsStore()
const gameHistoryStore = useGameHistoryStore()

// دریافت اطلاعات بازی جاری
const gameId = computed(() => String(route.params.id || ''))
const game = computed<ChoganGame | undefined>(() => getChoganGameById(gameId.value))

// ارجاع به iframe بوم بازی
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isIframeLoaded = ref(false)
const isFullscreen = ref(false)
const questionCardRef = ref<HTMLElement | null>(null)
const isQuestionCardHighlighted = ref(false)

// مودال‌های پیشرفت
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

// --- سیستم حرکات بر پایه پاسخ صحیح (Move Energy System) ---
const movesLeft = ref<number>(3) // ۳ حرکت آغازین برای شروع
const totalMovesMade = ref<number>(0)
const streak = ref<number>(0)

// --- سیستم سوالات و چالش دانایی ---
const selectedGrade = ref<number>(4)
const selectedCourseId = ref<string>('math')
const extraCurriculumQuestions = ref<EducationalQuestion[]>([])

// آمار سشن بازی جاری
const sessionStartTime = ref(Date.now())
const sessionAnswers = ref<QuestionAnswerRecord[]>([])
const bonusScore = ref(0)
const hasDoubleMultiplier = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)

// وضعیت چالش سوال درسی
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnswered = ref(false)
const wasCorrect = ref(false)
const questionStartTime = ref(Date.now())

// وضعیت مودال پایان مأموریت و ثبت در کارنامه
const showFinishModal = ref(false)
const finishRewardMedals = ref<string[]>([])

// دروس قابل انتخاب برای هر پایه
const availableCourses = computed(() => {
  const g = selectedGrade.value
  if (g <= 6) {
    return BASE_COURSES.filter((c) =>
      ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies', 'thinking-research', 'work-tech'].includes(c.id),
    )
  }
  if (g <= 9) {
    return BASE_COURSES.filter((c) =>
      ['math', 'science', 'persian-reading', 'arabic', 'english', 'religious-education', 'social-studies', 'work-tech', 'defense-readiness'].includes(c.id),
    )
  }
  return BASE_COURSES.filter((c) =>
    ['math', 'physics', 'chemistry', 'biology', 'persian-reading', 'arabic', 'english', 'religious-education', 'geography', 'history', 'defense-readiness', 'geology', 'environment', 'health'].includes(c.id),
  )
})

// بارگذاری بانک سوالات جامع درسی
async function loadQuestionBank(): Promise<void> {
  try {
    const grade = selectedGrade.value || 4
    let res = await fetch(`/data/questions/grade-${grade}.json`)
    if (!res.ok) {
      if (grade <= 6) {
        res = await fetch('/data/questions/elementary-curriculum-questions.json')
      } else if (grade <= 9) {
        res = await fetch('/data/questions/lower-secondary-curriculum-questions.json')
      } else {
        res = await fetch('/data/questions/upper-secondary-curriculum-questions.json')
      }
    }
    if (res.ok) {
      extraCurriculumQuestions.value = await res.json()
    }
  } catch (e) {
    console.warn('Curriculum questions failed to load:', e)
  }
}

// تجمیع کل بانک سوالات
const allQuestions = computed<EducationalQuestion[]>(() => {
  const existingTexts = new Set(questionsStore.items.map((q) => q.text))
  const dbItems: EducationalQuestion[] = questionsStore.items.map((q) => ({
    ...q,
    explanation:
      (q as unknown as { explanation?: string }).explanation ||
      'با مطالعه و دقت در کتاب درسی به جواب صحیح می‌رسید.',
  }))
  const extras = extraCurriculumQuestions.value.filter((q) => !existingTexts.has(q.text))
  return [...DEFAULT_CURRICULUM_QUESTIONS, ...extras, ...dbItems]
})

// سوالات واجد شرایط با پایه و درس انتخابی
const eligibleQuestions = computed(() => {
  return allQuestions.value.filter((q) => {
    if (q.grade !== selectedGrade.value) return false
    if (selectedCourseId.value && q.courseId !== selectedCourseId.value) return false
    return true
  })
})

// همگام‌سازی پایه با پروفایل دانش‌آموز فعال
watch(
  () => profilesStore.activeProfile?.grade,
  (grade) => {
    if (grade) {
      selectedGrade.value = grade
    }
  },
  { immediate: true },
)

watch(selectedGrade, () => {
  loadQuestionBank().then(() => {
    pickNextQuestion()
  })
  if (!availableCourses.value.some((c) => c.id === selectedCourseId.value)) {
    selectedCourseId.value = availableCourses.value[0]?.id || 'math'
  }
})

watch(selectedCourseId, () => {
  pickNextQuestion()
})

// انتخاب سوال جدید از بانک
function pickNextQuestion(): void {
  const pool = eligibleQuestions.value.length > 0 ? eligibleQuestions.value : allQuestions.value
  if (!pool.length) return

  let nextQ = pool[Math.floor(Math.random() * pool.length)]
  if (pool.length > 1 && currentQuestion.value && nextQ.id === currentQuestion.value.id) {
    nextQ = pool[Math.floor(Math.random() * pool.length)]
  }

  currentQuestion.value = nextQ
  selectedOptionIndex.value = null
  hasAnswered.value = false
  wasCorrect.value = false
  questionStartTime.value = Date.now()
}

// ثبت پاسخ به سوال و اهدای ۵ حرکت به بازی
async function submitAnswer(optionIndex: number): Promise<void> {
  if (hasAnswered.value || !currentQuestion.value) return

  selectedOptionIndex.value = optionIndex
  hasAnswered.value = true
  const durationSeconds = Number(((Date.now() - questionStartTime.value) / 1000).toFixed(1))
  const isRight = String(optionIndex) === String(currentQuestion.value.correctAnswer)
  wasCorrect.value = isRight

  if (isRight) {
    sfx.playCorrect()
    correctCount.value += 1
    streak.value += 1
    const addedPoints = hasDoubleMultiplier.value ? 100 : 50
    bonusScore.value += addedPoints

    // اهدای ۵ حرکت جدید در ازای پاسخ درست
    movesLeft.value += 5

    if (streak.value >= 3) {
      hasDoubleMultiplier.value = true
    }

    // اهدای فوری امتیاز و سکه به پروفایل دانش‌آموز
    if (profilesStore.activeProfile) {
      profilesStore.activeProfile.xp += 30
      profilesStore.activeProfile.coins += 20
      profilesStore.activeProfile.totalScore += addedPoints
      await profilesStore.saveProfiles()
    }
  } else {
    sfx.playIncorrect()
    wrongCount.value += 1
    streak.value = 0
    hasDoubleMultiplier.value = false
  }

  // ثبت در کارنامه تحلیلی جلسه
  const record: QuestionAnswerRecord = {
    questionId: currentQuestion.value.id,
    questionText: currentQuestion.value.text,
    courseId: currentQuestion.value.courseId,
    grade: currentQuestion.value.grade,
    difficulty: currentQuestion.value.difficulty,
    selectedOption: currentQuestion.value.options[optionIndex] || '',
    correctOption: currentQuestion.value.options[Number(currentQuestion.value.correctAnswer)] || '',
    isCorrect: isRight,
    durationSeconds,
    timestamp: Date.now(),
  }
  sessionAnswers.value.push(record)
}

// توجه دادن به کارت سوال در زمان اتمام حرکات
function triggerNeedQuestionNotice(): void {
  sfx.playIncorrect()
  isQuestionCardHighlighted.value = true
  setTimeout(() => {
    isQuestionCardHighlighted.value = false
  }, 1200)

  if (questionCardRef.value && window.innerWidth < 1024) {
    questionCardRef.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// مصرف ۱ حرکت در ازای تعامل کاربر در بازی
let lastMoveTimestamp = 0
function handleIframeInputCapture(e: Event): void {
  const target = e.target as HTMLElement | null
  // از مسدود کردن دکمه‌های کنترل نوار ابزار یا دیالوگ‌ها صرف‌نظر می‌شود
  if (
    target &&
    target.closest &&
    (target.closest('.ch-gamebar') ||
      target.closest('.ch-modal') ||
      target.closest('.ch-scrim') ||
      target.closest('.ch-toast') ||
      target.closest('[data-fs]'))
  ) {
    return
  }

  // اگر حرکتی نیست، رویداد را مسدود کن
  if (movesLeft.value <= 0) {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    triggerNeedQuestionNotice()
    return
  }

  // مصرف حرکت با کنترل سرعت برای ژست‌ها
  const now = Date.now()
  if (now - lastMoveTimestamp > 500) {
    lastMoveTimestamp = now
    consumeMove()
  }
}

function handleIframeKeyCapture(e: KeyboardEvent): void {
  const isActionKey =
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'z', 'x', 'c'].includes(e.key) ||
    e.code.startsWith('Arrow')
  if (!isActionKey) return

  if (movesLeft.value <= 0) {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    triggerNeedQuestionNotice()
    return
  }

  const now = Date.now()
  if (now - lastMoveTimestamp > 500) {
    lastMoveTimestamp = now
    consumeMove()
  }
}

function consumeMove(): void {
  if (movesLeft.value > 0) {
    movesLeft.value -= 1
    totalMovesMade.value += 1
    if (movesLeft.value === 0) {
      if (!currentQuestion.value || hasAnswered.value) {
        pickNextQuestion()
      }
    }
  }
}

// پل ارتباطی و اتصال رویدادهای آی‌فریم
function attachIframeBridge(): void {
  const iframe = iframeRef.value
  if (!iframe || !iframe.contentDocument || !iframe.contentWindow) return

  const doc = iframe.contentDocument
  const win = iframe.contentWindow

  try {
    // اعمال تم دارک/لایت
    const isDark =
      themeStore.mode === 'dark' ||
      (themeStore.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    doc.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    doc.documentElement.lang = 'fa'
    doc.documentElement.dir = 'rtl'

    if ((win as unknown as { Chogan?: { setLang?: (l: string) => void; setTheme?: (t: string) => void } }).Chogan) {
      const c = (win as unknown as { Chogan: { setLang?: (l: string) => void; setTheme?: (t: string) => void } }).Chogan
      if (c.setLang) c.setLang('fa')
      if (c.setTheme) c.setTheme(isDark ? 'dark' : 'light')
    }

    // هدایت اسکرول ماوس به پنجره اصلی سایت
    win.removeEventListener('wheel', handleIframeWheel)
    win.addEventListener('wheel', handleIframeWheel, { passive: true })

    // اتصال ناظر فاز Capture برای کنترل حرکات بازی
    doc.removeEventListener('pointerdown', handleIframeInputCapture, true)
    doc.addEventListener('pointerdown', handleIframeInputCapture, true)

    win.removeEventListener('keydown', handleIframeKeyCapture, true)
    win.addEventListener('keydown', handleIframeKeyCapture, true)
  } catch (err) {
    console.warn('Iframe bridge connection:', err)
  }
}

function handleIframeWheel(e: WheelEvent): void {
  window.scrollBy({ top: e.deltaY, left: e.deltaX, behavior: 'auto' })
}

function onIframeLoad(): void {
  isIframeLoaded.value = true
  attachIframeBridge()
}

// تغییر تم با تنظیمات سامانه
watch(
  () => themeStore.mode,
  () => {
    attachIframeBridge()
  },
)

// دکمه تمام‌صفحه بازی
function toggleFullscreen(): void {
  const container = document.getElementById('game-arena-container')
  if (!container) return

  if (!document.fullscreenElement) {
    container.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => {})
  }
}

// بارگذاری مجدد آی‌فریم
function reloadGame(): void {
  if (iframeRef.value) {
    isIframeLoaded.value = false
    iframeRef.value.src = iframeRef.value.src
  }
}

// پایان و ثبت مأموریت در لیگ و کارنامه
async function finishAndRecordMission(): Promise<void> {
  const durationSeconds = Math.max(10, Math.floor((Date.now() - sessionStartTime.value) / 1000))
  const totalQuestions = sessionAnswers.value.length
  const accuracy = totalQuestions > 0 ? Math.round((correctCount.value / totalQuestions) * 100) : 0
  const finalScore = bonusScore.value + (correctCount.value * 30)

  const session: GameHistorySession = {
    id: `chogan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    studentId: profilesStore.activeProfile?.id,
    studentName: profilesStore.activeProfile?.name || 'دانش‌آموز',
    gameType: `chogan-${gameId.value}`,
    gameTitle: game.value?.nameFa || 'بازی دانایی',
    heroId: 'aria',
    heroName: 'قهرمان دانایی',
    grade: selectedGrade.value,
    season: getCurrentSeasonKey(),
    selectedCourses: [selectedCourseId.value],
    startedAt: sessionStartTime.value,
    endedAt: Date.now(),
    totalDurationSeconds: durationSeconds,
    score: finalScore,
    wavesCleared: Math.max(1, correctCount.value),
    shotsFired: totalQuestions,
    shotsHit: correctCount.value,
    accuracyPercentage: accuracy,
    totalQuestionsAnswered: totalQuestions,
    correctAnswersCount: correctCount.value,
    wrongAnswersCount: wrongCount.value,
    answers: [...sessionAnswers.value],
  }

  // ذخیره در تاریخچه ایندکس‌دی‌بی
  await gameHistoryStore.saveGameSession(session)

  // اهدای مدال‌ها و ارتقای پیشرفت فصلی در استور پروفایل
  const newMedals = await profilesStore.recordMissionOutcome(session)
  finishRewardMedals.value = newMedals
  await profilesStore.load()

  sfx.playLevelUp()
  showFinishModal.value = true
}

function handleMissionModalClose(): void {
  showFinishModal.value = false
  router.push('/games')
}

const motivationalQuote = computed(() => {
  if (!MOTIVATIONAL_QUOTES.length) return 'دانایی توانایی است!'
  const idx =
    Math.abs(selectedGrade.value * 7 + (currentQuestion.value ? currentQuestion.value.text.length : 0)) %
    MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[idx].text
})

onMounted(async () => {
  // تنظیم زبان در localStorage قبل از لود آی‌فریم
  try {
    const isDark =
      themeStore.mode === 'dark' ||
      (themeStore.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    localStorage.setItem(
      'chogan.app.settings',
      JSON.stringify({
        lang: 'fa',
        theme: isDark ? 'dark' : 'light',
      }),
    )
  } catch (e) {}

  await loadQuestionBank()
  pickNextQuestion()

  // شنونده پیام پایان بازی از آی‌فریم
  ;(window as unknown as { onChoganGameFinish?: (data: unknown) => void }).onChoganGameFinish = (data: unknown) => {
    const d = (data || {}) as { points?: number; coins?: number; won?: boolean }
    if (d.points) bonusScore.value += d.points
    if (d.won) correctCount.value += 1
    void finishAndRecordMission()
  }
})

onBeforeUnmount(() => {
  delete (window as unknown as { onChoganGameFinish?: unknown }).onChoganGameFinish
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-ink-900 transition-colors duration-200 dark:bg-ink-950 dark:text-ink-100 flex flex-col justify-between" dir="rtl">
    <AppHeader />

    <main class="flex-1 pb-16">
      <!-- نوار پروفایل و وضعیت دانش‌آموز -->
      <section class="border-b border-slate-200 bg-white/70 backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/70">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <GameProfileBar
            @open-journey="showJourneyModal = true"
            @open-medals="showMedalsModal = true"
            @open-analytics="showAnalyticsModal = true"
          />
        </div>
      </section>

      <!-- نوار عنوان بازی و کنترل‌ها -->
      <section class="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <!-- مسیر و عنوان بازی -->
          <div class="flex items-center gap-3">
            <RouterLink
              to="/games"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
              title="بازگشت به باشگاه بازی‌ها"
            >
              ➔
            </RouterLink>

            <div class="flex items-center gap-3">
              <div
                v-if="game"
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl p-2 shadow-inner"
                :style="{ backgroundColor: game.soft || '#eff6ff' }"
              >
                <img :src="game.iconUrl" :alt="game.nameFa" class="h-8 w-8 object-contain" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl font-black text-ink-900 sm:text-2xl dark:text-white">
                    {{ game?.nameFa || 'بازی دانایی' }}
                  </h1>
                  <span v-if="game" class="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {{ game.categoryFa }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-ink-400 mt-0.5">
                  {{ game?.summaryFa || 'بازی آموزشی جذاب همراه با چالش سوالات درسی' }}
                </p>
              </div>
            </div>
          </div>

          <!-- دکمه‌های کنترلی بازی -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- نشانگر حرکات فعال با انیمیشن -->
            <div
              class="flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-black shadow-xs transition-all"
              :class="
                movesLeft > 2
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                  : movesLeft > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200 animate-pulse'
              "
            >
              <span class="text-base">{{ movesLeft > 0 ? '⚡' : '🔒' }}</span>
              <span>{{ movesLeft > 0 ? `${movesLeft} حرکت فعال` : 'حرکات تمام شد' }}</span>
            </div>

            <!-- دکمه ثبت نتیجه در کارنامه -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 cursor-pointer"
              @click="finishAndRecordMission"
            >
              <span>🏆</span>
              <span>ثبت نتیجه در کارنامه</span>
            </button>

            <!-- تمام صفحه -->
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 cursor-pointer"
              title="حالت تمام‌صفحه"
              @click="toggleFullscreen"
            >
              ⛶
            </button>

            <!-- شروع مجدد -->
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 cursor-pointer"
              title="بارگذاری مجدد بازی"
              @click="reloadGame"
            >
              🔄
            </button>
          </div>
        </div>
      </section>

      <!-- بخش اصلی: گرید دو ستونه یکپارچه بازی و چالش دانایی کتاب درسی -->
      <section class="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <!-- ستون اول: میدان بازی (Game Arena) -->
          <div class="lg:col-span-8 flex flex-col gap-3">
            <div
              id="game-arena-container"
              class="relative w-full overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900"
              style="min-height: 580px; height: 75vh;"
            >
              <!-- لودینگ بازی -->
              <div
                v-if="!isIframeLoaded"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-sm dark:bg-ink-950/90"
              >
                <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                <p class="mt-4 text-xs font-bold text-slate-600 dark:text-ink-300">
                  در حال بارگذاری صحنه بازی...
                </p>
              </div>

              <!-- پرده قفل حرکات (Move Lock Overlay) -->
              <div
                v-if="movesLeft <= 0 && isIframeLoaded"
                class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink-950/80 p-6 backdrop-blur-xs text-center transition-all animate-in fade-in"
              >
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl shadow-lg ring-1 ring-amber-500/40 animate-bounce">
                  🔒
                </div>
                <h3 class="mt-3 text-lg font-black text-white sm:text-xl">
                  حرکات شما به پایان رسید!
                </h3>
                <p class="mt-1.5 max-w-sm text-xs font-medium text-ink-200 leading-relaxed">
                  برای دریافت <span class="font-bold text-amber-400">۵ حرکت جدید</span>، به سوال چالش درسی در
                  <span class="hidden lg:inline">پنل کنار صفحه</span>
                  <span class="lg:hidden">بخش زیر بازی</span>
                  پاسخ دهید.
                </p>
                <button
                  type="button"
                  class="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 hover:from-amber-600 hover:to-orange-600 cursor-pointer"
                  @click="triggerNeedQuestionNotice"
                >
                  <span>💡</span>
                  <span>حل سوال کتاب درسی و دریافت ۵ حرکت</span>
                </button>
              </div>

              <!-- آی‌فریم بازی چوگان -->
              <iframe
                v-if="game"
                ref="iframeRef"
                :src="game.playUrl"
                class="h-full w-full border-0"
                allow="fullscreen"
                @load="onIframeLoad"
              ></iframe>
            </div>

            <!-- نوار وضعیت امتیاز و آمار زیر بازی -->
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-xs dark:border-ink-800 dark:bg-ink-900">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5 font-bold text-ink-900 dark:text-white">
                  <span class="text-amber-500">⭐</span>
                  <span>امتیاز بازی: {{ bonusScore }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>✅ درست: {{ correctCount }}</span>
                </div>
                <div v-if="wrongCount > 0" class="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <span>❌ نادرست: {{ wrongCount }}</span>
                </div>
                <div v-if="streak >= 2" class="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <span>🔥</span>
                  <span>زنجیره: {{ streak }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 text-11px text-slate-500 dark:text-ink-400">
                <span>مجموع حرکات انجام‌شده: {{ totalMovesMade }}</span>
              </div>
            </div>
          </div>

          <!-- ستون دوم: کارت چالش دانایی کتاب درسی (HoloDeck Question Challenge) -->
          <div class="lg:col-span-4">
            <div
              ref="questionCardRef"
              class="lg:sticky lg:top-4 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl transition-all duration-300 dark:border-ink-800 dark:bg-ink-900"
              :class="{
                'ring-4 ring-amber-400/50 border-amber-400 shadow-amber-500/20': isQuestionCardHighlighted,
              }"
            >
              <!-- سربرگ کارت چالش -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-ink-800">
                <div class="flex items-center gap-2">
                  <span class="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 text-lg shadow-xs">
                    💡
                  </span>
                  <div>
                    <h2 class="text-sm font-black text-ink-900 dark:text-white">چالش سوال دانایی</h2>
                    <p class="text-[11px] text-slate-500 dark:text-ink-400">پاسخ درست = +۵ حرکت در بازی</p>
                  </div>
                </div>

                <!-- نشانگر انرژی حرکات -->
                <div
                  class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black shadow-xs"
                  :class="
                    movesLeft > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                  "
                >
                  <span>{{ movesLeft > 0 ? '⚡' : '🔒' }}</span>
                  <span>{{ movesLeft }} حرکت</span>
                </div>
              </div>

              <!-- فیلترهای پایه و درس -->
              <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl dark:bg-ink-950/60 border border-slate-100 dark:border-ink-800/60">
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 dark:text-ink-400 mb-1">پایه تحصیلی:</label>
                  <select
                    v-model.number="selectedGrade"
                    aria-label="پایه"
                    class="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <optgroup label="دبستان">
                      <option v-for="g in [1, 2, 3, 4, 5, 6]" :key="g" :value="g">پایه {{ g }} ابتدایی</option>
                    </optgroup>
                    <optgroup label="متوسطه اول">
                      <option v-for="g in [7, 8, 9]" :key="g" :value="g">پایه {{ g }} متوسطه اول</option>
                    </optgroup>
                    <optgroup label="متوسطه دوم">
                      <option v-for="g in [10, 11, 12]" :key="g" :value="g">پایه {{ g }} متوسطه دوم</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-500 dark:text-ink-400 mb-1">کتاب درسی:</label>
                  <select
                    v-model="selectedCourseId"
                    aria-label="درس"
                    class="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option v-for="c in availableCourses" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>

              <!-- بدنه سوال -->
              <div v-if="currentQuestion" class="flex flex-col gap-3">
                <div class="flex items-center justify-between text-[11px] text-slate-400 dark:text-ink-500">
                  <span>{{ findCourse(BASE_COURSES, currentQuestion.courseId)?.name }} · پایه {{ currentQuestion.grade }}</span>
                  <span class="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                    سطح {{ currentQuestion.difficulty }}
                  </span>
                </div>

                <!-- متن سوال -->
                <p class="text-xs sm:text-sm font-bold leading-relaxed text-slate-800 dark:text-white">
                  {{ currentQuestion.text }}
                </p>

                <!-- گزینه‌های چهارگانه -->
                <div class="flex flex-col gap-2 mt-1">
                  <button
                    v-for="(option, idx) in currentQuestion.options"
                    :key="idx"
                    type="button"
                    class="flex items-center justify-between rounded-2xl border p-3 text-right text-xs font-semibold transition-all cursor-pointer"
                    :class="[
                      selectedOptionIndex === idx
                        ? wasCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                          : 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500 dark:bg-rose-950/60 dark:text-rose-200'
                        : hasAnswered && String(idx) === String(currentQuestion.correctAnswer)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-200 dark:hover:border-brand-600',
                    ]"
                    :disabled="hasAnswered"
                    @click="submitAnswer(idx)"
                  >
                    <span>{{ option }}</span>
                    <span
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      :class="
                        selectedOptionIndex === idx && wasCorrect
                          ? 'bg-emerald-500 text-white'
                          : selectedOptionIndex === idx && !wasCorrect
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 text-slate-600 dark:bg-ink-800 dark:text-ink-300'
                      "
                    >
                      {{ idx + 1 }}
                    </span>
                  </button>
                </div>

                <!-- بازخورد پاسخ صحیح -->
                <div
                  v-if="hasAnswered && wasCorrect"
                  class="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 flex flex-col gap-2"
                >
                  <div class="flex items-center gap-1.5 font-bold">
                    <span>🎉</span>
                    <span>آفرین! ۵ حرکت جدید به شما اضافه شد.</span>
                  </div>
                  <button
                    type="button"
                    class="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                    @click="pickNextQuestion"
                  >
                    سوال بعدی (+۵ حرکت بیشتر) 🔄
                  </button>
                </div>

                <!-- بازخورد پاسخ اشتباه -->
                <div
                  v-if="hasAnswered && !wasCorrect"
                  class="rounded-2xl border border-rose-300 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200 flex flex-col gap-2"
                >
                  <div class="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                    <span>❌</span>
                    <span>پاسخ صحیح: گزینه {{ Number(currentQuestion.correctAnswer) + 1 }} بود.</span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-slate-600 dark:text-ink-300">
                    💡 <span class="font-bold">نکته آموزشی:</span> {{ currentQuestion.explanation }}
                  </p>
                  <button
                    type="button"
                    class="w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                    @click="pickNextQuestion"
                  >
                    سوال بعدی / تلاش مجدد 🔄
                  </button>
                </div>
              </div>

              <!-- لودینگ در صورت عدم وجود سوال -->
              <div v-else class="py-8 text-center text-xs text-slate-400 dark:text-ink-500">
                در حال بارگذاری سوالات درسی...
              </div>

              <!-- جمله انگیزشی -->
              <div class="mt-auto border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400 dark:border-ink-800 dark:text-ink-500">
                ✨ {{ motivationalQuote }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- مودال پایان مأموریت و ثبت نتیجه -->
    <div
      v-if="showFinishModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
    >
      <div class="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-900 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 shadow-inner">
          🏆
        </div>
        <h2 class="mt-4 text-xl font-black text-ink-900 dark:text-white">
          مأموریت دانایی با موفقیت ثبت شد!
        </h2>
        <p class="mt-1 text-xs text-slate-500 dark:text-ink-400">
          نتایج این بازی در کارنامه تحلیلی و تابلوی لیگ هفتگی ذخیره شد.
        </p>

        <!-- مدال‌های دریافتی -->
        <div v-if="finishRewardMedals.length" class="mt-4 rounded-2xl bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
          <div class="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">🏅 مدال‌های جدید کسب‌شده:</div>
          <div class="flex flex-wrap justify-center gap-1.5">
            <span
              v-for="m in finishRewardMedals"
              :key="m"
              class="rounded-lg bg-amber-200/60 px-2 py-0.5 text-xs font-black text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
            >
              {{ m }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition"
            @click="handleMissionModalClose"
          >
            باشگاه بازی‌ها ➔
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            @click="showFinishModal = false"
          >
            ادامه بازی
          </button>
        </div>
      </div>
    </div>

    <!-- مودال‌های پیشرفت، مدال‌ها و تحلیل -->
    <GameJourneyModal v-if="showJourneyModal" :is-open="showJourneyModal" @close="showJourneyModal = false" />
    <GameMedalsModal v-if="showMedalsModal" :is-open="showMedalsModal" @close="showMedalsModal = false" />
    <GameAnalyticsModal v-if="showAnalyticsModal" :is-open="showAnalyticsModal" @close="showAnalyticsModal = false" />

    <AppFooter />
  </div>
</template>
