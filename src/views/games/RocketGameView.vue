<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useQuestionsStore } from '@/stores/questions'
import { DEFAULT_CURRICULUM_QUESTIONS, type EducationalQuestion } from '@/config/default-questions.config'
import { sfx } from '@/utils/sound-effects'
import { BASE_COURSES } from '@/config/courses.config'

// --- وضعیت فروشگاه سوالات و فیلترها ---
const questionsStore = useQuestionsStore()
const selectedGradeFilter = ref<number | 'all'>('all')
const selectedCourseFilter = ref<string>('all')
const extraCurriculumQuestions = ref<EducationalQuestion[]>([])

async function loadGameQuestionBank(): Promise<void> {
  try {
    const res = await fetch('/data/questions/elementary-curriculum-questions.json')
    if (res.ok) {
      extraCurriculumQuestions.value = await res.json()
    }
  } catch (e) {
    console.warn('Game curriculum questions could not be loaded:', e)
  }
}

const allQuestions = computed<EducationalQuestion[]>(() => {
  const existingTexts = new Set(questionsStore.items.map((q) => q.text))
  const dbItems: EducationalQuestion[] = questionsStore.items.map((q) => ({
    ...q,
    explanation: (q as unknown as { explanation?: string }).explanation || 'با بررسی دقیق کتاب درسی و مفاهیم فصل، به پاسخ صحیح دست پیدا می‌کنید.',
  }))
  const extras = extraCurriculumQuestions.value.filter((q) => !existingTexts.has(q.text))
  return [...DEFAULT_CURRICULUM_QUESTIONS, ...extras, ...dbItems]
})

const eligibleQuestions = computed(() => {
  return allQuestions.value.filter((q) => {
    if (selectedGradeFilter.value !== 'all' && q.grade !== selectedGradeFilter.value) return false
    if (selectedCourseFilter.value !== 'all' && q.courseId !== selectedCourseFilter.value) return false
    return true
  })
})

// --- متغیرهای بازی ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null

const score = ref(0)
const wave = ref(1)
const angle = ref(45) // درجه پرتاب (15 تا 80)
const power = ref(60) // قدرت پرتاب (20 تا 100)
const wind = ref(0) // سرعت باد (منفی به چپ، مثبت به راست)
const soundEnabled = ref(true)
const isFullscreen = ref(false)

// وضعیت سوال جاری
const showQuestionModal = ref(true)
const currentQuestion = ref<EducationalQuestion | null>(null)
const selectedOptionIndex = ref<number | null>(null)
const hasAnsweredCurrent = ref(false)
const wasAnswerCorrect = ref(false)
const hasLaserBuff = ref(false) // آیا لیزر هدف‌یاب فعال است؟
const hasDoubleDamageBuff = ref(false) // موشک دوبل؟

// وضعیت هدف و شلیک
const target = ref({ x: 500, y: 250, width: 44, height: 44, maxHp: 100, hp: 100 })
const launcherPos = { x: 70, y: 320 }
const isFiring = ref(false)
const feedbackMessage = ref('')
const showWaveCompleteModal = ref(false)

// وضعیت ذرات و انفجارها
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

// --- مدیریت چرخش صفحه در موبایل (Landscape Mode) ---
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

// انتخاب تصادفی یک سوال
function pickNextQuestion(): void {
  const pool = eligibleQuestions.value.length > 0 ? eligibleQuestions.value : DEFAULT_CURRICULUM_QUESTIONS
  const randomIndex = Math.floor(Math.random() * pool.length)
  currentQuestion.value = pool[randomIndex]
  selectedOptionIndex.value = null
  hasAnsweredCurrent.value = false
  wasAnswerCorrect.value = false
  showQuestionModal.value = true
}

