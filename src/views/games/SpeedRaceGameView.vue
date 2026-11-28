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

// --- مدل‌های خودروهای مسابقه‌ای دانش ---
interface VehicleDef {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  bodyGradient: [string, string]
  baseSpeed: number
  nitroSpeed: number
  perkTitle: string
  perkDescription: string
}

const VEHICLES: VehicleDef[] = [
  {
    id: 'formula-wisdom',
    name: 'فرمول دانایی',
    subtitle: 'ماشین مسابقه‌ای گرندپری',
    icon: '🏎️',
    color: '#06b6d4',
    bodyGradient: ['#06b6d4', '#0284c7'],
    baseSpeed: 110,
    nitroSpeed: 230,
    perkTitle: 'شتاب نیتروی انفجاری',
    perkDescription: 'پاسخ صحیح نیتروی فوق‌سریع ۳ ثانیه‌ای با حداکثر سرعت فعال می‌کند.',
  },
  {
    id: 'cyber-speedster',
    name: 'سایبرتراک محاسبات',
    subtitle: 'خودروی برقی فوق‌پیشرفته',
    icon: '⚡',
    color: '#a855f7',
    bodyGradient: ['#a855f7', '#7c3aed'],
    baseSpeed: 115,
    nitroSpeed: 215,
    perkTitle: 'پایداری و بازیابی سرعت',
    perkDescription: 'در صورت پاسخ اشتباه، سرعت خودرو کمتر افت می‌کند و سریع‌تر بازمی‌گردد.',
  },
  {
    id: 'aero-cruiser',
    name: 'هاورکرافت مغناطیسی',
    subtitle: 'شناور الکترومغناطیسی آینده',
    icon: '🛸',
    color: '#10b981',
    bodyGradient: ['#10b981', '#059669'],
    baseSpeed: 105,
    nitroSpeed: 225,
    perkTitle: 'نیتروی طولانی‌تر',
    perkDescription: 'مدت‌زمان شتاب نیترو با پاسخ‌های متوالی طولانی‌تر و پیوسته‌تر باقی می‌ماند.',
  },
  {
    id: 'word-rocket',
    name: 'موتور توربو کلمات',
    subtitle: 'سوپربایک آیرودینامیک',
    icon: '🏍️',
    color: '#f59e0b',
    bodyGradient: ['#f59e0b', '#d97706'],
    baseSpeed: 125,
    nitroSpeed: 220,
    perkTitle: 'سرعت پایه بالا',
    perkDescription: 'سرعت کروز عادی در مسیر مسابقه بالاتر از سایر وسایل نقلیه است.',
  },
]

// رقبای هوش مصنوعی مسابقه
interface RivalRacer {
  id: string
  name: string
  avatar: string
  carColor: string
  distance: number // فاصله طی‌شده به متر
  currentSpeed: number
  lane: number // ۱ تا ۴
  targetLane: number
  x: number
  y: number
}

// ساختار ذرات و دود نیترو
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
}

type GameState = 'setup' | 'countdown' | 'playing' | 'finished'

// --- استورها ---
const questionsStore = useQuestionsStore()
const gameHistoryStore = useGameHistoryStore()
const profilesStore = useGameProfilesStore()
useGameChromeInsets()

// --- متغیرهای وضعیت ---
const gameState = ref<GameState>('setup')
const selectedVehicleId = ref<string>('formula-wisdom')
const activeVehicle = computed(() => {
  return VEHICLES.find((v) => v.id === selectedVehicleId.value) || VEHICLES[0]
})

// فصل جاری و پروفایل
const activeSeasonKey = ref<GameSeasonKey>(getCurrentSeasonKey())
const activeSeason = computed(() => GAME_SEASONS[activeSeasonKey.value])
const selectedStage = ref<GameStage | null>(null)

// فیلترهای پایه و دروس
const selectedGrade = ref<number>(profilesStore.activeProfile?.grade || 4)
const selectedCourseIds = ref<string[]>(['math', 'persian-reading'])
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

// مدیریت سوالات و دیتابیس
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
    explanation: 'با دقت در مفاهیم آموزشی و کتاب درسی، به پاسخ صحیح دست می‌یابید.',
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

