<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { useGameHistoryStore } from '@/stores/game-history'
import { useGameProfilesStore } from '@/stores/game-profiles'
import { DEFAULT_CURRICULUM_QUESTIONS, type EducationalQuestion } from '@/config/default-questions.config'
import { sfx } from '@/utils/sound-effects'
import { BASE_COURSES, findCourse } from '@/config/courses.config'
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
const GRADE_COURSES_MAP: Record<number, string[]> = {
  1: ['math', 'science', 'persian-reading', 'quran'],
  2: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts'],
  3: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies'],
  4: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies'],
  5: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies'],
  6: ['math', 'science', 'persian-reading', 'quran', 'heaven-gifts', 'social-studies', 'thinking-research', 'work-tech'],
}

// --- استورهای سیستم ---
const questionsStore = useQuestionsStore()
const gameHistoryStore = useGameHistoryStore()
const profilesStore = useGameProfilesStore()

// --- فرماندهان قلعه فرزانگی (Heroes) ---
interface CommanderHero {
  id: 'dana' | 'roya' | 'alpha'
  name: string
  title: string
  avatar: string
  color: string
  perkTitle: string
  perkDescription: string
  damageMultiplier: number
  rangeMultiplier: number
  enemySpeedMultiplier: number
}

const COMMANDERS: CommanderHero[] = [
  {
    id: 'dana',
    name: 'استاد دانا',
    title: 'فرمانده ارشد دانشکده فرزانگی',
    avatar: '🧙‍♂️',
    color: '#8b5cf6',
    perkTitle: 'تمرکز ذهنی اعجاب‌انگیز',
    perkDescription: '+۱۵٪ خسارت به همهٔ برج‌های دفاعی',
    damageMultiplier: 1.15,
    rangeMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
  },
  {
    id: 'roya',
    name: 'کاپیتان رویا',
    title: 'دیده‌بان افق‌های نوآوری',
    avatar: '👩‍🚀',
    color: '#06b6d4',
    perkTitle: 'رادار کهکشانی پیشرفته',
    perkDescription: '+۲۰٪ برد شلیک و دیدبانی همهٔ برج‌ها',
    damageMultiplier: 1.0,
    rangeMultiplier: 1.2,
    enemySpeedMultiplier: 1.0,
  },
  {
    id: 'alpha',
    name: 'آلفا-ربات نواندیش',
    title: 'نگهبان سایبری خرد',
    avatar: '🤖',
    color: '#10b981',
    perkTitle: 'میدان مغناطیسی بازدارنده',
    perkDescription: 'کاهش ۱۵٪ سرعت حرکت تمام شیاطین نادانی',
    damageMultiplier: 1.0,
    rangeMultiplier: 1.0,
    enemySpeedMultiplier: 0.85,
  },
]

// --- انواع برج‌های دفاعی ---
export type TowerType = 'math' | 'science' | 'literature' | 'history'

interface TowerDef {
  type: TowerType
  name: string
  courseName: string
  icon: string
  color: string
  baseCost: number
  baseDamage: number
  baseRange: number
  fireRate: number
  description: string
  specialEffect: string
}

const TOWER_TYPES: Record<TowerType, TowerDef> = {
  math: {
    type: 'math',
    name: 'منشور محاسباتی',
    courseName: 'ریاضیات',
    icon: '💎',
    color: '#38bdf8',
    baseCost: 100,
    baseDamage: 28,
    baseRange: 130,
    fireRate: 2.2,
    description: 'شلیک لیزرهای نوری پرسرعت بر اساس محاسبات هندسی',
    specialEffect: 'تیراندازی متوالی و تک‌هدفه با بالاترین سرعت',
  },
  science: {
    type: 'science',
    name: 'توپ پلاسمای تجربی',
    courseName: 'علوم تجربی',
    icon: '🧪',
    color: '#22c55e',
    baseCost: 125,
    baseDamage: 45,
    baseRange: 110,
    fireRate: 0.9,
    description: 'پرتاب کره‌های پلاسمایی با انفجار و آسیب محیطی',
    specialEffect: 'انفجار محیطی (Splash) و آسیب به تمام دشمنان متراکم',
  },
  literature: {
    type: 'literature',
    name: 'ستون یخی واژگان',
    courseName: 'فارسی و ادبیات',
    icon: '❄️',
    color: '#818cf8',
    baseCost: 110,
    baseDamage: 18,
    baseRange: 120,
    fireRate: 1.3,
    description: 'امواج انجمادی بلورین برای به دام انداختن دشمنان',
    specialEffect: 'کاهش ۵۰٪ سرعت حرکت دشمنان در حوزهٔ نفوذ',
  },
  history: {
    type: 'history',
    name: 'ابلیسک صاعقهٔ اندیشه',
    courseName: 'مطالعات و تفکر',
    icon: '⚡',
    color: '#f59e0b',
    baseCost: 140,
    baseDamage: 38,
    baseRange: 135,
    fireRate: 1.1,
    description: 'جهش صاعقه‌های فکری زنجیره‌ای بین اهداف',
    specialEffect: 'انتقال شوک زنجیره‌ای بین ۳ دشمن مجاور',
  },
}

interface TowerPad {
  id: number
  x: number
  y: number
  tower: TowerInstance | null
}

interface TowerInstance {
  id: string
  padId: number
  type: TowerType
  level: number
  costInvested: number
  lastShotTime: number
  targetEnemyId: string | null
  angle: number
}

interface Enemy {
  id: string
  name: string
  type: 'sloth' | 'amnesia' | 'rumor' | 'boss'
  avatar: string
  color: string
  maxHp: number
  hp: number
  speed: number
  waypointIndex: number
  x: number
  y: number
  size: number
  rewardCrystals: number
  rewardScore: number
  slowTimer: number
  isBoss?: boolean
}

interface Projectile {
  id: string
  type: 'laser' | 'plasma' | 'frost' | 'chain' | 'skystrike'
  startX: number
  startY: number
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  targetEnemyId?: string
  color: string
  speed: number
  damage: number
  radius: number
  splashRadius?: number
  slowDuration?: number
  chainTargets?: { x: number; y: number }[]
  life: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
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

type GameState = 'setup' | 'countdown' | 'playing' | 'wave-cleared' | 'game-over' | 'victory'

const gameState = ref<GameState>('setup')
const countdownNumber = ref(3)

// متغیرهای فصلی و مراحل
const activeSeasonKey = ref<GameSeasonKey>(getCurrentSeasonKey())
const selectedStage = ref<GameStage | null>(null)

// جملات انگیزشی
const currentMotivationalQuote = ref<string>('')

function pickRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  return MOTIVATIONAL_QUOTES[randomIndex].text
}

// متغیرهای تنظیمات مأموریت
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
const selectedCommanderId = ref<'dana' | 'roya' | 'alpha'>('dana')

