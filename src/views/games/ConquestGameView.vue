<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { useGameHistoryStore } from '@/stores/game-history'
import { useGameProfilesStore } from '@/stores/game-profiles'
import { DEFAULT_CURRICULUM_QUESTIONS, type EducationalQuestion } from '@/config/default-questions.config'
import { sfx } from '@/utils/sound-effects'
import { useGameChromeInsets } from '@/composables/useGameChromeInsets'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
import { GAME_GRADES } from '@/config/game-grades.config'
import { GAME_GRADE_COURSE_IDS, loadGradeQuestions, normalizeCourseIds } from '@/config/game-grades.config'
import {
  GAME_SEASONS,
  getCurrentSeasonKey,
  MOTIVATIONAL_QUOTES,
} from '@/config/game-seasons.config'
import type { DifficultyLevel, GameHistorySession, GameSeasonKey, GameStage, QuestionAnswerRecord } from '@/types'

// کامپوننت‌های الحاقی پیشرفته
import GameProfileBar from '@/components/games/GameProfileBar.vue'
import GameJourneyModal from '@/components/games/GameJourneyModal.vue'
import GameMedalsModal from '@/components/games/GameMedalsModal.vue'
import GameAnalyticsModal from '@/components/games/GameAnalyticsModal.vue'

// --- دروس مجاز پایه‌ها ---
const GRADE_COURSE_IDS: Record<number, string[]> = GAME_GRADE_COURSE_IDS

// --- ساختار قلمروهای نقشه دانش ---
interface Territory {
  id: string
  name: string
  provinceName: string
  biomeTitle: string
  primaryCourseId: string
  avatar: string
  bannerColor: string
  x: number
  y: number
  radius: number
  connectedTo: string[]
  isLiberated: boolean
  isUnlocked: boolean
  defensePower: number
  maxDefensePower: number
  guardianBoss: string
}

const INITIAL_TERRITORIES: Territory[] = [
  {
    id: 't-alborz',
    name: 'قلمرو هیرکانی و البرز',
    provinceName: 'جنگل‌های باستانی و سرسبز شمال',
    biomeTitle: 'زیست‌شناسی و گیاه‌شناسی کهن',
    primaryCourseId: 'science',
    avatar: '🌲',
    bannerColor: '#10b981',
    x: 480,
    y: 140,
    radius: 46,
    connectedTo: ['t-capital', 't-zagros', 't-silkroad'],
    isLiberated: false,
    isUnlocked: true,
    defensePower: 100,
    maxDefensePower: 100,
    guardianBoss: 'دیو غفلت طبیعت',
  },
  {
    id: 't-zagros',
    name: 'قلمرو کهن زاگرس',
    provinceName: 'سرزمین صخره‌ها و غارهای تمدن',
    biomeTitle: 'تاریخ، آثار باستانی و فرهنگ ایران',
    primaryCourseId: 'social-studies',
    avatar: '🏔️',
    bannerColor: '#f59e0b',
    x: 230,
    y: 260,
    radius: 48,
    connectedTo: ['t-alborz', 't-capital', 't-persian-gulf'],
    isLiberated: false,
    isUnlocked: true,
    defensePower: 110,
    maxDefensePower: 110,
    guardianBoss: 'اشباح بی‌خبری تاریخ',
  },
  {
    id: 't-capital',
    name: 'پایتخت فرزانگی و سخن',
    provinceName: 'قلب علم، زبان، نگارش و تمدن',
    biomeTitle: 'فارسی، شعر، حکمت و اخلاق',
    primaryCourseId: 'persian-reading',
    avatar: '🏰',
    bannerColor: '#6366f1',
    x: 460,
    y: 280,
    radius: 54,
    connectedTo: ['t-alborz', 't-zagros', 't-desert', 't-persian-gulf', 't-silkroad'],
    isLiberated: false,
    isUnlocked: false,
    defensePower: 150,
    maxDefensePower: 150,
    guardianBoss: 'اژدهای تیرگی سخن',
  },
  {
    id: 't-desert',
    name: 'قلمرو کویر و ستارگان',
    provinceName: 'کویر لوت و رصدگاه‌های آسمان',
    biomeTitle: 'ریاضیات، هندسه و جهت‌یابی نجومی',
    primaryCourseId: 'math',
    avatar: '🏜️',
    bannerColor: '#eab308',
    x: 680,
    y: 310,
    radius: 46,
    connectedTo: ['t-capital', 't-silkroad', 't-persian-gulf'],
    isLiberated: false,
    isUnlocked: true,
    defensePower: 100,
    maxDefensePower: 100,
    guardianBoss: 'طوفان سرگردانی شن',
  },
  {
    id: 't-persian-gulf',
    name: 'قلمرو خلیج همیشگی فارس',
    provinceName: 'دریاها، جزایر و تجارت دریایی',
    biomeTitle: 'جغرافیا، آب‌ها و زیست‌بوم دریایی',
    primaryCourseId: 'social-studies',
    avatar: '🌊',
    bannerColor: '#06b6d4',
    x: 480,
    y: 440,
    radius: 50,
    connectedTo: ['t-zagros', 't-capital', 't-desert'],
    isLiberated: false,
    isUnlocked: false,
    defensePower: 120,
    maxDefensePower: 120,
    guardianBoss: 'هیولای فراموشی آب‌ها',
  },
  {
    id: 't-silkroad',
    name: 'قلمرو جاده ابریشم و جهان',
    provinceName: 'پیوند تمدن‌ها، کاروان‌ها و اختراعات',
    biomeTitle: 'علوم، فناوری و اختراعات بشر',
    primaryCourseId: 'science',
    avatar: '🌍',
    bannerColor: '#ec4899',
    x: 760,
    y: 170,
    radius: 45,
    connectedTo: ['t-alborz', 't-capital', 't-desert'],
    isLiberated: false,
    isUnlocked: false,
    defensePower: 115,
    maxDefensePower: 115,
    guardianBoss: 'نگهبان تعصب و جمود',
  },
]