// آمار جلسه و تاریخچه بازی
const currentSessionId = ref<string>('')
const gameStartTime = ref<number>(0)
const sessionAnswers = ref<QuestionAnswerRecord[]>([])
const questionShownAt = ref<number>(0)
const score = ref(0)
const streak = ref(0)

// مودال‌های ناوبری و بخش‌های الحاقی
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

// متغیرهای فیزیک و مسابقه
const totalRaceDistance = ref(1200) // طول پیست مسابقه به متر
const playerDistance = ref(0)
const playerSpeed = ref(100) // کیلومتر بر ساعت
const isNitroActive = ref(false)
const nitroTimer = ref(0)
const nitroTanks = ref(3) // حداکثر ۳ کپسول نیترو

// رقبای پیست
const rivals = ref<RivalRacer[]>([
  {
    id: 'rival-rabbit',
    name: 'خرگوش شتاب‌زده',
    avatar: '🐰',
    carColor: '#eab308',
    distance: 0,
    currentSpeed: 105,
    lane: 1,
    targetLane: 1,
    x: 240,
    y: 340,
  },
  {
    id: 'rival-cheetah',
    name: 'یوزپلنگ قهرمان',
    avatar: '🐆',
    carColor: '#f97316',
    distance: 0,
    currentSpeed: 112,
    lane: 3,
    targetLane: 3,
    x: 600,
    y: 350,
  },
  {
    id: 'rival-robot',
    name: 'ربات الگوریتم',
    avatar: '🤖',
    carColor: '#8b5cf6',
    distance: 0,
    currentSpeed: 108,
    lane: 4,
    targetLane: 4,
    x: 740,
    y: 360,
  },
])

// رتبه جاری بازیکن در مسابقه (۱ تا ۴)
const playerRank = computed(() => {
  let rank = 1
  for (const r of rivals.value) {
    if (r.distance > playerDistance.value) {
      rank++
    }
  }
  return rank
})

// وضعیت سوال جاری روی هود
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnsweredCurrent = ref(false)
const wasAnswerCorrect = ref(false)
const showHoloDeck = ref(true)

// بوم نقاشی و رندرینگ
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let particles: Particle[] = []
let floatingTexts: FloatingText[] = []
let roadOffset = 0

// شمارش معکوس
const countdownNumber = ref(3)
const currentMotivationalQuote = ref('')
const soundEnabled = ref(true)

function pickRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  return MOTIVATIONAL_QUOTES[randomIndex].text
}

// وضعیت چرخش صفحه گوشی
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

function answerQuestion(index: number): void {
  if (hasAnsweredCurrent.value || !currentQuestion.value) return
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
    sfx.playLaunch()
    score.value += 180
    streak.value += 1

    // فعال‌سازی توربو نیترو
    isNitroActive.value = true
    nitroTimer.value = 160 // فریم شتاب نیترو (~۲.۶ ثانیه)
    nitroTanks.value = Math.min(3, nitroTanks.value + 1)

    // ایجاد ذرات نیتروی خروجی
    createNitroBlastParticles()

    floatingTexts.push({
      x: 480,
      y: 360,
      text: `🚀 نیترو توربو فعال شد! (${durationSeconds}s) +۱۸۰ امتیاز`,
      color: '#38bdf8',
      alpha: 1,
      vy: -1.2,
    })

    if (streak.value % 3 === 0) {
      floatingTexts.push({
        x: 480,
        y: 320,
        text: `🔥 زنجیره ${streak.value} تایی! ${pickRandomMotivationalQuote()}`,
        color: '#fbbf24',
        alpha: 1,
        vy: -0.9,
      })
    }

    setTimeout(() => {
      if (gameState.value === 'playing') {
        pickNextQuestion()
      }
    }, 1200)
  } else {
    sfx.playIncorrect()
    streak.value = 0
    playerSpeed.value = Math.max(55, playerSpeed.value - 40)

    floatingTexts.push({
      x: 480,
      y: 360,
      text: `⚠️ کاهش سرعت! گزینه درست را مرور کن`,
      color: '#ef4444',
      alpha: 1,
      vy: -1.0,
    })
  }

  saveCurrentSessionSnapshot()
}

function retryWithNewQuestion(): void {
  pickNextQuestion()
}

