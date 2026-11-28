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
import { GAME_GRADE_COURSE_IDS, loadGradeQuestions } from '@/config/game-grades.config'
import { getCurrentSeasonKey, MOTIVATIONAL_QUOTES } from '@/config/game-seasons.config'
import type { DifficultyLevel, GameHistorySession, GameSeasonKey, GameStage, QuestionAnswerRecord } from '@/types'

// کامپوننت‌های الحاقی پیشرفته
import GameProfileBar from '@/components/games/GameProfileBar.vue'
import GameJourneyModal from '@/components/games/GameJourneyModal.vue'
import GameMedalsModal from '@/components/games/GameMedalsModal.vue'
import GameAnalyticsModal from '@/components/games/GameAnalyticsModal.vue'

// --- نقشه‌ها و اطلاعات درسی پایه‌ها ---
const GRADE_COURSES_MAP: Record<number, string[]> = GAME_GRADE_COURSE_IDS

// کاراکترهای قهرمان بازی
interface HeroCharacter {
  id: 'aria' | 'sara' | 'nitro'
  name: string
  title: string
  avatar: string
  color: string
  description: string
}

const HEROES: HeroCharacter[] = [
  {
    id: 'aria',
    name: 'آریا',
    title: 'خلبان شجاع هوافضا',
    avatar: '👨‍🚀',
    color: '#06b6d4',
    description: 'متخصص شلیک‌های زاویه‌دار و موشک‌های پلاسمای پرسرعت',
  },
  {
    id: 'sara',
    name: 'سارا',
    title: 'دانشمند کهکشانی',
    avatar: '👩‍🔬',
    color: '#a855f7',
    description: 'استاد محاسبات دقیق و توپخانه‌های الکترومغناطیسی',
  },
  {
    id: 'nitro',
    name: 'نیترو',
    title: 'ربات نابغه کیهانی',
    avatar: '🤖',
    color: '#10b981',
    description: 'مجهز به سیستم هدف‌یابی خودکار و رادارهای تقویت‌شده',
  },
]

// وضعیت‌های اصلی بازی
type GameState = 'setup' | 'countdown' | 'playing'
const gameState = ref<GameState>('setup')
const countdownNumber = ref(3)

// --- متغیرهای تنظیمات مأموریت ---
const selectedGrade = ref<number>(4)
const selectedCourseIds = ref<string[]>(['science', 'math'])
const subjectDifficulties = ref<Record<string, DifficultyLevel | 'all'>>({
  science: 'all',
  math: 'all',
  'persian-reading': 'all',
  quran: 'all',
  'heaven-gifts': 'all',
  'social-studies': 'all',
  'thinking-research': 'all',
  'work-tech': 'all',
})
const selectedHeroId = ref<'aria' | 'sara' | 'nitro'>('aria')

const activeHero = computed(() => HEROES.find((h) => h.id === selectedHeroId.value) || HEROES[0])

// دروس مجاز برای پایه انتخاب شده
const availableCoursesForGrade = computed(() => {
  const ids = GRADE_COURSES_MAP[selectedGrade.value] || []
  return BASE_COURSES.filter((c) => ids.includes(c.id))
})

// هماهنگی دروس با تغییر پایه
watch(selectedGrade, (newGrade) => {
  const allowed = GRADE_COURSES_MAP[newGrade] || []
  selectedCourseIds.value = selectedCourseIds.value.filter((id) => allowed.includes(id))
  if (selectedCourseIds.value.length === 0 && allowed.length > 0) {
    selectedCourseIds.value = [allowed[0]]
  }
})

function toggleSubject(courseId: string): void {
  const idx = selectedCourseIds.value.indexOf(courseId)
  if (idx >= 0) {
    if (selectedCourseIds.value.length > 1) {
      selectedCourseIds.value.splice(idx, 1)
    }
  } else {
    selectedCourseIds.value.push(courseId)
  }
}

function selectAllSubjects(): void {
  selectedCourseIds.value = availableCoursesForGrade.value.map((c) => c.id)
}

// --- مدیریت فروشگاه سوالات و بارگذاری ---
const questionsStore = useQuestionsStore()
const gameHistoryStore = useGameHistoryStore()
const extraCurriculumQuestions = ref<EducationalQuestion[]>([])

async function loadGameQuestionBank(): Promise<void> {
  extraCurriculumQuestions.value = await loadGradeQuestions(selectedGrade.value)
}

watch(selectedGrade, () => {
  void loadGameQuestionBank()
})

// تجمیع سوالات بدون موارد تکراری
const allQuestions = computed<EducationalQuestion[]>(() => {
  const existingTexts = new Set(questionsStore.items.map((q) => q.text))
  const dbItems: EducationalQuestion[] = questionsStore.items.map((q) => ({
    ...q,
    explanation:
      (q as unknown as { explanation?: string }).explanation ||
      'با بررسی دقیق کتاب درسی و مفاهیم فصل، به پاسخ صحیح دست پیدا می‌کنید.',
  }))
  const extras = extraCurriculumQuestions.value.filter((q) => !existingTexts.has(q.text))
  return [...DEFAULT_CURRICULUM_QUESTIONS, ...extras, ...dbItems]
})

// فیلتر هوشمند سوالات بر اساس تنظیمات مأموریت
const eligibleQuestions = computed(() => {
  return allQuestions.value.filter((q) => {
    if (q.grade !== selectedGrade.value) return false
    if (!selectedCourseIds.value.includes(q.courseId)) return false
    const diff = subjectDifficulties.value[q.courseId]
    if (diff && diff !== 'all' && q.difficulty !== diff) return false
    return true
  })
})

// استورهای سیستم
const profilesStore = useGameProfilesStore()
useGameChromeInsets()

// متغیرهای فصلی و مراحل
const activeSeasonKey = ref<GameSeasonKey>(getCurrentSeasonKey())
const selectedStage = ref<GameStage | null>(null)
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)
const currentMotivationalQuote = ref<string>('')

function pickRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  return MOTIVATIONAL_QUOTES[randomIndex].text
}

// همگام‌سازی پایه با دانش‌آموز فعال
watch(
  () => profilesStore.activeProfile?.grade,
  (newGrade) => {
    if (newGrade) selectedGrade.value = newGrade
  },
  { immediate: true }
)

// --- متغیرهای تاریخچه و زمان‌سنجی جلسه جاری ---
const currentSessionId = ref<string>('')
const gameStartTime = ref<number>(0)
const sessionAnswers = ref<QuestionAnswerRecord[]>([])
const sessionShotsFired = ref<number>(0)
const sessionShotsHit = ref<number>(0)
const questionShownAt = ref<number>(0)
const showHistoryModal = ref(false)
const detailedHistorySession = ref<GameHistorySession | null>(null)

// --- متغیرهای فیزیک و رندر بازی ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null

const score = ref(0)
const wave = ref(1)
const angle = ref(45)
const power = ref(65)
const wind = ref(0)
const soundEnabled = ref(true)
const isFullscreen = ref(false)

// وضعیت سوال جاری (HUD هولوگرافیک)
const showHoloDeck = ref(true)
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnsweredCurrent = ref(false)
const wasAnswerCorrect = ref(false)
const hasLaserBuff = ref(false)
const hasDoubleDamageBuff = ref(false)