// فرماندهان اردوی کشف قلمرو
interface CommanderDef {
  id: string
  name: string
  title: string
  avatar: string
  perkTitle: string
  perkDescription: string
  crystalsBonusMultiplier: number
}

const COMMANDERS: CommanderDef[] = [
  {
    id: 'siraf',
    name: 'ناخدا سیراف',
    title: 'دریانورد و کاوشگر افق‌ها',
    avatar: '🧭',
    perkTitle: 'تسلط بر جغرافیای آب‌ها',
    perkDescription: 'پاسخ‌های صحیح در دروس جغرافیا و مطالعات پاداش کریستال +۲۵٪ به همراه دارد.',
    crystalsBonusMultiplier: 1.25,
  },
  {
    id: 'ario',
    name: 'سردار آریو',
    title: 'مدافع استراتژیک دژها',
    avatar: '🛡️',
    perkTitle: 'سپر استوار دانایی',
    perkDescription: 'در صورت پاسخ اشتباه، مقاومت قلمرو کمتر دچار آسیب و پسروی می‌شود.',
    crystalsBonusMultiplier: 1.0,
  },
  {
    id: 'toos',
    name: 'حکیم طوس',
    title: 'استاد اندیشه، زبان و شاهنامه',
    avatar: '📜',
    perkTitle: 'چراغ روشن کلمات',
    perkDescription: 'پاسخ صحیح به دروس فارسی و پیام‌ها بلافاصله به قلمروهای مجاور نور می‌تاباند.',
    crystalsBonusMultiplier: 1.15,
  },
  {
    id: 'biruni',
    name: 'ابوریحان فرزانه',
    title: 'دانشمند ریاضی، فلک و تقویم',
    avatar: '🔭',
    perkTitle: 'محاسبات دقیق نجومی',
    perkDescription: 'در سوالات ریاضی و علوم پاداش امتیاز مضاعف و شتاب فتح قلمرو را فراهم می‌کند.',
    crystalsBonusMultiplier: 1.2,
  },
]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
}

type GameState = 'setup' | 'countdown' | 'playing' | 'victory'

// استورها
const questionsStore = useQuestionsStore()
const gameHistoryStore = useGameHistoryStore()
const profilesStore = useGameProfilesStore()
useGameChromeInsets()

const gameState = ref<GameState>('setup')
const selectedCommanderId = ref<string>('siraf')
const activeCommander = computed(() => {
  return COMMANDERS.find((c) => c.id === selectedCommanderId.value) || COMMANDERS[0]
})

// فصل جاری و مراحل
const activeSeasonKey = ref<GameSeasonKey>(getCurrentSeasonKey())
const activeSeason = computed(() => GAME_SEASONS[activeSeasonKey.value])
const selectedStage = ref<GameStage | null>(null)

// فیلترهای پایه و دروس
const selectedGrade = ref<number>(profilesStore.activeProfile?.grade || 4)
const selectedCourseIds = ref<string[]>(['social-studies', 'science', 'persian-reading', 'math'])
const availableCoursesForGrade = computed(() => {
  const allowed = GRADE_COURSE_IDS[selectedGrade.value] || []
  return BASE_COURSES.filter((c) => allowed.includes(c.id))
})

watch(
  () => profilesStore.activeProfile?.grade,
  (newGrade) => {
    if (newGrade && gameState.value === 'setup') {
      selectedGrade.value = newGrade
      const allowed = GRADE_COURSE_IDS[newGrade] || []
      selectedCourseIds.value = selectedCourseIds.value.filter((id) => allowed.includes(id))
      if (selectedCourseIds.value.length === 0 && allowed.length > 0) {
        selectedCourseIds.value = [allowed[0]]
      }
    }
  },
  { immediate: true }
)

// بانک سوالات
const extraCurriculumQuestions = ref<EducationalQuestion[]>([])

async function loadGameQuestionBank(): Promise<void> {
  extraCurriculumQuestions.value = await loadGradeQuestions(selectedGrade.value)
}

watch(selectedGrade, (grade) => {
  selectedCourseIds.value = normalizeCourseIds(grade, selectedCourseIds.value)
  void loadGameQuestionBank()
})

const allQuestions = computed<EducationalQuestion[]>(() => {
  const existingTexts = new Set(questionsStore.items.map((q) => q.text))
  const dbItems: EducationalQuestion[] = questionsStore.items.map((q) => ({
    ...q,
    explanation: 'با تکیه بر آموخته‌های کتاب درسی و تفکر دقیق، راز قلمرو کشف می‌شود.',
  }))
  const extras = extraCurriculumQuestions.value.filter((q) => !existingTexts.has(q.text))
  return [...DEFAULT_CURRICULUM_QUESTIONS, ...extras, ...dbItems]
})

