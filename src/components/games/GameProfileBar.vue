<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameProfilesStore } from '@/stores/game-profiles'
import { GAME_SEASONS, getCurrentSeasonKey } from '@/config/game-seasons.config'
import type { GameSeasonKey, StudentGameProfile } from '@/types'

const props = defineProps<{
  currentSeasonKey?: GameSeasonKey
}>()

const emit = defineEmits<{
  (e: 'open-journey'): void
  (e: 'open-medals'): void
  (e: 'open-analytics'): void
  (e: 'profile-changed'): void
}>()

const profilesStore = useGameProfilesStore()

const activeSeason = computed(() => {
  const key = props.currentSeasonKey || getCurrentSeasonKey()
  return GAME_SEASONS[key]
})

// مودال تغییر و مدیریت دانش‌آموزان
const showProfilesModal = ref(false)
type FormMode = 'list' | 'add' | 'edit'
const formMode = ref<FormMode>('list')
const editingStudentId = ref<string | null>(null)

const formStudentName = ref('')
const formStudentGrade = ref(4)
const formStudentAvatar = ref('🦁')

const AVAILABLE_AVATARS = [
  '🦁', '🚀', '🦉', '🦊', '🌟', '🐬',
  '👩‍🎓', '👨‍🎓', '🤖', '🧙‍♂️', '⚡', '🏆',
  '🐼', '🐯', '🦄', '🦖', '🎨', '⚽'
]

function openAddStudent(): void {
  formMode.value = 'add'
  editingStudentId.value = null
  formStudentName.value = ''
  formStudentGrade.value = 4
  formStudentAvatar.value = '🦁'
}

function openEditStudent(profile: StudentGameProfile, e?: Event): void {
  if (e) e.stopPropagation()
  formMode.value = 'edit'
  editingStudentId.value = profile.id
  formStudentName.value = profile.name
  formStudentGrade.value = profile.grade
  formStudentAvatar.value = profile.avatar
}

function handleSelectProfile(id: string): void {
  profilesStore.setActiveProfile(id)
  emit('profile-changed')
  showProfilesModal.value = false
}

async function handleSaveStudent(): Promise<void> {
  const name = formStudentName.value.trim()
  if (!name) {
    alert('لطفاً نام دانش‌آموز را وارد کنید.')
    return
  }

  if (formMode.value === 'add') {
    await profilesStore.createProfile(
      name,
      formStudentGrade.value,
      formStudentAvatar.value
    )
  } else if (formMode.value === 'edit' && editingStudentId.value) {
    await profilesStore.updateProfile(editingStudentId.value, {
      name,
      grade: formStudentGrade.value,
      avatar: formStudentAvatar.value,
    })
  }

  formMode.value = 'list'
  editingStudentId.value = null
  emit('profile-changed')
}

async function handleDeleteStudent(id: string): Promise<void> {
  if (profilesStore.profiles.length <= 1) {
    alert('حداقل یک پروفایل دانش‌آموز باید در سامانه باقی بماند.')
    return
  }
  if (!confirm('آیا از حذف این حساب دانش‌آموز اطمینان دارید؟ تمامی آمار و رکوردهای او پاک خواهد شد.')) {
    return
  }
  await profilesStore.removeProfile(id)
  formMode.value = 'list'
  editingStudentId.value = null
  emit('profile-changed')
}

function getGradeStageLabel(grade: number): string {
  if (grade <= 6) return 'دبستان'
  if (grade <= 9) return 'متوسطه اول'
  return 'متوسطه دوم'
}
</script>