// شرط شلیک: فقط در صورت پاسخ صحیح قفل موشک باز می‌شود!
const canFire = computed(() => {
  return (
    gameState.value === 'playing' &&
    hasAnsweredCurrent.value &&
    wasAnswerCorrect.value &&
    !isFiring.value &&
    !showWaveCompleteModal.value
  )
})

// وضعیت دشمن و پرتاب‌کننده
interface EnemyState {
  x: number
  y: number
  radius: number
  maxHp: number
  hp: number
  name: string
  avatar: string
  color: string
  shake: number
}

const enemy = ref<EnemyState>({
  x: 520,
  y: 220,
  radius: 28,
  maxHp: 100,
  hp: 100,
  name: 'حبابک فضایی (Globy)',
  avatar: '👾',
  color: '#f43f5e',
  shake: 0,
})

const launcherPos = { x: 80, y: 320 }
const isFiring = ref(false)
const feedbackMessage = ref('')
const showWaveCompleteModal = ref(false)
let screenShake = 0

// ذرات انفجار، آتش و دود
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  life: number
}
let particles: Particle[] = []

// پرتابه موشک
interface RocketState {
  x: number
  y: number
  vx: number
  vy: number
  trail: { x: number; y: number }[]
  active: boolean
}
let rocket: RocketState | null = null

// متون شناور امتیاز (Floating Damage Text)
interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
}
let floatingTexts: FloatingText[] = []

// --- چرخش صفحه در موبایل (Orientation Guard) ---
const isPortraitMobile = ref(false)
const dismissRotationWarning = ref(false)

function checkOrientation(): void {
  if (typeof window === 'undefined') return
  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const isSmallScreen = window.innerWidth <= 1024
  isPortraitMobile.value = isPortrait && isSmallScreen
}

async function requestLandscapeAndFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
      if ('orientation' in screen && 'lock' in (screen.orientation as unknown as { lock: (mode: string) => Promise<void> })) {
        try {
          await (screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape')
        } catch {}
      }
    }
  } catch {}
  dismissRotationWarning.value = true
}

function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value
  sfx.enabled = soundEnabled.value
}

// انتخاب سوال بعدی و راه‌اندازی تایمر پاسخگویی
function pickNextQuestion(): void {
  const pool = eligibleQuestions.value.length > 0 ? eligibleQuestions.value : allQuestions.value
  if (!pool.length) return
  const randomIndex = Math.floor(Math.random() * pool.length)
  currentQuestion.value = pool[randomIndex]
  selectedOptionIndex.value = null
  hasAnsweredCurrent.value = false
  wasAnswerCorrect.value = false
  showHoloDeck.value = true
  questionShownAt.value = Date.now()
}

// پاسخ به سوال و ثبت زمان دقیق تفکر و پاسخگویی
function answerQuestion(index: number): void {
  if (hasAnsweredCurrent.value || !currentQuestion.value) return
  selectedOptionIndex.value = index
  hasAnsweredCurrent.value = true

  const durationSeconds = Number(((Date.now() - questionShownAt.value) / 1000).toFixed(1))
  const isCorrect = String(index) === String(currentQuestion.value.correctAnswer)
  wasAnswerCorrect.value = isCorrect

  // ثبت در گزارش کارنامه جلسه
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
    sfx.playCharge()
    score.value += 120
    hasLaserBuff.value = true
    hasDoubleDamageBuff.value = true

    floatingTexts.push({
      x: launcherPos.x + 30,
      y: launcherPos.y - 40,
      text: `⚡ پاسخ صحیح در ${durationSeconds} ثانیه! قفل پرتاب باز شد`,
      color: '#10b981',
      alpha: 1,
      vy: -1.2,
    })

    // بستن خودکار پنل پس از پاسخ درست تا کاربر بدون مانع نشانه‌گیری کند
    const answeredId = currentQuestion.value.id
    setTimeout(() => {
      if (currentQuestion.value?.id === answeredId && hasAnsweredCurrent.value && wasAnswerCorrect.value) {
        showHoloDeck.value = false
      }
    }, 1300)
  } else {
    sfx.playIncorrect()
    hasLaserBuff.value = false
    hasDoubleDamageBuff.value = false
  }

  // بروزرسانی تاریخچه زنده در دیتابیس
  saveCurrentSessionSnapshot()
}

// تلاش مجدد و گرفتن سوال جدید در صورت اشتباه
function retryWithNewQuestion(): void {
  pickNextQuestion()
}

// شروع مأموریت با شمارش معکوس
function startMission(): void {
  if (selectedCourseIds.value.length === 0) {
    alert('لطفاً حداقل یک درس را انتخاب کنید.')
    return
  }
  currentSessionId.value = crypto.randomUUID()
  gameStartTime.value = Date.now()
  sessionAnswers.value = []
  sessionShotsFired.value = 0
  sessionShotsHit.value = 0
  score.value = 0

  currentMotivationalQuote.value = pickRandomMotivationalQuote()
  gameState.value = 'countdown'
  countdownNumber.value = 3
  sfx.playCountdown(false)

  const timer = setInterval(() => {
    countdownNumber.value -= 1
    if (countdownNumber.value > 0) {
      sfx.playCountdown(false)
    } else {
      clearInterval(timer)
      sfx.playCountdown(true)
      gameState.value = 'playing'
      initWave(1)
    }
  }, 900)
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
  startMission()
}

function openMissionSetup(): void {
  saveCurrentSessionSnapshot()
  gameState.value = 'setup'
  showWaveCompleteModal.value = false
  isFiring.value = false
}

// ذخیره گزارش و تاریخچه جلسه بازی در دیتابیس
async function saveCurrentSessionSnapshot(): Promise<void> {
  if (!currentSessionId.value || sessionAnswers.value.length === 0) return

  const totalDuration = Math.round((Date.now() - gameStartTime.value) / 1000)
  const totalQuestions = sessionAnswers.value.length
  const correctCount = sessionAnswers.value.filter((a) => a.isCorrect).length
  const accuracy =
    sessionShotsFired.value > 0 ? Math.round((sessionShotsHit.value / sessionShotsFired.value) * 100) : 0

  const session: GameHistorySession = {
    id: currentSessionId.value,
    studentId: profilesStore.activeProfile?.id,
    studentName: profilesStore.activeProfile?.name,
    gameType: 'rocket',
    gameTitle: 'نبرد موشکی علمی',
    heroId: activeHero.value.id,
    heroName: activeHero.value.name,
    grade: selectedGrade.value,
    season: activeSeasonKey.value,
    stageId: selectedStage.value?.id,
    selectedCourses: [...selectedCourseIds.value],
    startedAt: gameStartTime.value,
    endedAt: Date.now(),
    totalDurationSeconds: Math.max(1, totalDuration),
    score: score.value,
    wavesCleared: wave.value - 1,
    shotsFired: sessionShotsFired.value,
    shotsHit: sessionShotsHit.value,
    accuracyPercentage: accuracy,
    totalQuestionsAnswered: totalQuestions,
    correctAnswersCount: correctCount,
    answers: [...sessionAnswers.value],
  }

  await gameHistoryStore.save(session)
  await profilesStore.recordMissionOutcome(session)
}