// همگام‌سازی پایه با دانش‌آموز فعال
watch(
  () => profilesStore.activeProfile?.grade,
  (newGrade) => {
    if (newGrade) selectedGrade.value = newGrade
  },
  { immediate: true }
)

const activeCommander = computed(() => {
  return COMMANDERS.find((c) => c.id === selectedCommanderId.value) || COMMANDERS[0]
})

const availableCoursesForGrade = computed(() => {
  const ids = GRADE_COURSES_MAP[selectedGrade.value] || []
  return BASE_COURSES.filter((c) => ids.includes(c.id))
})

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

// مدیریت سوالات و استورها
const extraCurriculumQuestions = ref<EducationalQuestion[]>([])

async function loadGameQuestionBank(): Promise<void> {
  try {
    const res = await fetch('/data/questions/elementary-curriculum-questions.json')
    if (res.ok) {
      extraCurriculumQuestions.value = await res.json()
    }
  } catch (e) {
    console.warn('Questions file could not be loaded:', e)
  }
}

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

const eligibleQuestions = computed(() => {
  return allQuestions.value.filter((q) => {
    if (q.grade !== selectedGrade.value) return false
    if (!selectedCourseIds.value.includes(q.courseId)) return false
    const diff = subjectDifficulties.value[q.courseId]
    if (diff && diff !== 'all' && q.difficulty !== diff) return false
    return true
  })
})

// جلسه و تاریخچه بازی
const currentSessionId = ref<string>('')
const gameStartTime = ref<number>(0)
const sessionAnswers = ref<QuestionAnswerRecord[]>([])
const questionShownAt = ref<number>(0)

// مودال‌های ناوبری و بخش‌های الحاقی
const showJourneyModal = ref(false)
const showMedalsModal = ref(false)
const showAnalyticsModal = ref(false)

// منابع و امتیاز درون بازی
const score = ref(0)
const crystals = ref(180)
const citadelHp = ref(100)
const maxCitadelHp = 100
const currentWave = ref(1)
const maxWaves = ref(10)
const gameSpeed = ref<1 | 2>(1)
const isPaused = ref(false)
const soundEnabled = ref(true)

// HUD هولوگرافیک سوال
const showHoloDeck = ref(true)
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnsweredCurrent = ref(false)
const wasAnswerCorrect = ref(false)

// انتخاب ایستگاه برج و منوی ساخت / ارتقا
const selectedPad = ref<TowerPad | null>(null)
const showBuildModal = ref(false)

// بوم نقاشی و متغیرهای انیمیشن
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null

// مسیر عبور دشمنان (Path Waypoints) در مقیاس 960x540
const PATH_WAYPOINTS = [
  { x: -30, y: 130 },
  { x: 190, y: 130 },
  { x: 190, y: 390 },
  { x: 440, y: 390 },
  { x: 440, y: 150 },
  { x: 710, y: 150 },
  { x: 710, y: 440 },
  { x: 890, y: 440 },
]

const CITADEL_POS = { x: 890, y: 440 }

const towerPads = ref<TowerPad[]>([
  { id: 1, x: 95, y: 250, tower: null },
  { id: 2, x: 310, y: 270, tower: null },
  { id: 3, x: 310, y: 470, tower: null },
  { id: 4, x: 570, y: 90, tower: null },
  { id: 5, x: 575, y: 310, tower: null },
  { id: 6, x: 805, y: 280, tower: null },
  { id: 7, x: 805, y: 110, tower: null },
])

let enemies: Enemy[] = []
let projectiles: Projectile[] = []
let particles: Particle[] = []
let floatingTexts: FloatingText[] = []

let waveEnemyQueue: Array<{ type: Enemy['type']; delay: number }> = []
let waveSpawnTimer = 0
let isSpawningWave = false

const isPortraitMobile = ref(false)
const dismissRotationWarning = ref(false)

function checkOrientation(): void {
  if (typeof window === 'undefined') return
  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const isSmallScreen = window.innerWidth <= 1024
  isPortraitMobile.value = isPortrait && isSmallScreen
}

function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value
  sfx.enabled = soundEnabled.value
}

function toggleGameSpeed(): void {
  gameSpeed.value = gameSpeed.value === 1 ? 2 : 1
}

function togglePause(): void {
  isPaused.value = !isPaused.value
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
    score.value += 150
    crystals.value += 100

    floatingTexts.push({
      x: 480,
      y: 120,
      text: `⚡ پاسخ صحیح در ${durationSeconds} ثانیه! (+۱۰۰ 💎 دانایی)`,
      color: '#10b981',
      alpha: 1,
      vy: -1.2,
    })

    const streak = sessionAnswers.value.slice(-3).every((a) => a.isCorrect)
    if (streak && sessionAnswers.value.length >= 3) {
      floatingTexts.push({
        x: 480,
        y: 80,
        text: `🌟 ${pickRandomMotivationalQuote()}`,
        color: '#fbbf24',
        alpha: 1,
        vy: -0.8,
      })
    }

    triggerWisdomSkyStrike()

    setTimeout(() => {
      showHoloDeck.value = false
    }, 1500)
  } else {
    sfx.playIncorrect()
    floatingTexts.push({
      x: 480,
      y: 120,
      text: `❌ پاسخ اشتباه! دوباره تلاش کن`,
      color: '#ef4444',
      alpha: 1,
      vy: -1.0,
    })
  }

  saveCurrentSessionSnapshot()
}

function triggerWisdomSkyStrike(): void {
  if (enemies.length === 0) return
  const leadEnemy = [...enemies].sort((a, b) => b.waypointIndex - a.waypointIndex || (b.x - a.x))[0]
  if (!leadEnemy) return

  sfx.playLaunch()

  projectiles.push({
    id: crypto.randomUUID(),
    type: 'skystrike',
    startX: leadEnemy.x,
    startY: -30,
    currentX: leadEnemy.x,
    currentY: -30,
    targetX: leadEnemy.x,
    targetY: leadEnemy.y,
    color: '#fbbf24',
    speed: 35,
    damage: 90 * activeCommander.value.damageMultiplier,
    radius: 8,
    splashRadius: 70,
    life: 1,
  })
}

function retryWithNewQuestion(): void {
  pickNextQuestion()
}

function handlePadClick(pad: TowerPad): void {
  selectedPad.value = pad
  showBuildModal.value = true
}

function buildTower(type: TowerType): void {
  if (!selectedPad.value) return
  const def = TOWER_TYPES[type]
  if (crystals.value < def.baseCost) {
    alert(`کریستال دانایی کافی ندارید! (نیاز: ${def.baseCost}، موجودی: ${crystals.value}) با پاسخ صحیح به سوالات کتاب کریستال دریافت کنید.`)
    return
  }

  crystals.value -= def.baseCost
  sfx.playBuild()

  selectedPad.value.tower = {
    id: crypto.randomUUID(),
    padId: selectedPad.value.id,
    type,
    level: 1,
    costInvested: def.baseCost,
    lastShotTime: 0,
    targetEnemyId: null,
    angle: 0,
  }

  floatingTexts.push({
    x: selectedPad.value.x,
    y: selectedPad.value.y - 20,
    text: `ساخت ${def.name}!`,
    color: def.color,
    alpha: 1,
    vy: -1.0,
  })

  showBuildModal.value = false
}