<template>
  <div class="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-md backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100">
    <!-- بخش پروفایل دانش‌آموز فعال -->
    <div class="flex items-center gap-3">
      <!-- آواتار دانش‌آموز با دکمه تغییر سریع -->
      <button
        type="button"
        class="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-2xl shadow-sm transition hover:scale-105 active:scale-95 dark:border-indigo-500/40 dark:bg-indigo-950/50"
        title="تغییر یا مدیریت دانش‌آموز"
        @click="showProfilesModal = true; formMode = 'list'"
      >
        <span>{{ profilesStore.activeProfile?.avatar || '🦁' }}</span>
        <span class="absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white shadow">
          ✎
        </span>
      </button>

      <div>
        <div class="flex items-center gap-2">
          <span class="font-black text-sm text-slate-800 dark:text-white">
            {{ profilesStore.activeProfile?.name || 'دانش‌آموز' }}
          </span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            پایه {{ profilesStore.activeProfile?.grade || 4 }}
          </span>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <span class="flex items-center gap-1 font-bold text-amber-500">
            <span>⭐</span>
            <span>{{ profilesStore.activeProfile?.totalScore || 0 }}</span>
            <span class="text-[10px]">امتیاز کل</span>
          </span>
          <span class="flex items-center gap-1 font-bold text-rose-500">
            <span>🔥</span>
            <span>{{ profilesStore.activeProfile?.currentStreak || 1 }}</span>
            <span class="text-[10px]">روز متوالی</span>
          </span>
        </div>
      </div>
    </div>

    <!-- نشان فصل جاری سال تحصیلی و دکمه‌های ناوبری سریع -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- نشان فصل تحصیلی -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300"
        @click="emit('open-journey')"
        title="مشاهده مسیر مراحل یک‌ساله"
      >
        <span>{{ activeSeason.icon }}</span>
        <span class="hidden sm:inline">{{ activeSeason.name }}</span>
        <span class="text-[10px] opacity-75 font-normal">({{ activeSeason.monthsName }})</span>
      </button>

      <!-- مسیر مراحل -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300"
        @click="emit('open-journey')"
      >
        <span>🗺️</span>
        <span class="hidden sm:inline">مسیر یک‌ساله</span>
      </button>

      <!-- مدال‌ها و چالش‌ها -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
        @click="emit('open-medals')"
      >
        <span>🏅</span>
        <span>مدال‌ها و چالش‌ها</span>
        <span class="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] text-white">
          {{ profilesStore.unlockedMedalsCount }}/{{ profilesStore.totalMedalsCount }}
        </span>
      </button>

      <!-- نمودارها و گزارش‌ها -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300"
        @click="emit('open-analytics')"
      >
        <span>📊</span>
        <span>نمودار و گزارش</span>
      </button>
    </div>

    <!-- مدال انتخاب، ایجاد و ویرایش دانش‌آموزان با Teleport به بدنه برای پوشش کامل صفحه به شکل باکس روی صفحه -->
    <Teleport to="body">
      <div
        v-if="showProfilesModal"
        class="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto bg-slate-950/75 p-2 backdrop-blur-sm sm:items-center sm:p-4"
        dir="rtl"
        @click.self="showProfilesModal = false"
      >
        <div
          class="my-auto flex w-full max-w-lg max-h-[92dvh] flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        >
          <!-- هدر مدال مدیریت دانش‌آموز -->
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 shrink-0 sm:px-6 sm:py-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">👨‍👩‍👧‍👦</span>
              <div>
                <h3 class="font-black text-base sm:text-lg text-slate-800 dark:text-white">
                  {{
                    formMode === 'add'
                      ? 'افزودن دانش‌آموز جدید'
                      : formMode === 'edit'
                      ? 'ویرایش اطلاعات دانش‌آموز'
                      : 'انتخاب و مدیریت دانش‌آموزان'
                  }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{
                    formMode === 'add'
                      ? 'اطلاعات و پایه تحصیلی دانش‌آموز جدید را وارد کنید'
                      : formMode === 'edit'
                      ? 'ویرایش نام، پایه تحصیلی یا نشان آواتار دانش‌آموز'
                      : 'پروفایل دانش‌آموز فعال را برای بازی انتخاب یا ویرایش کنید'
                  }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
              @click="showProfilesModal = false"
            >
              ✕
            </button>
          </div>

          <!-- بدنه اسکرول‌شونده مدال -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <!-- فرم افزودن یا ویرایش دانش‌آموز -->
            <div v-if="formMode === 'add' || formMode === 'edit'" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نام دانش‌آموز:</label>
                <input
                  v-model="formStudentName"
                  type="text"
                  placeholder="مثال: علی، سارا، رامتین..."
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                  autofocus
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">پایه تحصیلی:</label>
                <select
                  v-model.number="formStudentGrade"
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                >
                  <optgroup label="دوره ابتدایی (پایه‌های ۱ تا ۶)">
                    <option v-for="g in [1, 2, 3, 4, 5, 6]" :key="g" :value="g">پایه {{ g }} دبستان</option>
                  </optgroup>
                  <optgroup label="دوره اول متوسطه (پایه‌های ۷ تا ۹)">
                    <option v-for="g in [7, 8, 9]" :key="g" :value="g">پایه {{ g }} متوسطه اول</option>
                  </optgroup>
                  <optgroup label="دوره دوم متوسطه (پایه‌های ۱۰ تا ۱۲)">
                    <option v-for="g in [10, 11, 12]" :key="g" :value="g">پایه {{ g }} متوسطه دوم</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">انتخاب آواتار و نشان دلخواه:</label>
                  <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    انتخاب شده: {{ formStudentAvatar }}
                  </span>
                </div>
                <div class="grid grid-cols-6 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40 sm:gap-2">
                  <button
                    v-for="av in AVAILABLE_AVATARS"
                    :key="av"
                    type="button"
                    class="flex aspect-square w-full items-center justify-center rounded-xl border text-xl transition hover:scale-105 active:scale-95 sm:text-2xl"
                    :class="
                      formStudentAvatar === av
                        ? 'border-indigo-500 bg-indigo-100 shadow-md ring-2 ring-indigo-500 dark:bg-indigo-900/60'
                        : 'border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                    "
                    @click="formStudentAvatar = av"
                  >
                    {{ av }}
                  </button>
                </div>
              </div>
            </div>

            <!-- لیست پروفایل‌های موجود با دکمه‌های انتخاب و ویرایش -->
            <div v-else class="space-y-3">
              <div class="space-y-2.5 max-h-[50dvh] overflow-y-auto p-0.5 sm:max-h-72">
                <div
                  v-for="profile in profilesStore.profiles"
                  :key="profile.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 transition cursor-pointer sm:p-3.5"
                  :class="
                    profilesStore.activeProfileId === profile.id
                      ? 'border-indigo-500 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                  "
                  @click="handleSelectProfile(profile.id)"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span class="text-3xl">{{ profile.avatar }}</span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-slate-800 dark:text-white">{{ profile.name }}</span>
                        <span
                          v-if="profilesStore.activeProfileId === profile.id"
                          class="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        >
                          فعال
                        </span>
                      </div>
                      <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>پایه {{ profile.grade }} ({{ getGradeStageLabel(profile.grade) }})</span>
                        <span>·</span>
                        <span class="text-amber-500 font-bold">⭐ {{ profile.totalScore }} امتیاز</span>
                        <span>·</span>
                        <span class="text-rose-500 font-bold">🔥 {{ profile.currentStreak }} روز</span>
                      </div>
                    </div>
                  </div>

                  <!-- دکمه‌های سمت چپ: ویرایش و انتخاب -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white transition"
                      title="ویرایش نام، پایه یا آواتار"
                      @click="openEditStudent(profile, $event)"
                    >
                      ✏️
                    </button>

                    <span
                      class="text-xs font-bold px-2 py-1 rounded-lg"
                      :class="
                        profilesStore.activeProfileId === profile.id
                          ? 'text-indigo-600 bg-indigo-100/70 dark:text-indigo-300 dark:bg-indigo-950/70'
                          : 'text-slate-400'
                      "
                    >
                      {{ profilesStore.activeProfileId === profile.id ? '✓ جاری' : 'انتخاب' }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-300 py-3 text-xs font-bold text-indigo-600 transition hover:border-indigo-500 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                @click="openAddStudent"
              >
                <span class="text-base">+</span>
                <span>افزودن دانش‌آموز جدید</span>
              </button>
            </div>
          </div>

          <!-- فوتر ثابت دکمه‌های فرم در حالت ویرایش یا افزودن -->
          <div
            v-if="formMode === 'add' || formMode === 'edit'"
            class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70 shrink-0 sm:px-6 sm:py-4"
          >
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-xs text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition"
                @click="handleSaveStudent"
              >
                {{ formMode === 'add' ? 'ثبت و ورود' : 'ذخیره تغییرات' }}
              </button>
              <button
                type="button"
                class="rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                @click="formMode = 'list'"
              >
                بازگشت به لیست
              </button>
            </div>

            <button
              v-if="formMode === 'edit' && editingStudentId && profilesStore.profiles.length > 1"
              type="button"
              class="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 transition"
              title="حذف این حساب دانش‌آموز"
              @click="handleDeleteStudent(editingStudentId)"
            >
              <span>🗑️</span>
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