// ساخت مرحله جدید و تنظیم دشمن
function initWave(waveNum: number): void {
  wave.value = waveNum
  const enemyRoster = [
    { name: 'حبابک فضایی (Globy)', avatar: '👾', color: '#f43f5e', maxHp: 80 },
    { name: 'دروید نگهبان (MetalBot)', avatar: '🛸', color: '#06b6d4', maxHp: 120 },
    { name: 'اژدهای کیهانی (Cosmo Dragon)', avatar: '🐲', color: '#a855f7', maxHp: 160 },
    { name: 'سفینه مادر ارتش بیگانگان', avatar: '👽', color: '#eab308', maxHp: 210 },
  ]
  const enemyProfile = enemyRoster[(waveNum - 1) % enemyRoster.length]

  enemy.value = {
    x: 520,
    y: 220,
    radius: 28,
    maxHp: enemyProfile.maxHp + (waveNum - 1) * 20,
    hp: enemyProfile.maxHp + (waveNum - 1) * 20,
    name: enemyProfile.name,
    avatar: enemyProfile.avatar,
    color: enemyProfile.color,
    shake: 0,
  }

  const canvas = canvasRef.value
  const width = canvas ? canvas.width : 760
  const height = canvas ? canvas.height : 400

  const minX = Math.max(380, width * 0.55)
  const maxX = width - 80
  enemy.value.x = minX + Math.random() * Math.max(40, maxX - minX)
  enemy.value.y = height - 120 - Math.random() * 80

  wind.value = waveNum > 1 ? Number(((Math.random() - 0.5) * 4.5).toFixed(1)) : 0
  feedbackMessage.value = ''
  showWaveCompleteModal.value = false
  pickNextQuestion()
}

// شلیک موشک (فقط در صورت داشتن مجوز پاسخ صحیح)
function fireRocket(): void {
  if (!canFire.value) {
    if (!hasAnsweredCurrent.value) {
      alert('🔒 ابتدا به سوال مأموریت پاسخ دهید تا قفل پرتابگر باز شود.')
      showHoloDeck.value = true
    } else if (!wasAnswerCorrect.value) {
      alert('🔒 پاسخ شما نادرست بود. دکمه «تلاش مجدد» را بزنید و پاسخ درست دهید تا موشک شارژ شود.')
    }
    return
  }

  isFiring.value = true
  sessionShotsFired.value++
  feedbackMessage.value = ''
  sfx.playLaunch()

  const rad = (angle.value * Math.PI) / 180
  const speed = (power.value / 100) * 16.5

  rocket = {
    x: launcherPos.x + Math.cos(rad) * 42,
    y: launcherPos.y - Math.sin(rad) * 42,
    vx: Math.cos(rad) * speed,
    vy: -Math.sin(rad) * speed,
    trail: [],
    active: true,
  }

  createExplosion(rocket.x, rocket.y, false, 8)
}

function createExplosion(x: number, y: number, isHit: boolean, countOverride?: number): void {
  const count = countOverride ?? (isHit ? 45 : 20)
  const colors = isHit
    ? ['#fbbf24', '#f97316', '#ef4444', '#10b981', '#38bdf8', '#ffffff']
    : ['#94a3b8', '#64748b', '#cbd5e1']

  for (let i = 0; i < count; i++) {
    const angleRand = Math.random() * Math.PI * 2
    const speed = 1.2 + Math.random() * (isHit ? 7 : 3.5)
    particles.push({
      x,
      y,
      vx: Math.cos(angleRand) * speed,
      vy: Math.sin(angleRand) * speed,
      radius: 2 + Math.random() * (isHit ? 4.5 : 2.5),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      life: 0.8 + Math.random() * 0.5,
    })
  }
}

// --- حلقه رندر بوم بازی ---
let globalTime = 0