function upgradeTower(): void {
  if (!selectedPad.value || !selectedPad.value.tower) return
  const tower = selectedPad.value.tower
  if (tower.level >= 3) return

  const upgradeCost = Math.round(TOWER_TYPES[tower.type].baseCost * (tower.level === 1 ? 1.2 : 1.8))
  if (crystals.value < upgradeCost) {
    alert(`کریستال کافی ندارید! برای ارتقا به ${upgradeCost} کریستال دانایی نیاز است. به سوالات کتاب پاسخ دهید.`)
    return
  }

  crystals.value -= upgradeCost
  tower.costInvested += upgradeCost
  tower.level += 1
  sfx.playBuild()

  floatingTexts.push({
    x: selectedPad.value.x,
    y: selectedPad.value.y - 25,
    text: `⭐️ ارتقا به سطح ${tower.level}!`,
    color: '#fbbf24',
    alpha: 1,
    vy: -1.2,
  })

  showBuildModal.value = false
}

function sellTower(): void {
  if (!selectedPad.value || !selectedPad.value.tower) return
  const refund = Math.round(selectedPad.value.tower.costInvested * 0.7)
  crystals.value += refund
  selectedPad.value.tower = null
  sfx.playLaunch()

  floatingTexts.push({
    x: selectedPad.value.x,
    y: selectedPad.value.y - 20,
    text: `+${refund} 💎 بازیافت برج`,
    color: '#38bdf8',
    alpha: 1,
    vy: -1.0,
  })

  showBuildModal.value = false
}

function prepareWave(waveNum: number): void {
  isSpawningWave = true
  waveSpawnTimer = 0
  waveEnemyQueue = []

  const totalEnemies = 5 + waveNum * 3
  const isBossWave = waveNum % 5 === 0

  for (let i = 0; i < totalEnemies; i++) {
    let type: Enemy['type'] = 'sloth'
    const roll = Math.random()
    if (waveNum >= 2 && roll > 0.4) type = 'amnesia'
    if (waveNum >= 4 && roll > 0.75) type = 'rumor'

    waveEnemyQueue.push({
      type,
      // تأخیر ملایم‌تر بین هجوم دشمنان برای ایجاد فرصت فکر و حل تست برای دانش‌آموز (حدود ۲ الی ۳ ثانیه بین هر دشمن)
      delay: i === 0 ? 80 : 120 + Math.floor(Math.random() * 60),
    })
  }

  if (isBossWave) {
    waveEnemyQueue.push({
      type: 'boss',
      delay: 150,
    })
  }

  floatingTexts.push({
    x: 480,
    y: 200,
    text: `⚔️ موج ${waveNum} آغاز شد!`,
    color: '#f59e0b',
    alpha: 1,
    vy: -0.8,
  })
}

function spawnEnemy(type: Enemy['type']): void {
  const waveScale = 1 + (currentWave.value - 1) * 0.28
  let name = 'باگ تنبلی'
  let avatar = '👾'
  let color = '#a855f7'
  let maxHp = Math.round(65 * waveScale)
  let speed = 0.85 * activeCommander.value.enemySpeedMultiplier
  let size = 18
  let rewardCrystals = 15
  let rewardScore = 40
  let isBoss = false

  if (type === 'amnesia') {
    name = 'سایه فراموشی'
    avatar = '👻'
    color = '#60a5fa'
    maxHp = Math.round(110 * waveScale)
    speed = 0.65 * activeCommander.value.enemySpeedMultiplier
    size = 20
    rewardCrystals = 22
    rewardScore = 60
  } else if (type === 'rumor') {
    name = 'ربات شایعه'
    avatar = '🤖'
    color = '#f97316'
    maxHp = Math.round(240 * waveScale)
    speed = 0.45 * activeCommander.value.enemySpeedMultiplier
    size = 24
    rewardCrystals = 35
    rewardScore = 100
  } else if (type === 'boss') {
    name = 'اژدهای نادانی'
    avatar = '🐲'
    color = '#ef4444'
    maxHp = Math.round(850 * waveScale)
    speed = 0.32 * activeCommander.value.enemySpeedMultiplier
    size = 34
    rewardCrystals = 100
    rewardScore = 350
    isBoss = true
  }

  enemies.push({
    id: crypto.randomUUID(),
    name,
    type,
    avatar,
    color,
    maxHp,
    hp: maxHp,
    speed,
    waypointIndex: 0,
    x: PATH_WAYPOINTS[0].x,
    y: PATH_WAYPOINTS[0].y,
    size,
    rewardCrystals,
    rewardScore,
    slowTimer: 0,
    isBoss,
  })
}

function startMission(): void {
  if (selectedCourseIds.value.length === 0) {
    alert('لطفاً حداقل یک درس را انتخاب کنید.')
    return
  }

  currentSessionId.value = crypto.randomUUID()
  gameStartTime.value = Date.now()
  sessionAnswers.value = []
  score.value = 0
  crystals.value = 200
  citadelHp.value = maxCitadelHp
  currentWave.value = 1
  enemies = []
  projectiles = []
  particles = []
  floatingTexts = []

  towerPads.value.forEach((pad) => {
    pad.tower = null
  })

  currentMotivationalQuote.value = pickRandomMotivationalQuote()
  gameState.value = 'countdown'
  countdownNumber.value = 3
  sfx.playCountdown()

  const timer = setInterval(() => {
    countdownNumber.value -= 1
    if (countdownNumber.value > 0) {
      sfx.playCountdown()
    } else {
      clearInterval(timer)
      sfx.playCountdown(true)
      gameState.value = 'playing'
      pickNextQuestion()
      prepareWave(currentWave.value)
    }
  }, 900)
}