const eligibleQuestions = computed(() => {
  return allQuestions.value.filter((q) => {
    if (q.grade !== selectedGrade.value) return false
    if (!selectedCourseIds.value.includes(q.courseId)) return false
    return true
  })
})

// قلمروهای نقشه
const territories = ref<Territory[]>(JSON.parse(JSON.stringify(INITIAL_TERRITORIES)))
const selectedTerritory = ref<Territory | null>(null)
const hoveredTerritory = ref<Territory | null>(null)

const liberatedCount = computed(() => {
  return territories.value.filter((t) => t.isLiberated).length
})

// منابع و آمار بازی
const score = ref(0)
const crystals = ref(150)
const streak = ref(0)
const gameStartTime = ref(0)
const currentSessionId = ref('')
const sessionAnswers = ref<QuestionAnswerRecord[]>([])
const questionShownAt = ref(0)

// سوال فعال روی هود
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnsweredCurrent = ref(false)
const wasAnswerCorrect = ref(false)
const showHoloDeck = ref(true)

// مودال‌ها
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

// بوم نقاشی و انیمیشن
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let particles: Particle[] = []
let floatingTexts: FloatingText[] = []
let radarAngle = 0

// شمارش معکوس
const countdownNumber = ref(3)
const currentMotivationalQuote = ref('')
const soundEnabled = ref(true)

function pickRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  return MOTIVATIONAL_QUOTES[randomIndex].text
}

// وضعیت گوشی در حالت عمودی
const isPortraitMobile = ref(false)
const dismissRotationWarning = ref(false)

function checkOrientation(): void {
  if (typeof window !== 'undefined') {
    isPortraitMobile.value = window.innerHeight > window.innerWidth && window.innerWidth < 768
  }
}

function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value
  sfx.setEnabled(soundEnabled.value)
}

function toggleCourseSelection(courseId: string): void {
  const index = selectedCourseIds.value.indexOf(courseId)
  if (index >= 0) {
    if (selectedCourseIds.value.length > 1) {
      selectedCourseIds.value.splice(index, 1)
    }
  } else {
    selectedCourseIds.value.push(courseId)
  }
}

function startMission(): void {
  if (selectedCourseIds.value.length === 0) {
    alert('لطفاً حداقل یک درس را انتخاب کنید.')
    return
  }

  territories.value = JSON.parse(JSON.stringify(INITIAL_TERRITORIES))
  selectedTerritory.value = null
  currentSessionId.value = crypto.randomUUID()
  gameStartTime.value = Date.now()
  sessionAnswers.value = []
  score.value = 0
  streak.value = 0
  crystals.value = 150
  particles = []
  floatingTexts = []

  currentMotivationalQuote.value = pickRandomMotivationalQuote()
  gameState.value = 'countdown'
  countdownNumber.value = 3

  sfx.playCountdown(false)

  const countdownTimer = setInterval(() => {
    countdownNumber.value -= 1
    if (countdownNumber.value > 0) {
      sfx.playCountdown(false)
    } else if (countdownNumber.value === 0) {
      clearInterval(countdownTimer)
      sfx.playCountdown(true)
      gameState.value = 'playing'
      // قلمرو اول را برای کشف پیشنهاد بده
      const firstTerritory = territories.value.find((t) => t.isUnlocked && !t.isLiberated)
      if (firstTerritory) {
        selectTerritoryForSiege(firstTerritory)
      }
    }
  }, 900)
}

function selectTerritoryForSiege(t: Territory): void {
  if (!t.isUnlocked) {
    alert('این قلمرو هنوز در مه نادانی قرار دارد! ابتدا قلمروهای مجاور متصل به آن را فتح کنید.')
    return
  }
  selectedTerritory.value = t
  pickQuestionForTerritory(t)
}

function pickQuestionForTerritory(t: Territory): void {
  // فیلتر اولویت‌دار بر اساس درس این قلمرو
  let pool = eligibleQuestions.value.filter((q) => q.courseId === t.primaryCourseId)
  if (pool.length === 0) {
    pool = eligibleQuestions.value
  }
  if (pool.length === 0) {
    pool = allQuestions.value
  }
  if (pool.length === 0) return

  const randomIndex = Math.floor(Math.random() * pool.length)
  currentQuestion.value = pool[randomIndex]
  selectedOptionIndex.value = null
  hasAnsweredCurrent.value = false
  wasAnswerCorrect.value = false
  showHoloDeck.value = true
  questionShownAt.value = Date.now()
}

