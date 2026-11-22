<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameHistoryStore } from '@/stores/game-history'
import { useGameProfilesStore } from '@/stores/game-profiles'
import { BASE_COURSES, findCourse } from '@/config/courses.config'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const historyStore = useGameHistoryStore()
const profilesStore = useGameProfilesStore()

type TimeFilter = 'week' | 'month' | 'season' | 'year'
const timeFilter = ref<TimeFilter>('week')

// جلسات فیلتر شده بر اساس دانش‌آموز فعال و بازه زمانی
const filteredSessions = computed(() => {
  const activeStudentId = profilesStore.activeProfile?.id
  const now = Date.now()

  let minTime = now - 7 * 86400000
  if (timeFilter.value === 'month') minTime = now - 30 * 86400000
  if (timeFilter.value === 'season') minTime = now - 90 * 86400000
  if (timeFilter.value === 'year') minTime = now - 365 * 86400000

  return historyStore.items.filter((s) => {
    if (s.endedAt < minTime) return false
    // در صورت وجود شناسه دانش‌آموز فیلتر کن
    if (activeStudentId && s.studentId && s.studentId !== activeStudentId) return false
    return true
  })
})

// آمار تجمیعی
const totalPlayMinutes = computed(() => {
  const sec = filteredSessions.value.reduce((acc, curr) => acc + (curr.totalDurationSeconds || 0), 0)
  return Math.round(sec / 60)
})

const totalQuestions = computed(() => {
  return filteredSessions.value.reduce((acc, curr) => acc + (curr.totalQuestionsAnswered || 0), 0)
})

const correctQuestions = computed(() => {
  return filteredSessions.value.reduce((acc, curr) => acc + (curr.correctAnswersCount || 0), 0)
})

const overallAccuracy = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((correctQuestions.value / totalQuestions.value) * 100)
})

const avgThinkingTimeSeconds = computed(() => {
  let count = 0
  let sum = 0
  filteredSessions.value.forEach((s) => {
    s.answers?.forEach((a) => {
      if (a.durationSeconds) {
        sum += a.durationSeconds
        count += 1
      }
    })
  })
  if (count === 0) return 0
  return Number((sum / count).toFixed(1))
})

// نمودار فعالیت ۷ روز اخیر (شنبه تا جمعه)
const weekDaysActivity = computed(() => {
  const days = [
    { label: 'شنبه', key: 6, count: 0, questions: 0 },
    { label: '۱شنبه', key: 0, count: 0, questions: 0 },
    { label: '۲شنبه', key: 1, count: 0, questions: 0 },
    { label: '۳شنبه', key: 2, count: 0, questions: 0 },
    { label: '۴شنبه', key: 3, count: 0, questions: 0 },
    { label: '۵شنبه', key: 4, count: 0, questions: 0 },
    { label: 'جمعه', key: 5, count: 0, questions: 0 },
  ]

  filteredSessions.value.forEach((s) => {
    const d = new Date(s.endedAt).getDay()
    const found = days.find((item) => item.key === d)
    if (found) {
      found.count += 1
      found.questions += s.totalQuestionsAnswered || 0
    }
  })

  const maxQ = Math.max(1, ...days.map((d) => d.questions))
  return days.map((d) => ({
    ...d,
    heightPercentage: Math.round((d.questions / maxQ) * 100),
  }))
})