function answerQuestion(index: number): void {
  if (hasAnsweredCurrent.value || !currentQuestion.value) return
  selectedOptionIndex.value = index
  hasAnsweredCurrent.value = true

  const isCorrect = String(index) === String(currentQuestion.value.correctAnswer)
  wasAnswerCorrect.value = isCorrect

  if (isCorrect) {
    sfx.playCorrect()
    score.value += 100
    hasLaserBuff.value = true
    hasDoubleDamageBuff.value = true
    setTimeout(() => {
      showQuestionModal.value = false
    }, 1200)
  } else {
    sfx.playIncorrect()
    hasLaserBuff.value = false
    hasDoubleDamageBuff.value = false
  }
}

function closeQuestionModal(): void {
  showQuestionModal.value = false
}

// تولید مرحله جدید
function initWave(waveNum: number): void {
  wave.value = waveNum
  target.value.maxHp = 80 + waveNum * 20
  target.value.hp = target.value.maxHp

  // موقعیت هدف تصادفی متناسب با اندازه بوم
  const canvas = canvasRef.value
  const width = canvas ? canvas.width : 700
  const height = canvas ? canvas.height : 360

  const minX = Math.min(width - 150, 420)
  const maxX = width - 70
  target.value.x = minX + Math.random() * Math.max(20, maxX - minX)
  target.value.y = height - 90 - Math.random() * 80

  // تولید باد تصادفی در مراحل بالاتر
  wind.value = waveNum > 1 ? Number(((Math.random() - 0.5) * 4).toFixed(1)) : 0
  feedbackMessage.value = ''
  showWaveCompleteModal.value = false
  pickNextQuestion()
}

// شلیک موشک
function fireRocket(): void {
  if (isFiring.value || showQuestionModal.value || showWaveCompleteModal.value) return

  isFiring.value = true
  feedbackMessage.value = ''
  sfx.playLaunch()

  const rad = (angle.value * Math.PI) / 180
  const speed = (power.value / 100) * 16 // سرعت اولیه

  rocket = {
    x: launcherPos.x + Math.cos(rad) * 35,
    y: launcherPos.y - Math.sin(rad) * 35,
    vx: Math.cos(rad) * speed,
    vy: -Math.sin(rad) * speed,
    trail: [],
    active: true,
  }
}

function createExplosion(x: number, y: number, isHit: boolean): void {
  const count = isHit ? 35 : 18
  const colors = isHit
    ? ['#fbbf24', '#f97316', '#ef4444', '#10b981', '#ffffff']
    : ['#94a3b8', '#64748b', '#cbd5e1']

  for (let i = 0; i < count; i++) {
    const angleRand = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * (isHit ? 6 : 3)
    particles.push({
      x,
      y,
      vx: Math.cos(angleRand) * speed,
      vy: Math.sin(angleRand) * speed,
      radius: 2 + Math.random() * (isHit ? 3.5 : 2),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      life: 0.8 + Math.random() * 0.4,
    })
  }
}