function handleSelectStage(stage: GameStage): void {
  selectedStage.value = stage
  maxWaves.value = stage.wavesCount
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

async function saveCurrentSessionSnapshot(): Promise<void> {
  if (!currentSessionId.value) return
  const durationSec = Math.max(1, Math.round((Date.now() - gameStartTime.value) / 1000))
  const correctCount = sessionAnswers.value.filter((a) => a.isCorrect).length
  const totalCount = sessionAnswers.value.length
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  const session: GameHistorySession = {
    id: currentSessionId.value,
    studentId: profilesStore.activeProfile?.id,
    studentName: profilesStore.activeProfile?.name,
    gameType: 'tower-defense',
    gameTitle: 'برج دفاعی دانایی',
    heroId: activeCommander.value.id,
    heroName: activeCommander.value.name,
    grade: selectedGrade.value,
    season: activeSeasonKey.value,
    stageId: selectedStage.value?.id,
    selectedCourses: [...selectedCourseIds.value],
    startedAt: gameStartTime.value,
    endedAt: Date.now(),
    totalDurationSeconds: durationSec,
    score: score.value,
    wavesCleared: currentWave.value - (gameState.value === 'victory' ? 0 : 1),
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

function gameLoop(timestamp: number): void {
  if (gameState.value === 'playing' && !isPaused.value) {
    const loopIterations = gameSpeed.value
    for (let i = 0; i < loopIterations; i++) {
      updateGamePhysics(timestamp)
    }
  }

  renderGameCanvas()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function updateGamePhysics(now: number): void {
  if (isSpawningWave && waveEnemyQueue.length > 0) {
    waveSpawnTimer += 1
    if (waveSpawnTimer >= waveEnemyQueue[0].delay) {
      const nextEnemy = waveEnemyQueue.shift()
      if (nextEnemy) {
        spawnEnemy(nextEnemy.type)
      }
      waveSpawnTimer = 0
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (e.slowTimer > 0) {
      e.slowTimer -= 1
    }

    const currentSpeed = e.slowTimer > 0 ? e.speed * 0.5 : e.speed
    const targetWp = PATH_WAYPOINTS[e.waypointIndex + 1]

    if (!targetWp) {
      const damageToCitadel = e.isBoss ? 25 : 8
      citadelHp.value = Math.max(0, citadelHp.value - damageToCitadel)
      sfx.playDefeat()

      floatingTexts.push({
        x: CITADEL_POS.x - 30,
        y: CITADEL_POS.y - 40,
        text: `💥 -${damageToCitadel} قلعه!`,
        color: '#ef4444',
        alpha: 1,
        vy: -1.0,
      })

      createParticles(CITADEL_POS.x, CITADEL_POS.y, '#ef4444', 15)
      enemies.splice(i, 1)

      if (citadelHp.value <= 0) {
        gameState.value = 'game-over'
        sfx.playDefeat()
        saveCurrentSessionSnapshot()
        return
      }
      continue
    }

    const dx = targetWp.x - e.x
    const dy = targetWp.y - e.y
    const dist = Math.hypot(dx, dy)

    if (dist <= currentSpeed) {
      e.x = targetWp.x
      e.y = targetWp.y
      e.waypointIndex += 1
    } else {
      e.x += (dx / dist) * currentSpeed
      e.y += (dy / dist) * currentSpeed
    }
  }

  towerPads.value.forEach((pad) => {
    const tower = pad.tower
    if (!tower) return

    const def = TOWER_TYPES[tower.type]
    const range = def.baseRange * (tower.level === 1 ? 1 : tower.level === 2 ? 1.25 : 1.5) * activeCommander.value.rangeMultiplier
    const damage = Math.round(def.baseDamage * (tower.level === 1 ? 1 : tower.level === 2 ? 1.6 : 2.4) * activeCommander.value.damageMultiplier)
    const fireIntervalMs = 1000 / def.fireRate

    let target: Enemy | null = null
    let maxProgress = -1

    for (const enemy of enemies) {
      const d = Math.hypot(enemy.x - pad.x, enemy.y - pad.y)
      if (d <= range) {
        const progress = enemy.waypointIndex * 1000 + (enemy.x + enemy.y)
        if (progress > maxProgress) {
          maxProgress = progress
          target = enemy
        }
      }
    }

    if (target) {
      tower.angle = Math.atan2(target.y - pad.y, target.x - pad.x)
      tower.targetEnemyId = target.id

      if (now - tower.lastShotTime >= fireIntervalMs) {
        tower.lastShotTime = now
        fireTowerWeapon(pad, tower, target, damage, range)
      }
    } else {
      tower.targetEnemyId = null
    }
  })

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]

    if (p.type === 'laser') {
      p.life -= 0.15
      if (p.life <= 0) projectiles.splice(i, 1)
      continue
    }

    if (p.type === 'skystrike') {
      p.currentY += p.speed
      if (p.currentY >= p.targetY) {
        sfx.playExplosion()
        createParticles(p.targetX, p.targetY, '#fbbf24', 25)

        enemies.forEach((enemy) => {
          const d = Math.hypot(enemy.x - p.targetX, enemy.y - p.targetY)
          if (d <= (p.splashRadius || 70)) {
            damageEnemy(enemy, p.damage)
          }
        })

        floatingTexts.push({
          x: p.targetX,
          y: p.targetY - 20,
          text: `⚡ دانایی! -${Math.round(p.damage)}`,
          color: '#fbbf24',
          alpha: 1,
          vy: -1.2,
        })

        projectiles.splice(i, 1)
      }
      continue
    }

    if (p.type === 'plasma') {
      const dx = p.targetX - p.currentX
      const dy = p.targetY - p.currentY
      const dist = Math.hypot(dx, dy)

      if (dist <= p.speed) {
        sfx.playExplosion()
        createParticles(p.targetX, p.targetY, '#22c55e', 18)

        enemies.forEach((enemy) => {
          const d = Math.hypot(enemy.x - p.targetX, enemy.y - p.targetY)
          if (d <= (p.splashRadius || 45)) {
            damageEnemy(enemy, p.damage)
          }
        })

        projectiles.splice(i, 1)
      } else {
        p.currentX += (dx / dist) * p.speed
        p.currentY += (dy / dist) * p.speed
      }
      continue
    }

    if (p.type === 'frost') {
      p.life -= 0.1
      if (p.life <= 0) projectiles.splice(i, 1)
      continue
    }

    if (p.type === 'chain') {
      p.life -= 0.12
      if (p.life <= 0) projectiles.splice(i, 1)
      continue
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i]
    pt.x += pt.vx
    pt.y += pt.vy
    pt.alpha -= 0.03
    if (pt.alpha <= 0) particles.splice(i, 1)
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i]
    ft.y += ft.vy
    ft.alpha -= 0.02
    if (ft.alpha <= 0) floatingTexts.splice(i, 1)
  }

  if (isSpawningWave && waveEnemyQueue.length === 0 && enemies.length === 0) {
    isSpawningWave = false
    handleWaveCleared()
  }
}

function fireTowerWeapon(
  pad: TowerPad,
  tower: TowerInstance,
  target: Enemy,
  damage: number,
  range: number
): void {
  if (tower.type === 'math') {
    sfx.playTowerShoot()
    damageEnemy(target, damage)
    createParticles(target.x, target.y, '#38bdf8', 6)

    projectiles.push({
      id: crypto.randomUUID(),
      type: 'laser',
      startX: pad.x,
      startY: pad.y,
      currentX: pad.x,
      currentY: pad.y,
      targetX: target.x,
      targetY: target.y,
      color: '#38bdf8',
      speed: 0,
      damage,
      radius: tower.level === 3 ? 4 : 2.5,
      life: 1,
    })
  } else if (tower.type === 'science') {
    sfx.playLaunch()
    projectiles.push({
      id: crypto.randomUUID(),
      type: 'plasma',
      startX: pad.x,
      startY: pad.y,
      currentX: pad.x,
      currentY: pad.y,
      targetX: target.x,
      targetY: target.y,
      color: '#22c55e',
      speed: 11,
      damage,
      radius: 6,
      splashRadius: tower.level === 3 ? 65 : 45,
      life: 1,
    })
  } else if (tower.type === 'literature') {
    sfx.playFreeze()
    damageEnemy(target, damage)
    target.slowTimer = 90

    projectiles.push({
      id: crypto.randomUUID(),
      type: 'frost',
      startX: pad.x,
      startY: pad.y,
      currentX: pad.x,
      currentY: pad.y,
      targetX: target.x,
      targetY: target.y,
      color: '#818cf8',
      speed: 0,
      damage,
      radius: range * 0.9,
      life: 1,
    })

    createParticles(target.x, target.y, '#c7d2fe', 10)
  } else if (tower.type === 'history') {
    sfx.playTowerShoot()
    damageEnemy(target, damage)

    const chained = enemies
      .filter((e) => e.id !== target.id && Math.hypot(e.x - target.x, e.y - target.y) <= 120)
      .slice(0, tower.level >= 2 ? 3 : 2)

    chained.forEach((chainTarget) => {
      damageEnemy(chainTarget, Math.round(damage * 0.75))
      createParticles(chainTarget.x, chainTarget.y, '#f59e0b', 8)
    })

    projectiles.push({
      id: crypto.randomUUID(),
      type: 'chain',
      startX: pad.x,
      startY: pad.y,
      currentX: pad.x,
      currentY: pad.y,
      targetX: target.x,
      targetY: target.y,
      color: '#f59e0b',
      speed: 0,
      damage,
      radius: 2,
      chainTargets: chained.map((c) => ({ x: c.x, y: c.y })),
      life: 1,
    })
  }
}

function damageEnemy(enemy: Enemy, damage: number): void {
  enemy.hp -= damage

  floatingTexts.push({
    x: enemy.x + (Math.random() * 20 - 10),
    y: enemy.y - 15,
    text: `-${Math.round(damage)}`,
    color: '#ffffff',
    alpha: 0.9,
    vy: -0.9,
  })

  if (enemy.hp <= 0) {
    const idx = enemies.findIndex((e) => e.id === enemy.id)
    if (idx >= 0) {
      enemies.splice(idx, 1)
      score.value += enemy.rewardScore
      crystals.value += enemy.rewardCrystals
      sfx.playExplosion()
      createParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 35 : 16)

      floatingTexts.push({
        x: enemy.x,
        y: enemy.y - 30,
        text: `+${enemy.rewardCrystals} 💎`,
        color: '#38bdf8',
        alpha: 1,
        vy: -1.2,
      })
    }
  }
}

function createParticles(x: number, y: number, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3.5 + 0.5
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: Math.random() * 4 + 2,
      alpha: 1,
      life: 1,
    })
  }
}