function renderLoop(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  globalTime += 0.02
  ctx.save()

  if (screenShake > 0) {
    const sx = (Math.random() - 0.5) * screenShake
    const sy = (Math.random() - 0.5) * screenShake
    ctx.translate(sx, sy)
    screenShake *= 0.9
    if (screenShake < 0.5) screenShake = 0
  }

  const W = canvas.width
  const H = canvas.height

  launcherPos.x = Math.max(70, W * 0.1)
  launcherPos.y = H - 65

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // ۱. پس‌زمینه (آسمان آفتابی در تم روشن / کهکشان پر ستاره در تم تاریک)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
  if (isDark) {
    skyGrad.addColorStop(0, '#020617')
    skyGrad.addColorStop(0.4, '#0f172a')
    skyGrad.addColorStop(0.75, '#1e1b4b')
    skyGrad.addColorStop(1, '#090d16')
  } else {
    skyGrad.addColorStop(0, '#38bdf8')
    skyGrad.addColorStop(0.4, '#7dd3fc')
    skyGrad.addColorStop(0.75, '#bae6fd')
    skyGrad.addColorStop(1, '#e0f2fe')
  }
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W, H)

  if (isDark) {
    // ستاره‌های چشمک‌زن
    for (let i = 0; i < 45; i++) {
      const sx = (i * 97) % W
      const sy = (i * 43) % (H - 120)
      const flicker = 0.3 + 0.7 * Math.abs(Math.sin(globalTime * 2 + i))
      ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`
      const size = i % 4 === 0 ? 2.5 : 1.5
      ctx.fillRect(sx, sy, size, size)
    }
  } else {
    // ابرهای سفید و پف‌دار در آسمان روز
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 210 + globalTime * 20) % (W + 200)) - 100
      const cy = 40 + (i % 3) * 35
      ctx.beginPath()
      ctx.arc(cx, cy, 26, 0, Math.PI * 2)
      ctx.arc(cx + 22, cy - 8, 20, 0, Math.PI * 2)
      ctx.arc(cx + 42, cy, 24, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // خورشید تابان (روشن) یا سیاره حلقه‌دار (تاریک)
  ctx.save()
  const moonX = W * 0.82
  const moonY = 75
  const moonGrad = ctx.createRadialGradient(moonX - 8, moonY - 8, 4, moonX, moonY, 32)
  if (isDark) {
    moonGrad.addColorStop(0, '#fef08a')
    moonGrad.addColorStop(0.7, '#f59e0b')
    moonGrad.addColorStop(1, '#78350f')
    ctx.fillStyle = moonGrad
    ctx.beginPath()
    ctx.arc(moonX, moonY, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(moonX, moonY, 48, 12, -0.25, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    moonGrad.addColorStop(0, '#ffffff')
    moonGrad.addColorStop(0.3, '#fef08a')
    moonGrad.addColorStop(0.8, '#f59e0b')
    moonGrad.addColorStop(1, '#ea580c')
    ctx.fillStyle = moonGrad
    ctx.beginPath()
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // ۲. کوه‌های دور
  ctx.fillStyle = isDark ? '#1e1b4b' : '#93c5fd'
  ctx.beginPath()
  ctx.moveTo(0, H - 70)
  for (let x = 0; x <= W; x += 30) {
    const my = H - 130 - Math.sin(x * 0.007) * 45 - Math.cos(x * 0.015) * 25
    ctx.lineTo(x, my)
  }
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()

  // ۳. تپه‌های میانی
  ctx.fillStyle = isDark ? '#064e3b' : '#34d399'
  ctx.beginPath()
  ctx.moveTo(0, H - 60)
  for (let x = 0; x <= W; x += 25) {
    const hy = H - 95 - Math.sin(x * 0.01 + 1) * 28
    ctx.lineTo(x, hy)
  }
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()

  // ۴. زمین پیش‌زمینه
  const groundGrad = ctx.createLinearGradient(0, H - 70, 0, H)
  if (isDark) {
    groundGrad.addColorStop(0, '#042f2e')
    groundGrad.addColorStop(1, '#021815')
  } else {
    groundGrad.addColorStop(0, '#10b981')
    groundGrad.addColorStop(1, '#047857')
  }
  ctx.fillStyle = groundGrad
  ctx.beginPath()
  ctx.moveTo(0, H - 55)
  ctx.bezierCurveTo(W * 0.25, H - 75, W * 0.5, H - 45, W * 0.75, H - 85)
  ctx.quadraticCurveTo(W * 0.9, H - 95, W, H - 65)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()

  ctx.strokeStyle = isDark ? '#10b981' : '#34d399'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(0, H - 55)
  ctx.bezierCurveTo(W * 0.25, H - 75, W * 0.5, H - 45, W * 0.75, H - 85)
  ctx.quadraticCurveTo(W * 0.9, H - 95, W, H - 65)
  ctx.stroke()

  // ۵. خط کمکی لیزر در صورت فعال بودن باف
  if (hasLaserBuff.value && !isFiring.value) {
    ctx.save()
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'
    ctx.lineWidth = 2.5
    ctx.setLineDash([5, 5])
    ctx.beginPath()

    const rad = (angle.value * Math.PI) / 180
    const speed = (power.value / 100) * 16.5
    let simX = launcherPos.x + Math.cos(rad) * 42
    let simY = launcherPos.y - Math.sin(rad) * 42
    let simVx = Math.cos(rad) * speed
    let simVy = -Math.sin(rad) * speed
    const gravity = 0.22

    ctx.moveTo(simX, simY)
    for (let t = 0; t < 70; t++) {
      simVx += wind.value * 0.008
      simVy += gravity
      simX += simVx
      simY += simVy
      ctx.lineTo(simX, simY)
      if (simY >= H - 55) break
    }
    ctx.stroke()
    ctx.restore()
  }

  // ۶. رسم پرتاب‌کننده و کاراکتر خلبان
  ctx.save()
  const bobY = Math.sin(globalTime * 3) * 2.5
  ctx.translate(launcherPos.x, launcherPos.y + bobY)

  // بدنه تانک پرتاب‌کننده
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(-26, -10, 52, 20)
  ctx.strokeStyle = canFire.value ? '#10b981' : activeHero.value.color
  ctx.lineWidth = 2
  ctx.strokeRect(-26, -10, 52, 20)

  // چرخ‌ها
  ctx.fillStyle = '#0f172a'
  for (let wx = -20; wx <= 20; wx += 10) {
    ctx.beginPath()
    ctx.arc(wx, 10, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#475569'
    ctx.stroke()
  }

  // نشانگر شارژ LED
  ctx.fillStyle = canFire.value ? '#10b981' : '#475569'
  ctx.fillRect(-18, -6, 10, 4)
  ctx.fillRect(-4, -6, 10, 4)
  ctx.fillRect(10, -6, 10, 4)

  // خلبان قهرمان
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(activeHero.value.avatar, 0, -22)

  // لوله توپ پرتاب‌کننده
  ctx.save()
  const radAngle = (angle.value * Math.PI) / 180
  ctx.translate(0, -6)
  ctx.rotate(-radAngle)

  ctx.fillStyle = canFire.value ? '#10b981' : '#64748b'
  ctx.fillRect(0, -7, 44, 14)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeRect(0, -7, 44, 14)

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(40, -9, 6, 18)
  ctx.restore()

  ctx.restore()

  // ۷. رسم کاراکتر دشمن فضایی
  ctx.save()
  const enemyHoverY = Math.sin(globalTime * 4) * 8
  const ex = enemy.value.x + (enemy.value.shake > 0 ? (Math.random() - 0.5) * 8 : 0)
  const ey = enemy.value.y + enemyHoverY
  if (enemy.value.shake > 0) enemy.value.shake -= 1

  const shieldRadius = enemy.value.radius + 10
  const shieldGrad = ctx.createRadialGradient(ex, ey, enemy.value.radius * 0.5, ex, ey, shieldRadius)
  shieldGrad.addColorStop(0, 'rgba(244, 63, 94, 0.05)')
  shieldGrad.addColorStop(0.8, 'rgba(244, 63, 94, 0.35)')
  shieldGrad.addColorStop(1, 'rgba(244, 63, 94, 0.7)')
  ctx.fillStyle = shieldGrad
  ctx.beginPath()
  ctx.arc(ex, ey, shieldRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1e1b4b'
  ctx.beginPath()
  ctx.ellipse(ex, ey + 22, 28, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = enemy.value.color
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.font = '40px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(enemy.value.avatar, ex, ey)

  // نوار سلامت شناور
  const hpBarW = 60
  const hpBarH = 7
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(ex - hpBarW / 2, ey - 38, hpBarW, hpBarH)
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1
  ctx.strokeRect(ex - hpBarW / 2, ey - 38, hpBarW, hpBarH)

  const hpRatio = Math.max(0, enemy.value.hp / enemy.value.maxHp)
  ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444'
  ctx.fillRect(ex - hpBarW / 2 + 1, ey - 37, (hpBarW - 2) * hpRatio, hpBarH - 2)

  ctx.font = 'bold 10px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${enemy.value.name} (${Math.round(hpRatio * 100)}%)`, ex, ey - 46)

  ctx.restore()

  // ۸. موشک شلیک‌شده
  if (rocket && rocket.active) {
    const gravity = 0.22
    rocket.vx += wind.value * 0.008
    rocket.vy += gravity
    rocket.x += rocket.vx
    rocket.y += rocket.vy

    rocket.trail.push({ x: rocket.x, y: rocket.y })
    if (rocket.trail.length > 18) rocket.trail.shift()

    ctx.save()
    for (let i = 0; i < rocket.trail.length; i++) {
      const pt = rocket.trail[i]
      const alpha = (i / rocket.trail.length) * 0.75
      ctx.fillStyle = hasDoubleDamageBuff.value ? `rgba(16, 185, 129, ${alpha})` : `rgba(249, 115, 22, ${alpha})`
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, (i / rocket.trail.length) * 4.5, 0, Math.PI * 2)
      ctx.fill()
    }

    const rocketAngle = Math.atan2(rocket.vy, rocket.vx)
    ctx.translate(rocket.x, rocket.y)
    ctx.rotate(rocketAngle)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-12, -3.5, 18, 7)
    ctx.fillStyle = hasDoubleDamageBuff.value ? '#10b981' : '#f97316'
    ctx.beginPath()
    ctx.moveTo(6, -5)
    ctx.lineTo(15, 0)
    ctx.lineTo(6, 5)
    ctx.fill()
    ctx.restore()

    const distToTarget = Math.hypot(rocket.x - enemy.value.x, rocket.y - (enemy.value.y + enemyHoverY))
    if (distToTarget < enemy.value.radius + 8) {
      rocket.active = false
      isFiring.value = false
      sessionShotsHit.value++
      sfx.playExplosion()
      screenShake = 12
      enemy.value.shake = 10
      createExplosion(enemy.value.x, enemy.value.y + enemyHoverY, true)

      const damage = hasDoubleDamageBuff.value ? 75 : 40
      enemy.value.hp -= damage
      score.value += damage * 2

      floatingTexts.push({
        x: enemy.value.x,
        y: enemy.value.y - 20,
        text: `💥 اصابت موفق! -${damage} HP`,
        color: '#34d399',
        alpha: 1,
        vy: -1.5,
      })

      feedbackMessage.value = '🎯 اصابت دقیق موشک! دشمن آسیب دید.'

      if (enemy.value.hp <= 0) {
        sfx.playVictory()
        setTimeout(() => {
          showWaveCompleteModal.value = true
          saveCurrentSessionSnapshot()
        }, 600)
      } else {
        // بعد از پایان شلیک، قفل دوباره فعال می‌شود و سوال جدید می‌آید
        setTimeout(pickNextQuestion, 900)
      }
    } else if (rocket.y >= H - 55 || rocket.x > W + 60 || rocket.x < -30) {
      rocket.active = false
      isFiring.value = false
      createExplosion(rocket.x, Math.min(rocket.y, H - 55), false)
      sfx.playExplosion()
      screenShake = 4

      const missDistance = Math.round(Math.abs(rocket.x - enemy.value.x))
      if (rocket.x < enemy.value.x) {
        feedbackMessage.value = `❌ موشک ${missDistance} متر قبل از دشمن به زمین خورد! قدرت یا زاویه را بیشتر کنید.`
      } else {
        feedbackMessage.value = `❌ موشک ${missDistance} متر از روی هدف گذشت! قدرت یا زاویه را تنظیم کنید.`
      }

      // بعد از پرتاب ناموفق نیز برای شلیک بعدی باید سوال جدید پاسخ داده شود
      setTimeout(pickNextQuestion, 1200)
    }
  }

  // ۹. ذرات انفجار
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.08
    p.alpha -= 0.025
    if (p.alpha <= 0) {
      particles.splice(i, 1)
      continue
    }
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.alpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // ۱۰. متون شناور
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i]
    ft.y += ft.vy
    ft.alpha -= 0.02
    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1)
      continue
    }
    ctx.save()
    ctx.globalAlpha = ft.alpha
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = ft.color
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }

  ctx.restore()
  animationFrameId = requestAnimationFrame(renderLoop)
}