// حلقه رندر بوم بازی
function renderLoop(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // بروزرسانی ارتفاع و موقعیت لانچر بر اساس بوم
  launcherPos.y = canvas.height - 50

  // ۱. پاکسازی و پس‌زمینه آسمان کهکشانی
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, '#020617')
  grad.addColorStop(0.65, '#0f172a')
  grad.addColorStop(1, '#1e293b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // ستاره‌های پس‌زمینه
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  for (let i = 0; i < 40; i++) {
    const sx = (i * 73) % canvas.width
    const sy = (i * 37) % (canvas.height - 90)
    ctx.fillRect(sx, sy, (i % 3 === 0 ? 2 : 1), (i % 3 === 0 ? 2 : 1))
  }

  // ۲. زمین و بستر تپه‌ها
  ctx.fillStyle = '#090d16'
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - 40)
  ctx.lineTo(canvas.width, canvas.height - 40)
  ctx.lineTo(canvas.width, canvas.height)
  ctx.lineTo(0, canvas.height)
  ctx.fill()

  ctx.strokeStyle = '#10b981'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - 40)
  ctx.lineTo(canvas.width, canvas.height - 40)
  ctx.stroke()

  // ۳. نمایش مسیر تخمینی لیزر در صورت فعال بودن باف پاسخ صحیح
  if (hasLaserBuff.value && !isFiring.value) {
    ctx.save()
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()

    const rad = (angle.value * Math.PI) / 180
    const speed = (power.value / 100) * 16
    let simX = launcherPos.x + Math.cos(rad) * 35
    let simY = launcherPos.y - Math.sin(rad) * 35
    let simVx = Math.cos(rad) * speed
    let simVy = -Math.sin(rad) * speed
    const gravity = 0.22

    ctx.moveTo(simX, simY)
    for (let t = 0; t < 65; t++) {
      simVx += wind.value * 0.008
      simVy += gravity
      simX += simVx
      simY += simVy
      ctx.lineTo(simX, simY)
      if (simY >= canvas.height - 40) break
    }
    ctx.stroke()
    ctx.restore()
  }

  // ۴. رسم توپخانه / پرتاب‌کننده موشک (Launcher)
  ctx.save()
  ctx.translate(launcherPos.x, launcherPos.y)

  // پایه پرتاب‌کننده
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.arc(0, 0, 22, Math.PI, 0)
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.stroke()

  // لوله زاویه‌دار توپ
  const rad = (angle.value * Math.PI) / 180
  ctx.rotate(-rad)
  ctx.fillStyle = hasDoubleDamageBuff.value ? '#10b981' : '#38bdf8'
  ctx.fillRect(0, -6, 36, 12)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.strokeRect(0, -6, 36, 12)

  ctx.restore()

  // ۵. رسم هدف فضایی (Target)
  ctx.save()
  const tx = target.value.x
  const ty = target.value.y

  // پایه هدف
  ctx.fillStyle = '#475569'
  ctx.fillRect(tx - 6, ty + 20, 12, canvas.height - 40 - (ty + 20))

  // بدنه هدف
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(tx, ty, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fca5a5'
  ctx.lineWidth = 2
  ctx.stroke()

  // حلقه درخشان حفاظتی هدف
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(tx, ty, 25, 0, Math.PI * 2)
  ctx.stroke()

  // نوار سلامت هدف
  const barW = 40
  const barH = 5
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(tx - barW / 2, ty - 32, barW, barH)
  const hpRatio = Math.max(0, target.value.hp / target.value.maxHp)
  ctx.fillStyle = hpRatio > 0.4 ? '#10b981' : '#ef4444'
  ctx.fillRect(tx - barW / 2, ty - 32, barW * hpRatio, barH)

  ctx.restore()

  // ۶. انیمیشن موشک در حال پرواز
  if (rocket && rocket.active) {
    const gravity = 0.22
    rocket.vx += wind.value * 0.008
    rocket.vy += gravity
    rocket.x += rocket.vx
    rocket.y += rocket.vy

    // ثبت دم دود موشک
    rocket.trail.push({ x: rocket.x, y: rocket.y })
    if (rocket.trail.length > 15) rocket.trail.shift()

    // رسم رد آتش و دود
    ctx.save()
    for (let i = 0; i < rocket.trail.length; i++) {
      const pt = rocket.trail[i]
      const alpha = (i / rocket.trail.length) * 0.7
      ctx.fillStyle = hasDoubleDamageBuff.value ? `rgba(16, 185, 129, ${alpha})` : `rgba(249, 115, 22, ${alpha})`
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, (i / rocket.trail.length) * 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // رسم سر موشک
    const rocketAngle = Math.atan2(rocket.vy, rocket.vx)
    ctx.translate(rocket.x, rocket.y)
    ctx.rotate(rocketAngle)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-10, -3, 16, 6)
    ctx.fillStyle = hasDoubleDamageBuff.value ? '#10b981' : '#f97316'
    ctx.beginPath()
    ctx.moveTo(6, -4)
    ctx.lineTo(13, 0)
    ctx.lineTo(6, 4)
    ctx.fill()
    ctx.restore()

    // بررسی برخورد با هدف
    const distToTarget = Math.hypot(rocket.x - target.value.x, rocket.y - target.value.y)
    if (distToTarget < 26) {
      // اصابت مستقیم
      rocket.active = false
      isFiring.value = false
      sfx.playExplosion()
      createExplosion(target.value.x, target.value.y, true)

      const damage = hasDoubleDamageBuff.value ? 75 : 45
      target.value.hp -= damage
      score.value += damage * 2
      feedbackMessage.value = hasDoubleDamageBuff.value
        ? '🎯 اصابت دقیق با موشک تقویت‌شده پلاسما! آسیب حداکثری وارد شد!'
        : '💥 اصابت به هدف! هدف آسیب دید.'

      if (target.value.hp <= 0) {
        sfx.playVictory()
        setTimeout(() => {
          showWaveCompleteModal.value = true
        }, 600)
      } else {
        setTimeout(pickNextQuestion, 1000)
      }
    } else if (rocket.y >= canvas.height - 40 || rocket.x > canvas.width + 50 || rocket.x < -30) {
      // برخورد به زمین یا خروج از صفحه
      rocket.active = false
      isFiring.value = false
      createExplosion(rocket.x, Math.min(rocket.y, canvas.height - 40), false)
      sfx.playExplosion()

      const missDistance = Math.round(Math.abs(rocket.x - target.value.x))
      if (rocket.x < target.value.x) {
        feedbackMessage.value = `❌ موشک ${missDistance} واحد قبل از هدف به زمین خورد! قدرت یا زاویه را بیشتر کن.`
      } else {
        feedbackMessage.value = `❌ موشک ${missDistance} واحد از هدف رد شد! قدرت یا زاویه را کمتر کن.`
      }

      setTimeout(pickNextQuestion, 1400)
    }
  }

  // ۷. رندر ذرات انفجار
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.1
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

onMounted(async () => {
  loadGameQuestionBank()
  await questionsStore.loadFromDb()
  checkOrientation()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', checkOrientation)

  handleResize()
  initWave(1)
  animationFrameId = requestAnimationFrame(renderLoop)
})

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', checkOrientation)
})

