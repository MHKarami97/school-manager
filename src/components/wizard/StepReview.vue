<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWizardStore } from '@/stores/wizard'
import { useTeachersStore } from '@/stores/teachers'
import { useSchedulesStore } from '@/stores/schedules'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import { generateSchedule } from '@/utils/generate-schedule'

const router = useRouter()
const wizard = useWizardStore()
const teachersStore = useTeachersStore()
const schedulesStore = useSchedulesStore()

onMounted(() => {
  teachersStore.loadFromDb()
})

const level = computed(() => (wizard.levelId ? getLevelById(wizard.levelId) : undefined))
const activeShiftConfig = computed(() => wizard.shiftConfigs[wizard.shiftId])

const isGenerating = ref(false)
const warnings = ref<string[]>([])
const errorMessage = ref('')

async function handleGenerate(): Promise<void> {
  if (!wizard.levelId) return
  isGenerating.value = true
  errorMessage.value = ''

  try {
    const { schedule, warnings: genWarnings } = generateSchedule({
      audience: wizard.audience ?? 'self',
      schoolName: wizard.schoolName,
      levelId: wizard.levelId,
      grades: wizard.selectedGrades,
      shiftId: wizard.shiftId,
      shiftConfig: activeShiftConfig.value,
      teacherSelections: wizard.teacherSelections,
      lockedSportCells: wizard.lockedSportCells,
      teachersPool: teachersStore.items,
    })

    warnings.value = genWarnings

    const id = crypto.randomUUID()
    const now = Date.now()
    await schedulesStore.save({ id, createdAt: now, updatedAt: now, ...schedule })

    wizard.reset()
    router.push(`/schedules/${id}`)
  } catch (error) {
    errorMessage.value = 'ساخت برنامه با خطا مواجه شد. لطفاً مراحل قبل را بررسی کنید.'
    console.error(error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="text-sm font-semibold text-ink-800 dark:text-ink-100">خلاصه انتخاب‌های شما</p>
      <dl class="mt-3 grid gap-2 text-sm text-ink-600 sm:grid-cols-2 dark:text-ink-300">
        <div><dt class="inline text-ink-400 dark:text-ink-500">مخاطب: </dt><dd class="inline">{{ wizard.audience === 'self' ? 'خودم' : `مدرسه${wizard.schoolName ? ' - ' + wizard.schoolName : ''}` }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">دوره: </dt><dd class="inline">{{ level?.name }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">پایه‌ها: </dt><dd class="inline">{{ wizard.selectedGrades.map((g) => gradeLabel(g)).join('، ') }}</dd></div>
        <div><dt class="inline text-ink-400 dark:text-ink-500">شیفت: </dt><dd class="inline">{{ activeShiftConfig.name }} ({{ activeShiftConfig.startTime }}–{{ activeShiftConfig.endTime }})</dd></div>
      </dl>
    </div>

    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      نکته: قرآن به‌صورت خودکار همیشه در زنگ اول قرار می‌گیرد. اگر می‌خواهید زنگ‌های ورزش پشت‌سرهم باشد، بعد از ساخت برنامه در ویرایشگر خانه‌های ورزش را درگودراپ جابجا کنید.
    </div>

    <div v-if="warnings.length" class="space-y-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <p v-for="(w, i) in warnings" :key="i">{{ w }}</p>
    </div>
    <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>

    <button type="button" class="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50" :disabled="isGenerating" @click="handleGenerate">
      {{ isGenerating ? 'در حال ساخت برنامه…' : 'ساخت برنامه هفتگی' }}
    </button>
  </div>
</template>