function answerQuestion(index: number): void {
  if (hasAnsweredCurrent.value || !currentQuestion.value || !selectedTerritory.value) return
  selectedOptionIndex.value = index
  hasAnsweredCurrent.value = true

  const durationSeconds = Number(((Date.now() - questionShownAt.value) / 1000).toFixed(1))
  const isCorrect = String(index) === String(currentQuestion.value.correctAnswer)
  wasAnswerCorrect.value = isCorrect

  const record: QuestionAnswerRecord = {
    questionId: currentQuestion.value.id,
    questionText: currentQuestion.value.text,
    courseId: currentQuestion.value.courseId,
    grade: currentQuestion.value.grade,
    difficulty: currentQuestion.value.difficulty,
    selectedOption: currentQuestion.value.options[index] || '',
    correctOption: currentQuestion.value.options[Number(currentQuestion.value.correctAnswer)] || '',
    isCorrect,
    durationSeconds,
    timestamp: Date.now(),
  }

  sessionAnswers.value.push(record)

  if (isCorrect) {
    sfx.playCorrect()
    sfx.playVictory()
    const points = Math.round(200 * activeCommander.value.crystalsBonusMultiplier)
    score.value += points
    crystals.value += Math.round(75 * activeCommander.value.crystalsBonusMultiplier)
    streak.value += 1

    // فتح قطعی قلمرو
    const t = selectedTerritory.value
    t.isLiberated = true
    t.defensePower = 0

    // باز کردن قلمروهای متصل به این سرزمین
    t.connectedTo.forEach((connectedId) => {
      const neighbor = territories.value.find((item) => item.id === connectedId)
      if (neighbor && !neighbor.isUnlocked) {
        neighbor.isUnlocked = true
        floatingTexts.push({
          x: neighbor.x,
          y: neighbor.y - 30,
          text: `✨ کشف شد: ${neighbor.name}`,
          color: '#38bdf8',
          alpha: 1,
          vy: -0.8,
        })
      }
    })

    createConquestFireworks(t.x, t.y, t.bannerColor)

    floatingTexts.push({
      x: t.x,
      y: t.y - 10,
      text: `👑 ${t.name} فتح شد! (+${points} امتیاز)`,
      color: '#10b981',
      alpha: 1,
      vy: -1.2,
    })

    if (streak.value % 2 === 0) {
      floatingTexts.push({
        x: 480,
        y: 80,
        text: `🌟 ${pickRandomMotivationalQuote()}`,
        color: '#fbbf24',
        alpha: 1,
        vy: -0.7,
      })
    }

    // بررسی شرایط پیروزی کامل در نقشه
    if (territories.value.every((item) => item.isLiberated)) {
      setTimeout(() => {
        finishConquestVictory()
      }, 1500)
    } else {
      setTimeout(() => {
        // انتخاب قلمروی فتح نشده بعدی
        const nextTarget = territories.value.find((item) => item.isUnlocked && !item.isLiberated)
        if (nextTarget) {
          selectTerritoryForSiege(nextTarget)
        } else {
          showHoloDeck.value = false
        }
      }, 1600)
    }
  } else {
    sfx.playIncorrect()
    streak.value = 0

    floatingTexts.push({
      x: selectedTerritory.value.x,
      y: selectedTerritory.value.y - 10,
      text: `❌ حمله دفع شد! پاسخ صحیح را بخوان`,
      color: '#ef4444',
      alpha: 1,
      vy: -1.0,
    })
  }

  saveCurrentSessionSnapshot()
}

function retryWithNewQuestion(): void {
  if (selectedTerritory.value) {
    pickQuestionForTerritory(selectedTerritory.value)
  }
}

function createConquestFireworks(x: number, y: number, color: string): void {
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 5 + 2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 5 + 3,
      color,
      alpha: 1,
    })
  }
}

function finishConquestVictory(): void {
  gameState.value = 'victory'
  sfx.playVictory()
  saveCurrentSessionSnapshot()
}

async function saveCurrentSessionSnapshot(): Promise<void> {
  const durationSec = Math.max(1, Math.round((Date.now() - gameStartTime.value) / 1000))
  const totalCount = sessionAnswers.value.length
  const correctCount = sessionAnswers.value.filter((a) => a.isCorrect).length
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  const session: GameHistorySession = {
    id: currentSessionId.value,
    studentId: profilesStore.activeProfile?.id,
    studentName: profilesStore.activeProfile?.name,
    season: activeSeasonKey.value,
    stageId: selectedStage.value?.id,
    gameType: 'conquest',
    gameTitle: 'فتح قلمروهای دانش',
    heroId: selectedCommanderId.value,
    selectedGrade: selectedGrade.value,
    selectedCourses: [...selectedCourseIds.value],
    startedAt: gameStartTime.value,
    endedAt: Date.now(),
    totalDurationSeconds: durationSec,
    score: score.value,
    wavesCleared: liberatedCount.value,
    shotsFired: totalCount,
    shotsHit: correctCount,
    accuracyPercentage: accuracy,
    totalQuestionsAnswered: totalCount,
    correctAnswersCount: correctCount,
    answers: [...sessionAnswers.value],
  }

  await gameHistoryStore.save(session)
  await profilesStore.recordMissionOutcome(session)
}

function handleSelectStage(stage: GameStage): void {
  selectedStage.value = stage
  if (stage.recommendedCourses && stage.recommendedCourses.length > 0) {
    const valid = stage.recommendedCourses.filter((id) =>
      availableCoursesForGrade.value.some((c) => c.id === id)
    )
    if (valid.length > 0) {
      selectedCourseIds.value = valid
    }
  }
  showJourneyModal.value = false
}

// مدیریت کلیک روی نقشه Canvas
function handleCanvasClick(event: MouseEvent): void {
  if (gameState.value !== 'playing') return
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (event.clientX - rect.left) * scaleX
  const clickY = (event.clientY - rect.top) * scaleY

  for (const t of territories.value) {
    const dist = Math.hypot(t.x - clickX, t.y - clickY)
    if (dist <= t.radius) {
      selectTerritoryForSiege(t)
      return
    }
  }
}