function createNitroBlastParticles(): void {
  for (let i = 0; i < 25; i++) {
    particles.push({
      x: 480 + (Math.random() * 40 - 20),
      y: 470,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 8 + 4,
      size: Math.random() * 7 + 4,
      color: Math.random() > 0.5 ? '#38bdf8' : '#67e8f9',
      alpha: 1,
      life: 1,
    })
  }
}

function startMission(): void {
  if (selectedCourseIds.value.length === 0) {
    alert('لطفاً حداقل یک درس را برای مسابقه انتخاب کنید.')
    return
  }

  currentSessionId.value = crypto.randomUUID()
  gameStartTime.value = Date.now()
  sessionAnswers.value = []
  score.value = 0
  streak.value = 0
  playerDistance.value = 0
  playerSpeed.value = activeVehicle.value.baseSpeed
  isNitroActive.value = false
  nitroTimer.value = 0
  nitroTanks.value = 2

  // بازنشانی رقبا
  rivals.value.forEach((r, idx) => {
    r.distance = 0
    r.currentSpeed = 104 + idx * 4
  })

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
      pickNextQuestion()
    }
  }, 900)
}

function handleSelectStage(stage: GameStage): void {
  selectedStage.value = stage
  totalRaceDistance.value = 1000 + stage.stageNumber * 100
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
    gameType: 'speed-race',
    gameTitle: 'مسابقه سرعت ریاضی و کلمات',
    heroId: selectedVehicleId.value,
    selectedGrade: selectedGrade.value,
    selectedCourses: [...selectedCourseIds.value],
    startedAt: gameStartTime.value,
    endedAt: Date.now(),
    totalDurationSeconds: durationSec,
    score: score.value,
    wavesCleared: playerRank.value === 1 ? 3 : playerRank.value === 2 ? 2 : 1,
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

function finishRace(): void {
  gameState.value = 'finished'
  sfx.playVictory()
  saveCurrentSessionSnapshot()
}

// حلقه به‌روزرسانی فیزیک مسابقه
function updateRacePhysics(): void {
  // سرعت بازیکن با در نظر گرفتن نیترو
  const targetSpeed = isNitroActive.value ? activeVehicle.value.nitroSpeed : activeVehicle.value.baseSpeed
  playerSpeed.value += (targetSpeed - playerSpeed.value) * 0.08

  if (isNitroActive.value) {
    nitroTimer.value -= 1
    if (nitroTimer.value <= 0) {
      isNitroActive.value = false
    }
    // ایجاد ذرات نیترو در طول حرکت
    if (Math.random() > 0.4) {
      particles.push({
        x: 480 + (Math.random() * 24 - 12),
        y: 465,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 5 + 3,
        color: '#38bdf8',
        alpha: 0.9,
        life: 1,
      })
    }
  }

  // پیشروی مسافت (کیلومتر بر ساعت به متر بر فریم در ۶۰fps)
  const playerAdvanceMeters = (playerSpeed.value / 3.6) / 60
  playerDistance.value += playerAdvanceMeters
  roadOffset = (roadOffset + playerSpeed.value * 0.15) % 80

  // به‌روزرسانی رقبا
  rivals.value.forEach((r) => {
    // هوش مصنوعی دینامیک رقبا با رابربندینگ جذاب
    const speedVariation = (Math.random() - 0.5) * 2
    r.currentSpeed += speedVariation
    r.currentSpeed = Math.max(95, Math.min(150, r.currentSpeed))

    const rivalAdvanceMeters = (r.currentSpeed / 3.6) / 60
    r.distance += rivalAdvanceMeters

    // تغییر لاین رقیب به صورت نرم
    if (Math.random() > 0.985) {
      r.targetLane = Math.floor(Math.random() * 4) + 1
    }
    r.lane += (r.targetLane - r.lane) * 0.05

    // محاسبه موقعیت افقی و عمودی روی پیست پرسپکتیو
    const distDiff = r.distance - playerDistance.value
    // اگر در محدوده دید (بین -30 متر تا +80 متر) باشد
    const t = (distDiff + 30) / 110 // 0 تا 1
    r.y = 440 - t * 240
    // پهنای جاده در عمق
    const roadWidthAtY = 240 + (r.y / 540) * 560
    const laneWidth = roadWidthAtY / 4
    const roadLeftX = 480 - roadWidthAtY / 2
    r.x = roadLeftX + (r.lane - 0.5) * laneWidth
  })

  // بررسی عبور از خط پایان
  if (playerDistance.value >= totalRaceDistance.value && gameState.value === 'playing') {
    finishRace()
  }

  // به‌روزرسانی ذرات
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]
    pt.x += pt.vx
    pt.y += pt.vy
    pt.alpha -= 0.03
    pt.size = Math.max(0, pt.size - 0.1)
    if (pt.alpha <= 0) particles.splice(i, 1)
  }

  // به‌روزرسانی متون شناور
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i]
    ft.y += ft.vy
    ft.alpha -= 0.015
    if (ft.alpha <= 0) floatingTexts.splice(i, 1)
  }
}

