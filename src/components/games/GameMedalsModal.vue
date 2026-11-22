<script setup lang="ts">
import { ref } from 'vue'
import { GAME_MEDALS } from '@/config/game-seasons.config'
import { useGameProfilesStore } from '@/stores/game-profiles'

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
}>()

const profilesStore = useGameProfilesStore()
const activeTab = ref<'medals' | 'challenges'>('medals')

function isMedalUnlocked(medalId: string): boolean {
  const profile = profilesStore.activeProfile
  return profile ? profile.unlockedMedalIds.includes(medalId) : false
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
          <span class="text-3xl">🏅</span>
          <div>
            <h3 class="font-black text-lg text-slate-800 dark:text-white">
              تالار افتخارات، مدال‌ها و چالش‌های روزانه
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              مدال‌های کسب‌شده توسط: <strong class="text-indigo-600 dark:text-indigo-400">{{ profilesStore.activeProfile?.name }}</strong>
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

      <!-- ناوبری تب‌ها -->
      <div class="flex border-b border-slate-200 bg-slate-50 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/60 gap-3">
        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition"
          :class="
            activeTab === 'medals'
              ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          "
          @click="activeTab = 'medals'"
        >
          <span>🏆</span>
          <span>مدال‌های افتخار</span>
          <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {{ profilesStore.unlockedMedalsCount }}/{{ profilesStore.totalMedalsCount }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition"
          :class="
            activeTab === 'challenges'
              ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-800 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          "
          @click="activeTab = 'challenges'"
        >
          <span>🎯</span>
          <span>چالش‌های روزانه</span>
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            امروز
          </span>
        </button>
      </div>

      <!-- محتوای تب مدال‌ها -->
      <div v-show="activeTab === 'medals'" class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div
            v-for="medal in GAME_MEDALS"
            :key="medal.id"
            class="flex items-center gap-3.5 rounded-2xl border p-4 transition"
            :class="
              isMedalUnlocked(medal.id)
                ? 'border-amber-300 bg-amber-50/70 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/20'
                : 'border-slate-200 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-950/40'
            "
          >
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner"
              :class="
                isMedalUnlocked(medal.id)
                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-amber-300/50'
                  : 'bg-slate-200 dark:bg-slate-800 grayscale'
              "
            >
              {{ medal.icon }}
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h5 class="font-black text-sm text-slate-800 dark:text-white">{{ medal.title }}</h5>
                <span
                  v-if="isMedalUnlocked(medal.id)"
                  class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300"
                >
                  ✓ باز شده
                </span>
                <span
                  v-else
                  class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  قفل
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ medal.description }}</p>
              <div class="mt-2 flex items-center justify-between text-[11px]">
                <span class="text-slate-400 font-medium">شرط: {{ medal.requirementText }}</span>
                <span class="font-bold text-amber-600 dark:text-amber-400">+{{ medal.rewardScore }} امتیاز</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- محتوای تب چالش‌های روزانه -->
      <div v-show="activeTab === 'challenges'" class="flex-1 overflow-y-auto p-6 space-y-4">
        <div class="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
          چالش‌های هر روز بر اساس بازی کردن و پاسخ صحیح به سوالات محاسبه و تیک می‌خورند. هر روز با ورود به بازی می‌توانید پاداش‌های جدید بگیرید!
        </div>

        <div class="space-y-3">
          <div
            v-for="challenge in profilesStore.dailyChallenges"
            :key="challenge.id"
            class="flex items-center justify-between rounded-2xl border p-4 transition"
            :class="
              challenge.isCompleted
                ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-950/20'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/60'
            "
          >
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ challenge.icon }}</span>
              <div>
                <h5 class="font-bold text-sm text-slate-800 dark:text-white">{{ challenge.title }}</h5>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ challenge.description }}</p>
              </div>
            </div>

            <div class="text-left">
              <div
                v-if="challenge.isCompleted"
                class="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm"
              >
                ✓ تکمیل شد
              </div>
              <div v-else class="text-xs font-bold text-amber-600 dark:text-amber-400">
                +{{ challenge.rewardScore }} امتیاز
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>
