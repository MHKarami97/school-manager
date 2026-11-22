<script setup lang="ts">
import { computed, ref } from 'vue'
import { GAME_SEASONS, GAME_STAGES, getCurrentSeasonKey } from '@/config/game-seasons.config'
import { useGameProfilesStore } from '@/stores/game-profiles'
import type { GameSeasonKey, GameStage } from '@/types'

withDefaults(
  defineProps<{
    isOpen?: boolean
  }>(),
  {
    isOpen: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select-stage', stage: GameStage): void
}>()

const profilesStore = useGameProfilesStore()
const activeSeasonKey = ref<GameSeasonKey>(getCurrentSeasonKey())

const activeSeasonInfo = computed(() => GAME_SEASONS[activeSeasonKey.value])

const currentSeasonStages = computed(() => {
  return GAME_STAGES.filter((s) => s.season === activeSeasonKey.value)
})

function getStageProgress(stageId: string) {
  const profile = profilesStore.activeProfile
  return profile?.stageProgress[stageId] || null
}

function handleStartStage(stage: GameStage): void {
  emit('select-stage', stage)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      @click.self="emit('close')"
    >
      <div class="my-auto flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 overflow-hidden">
        <!-- هدر مدال -->
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🗺️</span>
          <div>
            <h3 class="font-black text-lg text-slate-800 dark:text-white">
              مسیر تحصیلی یک‌ساله و مراحل فصلی
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ۱۶ مرحله هماهنگ با تقویم فصول سال؛ پیشروی گام‌به‌گام و کسب ستاره‌های زرین
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

      <!-- تب‌های فصول سال -->
      <div class="flex border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/60 overflow-x-auto gap-2">
        <button
          v-for="season in GAME_SEASONS"
          :key="season.key"
          type="button"
          class="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap"
          :class="
            activeSeasonKey === season.key
              ? 'bg-white shadow-sm text-slate-900 ring-2 ring-indigo-500 dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-900'
          "
          @click="activeSeasonKey = season.key"
        >
          <span class="text-lg">{{ season.icon }}</span>
          <span>{{ season.name }}</span>
          <span
            v-if="season.key === getCurrentSeasonKey()"
            class="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-600 dark:text-amber-300"
          >
            فصل جاری
          </span>
        </button>
      </div>

      <!-- محتوای فصل انتخاب‌شده -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- بنر توضیحات فصل -->
        <div
          class="rounded-2xl border p-4 transition"
          :class="
            activeSeasonKey === 'autumn'
              ? 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200'
              : activeSeasonKey === 'winter'
              ? 'border-sky-200 bg-sky-50/70 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-200'
              : activeSeasonKey === 'spring'
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'border-yellow-200 bg-yellow-50/70 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-950/30 dark:text-yellow-200'
          "
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-black text-base flex items-center gap-2">
                <span>{{ activeSeasonInfo.icon }}</span>
                <span>{{ activeSeasonInfo.title }}</span>
              </h4>
              <p class="text-xs mt-1 opacity-90">{{ activeSeasonInfo.subtitle }}</p>
            </div>
            <div class="text-left font-bold text-xs opacity-75">
              ماه‌های فصل: {{ activeSeasonInfo.monthsName }}
            </div>
          </div>
        </div>

        <!-- کارت‌های مراحل ۴گانه این فصل -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            v-for="stage in currentSeasonStages"
            :key="stage.id"
            class="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div>
              <!-- شماره و ستاره‌های مرحله -->
              <div class="flex items-center justify-between mb-2">
                <span class="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  مرحله {{ stage.stageNumber }}
                </span>

                <div class="flex items-center gap-1">
                  <span
                    v-for="star in 3"
                    :key="star"
                    class="text-base"
                    :class="(getStageProgress(stage.id)?.stars || 0) >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'"
                  >
                    ★
                  </span>
                </div>
              </div>

              <h5 class="font-bold text-sm text-slate-800 dark:text-white">{{ stage.title }}</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ stage.description }}</p>

              <!-- اطلاعات تکنیکی مرحله -->
              <div class="mt-3 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                <span>⚔️ {{ stage.wavesCount }} موج دفاعی</span>
                <span>🎯 هدف: {{ stage.targetScore }} امتیاز</span>
              </div>
            </div>

            <!-- دکمه ورود به این مرحله -->
            <button
              type="button"
              class="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-indigo-600 hover:to-indigo-700 active:scale-95"
              @click="handleStartStage(stage)"
            >
              شروع چالش این مرحله 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>