// آمار تسلط بر دروس
const courseStats = computed(() => {
  const map: Record<string, { total: number; correct: number; totalDuration: number }> = {}

  filteredSessions.value.forEach((s) => {
    s.answers?.forEach((a) => {
      const cId = a.courseId || 'general'
      if (!map[cId]) {
        map[cId] = { total: 0, correct: 0, totalDuration: 0 }
      }
      map[cId].total += 1
      if (a.isCorrect) map[cId].correct += 1
      map[cId].totalDuration += a.durationSeconds || 0
    })
  })

  return Object.entries(map).map(([courseId, stat]) => {
    const courseDef = findCourse(BASE_COURSES, courseId)
    const acc = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    const avgSec = stat.total > 0 ? Number((stat.totalDuration / stat.total).toFixed(1)) : 0
    return {
      courseId,
      name: courseDef?.name || courseId,
      color: courseDef?.color || '#6366f1',
      total: stat.total,
      correct: stat.correct,
      accuracy: acc,
      avgSpeedSeconds: avgSec,
    }
  }).sort((a, b) => b.total - a.total)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      @click.self="emit('close')"
    >
      <div class="my-auto flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 overflow-hidden">
        <!-- هدر مدال گزارش -->
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <span class="text-3xl">📊</span>
          <div>
            <h3 class="font-black text-lg text-slate-800 dark:text-white">
              گزارش تحلیلی و نمودار وضعیت پیشرفت تحصیلی
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              گزارش عملکرد: <strong class="text-indigo-600 dark:text-indigo-400">{{ profilesStore.activeProfile?.name }}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 dark:border-slate-700 dark:hover:text-white"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- فیلترهای زمانی -->
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
        <span class="text-xs font-bold text-slate-600 dark:text-slate-400">بازه زمانی گزارش:</span>
        <div class="flex gap-1.5">
          <button
            v-for="f in [
              { key: 'week', label: 'این هفته' },
              { key: 'month', label: 'این ماه' },
              { key: 'season', label: 'فصل جاری' },
              { key: 'year', label: 'کل سال' },
            ]"
            :key="f.key"
            type="button"
            class="rounded-xl px-3 py-1.5 text-xs font-bold transition"
            :class="
              timeFilter === f.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
            "
            @click="timeFilter = (f.key as TimeFilter)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- محتوای گزارش و نمودارها -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- ۴ کارت شاخص کلیدی (KPIs) -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
            <div class="text-xs text-slate-500 dark:text-slate-400">زمان یادگیری</div>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {{ totalPlayMinutes }} <span class="text-xs font-normal">دقیقه</span>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
            <div class="text-xs text-slate-500 dark:text-slate-400">سوالات حل شده</div>
            <div class="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {{ totalQuestions }}
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
            <div class="text-xs text-slate-500 dark:text-slate-400">درصد درستی پاسخ‌ها</div>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {{ overallAccuracy }}%
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/60">
            <div class="text-xs text-slate-500 dark:text-slate-400">میانگین زمان تفکر</div>
            <div class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {{ avgThinkingTimeSeconds }} <span class="text-xs font-normal">ثانیه</span>
            </div>
          </div>
        </div>

        <!-- ۱. نمودار روزهای بازی در طول هفته -->
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>📅</span>
            <span>نمودار روزهای تمرین و تعداد سوالات پاسخ‌داده‌شده</span>
          </h4>

          <div class="flex items-end justify-between gap-2 h-44 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
            <div
              v-for="day in weekDaysActivity"
              :key="day.label"
              class="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
            >
              <span class="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                {{ day.questions }} سوال
              </span>
              <div
                class="w-full max-w-[36px] rounded-t-xl transition-all duration-500"
                :class="
                  day.questions > 0
                    ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/60'
                "
                :style="{ height: `${Math.max(8, day.heightPercentage)}%` }"
              ></div>
              <span class="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                {{ day.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- ۲. نمودار تفکیک وضعیت تسلط بر دروس -->
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span>📚</span>
            <span>تحلیل تسلط و سرعت عمل به تفکیک درس</span>
          </h4>

          <div v-if="courseStats.length === 0" class="text-center py-6 text-xs text-slate-400">
            داده‌ای در بازه زمانی انتخاب‌شده یافت نشد. با انجام بازی‌ها گزارش تکمیل خواهد شد.
          </div>

          <div v-else class="space-y-3.5">
            <div
              v-for="c in courseStats"
              :key="c.courseId"
              class="space-y-1.5"
            >
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: c.color }" />
                  <span>{{ c.name }}</span>
                  <span class="text-[11px] text-slate-400 font-normal">({{ c.total }} سوال حل شده)</span>
                </span>
                <span class="flex items-center gap-3">
                  <span class="text-slate-400 font-normal text-[11px]">سرعت: {{ c.avgSpeedSeconds }} ثانیه</span>
                  <span
                    :class="c.accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : c.accuracy >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'"
                  >
                    {{ c.accuracy }}% دقت
                  </span>
                </span>
              </div>

              <!-- نوار درصد دقت -->
              <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
                    width: `${c.accuracy}%`,
                    backgroundColor: c.color,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>