function handleCanvasMouseMove(event: MouseEvent): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const mouseX = (event.clientX - rect.left) * scaleX
  const mouseY = (event.clientY - rect.top) * scaleY

  let found: Territory | null = null
  for (const t of territories.value) {
    if (Math.hypot(t.x - mouseX, t.y - mouseY) <= t.radius) {
      found = t
      break
    }
  }
  hoveredTerritory.value = found
}

// رندرینگ بوم نقشه استراتژیک
function renderConquestMap(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // ۱. پس‌زمینه نقشه با هماهنگی کامل تم روشن و تیره
  if (isDark) {
    // تم اتاق فرماندهی هولوگرافیک / سایبرپانک
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#0a0f1d')
    bgGrad.addColorStop(0.5, '#0f172a')
    bgGrad.addColorStop(1, '#020617')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // گرید خطوط رادار تاکتیکی
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // چرخش خط رادار مرکزی
    radarAngle += 0.015
    ctx.save()
    ctx.translate(480, 270)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(radarAngle) * 360, Math.sin(radarAngle) * 360)
    ctx.stroke()
    ctx.restore()
  } else {
    // تم نقشه کهن و اطلس جغرافیایی عتیقه
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#fef3c7')
    bgGrad.addColorStop(0.5, '#fde68a')
    bgGrad.addColorStop(1, '#fef3c7')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // بافت ظریف نقشه عتیقه
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.12)'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // گل قطب‌نما در گوشه پایین نقشه
    ctx.save()
    ctx.translate(110, 430)
    ctx.font = '54px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.35
    ctx.fillText('🧭', 0, 0)
    ctx.restore()
  }

  // ۲. خطوط اتصال تجاری و راه‌های لشکرکشی بین قلمروها
  territories.value.forEach((t) => {
    t.connectedTo.forEach((targetId) => {
      const target = territories.value.find((item) => item.id === targetId)
      if (target && t.id < target.id) {
        ctx.save()
        const isBothLiberated = t.isLiberated && target.isLiberated
        const isPathOpen = t.isUnlocked && target.isUnlocked

        ctx.strokeStyle = isBothLiberated
          ? '#10b981'
          : isPathOpen
          ? isDark
            ? 'rgba(56, 189, 248, 0.6)'
            : 'rgba(217, 119, 6, 0.7)'
          : isDark
          ? 'rgba(100, 116, 139, 0.2)'
          : 'rgba(180, 83, 9, 0.2)'

        ctx.lineWidth = isBothLiberated ? 3.5 : 2
        ctx.setLineDash(isBothLiberated ? [] : [6, 6])

        ctx.beginPath()
        ctx.moveTo(t.x, t.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }
    })
  })

  // ۳. ترسیم دایره‌ها و نمادهای قلمروها
  territories.value.forEach((t) => {
    ctx.save()
    ctx.translate(t.x, t.y)

    const isSelected = selectedTerritory.value?.id === t.id
    const isHovered = hoveredTerritory.value?.id === t.id

    // هاله انتخاب یا اشاره‌گر
    if (isSelected || isHovered) {
      ctx.beginPath()
      ctx.arc(0, 0, t.radius + 12, 0, Math.PI * 2)
      ctx.fillStyle = isSelected
        ? 'rgba(245, 158, 11, 0.25)'
        : 'rgba(56, 189, 248, 0.2)'
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#38bdf8'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }

    // بدنه دایره قلمرو
    ctx.beginPath()
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2)

    if (t.isLiberated) {
      ctx.fillStyle = isDark ? '#064e3b' : '#d1fae5'
      ctx.fill()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3
      ctx.stroke()
    } else if (t.isUnlocked) {
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = t.bannerColor
      ctx.lineWidth = 2.5
      ctx.stroke()
    } else {
      // حالت قفل و مه‌آلود (Fog of War)
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(214, 211, 209, 0.8)'
      ctx.fill()
      ctx.strokeStyle = isDark ? '#475569' : '#a8a29e'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // آیکون یا پرچم قلمرو
    ctx.font = `${t.radius * 0.9}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (!t.isUnlocked) {
      ctx.fillText('🌫️', 0, 0)
    } else if (t.isLiberated) {
      ctx.fillText(t.avatar, 0, -4)
    } else {
      ctx.fillText(t.avatar, 0, -4)
    }

    // پرچم فتح در صورت آزادسازی
    if (t.isLiberated) {
      ctx.font = '18px serif'
      ctx.fillText('🚩', t.radius - 10, -t.radius + 10)
    }

    // عنوان قلمرو
    ctx.font = 'bold 12px sans-serif'
    ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b'
    ctx.shadowColor = isDark ? '#000000' : '#ffffff'
    ctx.shadowBlur = 4
    ctx.fillText(t.name, 0, t.radius + 18)
    ctx.shadowBlur = 0

    // زیرعنوان درس و وضعیت
    ctx.font = '10px sans-serif'
    ctx.fillStyle = t.isLiberated
      ? '#10b981'
      : t.isUnlocked
      ? '#0284c7'
      : '#64748b'
    ctx.fillText(
      t.isLiberated ? '✓ فتح شده' : t.isUnlocked ? 'آماده نبرد دانایی' : '🔒 در مه',
      0,
      t.radius + 32
    )

    ctx.restore()
  })

  // ۴. ذرات آتش‌بازی و شادمانی
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]
    pt.x += pt.vx
    pt.y += pt.vy
    pt.alpha -= 0.025
    if (pt.alpha <= 0) {
      particles.splice(i, 1)
      continue
    }
    ctx.save()
    ctx.fillStyle = pt.color
    ctx.globalAlpha = Math.max(0, pt.alpha)
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ۵. متون شناور
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i]
    ft.y += ft.vy
    ft.alpha -= 0.015
    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1)
      continue
    }
    ctx.save()
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = ft.color
    ctx.globalAlpha = Math.max(0, ft.alpha)
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 6
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }
}

function gameLoop(): void {
  renderConquestMap()
  animationFrameId = requestAnimationFrame(gameLoop)
}

onMounted(async () => {
  await profilesStore.load()
  await loadGameQuestionBank()
  await gameHistoryStore.loadFromDb()
  currentMotivationalQuote.value = pickRandomMotivationalQuote()
  checkOrientation()
  window.addEventListener('resize', checkOrientation)
  animationFrameId = requestAnimationFrame(gameLoop)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', checkOrientation)
})
</script>

<template>
  <div class="game-root relative min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans select-none overflow-x-hidden transition-colors" dir="rtl">
    <!-- راهنمای چرخاندن گوشی در حالت عمودی -->
    <div
      v-if="isPortraitMobile && !dismissRotationWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-md"
    >
      <div class="max-w-sm rounded-3xl border border-cyan-500/40 bg-slate-900/90 p-6 text-center shadow-2xl">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-3xl">
          🔄
        </div>
        <h3 class="text-xl font-bold text-white">گوشی را افقی بچرخانید</h3>
        <p class="mt-2 text-sm text-slate-300">
          برای نظارت کامل بر نقشه قلمروها و تسلط بر راه‌های لشکرکشی دانش، لطفاً دستگاه خود را در حالت افقی (Landscape) قرار دهید.
        </p>
        <button
          type="button"
          class="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 py-3 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
          @click="dismissRotationWarning = true"
        >
          ادامه به صورت فعلی
        </button>
      </div>
    </div>

    <!-- هدر بازی با پشتیبانی تم روشن و تیره -->
    <header class="flex items-center justify-between border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-4 py-3 backdrop-blur-md sm:px-6 transition-colors">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          title="بازگشت به خانه"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </RouterLink>
        <div>
          <h1 class="flex items-center gap-2 text-base sm:text-lg font-black">
            <span>🗺️</span>
            <span class="bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-emerald-400 dark:to-indigo-400">
              فتح قلمروهای دانش
            </span>
            <span class="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 sm:inline-block">
              استراتژیک نقشه و جغرافیا
            </span>
          </h1>
        </div>
      </div>

      <!-- وضعیت فتح و منابع در حین بازی -->
      <div v-if="gameState === 'playing'" class="flex items-center gap-2 sm:gap-4">
        <!-- قلمروهای فتح شده -->
        <div class="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/40">
          <span class="text-base">🚩</span>
          <span class="font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
            {{ liberatedCount }} / {{ territories.length }}
          </span>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">قلمرو فتح‌شده</span>
        </div>

        <!-- کریستال دانش -->
        <div class="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-1.5 dark:bg-amber-950/40">
          <span class="text-base">💎</span>
          <span class="font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base">{{ crystals }}</span>
        </div>

        <!-- امتیاز کل -->
        <div class="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/40">
          <span class="text-xs">⭐</span>
          <span class="font-black text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm">{{ score }}</span>
        </div>
      </div>

      <!-- کنترل صدا -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          :class="{ 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400': soundEnabled }"
          @click="toggleSound"
          :title="soundEnabled ? 'قطع صدا' : 'وصل صدا'"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </header>

    <!-- نوار پروفایل دانش‌آموز، مسیر فصلی و ابزارها -->
    <div class="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
      <GameProfileBar
        :current-season-key="activeSeasonKey"
        @open-journey="showJourneyModal = true"
        @open-medals="showMedalsModal = true"
        @open-analytics="showAnalyticsModal = true"
      />
    </div>

    <!-- ۱. صفحه آماده‌سازی و انتخاب لشکرکشی (Setup Screen) -->
    <main v-if="gameState === 'setup'" class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div class="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        <!-- پیام انگیزشی بالای صفحه -->
        <div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
          🌟 {{ currentMotivationalQuote }}
        </div>

        <div class="text-center">
          <div class="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-600 shadow-xl shadow-emerald-500/20 text-4xl mb-4 text-white">
            🗺️
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">اتاق نقشه و استراتژی فتح قلمروها</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            سرزمین‌های کهن ایران در مه نادانی فرو رفته‌اند! با هدایت کاروان‌های کاوش و پاسخ به سوالات جغرافیا، تاریخ، مطالعات و علوم، پرچم دانایی را بر فراز تمام قلعه‌ها برافرازید.
          </p>
        </div>

        <!-- انتخاب پایه تحصیلی -->
        <div class="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            ۱. انتخاب پایه تحصیلی دانش‌آموز:
          </label>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              v-for="g in GAME_GRADES"
              :key="g"
              type="button"
              class="rounded-2xl border p-3 text-center font-bold text-sm transition-all"
              :class="
                selectedGrade === g
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="selectedGrade = g"
            >
              پایه {{ g }} دبستان
            </button>
          </div>
        </div>

        <!-- انتخاب دروس -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-bold text-slate-700 dark:text-slate-300">
              ۲. انتخاب دروس کارزار فتح (می‌توانید چند درس را برگزینید):
            </label>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {{ selectedCourseIds.length }} درس انتخاب‌شده
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in availableCoursesForGrade"
              :key="c.id"
              type="button"
              class="flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all"
              :class="
                selectedCourseIds.includes(c.id)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="toggleCourseSelection(c.id)"
            >
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: c.color }" />
              <span>{{ c.name }}</span>
            </button>
          </div>
        </div>

        <!-- انتخاب فرمانده کاوش -->
        <div class="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            ۳. انتخاب فرمانده اردوی فتح قلمروها:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="cmd in COMMANDERS"
              :key="cmd.id"
              class="flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer"
              :class="
                selectedCommanderId === cmd.id
                  ? 'border-emerald-500 bg-emerald-50 text-slate-900 shadow-md ring-2 ring-emerald-500 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="selectedCommanderId = cmd.id"
            >
              <div class="text-4xl mb-2">{{ cmd.avatar }}</div>
              <h4 class="font-black text-base">{{ cmd.name }}</h4>
              <p class="text-xs text-emerald-600 dark:text-emerald-300 font-bold mt-0.5">{{ cmd.perkTitle }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-300 mt-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-2 w-full">
                {{ cmd.perkDescription }}
              </p>
            </div>
          </div>
        </div>

        <!-- دکمه ورود به نقشه -->
        <div class="mt-10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            class="w-full sm:w-80 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-600 py-4 font-black text-lg text-white shadow-xl shadow-emerald-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            :disabled="selectedCourseIds.length === 0"
            @click="startMission"
          >
            گشودن نقشه و آغاز فتح قلمروها 🗺️
          </button>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            تعداد سوالات فعال در این چالش: <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ eligibleQuestions.length }}</span> سوال
          </p>
        </div>
      </div>
    </main>

    <!-- ۲. شمارش معکوس ورود به کارزار نقشه -->
    <div
      v-if="gameState === 'countdown'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
    >
      <div class="text-center max-w-md">
        <div class="text-8xl font-black bg-gradient-to-b from-amber-300 via-emerald-400 to-indigo-500 bg-clip-text text-transparent animate-bounce">
          {{ countdownNumber }}
        </div>
        <p class="mt-4 text-xl font-bold text-white">در حال گشودن اطلس جغرافیای دانش...</p>
        <div class="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-4 shadow-xl">
          <p class="text-sm font-bold text-emerald-300">💡 یادآوری انگیزشی:</p>
          <p class="text-xs text-slate-200 mt-1 leading-relaxed">{{ currentMotivationalQuote }}</p>
        </div>
      </div>
    </div>

    <!-- ۳. صحنه اصلی نقشه و کارزار فتح (Playing Map) -->
    <div v-show="gameState === 'playing'" class="relative flex flex-col items-center w-full px-2 py-4">
      <div class="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-slate-100 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <canvas
          ref="canvasRef"
          width="960"
          height="540"
          class="w-full h-auto cursor-pointer block"
          @click="handleCanvasClick"
          @mousemove="handleCanvasMouseMove"
        />

        <!-- راهنمای بالای نقشه -->
        <div class="absolute top-3 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 rounded-2xl bg-white/80 dark:bg-slate-950/80 px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 backdrop-blur-sm">
          <span>💡 روی هر قلمروی فعال کلیک کنید تا چالش فتح آن آغاز شود</span>
        </div>

        <!-- HUD هولوگرافیک سوالات کتاب درسی (مستقر در سمت راست نقشه بدون هم‌پوشانی) -->
        <div
          v-if="currentQuestion && selectedTerritory"
          class="absolute top-2 right-2 sm:top-3 sm:right-3 w-[calc(100%-1rem)] sm:w-96 max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-1.5rem)] z-30 flex flex-col transition-all duration-300 pointer-events-auto"
        >
          <div class="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl border border-emerald-500/40 bg-white/95 p-2.5 sm:p-4 shadow-2xl backdrop-blur-md dark:bg-slate-950/85 transition-colors">
            <div class="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 dark:border-slate-800">
              <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span class="text-xs font-black text-amber-500 truncate">⚡ چالش فتح {{ selectedTerritory.name }}:</span>
                <span class="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {{ findCourse(BASE_COURSES, currentQuestion.courseId)?.name || 'کتاب درسی' }}
                </span>
              </div>
              <button
                type="button"
                class="shrink-0 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                @click="showHoloDeck = !showHoloDeck"
              >
                {{ showHoloDeck ? '▼ جمع‌کردن' : '▲ بازکردن' }}
              </button>
            </div>

            <div v-show="showHoloDeck" class="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
              <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-snug sm:leading-relaxed mb-2 sm:mb-3">
                {{ currentQuestion.text }}
              </p>

              <div class="grid grid-cols-1 min-[480px]:grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  v-for="(option, idx) in currentQuestion.options"
                  :key="idx"
                  type="button"
                  class="rounded-xl border p-2 text-right text-xs font-medium transition-all"
                  :class="
                    hasAnsweredCurrent
                      ? String(idx) === String(currentQuestion.correctAnswer)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-200'
                        : selectedOptionIndex === idx
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                        : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800'
                  "
                  :disabled="hasAnsweredCurrent"
                  @click="answerQuestion(idx)"
                >
                  <span class="font-bold text-emerald-600 dark:text-emerald-400 ml-1.5">{{ idx + 1 }}.</span>
                  <span>{{ option }}</span>
                </button>
              </div>

              <div v-if="hasAnsweredCurrent && !wasAnswerCorrect" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 dark:border-rose-500/30 dark:bg-rose-950/40">
                <div class="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                  <span>❌</span>
                  <span>پاسخ نادرست بود! حمله دفع شد.</span>
                </div>
                <p class="text-[11px] text-slate-700 dark:text-slate-300">
                  <strong class="text-emerald-600 dark:text-emerald-300">پاسخ صحیح:</strong>
                  {{ currentQuestion.options[Number(currentQuestion.correctAnswer)] }}
                </p>
                <p v-if="currentQuestion.explanation" class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  💡 {{ currentQuestion.explanation }}
                </p>
                <button
                  type="button"
                  class="mt-2 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                  @click="retryWithNewQuestion"
                >
                  🔄 سوال بعدی / تلاش مجدد
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- دکمه درخواست سوال جدید در صورت بسته بودن (سمت چپ نقشه) -->
        <button
          v-if="!showHoloDeck || !currentQuestion"
          type="button"
          class="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-2xl border border-emerald-500/50 bg-white/90 px-4 py-2 text-xs font-bold text-emerald-800 shadow-xl backdrop-blur-md hover:bg-emerald-50 dark:bg-slate-950/80 dark:text-emerald-300 dark:hover:bg-emerald-950 transition-all pointer-events-auto"
          @click="selectedTerritory && pickQuestionForTerritory(selectedTerritory)"
        >
          <span>⚡</span>
          <span>دریافت چالش قلمرو (+۲۰۰ امتیاز)</span>
        </button>
      </div>

      <!-- راهنمای قلمروهای نقشه در زیر بوم -->
      <div class="mt-4 flex flex-wrap items-center justify-center gap-3 max-w-5xl text-xs text-slate-500 dark:text-slate-400">
        <span class="font-bold text-slate-700 dark:text-slate-300">🗺️ قلمروهای شش‌گانه:</span>
        <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">🌲 هیرکانی و البرز</span>
        <span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">🏔️ کهن زاگرس</span>
        <span class="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">🏰 پایتخت فرزانگی</span>
        <span class="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">🏜️ کویر و ستارگان</span>
        <span class="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">🌊 خلیج همیشگی فارس</span>
        <span class="flex items-center gap-1 text-pink-600 dark:text-pink-400">🌍 جاده ابریشم و جهان</span>
      </div>
    </div>

    <!-- ۴. جشن فتح کامل نقشه و پیروزی بزرگ (Victory Screen) -->
    <div
      v-if="gameState === 'victory'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
    >
      <div class="max-w-md w-full rounded-3xl border border-emerald-500/40 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
        <div class="text-6xl mb-3">👑🚩</div>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white">فتح بزرگ تمام قلمروهای دانش!</h3>
        <p class="text-sm text-slate-500 dark:text-slate-300 mt-2">
          تبریک! پرچم خرد و دانایی بر فراز تمامی سرزمین‌های کهن و قلمروهای شش‌گانه به اهتزاز درآمد و مه نادانی به طور کامل برچیده شد!
        </p>

        <!-- آمار پیروزی -->
        <div class="my-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4">
          <div>
            <div class="text-xs text-slate-400">امتیاز نهایی استراتژیک</div>
            <div class="text-xl font-black text-amber-500 mt-0.5">{{ score }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">قلمروهای آزاد شده</div>
            <div class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">۶ از ۶ قلمرو</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">تست‌های حل شده</div>
            <div class="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {{ sessionAnswers.filter((a) => a.isCorrect).length }} / {{ sessionAnswers.length }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-400">درصد دقت</div>
            <div class="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {{ sessionAnswers.length > 0 ? Math.round((sessionAnswers.filter((a) => a.isCorrect).length / sessionAnswers.length) * 100) : 100 }}%
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-600 py-3.5 font-black text-white shadow-lg transition hover:scale-105 active:scale-95"
            @click="gameState = 'setup'"
          >
            کاوش جدید 🗺️
          </button>
          <button
            type="button"
            class="rounded-2xl border border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950 px-4 py-3.5 font-bold text-indigo-700 dark:text-indigo-300"
            @click="showAnalyticsModal = true"
          >
            مشاهده گزارش 📊
          </button>
        </div>
      </div>
    </div>

    <!-- کامپوننت‌های مودال جامع -->
    <GameJourneyModal
      v-if="showJourneyModal"
      @close="showJourneyModal = false"
      @select-stage="handleSelectStage"
    />

    <GameMedalsModal
      v-if="showMedalsModal"
      @close="showMedalsModal = false"
    />

    <GameAnalyticsModal
      v-if="showAnalyticsModal"
      @close="showAnalyticsModal = false"
    />
  </div>
</template>
