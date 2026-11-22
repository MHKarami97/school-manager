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

// مودال‌های پیشرفت
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

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
const showQuestionModal = ref(false)
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
  return BASE_COURSES.filter((c) =>
    ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies'].includes(c.id),
  )
})

// بارگذاری بانک سوالات جامع درسی
async function loadQuestionBank(): Promise<void> {
  try {
    const res = await fetch('/data/questions/elementary-curriculum-questions.json')
    if (res.ok) {
      extraCurriculumQuestions.value = await res.json()
    }
  } catch (e) {
    console.warn('Extra curriculum questions failed to load:', e)
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

// باز کردن چالش سوال دانایی جدید
function openQuestionChallenge(): void {
  const pool = eligibleQuestions.value.length > 0 ? eligibleQuestions.value : allQuestions.value
  if (!pool.length) return

  const rnd = Math.floor(Math.random() * pool.length)
  currentQuestion.value = pool[rnd]
  selectedOptionIndex.value = null
  hasAnswered.value = false
  wasCorrect.value = false
  questionStartTime.value = Date.now()
  showQuestionModal.value = true
}

// ثبت پاسخ به سوال
async function submitAnswer(optionIndex: number): Promise<void> {
  if (hasAnswered.value || !currentQuestion.value) return

  selectedOptionIndex.value = optionIndex
  hasAnswered.value = true
  const durationSeconds = Number(((Date.now() - questionStartTime.value) / 1000).toFixed(1))
  const isRight = String(optionIndex) === String(currentQuestion.value.correctAnswer)
  wasCorrect.value = isRight

  if (isRight) {
    sfx.correct()
    correctCount.value += 1
    bonusScore.value += 50
    hasDoubleMultiplier.value = true

    // اهدای فوری امتیاز و سکه به پروفایل دانش‌آموز
    if (profilesStore.activeProfile) {
      profilesStore.activeProfile.xp += 25
      profilesStore.activeProfile.coins += 15
      profilesStore.activeProfile.totalScore += 50
      await profilesStore.saveProfiles()
    }
  } else {
    sfx.wrong()
    wrongCount.value += 1
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

// بستن مودال چالش سوال و بازگشت به بازی
function closeQuestionModal(): void {
  showQuestionModal.value = false
}

// پاسخ به سوال بعدی
function nextQuestion(): void {
  openQuestionChallenge()
}

// هماهنگ‌سازی تم تاریک/روشن با آی‌فریم بازی چوگان
function applyThemeToIframe(): void {
  try {
    const iframe = iframeRef.value
    if (!iframe || !iframe.contentDocument) return
    const isDark =
      themeStore.mode === 'dark' ||
      (themeStore.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    iframe.contentDocument.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } catch (e) {
    // در صورت سیاست‌های امنیتی دسترسی به آی‌فریم کنترل می‌شود
  }
}

function onIframeLoad(): void {
  isIframeLoaded.value = true
  applyThemeToIframe()
}

// تغییر تم با تغییر تنظیمات سامانه
watch(
  () => themeStore.mode,
  () => {
    applyThemeToIframe()
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

  sfx.levelUp()
  showFinishModal.value = true
}

function handleMissionModalClose(): void {
  showFinishModal.value = false
  router.push('/games')
}

onMounted(() => {
  loadQuestionBank()
  // در ابتدا یکبار چالش سوال اختیاری را آماده می‌کنیم
  const timer = setTimeout(() => {
    applyThemeToIframe()
  }, 1000)

  return () => clearTimeout(timer)
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

      <!-- نوار ابزار و اطلاعات بازی -->
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
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-2 shadow-inner"
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

          <!-- دکمه‌های کنترلی بازی و چالش دانایی -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- دکمه حل سوال برای دریافت سکه و جان -->
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 transition hover:from-amber-600 hover:to-orange-600 cursor-pointer"
              @click="openQuestionChallenge"
            >
              <span>💡</span>
              <span>چالش سوال دانایی (+سکه و امتیاز ۲×)</span>
            </button>

            <!-- دکمه ثبت پایان بازی در کارنامه -->
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

        <!-- نوار وضعیت تقویت‌کننده و امتیاز جلسه -->
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-xs dark:border-ink-800 dark:bg-ink-900">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 font-bold text-ink-900 dark:text-white">
              <span class="text-amber-500">⭐</span>
              <span>امتیاز مأموریت: {{ bonusScore }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>✅ پاسخ‌های درست: {{ correctCount }}</span>
            </div>
            <div v-if="wrongCount > 0" class="flex items-center gap-1.5 text-rose-500 font-semibold">
              <span>❌ نادرست: {{ wrongCount }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="hasDoubleMultiplier"
              class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-10px font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
            >
              ⚡ ضریب ۲ برابری امتیاز فعال است!
            </span>
            <span class="text-10px text-slate-400 dark:text-ink-500">
              پایه: {{ selectedGrade }}م · درس: {{ findCourse(BASE_COURSES, selectedCourseId)?.name || 'ریاضی' }}
            </span>
          </div>
        </div>
      </section>

      <!-- بوم و صحنه بازی (Game Arena) -->
      <section class="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div
          id="game-arena-container"
          class="relative w-full overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900"
          style="min-height: 640px; height: 75vh;"
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
      </section>
    </main>

    <!-- مودال چالش سوال دانایی (Curriculum Question Modal) -->
    <div
      v-if="showQuestionModal && currentQuestion"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div class="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-900">
        <!-- هدر سوال -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-ink-800">
          <div class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300 text-sm">
              💡
            </span>
            <div>
              <div class="text-xs font-bold text-brand-600 dark:text-brand-400">
                چالش درسی دانایی · {{ findCourse(BASE_COURSES, currentQuestion.courseId)?.name || 'کتاب درسی' }}
              </div>
              <div class="text-10px text-slate-400 dark:text-ink-500">
                پایه {{ currentQuestion.grade }}م · سطح {{ currentQuestion.difficulty }}
              </div>
            </div>
          </div>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800"
            @click="closeQuestionModal"
          >
            ✕
          </button>
        </div>

        <!-- متن سوال -->
        <div class="mt-4">
          <p class="text-sm font-bold text-ink-900 dark:text-white leading-relaxed">
            {{ currentQuestion.text }}
          </p>
        </div>

        <!-- گزینه‌های چهارگانه -->
        <div class="mt-4 grid gap-2.5">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            type="button"
            class="flex items-center justify-between rounded-2xl border p-3.5 text-right text-xs font-medium transition-all cursor-pointer"
            :class="[
              selectedOptionIndex === idx
                ? wasCorrect
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500'
                : hasAnswered && String(idx) === String(currentQuestion.correctAnswer)
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-ink-900 dark:border-ink-800 dark:bg-ink-800/80 dark:text-ink-100 dark:hover:bg-ink-800',
            ]"
            :disabled="hasAnswered"
            @click="submitAnswer(idx)"
          >
            <span>{{ opt }}</span>
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-10px font-bold"
              :class="selectedOptionIndex === idx && wasCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-ink-700 dark:text-ink-300'"
            >
              {{ idx + 1 }}
            </span>
          </button>
        </div>

        <!-- بازخورد پاسخ درست -->
        <div
          v-if="hasAnswered && wasCorrect"
          class="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/40"
        >
          <div class="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
            <span>🎉 آفرین! پاسخ کاملاً درست است.</span>
          </div>
          <p class="mt-1 text-slate-600 dark:text-ink-300">
            ۲۵ امتیاز، ۱۵ سکه و ضریب امتیاز دو برابری به پروفایل شما افزوده شد!
          </p>
          <div class="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-ink-800 dark:text-ink-200"
              @click="nextQuestion"
            >
              یک سوال دیگر
            </button>
            <button
              type="button"
              class="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              @click="closeQuestionModal"
            >
              ادامه بازی 🎮
            </button>
          </div>
        </div>

        <!-- بازخورد پاسخ نادرست و نکته آموزشی -->
        <div
          v-if="hasAnswered && !wasCorrect"
          class="mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs dark:border-rose-900/60 dark:bg-rose-950/40"
        >
          <div class="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
            <span>❌ پاسخ نادرست بود.</span>
          </div>
          <p class="mt-1 text-slate-700 dark:text-ink-200">
            پاسخ صحیح گزینه {{ Number(currentQuestion.correctAnswer) + 1 }} یعنی «{{ currentQuestion.options[Number(currentQuestion.correctAnswer)] }}» است.
          </p>
          <p v-if="currentQuestion.explanation" class="mt-2 text-slate-600 dark:text-ink-300 border-t border-rose-200 dark:border-rose-900/60 pt-2">
            💡 <span class="font-bold text-amber-600 dark:text-amber-400">نکته یادگیری:</span> {{ currentQuestion.explanation }}
          </p>
          <div class="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
              @click="nextQuestion"
            >
              امتحان سوال بعدی
            </button>
            <button
              type="button"
              class="rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-ink-800 dark:text-ink-200"
              @click="closeQuestionModal"
            >
              بازگشت به بازی
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال پایان مأموریت و ثبت در کارنامه (Finish Session Modal) -->
    <div
      v-if="showFinishModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/75 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
    >
      <div class="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-ink-800 dark:bg-ink-900">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg shadow-orange-500/30">
          🏆
        </div>
        <h3 class="mt-4 text-xl font-black text-ink-900 dark:text-white">
          مأموریت با موفقیت به پایان رسید!
        </h3>
        <p class="mt-1 text-xs text-slate-500 dark:text-ink-400">
          نتایج بازی «{{ game?.nameFa }}» در کارنامه و لیگ قهرمانان ثبت شد.
        </p>

        <!-- آمار مأموریت -->
        <div class="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-ink-800/80">
          <div class="text-center">
            <div class="text-base font-black text-brand-600 dark:text-brand-400">+{{ bonusScore }}</div>
            <div class="text-10px text-slate-400 dark:text-ink-400">امتیاز کسب‌شده</div>
          </div>
          <div class="text-center">
            <div class="text-base font-black text-emerald-600 dark:text-emerald-400">{{ correctCount }}</div>
            <div class="text-10px text-slate-400 dark:text-ink-400">پاسخ درست</div>
          </div>
          <div class="text-center">
            <div class="text-base font-black text-amber-500">{{ sessionAnswers.length > 0 ? Math.round((correctCount / sessionAnswers.length) * 100) : 100 }}٪</div>
            <div class="text-10px text-slate-400 dark:text-ink-400">دقت علمی</div>
          </div>
        </div>

        <!-- مدال‌های جدید آنلاک‌شده -->
        <div v-if="finishRewardMedals.length > 0" class="mt-4 rounded-xl bg-amber-50 p-3 text-xs dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
          <div class="font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1">
            <span>🎖️</span>
            <span>تبریک! مدال‌های جدیدی آزاد کردید:</span>
          </div>
          <div class="mt-1 text-slate-700 dark:text-ink-200 text-10px">
            {{ finishRewardMedals.join(' ، ') }}
          </div>
        </div>

        <button
          type="button"
          class="mt-6 w-full rounded-2xl bg-brand-600 py-3 text-xs font-black text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition"
          @click="handleMissionModalClose"
        >
          بازگشت به باشگاه بازی‌ها
        </button>
      </div>
    </div>

    <!-- مودال‌های پیشرفت، مدال‌ها و تحلیل بازی -->
    <GameJourneyModal v-if="showJourneyModal" :is-open="showJourneyModal" @close="showJourneyModal = false" />
    <GameMedalsModal v-if="showMedalsModal" :is-open="showMedalsModal" @close="showMedalsModal = false" />
    <GameAnalyticsModal v-if="showAnalyticsModal" :is-open="showAnalyticsModal" @close="showAnalyticsModal = false" />

    <AppFooter />
  </div>
</template>