function handleResize(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  checkOrientation()
}

// فرمت‌بندی ثانیه به زمان خوانای فارسی
function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  const mins = Math.floor(s / 60)
  const remSecs = s % 60
  if (mins === 0) return `${remSecs} ثانیه`
  return `${mins} دقیقه و ${remSecs} ثانیه`
}

function formatJalaliDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
  } catch {
    return new Date(timestamp).toLocaleDateString('fa-IR')
  }
}

async function removeHistoryItem(id: string): Promise<void> {
  if (!confirm('آیا این کارنامه بازی حذف شود؟')) return
  await gameHistoryStore.remove(id)
  if (detailedHistorySession.value?.id === id) {
    detailedHistorySession.value = null
  }
}

onMounted(async () => {
  await profilesStore.load()
  loadGameQuestionBank()
  await questionsStore.loadFromDb()
  await gameHistoryStore.loadFromDb()
  currentMotivationalQuote.value = pickRandomMotivationalQuote()
  checkOrientation()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', checkOrientation)

  handleResize()
  animationFrameId = requestAnimationFrame(renderLoop)
})

onBeforeUnmount(() => {
  saveCurrentSessionSnapshot()
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', checkOrientation)
})
</script>

<template>
  <div class="game-root relative flex h-dvh w-full flex-col overflow-hidden bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-white select-none transition-colors">
    <!-- هدر بازی -->
    <header class="flex h-11 sm:h-12 shrink-0 items-center justify-between border-b border-ink-200 bg-white/90 px-3 sm:px-6 backdrop-blur z-20 dark:border-ink-800 dark:bg-ink-900/90 text-slate-800 dark:text-white transition-colors">
      <div class="flex items-center gap-2 sm:gap-3">
        <RouterLink
          to="/"
          class="flex items-center gap-1 rounded-xl border border-ink-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-200 dark:hover:border-brand-500 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">بازگشت</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-600 text-sm shadow-md shadow-brand-500/20 text-white">
            🚀
          </span>
          <div>
            <h1 class="text-xs font-black sm:text-sm">نبرد موشکی علمی</h1>
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-1 rounded-lg border border-ink-200 bg-slate-100 px-2 py-1 text-10px font-medium text-slate-700 hover:bg-slate-200 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-300 dark:hover:border-brand-400 dark:hover:text-white"
          @click="openMissionSetup"
        >
          ⚙️ مأموریت جدید
        </button>

        <button
          type="button"
          class="flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2 py-1 text-10px font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-600/40 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:text-white"
          @click="showAnalyticsModal = true"
        >
          📊 گزارش و کارنامه
        </button>
      </div>

      <!-- وضعیت امتیاز، باد و صدا -->
      <div class="flex items-center gap-2 sm:gap-4">
        <span
          class="hidden sm:flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-10px font-medium text-slate-700 border border-slate-200 dark:bg-ink-800/80 dark:text-ink-300 dark:border-ink-700"
        >
          💨 باد: {{ wind > 0 ? `+${wind} راست` : wind < 0 ? `${wind} چپ` : 'آرام' }}
        </span>

        <span
          v-if="canFire"
          class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-10px font-bold text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/40 animate-pulse"
        >
          🔓 قفل پرتاب باز است
        </span>
        <span
          v-else
          class="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-10px font-medium text-amber-700 dark:text-amber-300 border border-amber-500/30"
        >
          🔒 پرتاب قفل است
        </span>

        <div class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-amber-600 dark:border-ink-800 dark:bg-ink-800/80 dark:text-amber-400">
          <span>⭐</span>
          <span>{{ score }}</span>
        </div>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-300 dark:hover:text-white"
          :title="soundEnabled ? 'قطع صدا' : 'وصل صدا'"
          @click="toggleSound"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </header>

    <!-- ناحیه اصلی بازی (Canvas) -->
    <main class="relative flex-1 min-h-0 overflow-hidden">
      <canvas ref="canvasRef" class="absolute inset-0 h-full w-full block cursor-crosshair"></canvas>

      <!-- ۱. صفحه تنظیمات مأموریت قبل از شروع (Setup Screen) -->
      <div
        v-if="gameState === 'setup'"
        class="rocket-setup absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-900/60 dark:bg-ink-950/90 p-4 backdrop-blur-md"
      >
        <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/95 p-5 sm:p-7 shadow-2xl dark:border-brand-500/30 dark:bg-ink-900/95 transition-colors">
          <!-- نوار پروفایل دانش‌آموز فعال و مسیر فصلی -->
          <div class="mb-5">
            <GameProfileBar
              :current-season-key="activeSeasonKey"
              @open-journey="showJourneyModal = true"
              @open-medals="showMedalsModal = true"
              @open-analytics="showAnalyticsModal = true"
            />
          </div>

          <!-- پیام انگیزشی -->
          <div class="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
            🌟 {{ currentMotivationalQuote }}
          </div>

          <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-ink-800">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🚀</span>
              <div>
                <h2 class="text-lg font-black text-slate-800 dark:text-white sm:text-xl">اتاق فرماندهی مأموریت موشکی علمی</h2>
                <p class="text-xs text-slate-500 dark:text-ink-400">پایه تحصیلی، درس‌ها و سطح چالش را مشخص کنید تا مأموریت آغاز شود.</p>
              </div>
            </div>
          </div>

          <!-- بخش اول: انتخاب پایه تحصیلی -->
          <div class="mb-5">
            <label class="mb-2 block text-xs font-bold text-ink-300">۱. انتخاب پایه تحصیلی:</label>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <button
                v-for="g in GAME_GRADES"
                :key="g"
                type="button"
                class="rounded-xl border py-2.5 text-center text-xs font-bold transition-all"
                :class="
                  selectedGrade === g
                    ? 'border-brand-500 bg-brand-600/30 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500'
                    : 'border-ink-800 bg-ink-800/50 text-ink-400 hover:border-ink-700 hover:text-white'
                "
                @click="selectedGrade = g"
              >
                پایه {{ g }} ابتدایی
              </button>
            </div>
          </div>

          <!-- بخش دوم: انتخاب درس‌ها (چندانتخابی) -->
          <div class="mb-5">
            <div class="mb-2 flex items-center justify-between">
              <label class="text-xs font-bold text-ink-300">۲. انتخاب کتاب‌های درسی (قابلیت انتخاب هم‌زمان چند درس):</label>
              <button
                type="button"
                class="text-11px font-medium text-brand-400 hover:text-brand-300"
                @click="selectAllSubjects"
              >
                انتخاب همه درس‌ها
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                v-for="course in availableCoursesForGrade"
                :key="course.id"
                type="button"
                class="flex items-center justify-between rounded-xl border p-2.5 text-right transition-all"
                :class="
                  selectedCourseIds.includes(course.id)
                    ? 'border-brand-500 bg-brand-600/20 text-white ring-1 ring-brand-500'
                    : 'border-ink-800 bg-ink-800/40 text-ink-400 hover:border-ink-700'
                "
                @click="toggleSubject(course.id)"
              >
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: course.color }"></span>
                  <span class="text-xs font-bold">{{ course.name }}</span>
                </div>
                <span class="text-xs">{{ selectedCourseIds.includes(course.id) ? '✓' : '+' }}</span>
              </button>
            </div>
          </div>

          <!-- بخش سوم: تعیین سطح دشواری برای هر درس -->
          <div class="mb-5">
            <label class="mb-2 block text-xs font-bold text-ink-300">۳. تعیین سطح دشواری سوالات برای هر درس:</label>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div
                v-for="courseId in selectedCourseIds"
                :key="courseId"
                class="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-800/40 px-3 py-2"
              >
                <span class="text-xs font-medium text-ink-200">{{ findCourse(BASE_COURSES, courseId)?.name }}</span>
                <select
                  v-model="subjectDifficulties[courseId]"
                  class="rounded-lg border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white"
                >
                  <option value="all">همه سطوح</option>
                  <option value="easy">آسان</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">سخت و چالشی</option>
                </select>
              </div>
            </div>
          </div>

          <!-- بخش چهارم: انتخاب خلبان قهرمان -->
          <div class="mb-6">
            <label class="mb-2 block text-xs font-bold text-ink-300">۴. انتخاب کاراکتر خلبان پرتابگاه:</label>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div
                v-for="hero in HEROES"
                :key="hero.id"
                class="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all"
                :class="
                  selectedHeroId === hero.id
                    ? 'border-brand-500 bg-brand-600/25 ring-1 ring-brand-500'
                    : 'border-ink-800 bg-ink-800/40 hover:border-ink-700'
                "
                @click="selectedHeroId = hero.id"
              >
                <span class="text-3xl">{{ hero.avatar }}</span>
                <div>
                  <div class="text-xs font-bold text-white">{{ hero.name }}</div>
                  <div class="text-10px text-ink-400">{{ hero.title }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- دکمه ورود به پرتابگاه -->
          <div class="flex items-center justify-between pt-2 border-t border-ink-800">
            <div class="text-xs text-ink-400">
              سوالات در دسترس این مأموریت:
              <span class="font-bold text-emerald-400">{{ eligibleQuestions.length }} سوال</span>
            </div>
            <button
              type="button"
              class="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-105"
              @click="startMission"
            >
              <span>🚀 آغاز مأموریت فضایی</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ۲. صفحه شمارش معکوس سینمایی ۳.. ۲.. ۱.. -->
      <div
        v-if="gameState === 'countdown'"
        class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink-950/80 backdrop-blur-md"
      >
        <span class="text-2xl font-bold text-brand-400">آماده‌باش برای شلیک...</span>
        <div class="mt-4 text-8xl font-black text-white animate-ping">
          {{ countdownNumber }}
        </div>
        <p class="mt-6 text-sm text-ink-400">سیستم هدایت لیزری در حال هماهنگی با ایستگاه فضایی</p>
      </div>

      <!-- ۳. ترمینال هولوگرافیک سوال مأموریت (In-Game Question Holo-Deck) -->
      <div
        v-if="gameState === 'playing' && currentQuestion && showHoloDeck"
        class="rocket-holo absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 flex max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-1.5rem)] w-[96%] sm:w-[95%] max-w-xl flex-col overflow-hidden rounded-2xl border border-brand-500/40 bg-white/95 p-2.5 sm:p-4 shadow-2xl backdrop-blur-md dark:bg-ink-900/90"
      >
        <div class="mb-1.5 sm:mb-2 flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5 sm:pb-2 dark:border-ink-800">
          <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-600/30 text-xs">
              {{ activeHero.avatar }}
            </span>
            <span class="text-xs font-bold text-brand-300 truncate">
              سوال فعال‌سازی پرتابگر · {{ findCourse(BASE_COURSES, currentQuestion.courseId)?.name }}
            </span>
            <span class="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-9px text-ink-300">
              سطح: {{ currentQuestion.difficulty }}
            </span>
          </div>

          <!-- وضعیت شرط پرتاب -->
          <span
            v-if="canFire"
            class="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-10px font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
          >
            ✓ پاسخ صحیح (مجوز پرتاب صادر شد)
          </span>
          <span
            v-else
            class="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-10px font-medium text-amber-800 dark:text-amber-300 border border-amber-500/40"
          >
            🔒 پرتاب موشک قفل است
          </span>
        </div>

        <!-- بخش اسکرول‌پذیر متن سوال و گزینه‌ها -->
        <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
          <!-- متن سوال -->
          <p class="text-xs font-semibold leading-snug sm:leading-relaxed text-slate-800 dark:text-white sm:text-sm">
            {{ currentQuestion.text }}
          </p>

          <!-- گزینه‌های چهارگانه -->
          <div class="mt-2 sm:mt-3 grid grid-cols-1 min-[480px]:grid-cols-2 gap-1.5 sm:gap-2">
            <button
              v-for="(option, idx) in currentQuestion.options"
              :key="idx"
              type="button"
              class="flex items-center justify-between gap-2 rounded-xl border p-2 sm:p-2.5 text-right text-xs font-medium transition-all"
              :class="[
                selectedOptionIndex === idx
                  ? wasAnswerCorrect
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 dark:bg-emerald-500/30 dark:text-white'
                    : 'border-rose-500 bg-rose-100 text-rose-950 ring-2 ring-rose-500 dark:bg-rose-500/30 dark:text-white'
                  : hasAnsweredCurrent && String(idx) === String(currentQuestion.correctAnswer)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-200'
                    : 'border-ink-700 bg-ink-800/80 text-ink-200 hover:border-brand-500 hover:bg-ink-800',
              ]"
              :disabled="hasAnsweredCurrent"
              @click="answerQuestion(idx)"
            >
              <span class="min-w-0 break-words">{{ option }}</span>
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-10px font-bold"
                :class="selectedOptionIndex === idx && wasAnswerCorrect ? 'bg-emerald-500 text-black' : 'bg-ink-700 text-ink-300'"
              >
                {{ idx + 1 }}
              </span>
            </button>
          </div>
        </div>

        <!-- بازخورد در صورت پاسخ صحیح (همیشه نمایان در پایین باکس) -->
        <div
          v-if="hasAnsweredCurrent && wasAnswerCorrect"
          class="mt-2 sm:mt-3 flex shrink-0 flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 p-2 sm:p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-base sm:text-lg shrink-0">🎯</span>
            <div class="min-w-0">
              <span class="font-bold">آفرین! پاسخ صحیح است.</span>
              <p class="hidden sm:block text-10px text-emerald-700 dark:text-emerald-300">قفل پرتابگر باز شد؛ زاویه و قدرت را تنظیم کرده و موشک را شلیک کنید.</p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            @click="showHoloDeck = false"
          >
            رفتن به پرتاب 🚀
          </button>
        </div>

        <!-- بازخورد و نمایش پاسخ درست در صورت اشتباه و دکمه تلاش مجدد -->
        <div
          v-if="hasAnsweredCurrent && !wasAnswerCorrect"
          class="mt-2 sm:mt-3 shrink-0 rounded-xl border border-rose-500/40 bg-rose-50 p-2 sm:p-3 text-11px text-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <div class="max-h-20 sm:max-h-none overflow-y-auto">
            <div class="flex flex-wrap items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 mb-1">
              <span>❌ پاسخ نادرست بود!</span>
              <span>پاسخ صحیح: گزینه {{ Number(currentQuestion.correctAnswer) + 1 }} یعنی «{{ currentQuestion.options[Number(currentQuestion.correctAnswer)] }}» است.</span>
            </div>
            <p class="mt-1 leading-relaxed text-slate-700 dark:text-ink-200">
              💡 <span class="font-semibold text-amber-700 dark:text-amber-300">نکته آموزشی:</span> {{ currentQuestion.explanation }}
            </p>
          </div>
          <div class="mt-1.5 sm:mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-rose-200 dark:border-rose-900/60 pt-1.5 sm:pt-2">
            <span class="text-10px text-rose-700 dark:text-rose-300">برای باز شدن قفل پرتاب، باید به سوال پاسخ درست دهید.</span>
            <button
              type="button"
              class="shrink-0 flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:scale-102 cursor-pointer"
              @click="retryWithNewQuestion"
            >
              <span>🔄 سوال بعدی / تلاش مجدد</span>
            </button>
          </div>
        </div>
      </div>

      <!-- دکمه کوچک باز کردن مجدد سوال مأموریت -->
      <div
        v-if="gameState === 'playing' && currentQuestion && !showHoloDeck"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-ink-900/90 px-3 py-1 text-xs font-bold shadow-lg backdrop-blur"
          :class="canFire ? 'text-emerald-300 border-emerald-500/40' : 'text-amber-300 border-amber-500/40'"
          @click="showHoloDeck = true"
        >
          <span>{{ canFire ? '🎯 سوال پاسخ داده شد (قفل باز)' : '🔒 باز کردن سوال مأموریت' }}</span>
        </button>
      </div>

      <!-- بازخورد وضعیت آخرین پرتاب -->
      <div
        v-if="feedbackMessage && !showHoloDeck"
        class="absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded-full border border-ink-700 bg-ink-900/90 px-4 py-1.5 text-xs font-bold shadow-xl backdrop-blur"
        :class="feedbackMessage.includes('اصابت') ? 'text-emerald-400' : 'text-amber-400'"
      >
        {{ feedbackMessage }}
      </div>

      <!-- مودال پیروزی و پایان مرحله -->
      <div
        v-if="showWaveCompleteModal"
        class="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md"
      >
        <div class="w-full max-w-sm rounded-3xl border border-emerald-500/40 bg-ink-900 p-6 text-center shadow-2xl">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">
            🏆
          </div>
          <h2 class="mt-3 text-lg font-black text-white">مأموریت مرحله {{ wave }} پیروزمندانه بود!</h2>
          <p class="mt-1 text-xs text-ink-300">
            سفینه بیگانگان منهدم شد. امتیاز کل شما به <span class="font-bold text-amber-400">{{ score }}</span> رسید.
          </p>
          <div class="mt-5 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:scale-102"
              @click="initWave(wave + 1)"
            >
              مرحله بعدی ➡️
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-700 bg-ink-800 px-3 py-2.5 text-xs font-medium text-ink-300 hover:text-white"
              @click="openMissionSetup"
            >
              اتاق فرماندهی
            </button>
          </div>
        </div>
      </div>

      <!-- ۴. مودال جامع سوابق و کارنامه بازی‌ها (Detailed History Modal) -->
      <div
        v-if="showHistoryModal"
        class="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink-950/90 p-3 sm:p-5 backdrop-blur-md"
      >
        <div class="w-full max-w-3xl rounded-3xl border border-purple-500/40 bg-ink-900 p-5 shadow-2xl max-h-[90vh] flex flex-col">
          <!-- هدر مودال -->
          <div class="flex items-center justify-between border-b border-ink-800 pb-3 shrink-0">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📜</span>
              <div>
                <h3 class="text-base font-black text-white">کارنامه و تاریخچه مأموریت‌های علمی</h3>
                <p class="text-xs text-ink-400">سوابق بازی‌ها، مدت زمان کل بازی و زمان‌سنجی دقیق پاسخ به هر سوال</p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-xl bg-ink-800 px-3 py-1.5 text-xs text-ink-300 hover:text-white"
              @click="showHistoryModal = false; detailedHistorySession = null"
            >
              بستن ✕
            </button>
          </div>

          <!-- آمار کلی تجمیعی -->
          <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 shrink-0">
            <div class="rounded-xl border border-ink-800 bg-ink-800/40 p-2.5 text-center">
              <span class="block text-10px text-ink-400">تعداد مأموریت‌ها</span>
              <span class="text-base font-black text-white">{{ gameHistoryStore.totalSessions }}</span>
            </div>
            <div class="rounded-xl border border-ink-800 bg-ink-800/40 p-2.5 text-center">
              <span class="block text-10px text-ink-400">کل زمان یادگیری</span>
              <span class="text-base font-black text-emerald-400">{{ formatDuration(gameHistoryStore.totalPlaytimeSeconds) }}</span>
            </div>
            <div class="rounded-xl border border-ink-800 bg-ink-800/40 p-2.5 text-center">
              <span class="block text-10px text-ink-400">سوالات پاسخ داده‌شده</span>
              <span class="text-base font-black text-amber-400">{{ gameHistoryStore.totalQuestionsAnswered }}</span>
            </div>
            <div class="rounded-xl border border-ink-800 bg-ink-800/40 p-2.5 text-center">
              <span class="block text-10px text-ink-400">دقت پاسخگویی</span>
              <span class="text-base font-black text-brand-400">{{ gameHistoryStore.overallAccuracy }}%</span>
            </div>
          </div>

          <!-- بخش محتوای اسکرول‌پذیر: لیست یا جزئیات یک جلسه -->
          <div class="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            <!-- در صورت انتخاب یک جلسه برای مشاهده ریز سوالات -->
            <div v-if="detailedHistorySession" class="space-y-3">
              <div class="flex items-center justify-between rounded-xl bg-purple-950/40 p-3 border border-purple-800">
                <div>
                  <span class="text-xs font-bold text-purple-200">
                    جزئیات سوالات مأموریت: پایه {{ detailedHistorySession.grade }} · خلبان {{ detailedHistorySession.heroName }}
                  </span>
                  <div class="text-10px text-ink-400 mt-0.5">
                    کل زمان بازی: {{ formatDuration(detailedHistorySession.totalDurationSeconds) }} · امتیاز: {{ detailedHistorySession.score }}
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-lg bg-ink-800 px-2.5 py-1 text-xs text-ink-200 hover:text-white"
                  @click="detailedHistorySession = null"
                >
                  ← بازگشت به لیست
                </button>
              </div>

              <!-- لیست تک تک سوالات پاسخ‌داده‌شده با زمان‌سنجی -->
              <div
                v-for="(ans, aIdx) in detailedHistorySession.answers"
                :key="aIdx"
                class="rounded-xl border p-3 text-xs space-y-1.5 transition-all"
                :class="ans.isCorrect ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full text-10px font-bold"
                      :class="ans.isCorrect ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'"
                    >
                      {{ ans.isCorrect ? '✓' : '✗' }}
                    </span>
                    <span class="font-bold text-white">سوال شماره {{ aIdx + 1 }}:</span>
                    <span class="rounded bg-ink-800 px-1.5 py-0.5 text-10px text-ink-300">
                      {{ findCourse(BASE_COURSES, ans.courseId)?.name || ans.courseId }}
                    </span>
                  </div>

                  <!-- زمان پاسخگویی به این سوال -->
                  <span class="rounded-full bg-ink-800 px-2.5 py-0.5 text-10px font-bold text-amber-300">
                    ⏱️ زمان پاسخگویی: {{ ans.durationSeconds }} ثانیه
                  </span>
                </div>

                <p class="font-medium text-ink-100 pr-6">{{ ans.questionText }}</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-6 pt-1 text-11px">
                  <div class="rounded-lg bg-ink-900/60 p-1.5 border border-ink-800">
                    <span class="text-ink-400">گزینه انتخابی بازیکن: </span>
                    <span :class="ans.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'">
                      {{ ans.selectedOption }}
                    </span>
                  </div>
                  <div v-if="!ans.isCorrect" class="rounded-lg bg-ink-900/60 p-1.5 border border-ink-800">
                    <span class="text-ink-400">پاسخ صحیح کتاب: </span>
                    <span class="text-emerald-400 font-bold">{{ ans.correctOption }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- در صورت نمایش فهرست جلسات -->
            <div v-else-if="gameHistoryStore.items.length === 0" class="py-12 text-center text-ink-400">
              هنوز مأموریتی ثبت نشده است. با آغاز بازی و پاسخ به سوالات، گزارش کامل عملکرد در اینجا ذخیره خواهد شد.
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="item in gameHistoryStore.items"
                :key="item.id"
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-ink-800 bg-ink-800/30 p-3.5 transition hover:border-purple-500/50 hover:bg-ink-800/50"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-xs sm:text-sm">
                      پایه {{ item.grade }} · خلبان {{ item.heroName }}
                    </span>
                    <span class="rounded-full bg-purple-900/60 px-2 py-0.5 text-10px font-bold text-purple-300">
                      {{ item.score }} امتیاز
                    </span>
                    <span class="text-10px text-ink-400">
                      {{ formatJalaliDate(item.endedAt) }}
                    </span>
                  </div>

                  <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-11px text-ink-300">
                    <span>⏱️ مدت بازی: <b class="text-emerald-400">{{ formatDuration(item.totalDurationSeconds) }}</b></span>
                    <span>📝 پاسخ‌ها: <b class="text-white">{{ item.correctAnswersCount }} از {{ item.totalQuestionsAnswered }} صحیح</b></span>
                    <span>🎯 دقت شلیک: <b class="text-amber-400">{{ item.accuracyPercentage }}%</b></span>
                    <span>🏆 مراحل پیروز: <b class="text-purple-300">{{ item.wavesCleared }}</b></span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="rounded-xl bg-purple-600/30 px-3 py-1.5 text-xs font-bold text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition"
                    @click="detailedHistorySession = item"
                  >
                    ریز پاسخ‌ها و زمان‌ها 👁️
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-rose-500/30 bg-rose-950/30 p-1.5 text-xs text-rose-400 hover:bg-rose-900/50"
                    title="حذف این رکورد"
                    @click="removeHistoryItem(item.id)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- پنل کنترل شلیک و زاویه و قدرت در پایین صفحه -->
    <footer
      v-if="gameState === 'playing'"
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:gap-3 border-t border-ink-800 bg-ink-900/95 px-3 py-1.5 sm:py-2.5 sm:px-6 backdrop-blur z-20"
    >
      <div class="flex flex-1 items-center gap-3 sm:gap-4 min-w-[180px]">
        <!-- تنظیم زاویه -->
        <div class="flex flex-1 items-center gap-2">
          <span class="text-xs font-bold text-ink-300 shrink-0">زاویه: {{ angle }}°</span>
          <input
            v-model.number="angle"
            type="range"
            min="15"
            max="85"
            class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-ink-700 accent-brand-500"
          />
        </div>

        <!-- تنظیم قدرت -->
        <div class="flex flex-1 items-center gap-2">
          <span class="text-xs font-bold text-ink-300 shrink-0">قدرت: {{ power }}%</span>
          <input
            v-model.number="power"
            type="range"
            min="25"
            max="100"
            class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-ink-700 accent-amber-500"
          />
        </div>
      </div>

      <!-- دکمه پرتاب موشک مشروط به پاسخ صحیح -->
      <button
        type="button"
        class="flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-6 py-1.5 sm:py-2.5 text-xs font-black transition-all"
        :class="[
          canFire
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 animate-pulse'
            : 'bg-ink-800 text-ink-400 border border-ink-700 cursor-not-allowed opacity-75',
        ]"
        :disabled="!canFire"
        @click="fireRocket"
      >
        <span v-if="canFire">🚀 شلیک موشک (مجوز صادر شد)</span>
        <span v-else-if="!hasAnsweredCurrent">🔒 ابتدا به سوال پاسخ دهید</span>
        <span v-else>🔒 پاسخ نادرست بود (دوباره تلاش کنید)</span>
      </button>
    </footer>

    <!-- هشدار چرخش صفحه برای موبایل (Landscape Mode Guard) -->
    <div
      v-if="isPortraitMobile && !dismissRotationWarning"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/95 p-6 text-center text-white backdrop-blur-md"
    >
      <div class="animate-bounce text-6xl">📱 🔄</div>
      <h2 class="mt-4 text-base font-black">لطفاً گوشی را بچرخانید</h2>
      <p class="mt-2 text-xs leading-relaxed text-ink-300">
        برای تسلط کامل بر میدان پرتاب موشک و مشاهده دقیق هدف، بازی در حالت افقی (Landscape) طراحی شده است.
      </p>
      <div class="mt-6 flex flex-col gap-2 w-full max-w-xs">
        <button
          type="button"
          class="rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-lg shadow-brand-500/30"
          @click="requestLandscapeAndFullscreen"
        >
          چرخش و تمام‌صفحه ⛶
        </button>
        <button
          type="button"
          class="rounded-xl border border-ink-700 py-2 text-xs text-ink-400"
          @click="dismissRotationWarning = true"
        >
          ادامه در همین حالت
        </button>
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