// رندرینگ بوم مسابقه
function renderRaceCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // ۱. آسمان و پس‌زمینه افق با هماهنگی کامل دارک/لایت
  const horizonY = 160
  if (isDark) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
    skyGrad.addColorStop(0, '#090d16')
    skyGrad.addColorStop(0.7, '#1e1b4b')
    skyGrad.addColorStop(1, '#312e81')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, horizonY)

    // ستاره‌های نئونی شب
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137) % width)
      const sy = ((i * 47) % (horizonY - 20))
      ctx.fillRect(sx, sy, 1.5, 1.5)
    }
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
    skyGrad.addColorStop(0, '#38bdf8')
    skyGrad.addColorStop(0.6, '#bae6fd')
    skyGrad.addColorStop(1, '#e0f2fe')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, horizonY)

    // ابرهای لطیف روز
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.beginPath()
    ctx.arc(180, 60, 36, 0, Math.PI * 2)
    ctx.arc(220, 50, 44, 0, Math.PI * 2)
    ctx.arc(260, 60, 32, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(740, 80, 30, 0, Math.PI * 2)
    ctx.arc(775, 70, 38, 0, Math.PI * 2)
    ctx.arc(810, 80, 26, 0, Math.PI * 2)
    ctx.fill()
  }

  // کوه‌ها و تپه‌های پس‌زمینه
  ctx.fillStyle = isDark ? '#1e293b' : '#86efac'
  ctx.beginPath()
  ctx.moveTo(0, horizonY)
  ctx.quadraticCurveTo(200, horizonY - 40, 480, horizonY - 15)
  ctx.quadraticCurveTo(720, horizonY - 50, width, horizonY)
  ctx.lineTo(width, horizonY)
  ctx.lineTo(0, horizonY)
  ctx.fill()

  // ۲. زمین چمن دو طرف جاده
  const grassGrad = ctx.createLinearGradient(0, horizonY, 0, height)
  if (isDark) {
    grassGrad.addColorStop(0, '#0f172a')
    grassGrad.addColorStop(1, '#020617')
  } else {
    grassGrad.addColorStop(0, '#4ade80')
    grassGrad.addColorStop(1, '#22c55e')
  }
  ctx.fillStyle = grassGrad
  ctx.fillRect(0, horizonY, width, height - horizonY)

  // ۳. جاده پرسپکتیو با ۴ لاین
  const topRoadW = 220
  const bottomRoadW = 820
  const roadTopLeft = 480 - topRoadW / 2
  const roadTopRight = 480 + topRoadW / 2
  const roadBottomLeft = 480 - bottomRoadW / 2
  const roadBottomRight = 480 + bottomRoadW / 2

  // سطح آسفالت
  ctx.fillStyle = isDark ? '#1e293b' : '#334155'
  ctx.beginPath()
  ctx.moveTo(roadTopLeft, horizonY)
  ctx.lineTo(roadTopRight, horizonY)
  ctx.lineTo(roadBottomRight, height)
  ctx.lineTo(roadBottomLeft, height)
  ctx.closePath()
  ctx.fill()

  // لبه‌های جاده (جدول‌های قرمز و سفید متحرک)
  const curbSegments = 16
  for (let i = 0; i < curbSegments; i++) {
    const t1 = i / curbSegments
    const t2 = (i + 1) / curbSegments
    const y1 = horizonY + Math.pow(t1, 1.6) * (height - horizonY)
    const y2 = horizonY + Math.pow(t2, 1.6) * (height - horizonY)

    const w1 = topRoadW + Math.pow(t1, 1.6) * (bottomRoadW - topRoadW)
    const w2 = topRoadW + Math.pow(t2, 1.6) * (bottomRoadW - topRoadW)

    const isRed = (i + Math.floor(roadOffset / 10)) % 2 === 0
    ctx.fillStyle = isRed ? '#ef4444' : '#ffffff'

    // جدول چپ
    ctx.beginPath()
    ctx.moveTo(480 - w1 / 2 - 14, y1)
    ctx.lineTo(480 - w1 / 2, y1)
    ctx.lineTo(480 - w2 / 2, y2)
    ctx.lineTo(480 - w2 / 2 - 18, y2)
    ctx.fill()

    // جدول راست
    ctx.beginPath()
    ctx.moveTo(480 + w1 / 2, y1)
    ctx.lineTo(480 + w1 / 2 + 14, y1)
    ctx.lineTo(480 + w2 / 2 + 18, y2)
    ctx.lineTo(480 + w2 / 2, y2)
    ctx.fill()
  }

  // خط‌کشی‌های بریده‌بریده ۳ خط میانی جاده (۴ لاین)
  for (let lane = 1; lane <= 3; lane++) {
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 3
    ctx.setLineDash([16, 20])
    ctx.lineDashOffset = -roadOffset * 1.5

    ctx.beginPath()
    const laneRatio = lane / 4
    const xTop = roadTopLeft + topRoadW * laneRatio
    const xBottom = roadBottomLeft + bottomRoadW * laneRatio
    ctx.moveTo(xTop, horizonY)
    ctx.lineTo(xBottom, height)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // خط پایان مسابقه (اگر نزدیک است)
  const remainingDist = totalRaceDistance.value - playerDistance.value
  if (remainingDist >= 0 && remainingDist <= 70) {
    const finishT = 1 - (remainingDist / 70)
    const finishY = horizonY + Math.pow(finishT, 1.6) * (height - horizonY)
    const finishW = topRoadW + Math.pow(finishT, 1.6) * (bottomRoadW - topRoadW)
    
    // پرچم شطرنجی متحرک روی زمین
    const checks = 12
    const checkW = finishW / checks
    for (let c = 0; c < checks; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#000000'
      ctx.fillRect(480 - finishW / 2 + c * checkW, finishY - 10, checkW, 20)
    }
  }

  // ۴. خطوط سرعت و موشن‌بلر نیترو (Speed lines)
  if (isNitroActive.value) {
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.45)'
    ctx.lineWidth = 2
    for (let i = 0; i < 18; i++) {
      const sx = (i % 2 === 0) ? Math.random() * 160 : width - Math.random() * 160
      const sy = Math.random() * height
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + (i % 2 === 0 ? -30 : 30), sy + 40)
      ctx.stroke()
    }
  }

  // ۵. رقبای مسابقه‌ای
  rivals.value.forEach((r) => {
    if (r.y < horizonY || r.y > height + 20) return
    const scale = Math.max(0.35, Math.min(1.2, r.y / 440))
    ctx.save()
    ctx.translate(r.x, r.y)
    ctx.scale(scale, scale)

    // سایه زیر خودروی رقیب
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.beginPath()
    ctx.ellipse(0, 22, 34, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // بدنه خودروی رقیب
    ctx.fillStyle = r.carColor
    ctx.beginPath()
    ctx.roundRect(-24, -18, 48, 36, 8)
    ctx.fill()

    // شیشه و سقف
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.roundRect(-16, -10, 32, 16, 4)
    ctx.fill()

    // راننده
    ctx.font = '18px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(r.avatar, 0, -2)

    // چراغ‌های خطر عقب
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(-20, 14, 8, 4)
    ctx.fillRect(12, 14, 8, 4)

    // نام و رتبه بالای خودروی رقیب
    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 4
    ctx.fillText(r.name, 0, -28)
    ctx.shadowBlur = 0

    ctx.restore()
  })

  // ۶. خودروی اصلی بازیکن در پایین و مرکز
  const playerX = 480
  const playerY = 460
  ctx.save()
  ctx.translate(playerX, playerY)

  // سایه زیر ماشین بازیکن
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.beginPath()
  ctx.ellipse(0, 28, 48, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // شلعه‌های نیترو و اگزوز هنگام شتاب
  if (isNitroActive.value) {
    const flameH = 30 + Math.random() * 20
    const flameGrad = ctx.createLinearGradient(0, 20, 0, 20 + flameH)
    flameGrad.addColorStop(0, '#ffffff')
    flameGrad.addColorStop(0.3, '#38bdf8')
    flameGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = flameGrad

    ctx.beginPath()
    ctx.moveTo(-16, 22)
    ctx.lineTo(-10, 22 + flameH)
    ctx.lineTo(-4, 22)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(4, 22)
    ctx.lineTo(10, 22 + flameH)
    ctx.lineTo(16, 22)
    ctx.fill()
  }

  // بدنه اصلی خودروی بازیکن
  const bodyGrad = ctx.createLinearGradient(-35, 0, 35, 0)
  bodyGrad.addColorStop(0, activeVehicle.value.bodyGradient[0])
  bodyGrad.addColorStop(1, activeVehicle.value.bodyGradient[1])
  ctx.fillStyle = bodyGrad

  // طرح بدنه آیرودینامیک
  ctx.beginPath()
  ctx.roundRect(-34, -28, 68, 56, 14)
  ctx.fill()
  ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // بال عقب (Rear Spoiler)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(-38, 16, 76, 8)

  // کابین خلبان / شیشه جلو
  ctx.fillStyle = isDark ? '#0284c7' : '#0369a1'
  ctx.beginPath()
  ctx.roundRect(-22, -18, 44, 26, 8)
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // آواتار خلبان کودک در کابین
  ctx.font = '24px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(profilesStore.activeProfile?.avatar || '🦁', 0, -4)

  // چراغ‌های جلو و نئون
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(-26, -26, 4, 0, Math.PI * 2)
  ctx.arc(26, -26, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  // ۷. ذرات نیترو و دود
  particles.forEach((pt) => {
    ctx.save()
    ctx.fillStyle = pt.color
    ctx.globalAlpha = Math.max(0, pt.alpha)
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // ۸. متون شناور امتیاز و انگیزه
  floatingTexts.forEach((ft) => {
    ctx.save()
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = ft.color
    ctx.globalAlpha = Math.max(0, ft.alpha)
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 6
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  })
}

function gameLoop(): void {
  if (gameState.value === 'playing') {
    updateRacePhysics()
  }
  renderRaceCanvas()
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
          برای تجربه هیجان کامل پیست گرندپری، تسلط بر لاین‌های مسابقه و پاسخگویی سریع، لطفاً دستگاه خود را در حالت افقی (Landscape) قرار دهید.
        </p>
        <button
          type="button"
          class="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
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
            <span>🏁</span>
            <span class="bg-gradient-to-r from-amber-500 via-cyan-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-cyan-400 dark:to-indigo-400">
              مسابقه سرعت ریاضی و کلمات
            </span>
            <span class="hidden rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 sm:inline-block">
              گرندپری هوش و محاسبات
            </span>
          </h1>
        </div>
      </div>

      <!-- وضعیت زنده مسابقه در حین بازی -->
      <div v-if="gameState === 'playing'" class="flex items-center gap-2 sm:gap-4">
        <!-- رتبه جاری -->
        <div class="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-1.5 dark:bg-amber-950/40">
          <span class="text-xs text-amber-700 dark:text-amber-400 font-bold">جایگاه:</span>
          <span class="font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base">
            {{ playerRank === 1 ? '🥇 اول' : playerRank === 2 ? '🥈 دوم' : playerRank === 3 ? '🥉 سوم' : '۴ام' }}
          </span>
        </div>

        <!-- سرعت سنج دیجیتال -->
        <div class="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-1.5 dark:bg-cyan-950/40">
          <span class="text-xs">⚡</span>
          <span class="font-black text-cyan-700 dark:text-cyan-300 text-sm sm:text-base">{{ Math.round(playerSpeed) }}</span>
          <span class="text-[10px] text-cyan-600 dark:text-cyan-400">km/h</span>
        </div>

        <!-- مسافت طی‌شده -->
        <div class="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/40">
          <span class="text-xs">🏁</span>
          <span class="font-black text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm">
            {{ Math.round(playerDistance) }} / {{ totalRaceDistance }}m
          </span>
        </div>
      </div>

      <!-- کنترل صدا -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          :class="{ 'border-cyan-500/50 text-cyan-600 dark:text-cyan-400': soundEnabled }"
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

    <!-- ۱. صفحه آماده‌سازی و انتخاب خودرو و درس (Setup Screen) -->
    <main v-if="gameState === 'setup'" class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div class="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        <!-- پیام انگیزشی بالای صفحه -->
        <div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
          🌟 {{ currentMotivationalQuote }}
        </div>

        <div class="text-center">
          <div class="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/20 text-4xl mb-4 text-white">
            🏎️
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">گاراژ مسابقه سرعت ریاضی و کلمات</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            ماشین مسابقه‌ای خود را انتخاب کنید، با پاسخ سریع به سوالات کتاب درسی نیترو بزنید و خط پایان گرندپری را فتح کنید!
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
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-sm ring-2 ring-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200'
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
              ۲. انتخاب دروس چالش سرعت (می‌توانید چند درس انتخاب کنید):
            </label>
            <span class="text-xs text-cyan-600 dark:text-cyan-400 font-bold">
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
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="toggleCourseSelection(c.id)"
            >
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: c.color }" />
              <span>{{ c.name }}</span>
            </button>
          </div>
        </div>

        <!-- انتخاب خودروی مسابقه -->
        <div class="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            ۳. انتخاب وسیله نقلیه و نوع نیترو:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="v in VEHICLES"
              :key="v.id"
              class="flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer"
              :class="
                selectedVehicleId === v.id
                  ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-md ring-2 ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="selectedVehicleId = v.id"
            >
              <div class="text-4xl mb-2">{{ v.icon }}</div>
              <h4 class="font-black text-base">{{ v.name }}</h4>
              <p class="text-xs text-cyan-600 dark:text-cyan-300 font-bold mt-0.5">{{ v.perkTitle }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-300 mt-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-2 w-full">
                {{ v.perkDescription }}
              </p>
            </div>
          </div>
        </div>

        <!-- دکمه ورود به پیست مسابقه -->
        <div class="mt-10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            class="w-full sm:w-80 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-600 py-4 font-black text-lg text-white shadow-xl shadow-cyan-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            :disabled="selectedCourseIds.length === 0"
            @click="startMission"
          >
            روشن کردن موتور و شروع مسابقه 🏁
          </button>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            تعداد سوالات فعال در این مسابقه: <span class="font-bold text-cyan-600 dark:text-cyan-400">{{ eligibleQuestions.length }}</span> سوال
          </p>
        </div>
      </div>
    </main>

    <!-- ۲. شمارش معکوس استارت گرندپری (Starting Lights 🔴🔴🟢) -->
    <div
      v-if="gameState === 'countdown'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
    >
      <div class="text-center max-w-md">
        <!-- چراغ‌های مسابقه‌ای فرمول ۱ -->
        <div class="flex items-center justify-center gap-4 mb-6">
          <div
            class="h-12 w-12 rounded-full border-2 border-slate-700 transition-all duration-300"
            :class="countdownNumber <= 3 ? 'bg-rose-500 shadow-lg shadow-rose-500/50 scale-110' : 'bg-slate-800'"
          />
          <div
            class="h-12 w-12 rounded-full border-2 border-slate-700 transition-all duration-300"
            :class="countdownNumber <= 2 ? 'bg-amber-500 shadow-lg shadow-amber-500/50 scale-110' : 'bg-slate-800'"
          />
          <div
            class="h-12 w-12 rounded-full border-2 border-slate-700 transition-all duration-300"
            :class="countdownNumber <= 1 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-110' : 'bg-slate-800'"
          />
        </div>

        <div class="text-7xl font-black bg-gradient-to-b from-amber-300 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
          {{ countdownNumber }}
        </div>
        <p class="mt-4 text-xl font-bold text-white">آماده‌باش برای شتاب اولیه و سبقت...</p>
        <div class="mt-6 rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-4 shadow-xl">
          <p class="text-sm font-bold text-cyan-300">💡 یادآوری انگیزشی:</p>
          <p class="text-xs text-slate-200 mt-1 leading-relaxed">{{ currentMotivationalQuote }}</p>
        </div>
      </div>
    </div>

    <!-- ۳. پیست مسابقه و صحنه اصلی بازی (Playing Track) -->
    <div v-show="gameState === 'playing'" class="relative flex flex-col items-center w-full px-2 py-4">
      <div class="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-slate-100 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <canvas
          ref="canvasRef"
          width="960"
          height="540"
          class="w-full h-auto block"
        />

        <!-- نوار بالایی نشانگر پیشروی مسابقه روی بوم -->
        <div class="absolute top-3 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
          <!-- نوار پیشروی مسافت پیست -->
          <div class="w-full max-w-sm rounded-full bg-slate-950/60 p-1.5 backdrop-blur-md border border-slate-700/50 hidden sm:block">
            <div class="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                :style="{ width: `${Math.min(100, (playerDistance / totalRaceDistance) * 100)}%` }"
              />
            </div>
          </div>
        </div>

        <!-- HUD هولوگرافیک سوالات کتاب درسی (مستقر در سمت راست میدان نبرد بدون تداخل) -->
        <div
          v-if="currentQuestion"
          class="absolute top-2 right-2 sm:top-3 sm:right-3 w-[calc(100%-1rem)] sm:w-96 max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-1.5rem)] z-30 flex flex-col transition-all duration-300 pointer-events-auto"
        >
          <div class="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-white/95 p-2.5 sm:p-4 shadow-2xl backdrop-blur-md dark:bg-slate-950/85 transition-colors">
            <div class="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 dark:border-slate-800">
              <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span class="text-xs font-black text-amber-500 truncate">⚡ چالش سبقت و نیترو:</span>
                <span class="shrink-0 rounded bg-cyan-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
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
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-500 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800'
                  "
                  :disabled="hasAnsweredCurrent"
                  @click="answerQuestion(idx)"
                >
                  <span class="font-bold text-cyan-600 dark:text-cyan-400 ml-1.5">{{ idx + 1 }}.</span>
                  <span>{{ option }}</span>
                </button>
              </div>

              <div v-if="hasAnsweredCurrent && !wasAnswerCorrect" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 dark:border-rose-500/30 dark:bg-rose-950/40">
                <div class="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">
                  <span>❌</span>
                  <span>پاسخ اشتباه! سرعت خودرو کم شد.</span>
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
                  🔄 سوال بعدی / جبران سرعت
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- دکمه درخواست سوال جدید در صورت بسته بودن (سمت چپ میدان مسابقه) -->
        <button
          v-if="!showHoloDeck || !currentQuestion"
          type="button"
          class="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-2xl border border-cyan-500/50 bg-white/90 px-4 py-2 text-xs font-bold text-cyan-800 shadow-xl backdrop-blur-md hover:bg-cyan-50 dark:bg-slate-950/80 dark:text-cyan-300 dark:hover:bg-cyan-950 transition-all pointer-events-auto"
          @click="pickNextQuestion"
        >
          <span>⚡</span>
          <span>دریافت تست نیترو (+۱۸۰ امتیاز)</span>
        </button>
      </div>
    </div>

    <!-- ۴. جشن قهرمانی و سکوی پیروزی (Finish / Victory Screen) -->
    <div
      v-if="gameState === 'finished'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
    >
      <div class="max-w-md w-full rounded-3xl border border-amber-500/40 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
        <div class="text-6xl mb-3">
          {{ playerRank === 1 ? '🥇' : playerRank === 2 ? '🥈' : '🥉' }}
        </div>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white">
          {{ playerRank === 1 ? 'قهرمانی در گرندپری دانش!' : 'پایان موفقیت‌آمیز مسابقه سرعت!' }}
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-300 mt-2">
          شما با موفقیت مسافت {{ totalRaceDistance }} متری پیست را با جایگاه
          <strong class="text-amber-500">«{{ playerRank === 1 ? 'مقام اول' : playerRank === 2 ? 'مقام دوم' : 'مقام سوم' }}»</strong>
          طی کردید!
        </p>

        <!-- آمار رانندگی و تست‌ها -->
        <div class="my-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4">
          <div>
            <div class="text-xs text-slate-400">امتیاز کل</div>
            <div class="text-xl font-black text-amber-500 mt-0.5">{{ score }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">حداکثر سرعت</div>
            <div class="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">{{ activeVehicle.nitroSpeed }} km/h</div>
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
            class="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-600 py-3.5 font-black text-white shadow-lg transition hover:scale-105 active:scale-95"
            @click="gameState = 'setup'"
          >
            مسابقه جدید 🏎️
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