function handleWaveCleared(): void {
  sfx.playVictory()
  crystals.value += 60 + currentWave.value * 25
  score.value += 300

  if (currentWave.value >= maxWaves.value) {
    gameState.value = 'victory'
    saveCurrentSessionSnapshot()
  } else {
    gameState.value = 'wave-cleared'
    saveCurrentSessionSnapshot()
  }
}

function startNextWave(): void {
  currentWave.value += 1
  gameState.value = 'playing'
  pickNextQuestion()
  prepareWave(currentWave.value)
}

function renderGameCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // ۱. پس‌زمینه با هماهنگی کامل تم تاریک/روشن
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  if (isDark) {
    bgGrad.addColorStop(0, '#0f172a')
    bgGrad.addColorStop(0.5, '#1e293b')
    bgGrad.addColorStop(1, '#0f172a')
  } else {
    bgGrad.addColorStop(0, '#f0fdf4')
    bgGrad.addColorStop(0.5, '#dcfce7')
    bgGrad.addColorStop(1, '#f0fdf4')
  }
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // خطوط نامرئی انرژی
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(16, 185, 129, 0.12)'
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

  // ۲. مسیر سنگ‌فرش
  ctx.save()
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.35)'
  ctx.lineWidth = 44
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  PATH_WAYPOINTS.forEach((wp, idx) => {
    if (idx === 0) ctx.moveTo(wp.x, wp.y)
    else ctx.lineTo(wp.x, wp.y)
  })
  ctx.stroke()

  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1'
  ctx.lineWidth = 36
  ctx.stroke()

  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(16, 185, 129, 0.7)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // ۳. قلعه فرزانگی
  ctx.save()
  ctx.translate(CITADEL_POS.x, CITADEL_POS.y)

  const shieldAlpha = 0.2 + (citadelHp.value / maxCitadelHp) * 0.4
  ctx.fillStyle = isDark ? `rgba(56, 189, 248, ${shieldAlpha})` : `rgba(16, 185, 129, ${shieldAlpha})`
  ctx.beginPath()
  ctx.arc(0, 0, 48, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = isDark ? '#38bdf8' : '#10b981'
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.fillStyle = isDark ? '#1e1b4b' : '#312e81'
  ctx.fillRect(-24, -24, 48, 48)
  ctx.fillStyle = '#4338ca'
  ctx.beginPath()
  ctx.moveTo(-28, -24)
  ctx.lineTo(0, -48)
  ctx.lineTo(28, -24)
  ctx.closePath()
  ctx.fill()

  ctx.font = '24px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🏰', 0, 2)

  const hpRatio = citadelHp.value / maxCitadelHp
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(-35, -60, 70, 8)
  ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444'
  ctx.fillRect(-35, -60, 70 * hpRatio, 8)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(-35, -60, 70, 8)

  ctx.restore()

  // ۴. ایستگاه‌های استقرار برج
  towerPads.value.forEach((pad) => {
    ctx.save()
    ctx.translate(pad.x, pad.y)

    const isHoveredOrSelected = selectedPad.value?.id === pad.id

    ctx.beginPath()
    ctx.arc(0, 0, 26, 0, Math.PI * 2)
    ctx.fillStyle = pad.tower
      ? isDark
        ? '#1e293b'
        : '#f8fafc'
      : isDark
      ? 'rgba(30, 41, 59, 0.7)'
      : 'rgba(255, 255, 255, 0.85)'
    ctx.fill()
    ctx.strokeStyle = isHoveredOrSelected
      ? '#fbbf24'
      : pad.tower
      ? TOWER_TYPES[pad.tower.type].color
      : isDark
      ? 'rgba(56, 189, 248, 0.4)'
      : 'rgba(16, 185, 129, 0.5)'
    ctx.lineWidth = isHoveredOrSelected ? 3 : 2
    ctx.stroke()

    if (pad.tower) {
      const def = TOWER_TYPES[pad.tower.type]

      if (isHoveredOrSelected) {
        ctx.beginPath()
        const range =
          def.baseRange *
          (pad.tower.level === 1 ? 1 : pad.tower.level === 2 ? 1.25 : 1.5) *
          activeCommander.value.rangeMultiplier
        ctx.arc(0, 0, range, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 6])
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.rotate(pad.tower.angle)
      ctx.fillStyle = def.color
      ctx.fillRect(-10, -10, 20, 20)
      ctx.fillRect(8, -4, 12, 8)

      ctx.font = '16px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(def.icon, 0, 0)

      ctx.restore()
      ctx.save()
      ctx.translate(pad.x, pad.y)
      ctx.font = 'bold 11px sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.textAlign = 'center'
      const stars = '⭐️'.repeat(pad.tower.level)
      ctx.fillText(stars, 0, -30)
    } else {
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(16, 185, 129, 0.8)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', 0, 0)
    }

    ctx.restore()
  })

  // ۵. پرتابه‌ها
  projectiles.forEach((p) => {
    ctx.save()
    if (p.type === 'laser') {
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.radius * p.life
      ctx.beginPath()
      ctx.moveTo(p.startX, p.startY)
      ctx.lineTo(p.targetX, p.targetY)
      ctx.stroke()
    } else if (p.type === 'skystrike') {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(p.startX, p.startY)
      ctx.lineTo(p.currentX, p.currentY)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(p.currentX, p.currentY, 8, 0, Math.PI * 2)
      ctx.fill()
    } else if (p.type === 'plasma') {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.currentX, p.currentY, p.radius, 0, Math.PI * 2)
      ctx.fill()
    } else if (p.type === 'frost') {
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(p.startX, p.startY, p.radius * (1 - p.life + 0.2), 0, Math.PI * 2)
      ctx.stroke()
    } else if (p.type === 'chain') {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(p.startX, p.startY)
      ctx.lineTo(p.targetX, p.targetY)
      if (p.chainTargets) {
        p.chainTargets.forEach((ct) => {
          ctx.lineTo(ct.x, ct.y)
        })
      }
      ctx.stroke()
    }
    ctx.restore()
  })

  // ۶. دشمنان
  enemies.forEach((e) => {
    ctx.save()
    ctx.translate(e.x, e.y)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.beginPath()
    ctx.ellipse(0, e.size * 0.7, e.size * 0.7, e.size * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()

    if (e.slowTimer > 0) {
      ctx.fillStyle = 'rgba(129, 140, 248, 0.4)'
      ctx.beginPath()
      ctx.arc(0, 0, e.size + 4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.font = `${e.size * 1.5}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(e.avatar, 0, 0)

    const barWidth = e.size * 2
    const hpRatio = Math.max(0, e.hp / e.maxHp)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(-barWidth / 2, -e.size - 10, barWidth, 5)
    ctx.fillStyle = e.isBoss ? '#ef4444' : hpRatio > 0.4 ? '#22c55e' : '#f59e0b'
    ctx.fillRect(-barWidth / 2, -e.size - 10, barWidth * hpRatio, 5)

    ctx.restore()
  })

  // ۷. ذرات
  particles.forEach((pt) => {
    ctx.save()
    ctx.fillStyle = pt.color
    ctx.globalAlpha = Math.max(0, pt.alpha)
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // ۸. متون شناور
  floatingTexts.forEach((ft) => {
    ctx.save()
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = ft.color
    ctx.globalAlpha = Math.max(0, ft.alpha)
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  })
}

function handleCanvasClick(event: MouseEvent): void {
  if (gameState.value !== 'playing') return
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (event.clientX - rect.left) * scaleX
  const clickY = (event.clientY - rect.top) * scaleY

  for (const pad of towerPads.value) {
    const dist = Math.hypot(pad.x - clickX, pad.y - clickY)
    if (dist <= 32) {
      handlePadClick(pad)
      return
    }
  }

  selectedPad.value = null
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
  <div class="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans select-none overflow-x-hidden transition-colors" dir="rtl">
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
          برای دید استراتژیک کامل روی میدان نبرد برج دفاعی و نظارت بر امواج، لطفاً دستگاه خود را در حالت افقی (Landscape) قرار دهید.
        </p>
        <button
          type="button"
          class="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
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
            <span>🏰</span>
            <span class="bg-gradient-to-r from-amber-500 via-cyan-600 to-indigo-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-cyan-400 dark:to-indigo-400">
              برج دفاعی دانایی
            </span>
            <span class="hidden rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 sm:inline-block">
              استراتژیک علمی
            </span>
          </h1>
        </div>
      </div>

      <!-- وضعیت منابع و ابزارهای سریع در حالت بازی -->
      <div v-if="gameState === 'playing'" class="flex items-center gap-2 sm:gap-4">
        <div class="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-1.5 dark:bg-cyan-950/40">
          <span class="text-lg">💎</span>
          <span class="font-black text-cyan-700 dark:text-cyan-300 text-sm sm:text-base">{{ crystals }}</span>
          <span class="text-[10px] text-cyan-600 dark:text-cyan-400 hidden sm:inline">کریستال</span>
        </div>

        <div class="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/40">
          <span class="text-lg">🛡️</span>
          <span class="font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">{{ citadelHp }}%</span>
        </div>

        <div class="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-1.5 dark:bg-amber-950/40">
          <span class="text-xs text-amber-700 dark:text-amber-400 font-bold">موج:</span>
          <span class="font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base">{{ currentWave }}/{{ maxWaves }}</span>
        </div>

        <button
          type="button"
          class="rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          :class="{ 'border-amber-500 bg-amber-100 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300': gameSpeed === 2 }"
          @click="toggleGameSpeed"
          title="تغییر سرعت بازی"
        >
          {{ gameSpeed }}x ⏩
        </button>

        <button
          type="button"
          class="rounded-xl border border-slate-300 bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          @click="togglePause"
          :title="isPaused ? 'ادامه بازی' : 'توقف بازی'"
        >
          {{ isPaused ? '▶️' : '⏸️' }}
        </button>
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

    <!-- ۱. صفحه تنظیمات اتاق مأموریت (Setup Screen) -->
    <main v-if="gameState === 'setup'" class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div class="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
        <!-- پیام انگیزشی بالای صفحه -->
        <div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
          🌟 {{ currentMotivationalQuote }}
        </div>

        <div class="text-center">
          <div class="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/20 text-4xl mb-4 text-white">
            🏰
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">اتاق فرماندهی دفاع از قلعه فرزانگی</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            امواج نادانی به سمت قلعه فرزانگی سرازیر شده‌اند! با برپایی برج‌های دانش و پاسخ صحیح به تست‌های کتاب درسی، امواج را متوقف کنید.
          </p>
        </div>

        <!-- انتخاب پایه تحصیلی -->
        <div class="mt-8">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">۱. انتخاب پایه تحصیلی:</label>
          <div class="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            <button
              v-for="grade in [1, 2, 3, 4, 5, 6]"
              :key="grade"
              type="button"
              class="flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all"
              :class="
                selectedGrade === grade
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-md ring-2 ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-200 scale-105'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="selectedGrade = grade"
            >
              <span class="text-xs text-slate-400">پایه</span>
              <span class="text-lg font-black mt-0.5">{{ grade }}</span>
            </button>
          </div>
        </div>

        <!-- انتخاب دروس به صورت همزمان -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-bold text-slate-700 dark:text-slate-300">۲. انتخاب دروس مأموریت (امکان انتخاب چند درس):</label>
            <button
              type="button"
              class="text-xs text-cyan-600 hover:underline font-bold dark:text-cyan-400"
              @click="selectAllSubjects"
            >
              انتخاب همه دروس
            </button>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div
              v-for="course in availableCoursesForGrade"
              :key="course.id"
              class="flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer"
              :class="
                selectedCourseIds.includes(course.id)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="toggleSubject(course.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-md border text-xs"
                  :class="selectedCourseIds.includes(course.id) ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'"
                >
                  <span v-if="selectedCourseIds.includes(course.id)">✓</span>
                </div>
                <span class="font-bold text-sm">{{ course.name }}</span>
              </div>

              <select
                v-if="selectedCourseIds.includes(course.id)"
                v-model="subjectDifficulties[course.id]"
                class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                @click.stop
              >
                <option value="all">همه سطوح</option>
                <option value="easy">آسان</option>
                <option value="medium">متوسط</option>
                <option value="hard">سخت</option>
              </select>
            </div>
          </div>
        </div>

        <!-- انتخاب فرمانده قلعه -->
        <div class="mt-8">
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">۳. انتخاب فرمانده و استراتژی قلعه:</label>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              v-for="commander in COMMANDERS"
              :key="commander.id"
              class="flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer"
              :class="
                selectedCommanderId === commander.id
                  ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-md ring-2 ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'
              "
              @click="selectedCommanderId = commander.id"
            >
              <div class="text-4xl mb-2">{{ commander.avatar }}</div>
              <h4 class="font-black text-base">{{ commander.name }}</h4>
              <p class="text-xs text-cyan-600 dark:text-cyan-300 font-bold mt-0.5">{{ commander.perkTitle }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-300 mt-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-2 w-full">
                {{ commander.perkDescription }}
              </p>
            </div>
          </div>
        </div>

        <!-- دکمه ورود به میدان نبرد -->
        <div class="mt-10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            class="w-full sm:w-80 rounded-2xl bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-600 py-4 font-black text-lg text-white shadow-xl shadow-cyan-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            :disabled="selectedCourseIds.length === 0"
            @click="startMission"
          >
            استقرار نیروها و شروع دفاع 🚀
          </button>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            تعداد سوالات فعال در این چالش: <span class="font-bold text-cyan-600 dark:text-cyan-400">{{ eligibleQuestions.length }}</span> سوال
          </p>
        </div>
      </div>
    </main>

    <!-- ۲. شمارش معکوس سینمایی همراه با جمله انگیزشی -->
    <div
      v-if="gameState === 'countdown'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
    >
      <div class="text-center max-w-md">
        <div class="text-8xl font-black bg-gradient-to-b from-amber-300 via-cyan-400 to-indigo-500 bg-clip-text text-transparent animate-bounce">
          {{ countdownNumber }}
        </div>
        <p class="mt-4 text-xl font-bold text-white">آماده‌باش برج‌ها و سپرهای قلعه...</p>
        <div class="mt-6 rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-4 shadow-xl">
          <p class="text-sm font-bold text-cyan-300">💡 یادآوری انگیزشی:</p>
          <p class="text-xs text-slate-200 mt-1 leading-relaxed">{{ currentMotivationalQuote }}</p>
        </div>
      </div>
    </div>

    <!-- ۳. صحنه اصلی بازی و میدان نبرد (Playing Battlefield) -->
    <div v-show="gameState === 'playing' || gameState === 'wave-cleared'" class="relative flex flex-col items-center w-full px-2 py-4">
      <div class="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-slate-100 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <canvas
          ref="canvasRef"
          width="960"
          height="540"
          class="w-full h-auto cursor-pointer block"
          @click="handleCanvasClick"
        />

        <!-- HUD هولوگرافیک سوالات کتاب درسی (مستقر در سمت راست میدان نبرد) -->
        <div
          v-if="currentQuestion"
          class="absolute top-3 right-3 w-80 sm:w-96 max-w-[90%] z-30 transition-all duration-300 pointer-events-auto"
        >
          <div class="rounded-2xl border border-cyan-500/40 bg-white/95 p-3.5 sm:p-4 shadow-2xl backdrop-blur-md dark:bg-slate-950/85 transition-colors">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 dark:border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-amber-500">⚡ چالش دانایی قلعه:</span>
                <span class="rounded bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  {{ findCourse(BASE_COURSES, currentQuestion.courseId)?.name || 'کتاب درسی' }}
                </span>
              </div>
              <button
                type="button"
                class="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                @click="showHoloDeck = !showHoloDeck"
              >
                {{ showHoloDeck ? '▼ جمع‌کردن' : '▲ بازکردن' }}
              </button>
            </div>

            <div v-show="showHoloDeck">
              <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-relaxed mb-3">
                {{ currentQuestion.text }}
              </p>

              <div class="grid grid-cols-1 gap-2">
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
                  <span>پاسخ نادرست بود!</span>
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

        <!-- دکمه درخواست چالش جدید دانایی (مستقر در سمت چپ میدان نبرد) -->
        <button
          v-if="!showHoloDeck || !currentQuestion"
          type="button"
          class="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-2xl border border-cyan-500/50 bg-white/90 px-4 py-2 text-xs font-bold text-cyan-800 shadow-xl backdrop-blur-md hover:bg-cyan-50 dark:bg-slate-950/80 dark:text-cyan-300 dark:hover:bg-cyan-950 transition-all pointer-events-auto"
          @click="pickNextQuestion"
        >
          <span>⚡</span>
          <span>دریافت چالش دانایی (+۱۰۰ 💎)</span>
        </button>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-center gap-3 max-w-5xl text-xs text-slate-500 dark:text-slate-400">
        <span class="font-bold text-slate-700 dark:text-slate-300">💡 برج‌های دفاعی:</span>
        <span class="flex items-center gap-1 text-sky-600 dark:text-sky-400">💎 منشور ریاضی (لیزر سریع)</span>
        <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">🧪 توپ علوم (انفجار محیطی)</span>
        <span class="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">❄️ ستون ادبیات (انجماد و کندسازی)</span>
        <span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">⚡ ابلیسک مطالعات (صاعقه زنجیره‌ای)</span>
      </div>
    </div>

    <!-- مدال انتخاب / ساخت / ارتقای برج -->
    <Teleport to="body">
      <div
        v-if="showBuildModal && selectedPad"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
        dir="rtl"
        @click.self="showBuildModal = false"
      >
        <div class="my-auto flex flex-col max-h-[92vh] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-3 dark:border-slate-800 shrink-0">
            <h3 class="font-black text-base sm:text-lg text-slate-800 dark:text-white">
              {{ selectedPad.tower ? 'مدیریت و ارتقای برج' : 'احداث برج جدید در ایستگاه' }}
            </h3>
            <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1" @click="showBuildModal = false">
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 pr-0.5">
            <div v-if="!selectedPad.tower" class="grid grid-cols-1 gap-3">
              <div
                v-for="towerDef in TOWER_TYPES"
                :key="towerDef.type"
                class="flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer"
                :class="
                  crystals >= towerDef.baseCost
                    ? 'border-slate-200 bg-slate-50 hover:border-cyan-500 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800'
                    : 'border-slate-200/50 bg-slate-50/50 opacity-50 cursor-not-allowed dark:border-slate-800/40 dark:bg-slate-950/20'
                "
                @click="crystals >= towerDef.baseCost && buildTower(towerDef.type)"
              >
                <div class="flex items-center gap-3">
                  <span class="text-3xl">{{ towerDef.icon }}</span>
                  <div>
                    <h4 class="font-bold text-sm text-slate-800 dark:text-white">{{ towerDef.name }}</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ towerDef.specialEffect }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 rounded-xl bg-cyan-100 px-3 py-1.5 border border-cyan-300 dark:bg-cyan-950/60 dark:border-cyan-500/30">
                  <span class="text-xs">💎</span>
                  <span class="text-xs font-black text-cyan-800 dark:text-cyan-300">{{ towerDef.baseCost }}</span>
                </div>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                <span class="text-4xl">{{ TOWER_TYPES[selectedPad.tower.type].icon }}</span>
                <h4 class="font-black text-lg text-slate-800 dark:text-white mt-1">{{ TOWER_TYPES[selectedPad.tower.type].name }}</h4>
                <p class="text-xs text-amber-500 font-bold">سطح کنونی: {{ selectedPad.tower.level }} / ۳</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">{{ TOWER_TYPES[selectedPad.tower.type].description }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button
                  v-if="selectedPad.tower.level < 3"
                  type="button"
                  class="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-3 font-bold text-xs text-white shadow-lg transition hover:scale-102 active:scale-95"
                  @click="upgradeTower"
                >
                  ⭐️ ارتقای برج
                  <div class="text-[10px] text-amber-100 mt-0.5">
                    (نیاز به {{ Math.round(TOWER_TYPES[selectedPad.tower.type].baseCost * (selectedPad.tower.level === 1 ? 1.2 : 1.8)) }} 💎)
                  </div>
                </button>
                <div v-else class="rounded-2xl bg-slate-200 dark:bg-slate-800 p-3 text-center text-xs font-bold text-amber-600 dark:text-amber-400">
                  حداکثر سطح (مکس)
                </div>

                <button
                  type="button"
                  class="rounded-2xl border border-rose-300 bg-rose-50 p-3 font-bold text-xs text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
                  @click="sellTower"
                >
                  ♻️ بازیافت و فروش
                  <div class="text-[10px] text-rose-500 dark:text-rose-200 mt-0.5">
                    (+{{ Math.round(selectedPad.tower.costInvested * 0.7) }} 💎 بازگشت)
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- مدال پیروزی در موج جاری -->
    <div
      v-if="gameState === 'wave-cleared'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md"
    >
      <div class="max-w-md w-full rounded-3xl border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 text-center shadow-2xl">
        <div class="text-5xl mb-2">🎉</div>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white">موج {{ currentWave }} با موفقیت دفع شد!</h3>
        <p class="text-sm text-slate-500 dark:text-slate-300 mt-2">
          قلعه فرزانگی ایستادگی کرد و امواج نادانی به عقب رانده شدند.
        </p>
        <div class="my-4 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 flex justify-around">
          <div>
            <div class="text-xs text-slate-400">امتیاز</div>
            <div class="text-lg font-black text-amber-500">{{ score }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">پاداش کریستال</div>
            <div class="text-lg font-black text-cyan-600 dark:text-cyan-400">+{{ 60 + currentWave * 25 }} 💎</div>
          </div>
        </div>
        <button
          type="button"
          class="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 font-black text-white shadow-lg transition hover:scale-105 active:scale-95"
          @click="startNextWave"
        >
          شروع موج بعدی ({{ currentWave + 1 }}/{{ maxWaves }}) ⚔️
        </button>
      </div>
    </div>

    <!-- مدال پیروزی نهایی (Victory) -->
    <div
      v-if="gameState === 'victory'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
    >
      <div class="max-w-md w-full rounded-3xl border border-amber-500/40 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
        <div class="text-6xl mb-3">👑</div>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white">فتح بزرگ قلعه فرزانگی!</h3>
        <p class="text-sm text-slate-500 dark:text-slate-300 mt-2">
          شما توانستید تمامی {{ maxWaves }} موج شیاطین نادانی را به طور کامل متوقف کنید و قلمرو علم را نجات دهید!
        </p>
        <div class="my-6 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4">
          <div class="text-xs text-slate-400">امتیاز نهایی استراتژیک</div>
          <div class="text-3xl font-black text-amber-500 mt-1">{{ score }}</div>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 font-bold text-white shadow-lg"
            @click="gameState = 'setup'"
          >
            مأموریت جدید
          </button>
          <button
            type="button"
            class="rounded-2xl border border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950 px-4 py-3 font-bold text-indigo-700 dark:text-indigo-300"
            @click="showAnalyticsModal = true"
          >
            مشاهده گزارش
          </button>
        </div>
      </div>
    </div>

    <!-- مدال شکست قلعه (Game Over) -->
    <div
      v-if="gameState === 'game-over'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
    >
      <div class="max-w-md w-full rounded-3xl border border-rose-500/40 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl">
        <div class="text-6xl mb-3">🛡️💥</div>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white">سپر قلعه فرزانگی شکست خورد!</h3>
        <p class="text-sm text-slate-500 dark:text-slate-300 mt-2">
          امواج نادانی نفوذ کردند؛ اما با تمرین بیشتر و پاسخ دقیق‌تر به تست‌های درسی می‌توانید در دفاع بعدی پیروز شوید.
        </p>
        <div class="my-6 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 flex justify-around">
          <div>
            <div class="text-xs text-slate-400">موج رسیده‌شده</div>
            <div class="text-xl font-black text-slate-800 dark:text-white">{{ currentWave }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">امتیاز کسب‌شده</div>
            <div class="text-xl font-black text-amber-500">{{ score }}</div>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 py-3 font-bold text-white shadow-lg"
            @click="gameState = 'setup'"
          >
            تلاش مجدد و اصلاح استراتژی
          </button>
          <button
            type="button"
            class="rounded-2xl border border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950 px-4 py-3 font-bold text-indigo-700 dark:text-indigo-300"
            @click="showAnalyticsModal = true"
          >
            بررسی گزارش
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