watch([selectedGradeFilter, selectedCourseFilter], () => {
  pickNextQuestion()
})
</script>

<template>
  <div class="relative flex h-screen w-screen flex-col overflow-hidden bg-ink-950 text-white select-none">
    <!-- هدر بازی -->
    <header class="flex h-13 shrink-0 items-center justify-between border-b border-ink-800 bg-ink-900/90 px-3 sm:px-6 backdrop-blur">
      <div class="flex items-center gap-2 sm:gap-3">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800/80 px-2.5 py-1 text-xs font-semibold text-ink-200 transition hover:border-brand-500 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">بازگشت</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-sm shadow-md shadow-brand-500/20">
            🚀
          </span>
          <div>
            <h1 class="text-xs font-black sm:text-sm text-white">نبرد موشکی علمی</h1>
            <p class="text-9px text-ink-400">مرحله {{ wave }} · باد: {{ wind > 0 ? `+${wind} راست` : wind < 0 ? `${wind} چپ` : 'آرام' }}</p>
          </div>
        </div>
      </div>

      <!-- وضعیت امتیاز و تقویت‌ها -->
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- باف لیزر -->
        <span
          v-if="hasLaserBuff"
          class="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-10px font-bold text-emerald-400 ring-1 ring-emerald-500/30 animate-pulse"
        >
          🎯 لیزر هدف‌یاب فعال
        </span>

        <!-- تابلو امتیاز -->
        <div class="flex items-center gap-1.5 rounded-xl border border-ink-800 bg-ink-800/80 px-3 py-1 text-xs font-bold text-amber-400">
          <span>⭐</span>
          <span>{{ score }}</span>
        </div>

        <!-- دکمه صدا -->
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-xl border border-ink-800 bg-ink-800/80 text-ink-300 hover:text-white"
          :title="soundEnabled ? 'قطع صدا' : 'وصل صدا'"
          @click="toggleSound"
        >
          <span v-if="soundEnabled">🔊</span>
          <span v-else>🔇</span>
        </button>
      </div>
    </header>

    <!-- میدان نبرد (Canvas) -->
    <div class="relative flex-1 overflow-hidden bg-ink-950">
      <canvas ref="canvasRef" class="h-full w-full block"></canvas>

      <!-- پیام راهنما یا نتیجه شلیک -->
      <Transition name="fade">
        <div
          v-if="feedbackMessage"
          class="absolute top-4 inset-x-4 mx-auto max-w-md rounded-2xl border border-ink-700 bg-ink-900/90 p-3 text-center text-xs font-bold shadow-xl backdrop-blur sm:text-sm"
          :class="feedbackMessage.startsWith('🎯') || feedbackMessage.startsWith('💥') ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-300 border-amber-500/30'"
        >
          {{ feedbackMessage }}
        </div>
      </Transition>

      <!-- لایه هشدار چرخش گوشی به افقی (Orientation Guard) -->
      <Transition name="fade">
        <div
          v-if="isPortraitMobile && !dismissRotationWarning"
          class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink-950/95 p-6 text-center backdrop-blur-md"
        >
          <div class="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-brand-400 bg-brand-500/10 text-brand-400 shadow-xl shadow-brand-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-10 w-10 animate-pulse">
              <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" stroke-width="2" />
              <path d="M12 18h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </div>
          <h2 class="text-base font-black text-white sm:text-lg">
            برای بازی نبرد موشکی، گوشی را افقی (Landscape) بگیرید 🔄
          </h2>
          <p class="mt-2 max-w-xs text-xs leading-6 text-ink-300">
            زاویه پرتاب و دید کامل هدف در حالت افقی بیشترین هیجان و دقت را دارد.
          </p>
          <div class="mt-5 flex flex-col gap-2">
            <button
              type="button"
              class="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
              @click="requestLandscapeAndFullscreen"
            >
              چرخش و تمام‌صفحه
            </button>
            <button
              type="button"
              class="rounded-xl border border-ink-800 bg-ink-800 px-4 py-2 text-10px font-medium text-ink-400 hover:text-white"
              @click="dismissRotationWarning = true"
            >
              ادامه در حالت عمودی
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- نوار کنترل پرتاب موشک -->
    <footer class="shrink-0 border-t border-ink-800 bg-ink-900/95 px-3 py-2 sm:px-6 sm:py-3 backdrop-blur">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <!-- کنترل زاویه -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-ink-300">زاویه:</span>
          <input
            type="range"
            min="15"
            max="80"
            v-model.number="angle"
            class="h-2 w-24 sm:w-32 accent-brand-500 cursor-pointer"
            :disabled="isFiring"
          />
          <span class="w-10 text-center font-mono text-xs font-extrabold text-brand-400">{{ angle }}°</span>
        </div>

        <!-- کنترل قدرت -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-ink-300">قدرت:</span>
          <input
            type="range"
            min="20"
            max="100"
            v-model.number="power"
            class="h-2 w-24 sm:w-32 accent-amber-500 cursor-pointer"
            :disabled="isFiring"
          />
          <span class="w-10 text-center font-mono text-xs font-extrabold text-amber-400">{{ power }}%</span>
        </div>

        <!-- دکمه سوال جدید -->
        <button
          type="button"
          class="rounded-xl border border-ink-700 bg-ink-800/80 px-3 py-2 text-xs font-semibold text-ink-300 transition hover:border-brand-500 hover:text-white"
          :disabled="isFiring"
          @click="showQuestionModal = true"
        >
          📝 سوال درسی
        </button>

        <!-- دکمه بزرگ شلیک -->
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-brand-600/30 transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="isFiring || showQuestionModal"
          @click="fireRocket"
        >
          <span>شلیک موشک</span>
          <span class="text-sm">🚀</span>
        </button>
      </div>
    </footer>

    <!-- مدال چالش سوال درسی (The Learning Loop) -->
    <Transition name="fade">
      <div
        v-if="showQuestionModal && currentQuestion"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <div class="relative w-full max-w-lg rounded-3xl border border-ink-800 bg-ink-900 p-6 shadow-2xl">
          <!-- هدر مدال -->
          <div class="flex items-center justify-between border-b border-ink-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="rounded-lg bg-brand-500/20 px-2.5 py-0.5 text-xs font-bold text-brand-400">
                چالش درسی قبل از شلیک 💡
              </span>
              <span class="text-xs text-ink-400">پاسخ درست = لیزر هدف‌یاب</span>
            </div>

            <!-- فیلتر سریع پایه -->
            <select
              v-model="selectedGradeFilter"
              class="rounded-lg border border-ink-700 bg-ink-800 px-2 py-1 text-10px font-medium text-ink-300"
            >
              <option value="all">تمام پایه‌ها</option>
              <option :value="4">چهارم</option>
              <option :value="5">پنجم</option>
              <option :value="6">ششم</option>
              <option :value="7">هفتم</option>
              <option :value="8">هشتم</option>
              <option :value="9">نهم</option>
            </select>
          </div>

          <!-- متن سوال -->
          <div class="py-5">
            <h3 class="text-sm font-bold leading-7 text-white sm:text-base">
              {{ currentQuestion.text }}
            </h3>
          </div>

          <!-- گزینه‌های چهارگانه -->
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              v-for="(option, idx) in currentQuestion.options"
              :key="idx"
              type="button"
              class="rounded-2xl border p-3.5 text-right text-xs font-semibold transition cursor-pointer"
              :class="[
                selectedOptionIndex === idx
                  ? wasAnswerCorrect
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40'
                    : 'border-red-500 bg-red-500/20 text-red-300 ring-2 ring-red-500/40'
                  : 'border-ink-800 bg-ink-800/80 text-ink-200 hover:border-brand-500 hover:bg-ink-700/60'
              ]"
              :disabled="hasAnsweredCurrent"
              @click="answerQuestion(idx)"
            >
              <span class="ml-2 font-mono text-ink-400">{{ idx + 1 }}.</span>
              {{ option }}
            </button>
          </div>

          <!-- راهنمای آموزشی در صورت پاسخ غلط -->
          <div v-if="hasAnsweredCurrent && !wasAnswerCorrect" class="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <div class="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
              <span>💡 نکته آموزشی درس:</span>
            </div>
            <p class="leading-6 text-amber-200/90">{{ currentQuestion.explanation }}</p>
          </div>

          <!-- دکمه بستن و رفتن به شلیک -->
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl px-5 py-2.5 text-xs font-bold transition"
              :class="hasAnsweredCurrent ? 'bg-brand-600 text-white hover:bg-brand-500' : 'bg-ink-800 text-ink-400 hover:text-white'"
              @click="closeQuestionModal"
            >
              {{ hasAnsweredCurrent ? 'ورود به میدان شلیک 🚀' : 'رد کردن این سوال (موشک عادی)' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- مدال پیروزی در مرحله -->
    <Transition name="fade">
      <div
        v-if="showWaveCompleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      >
        <div class="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-ink-900 p-6 text-center shadow-2xl">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-3xl">
            🏆
          </div>
          <h2 class="mt-4 text-xl font-black text-white">مرحله {{ wave }} فتح شد!</h2>
          <p class="mt-2 text-xs text-ink-400">هدف با موفقیت نابود شد و سرزمین بعدی آزاد شد.</p>
          <div class="my-4 rounded-xl border border-ink-800 bg-ink-800/60 p-3 text-sm font-bold text-amber-400">
            مجموع امتیاز: {{ score }} ⭐
          </div>
          <button
            type="button"
            class="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
            @click="initWave(wave + 1)"
          >
            ورود به مرحله بعدی 🚀
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
