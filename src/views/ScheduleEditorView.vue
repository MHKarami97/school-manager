<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useSchedulesStore } from '@/stores/schedules'
import { useTeachersStore } from '@/stores/teachers'
import { BASE_COURSES } from '@/config/courses.config'
import { getLevelById, gradeLabel } from '@/config/levels.config'
import AppHeader from '@/components/layout/AppHeader.vue'
import ScheduleGrid from '@/components/schedule/ScheduleGrid.vue'
import PrintableSchedule from '@/components/schedule/PrintableSchedule.vue'
import { exportElementAsImage, printPage } from '@/utils/export'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const schedulesStore = useSchedulesStore()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const activeGradeIndex = ref(0)
const isEditable = ref(false)
const isExportingImage = ref(false)
const gridContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await Promise.all([schedulesStore.loadFromDb(), teachersStore.loadFromDb()])
  isLoading.value = false
})

const schedule = computed(() => (props.id ? schedulesStore.byId(props.id) : undefined))
const level = computed(() => (schedule.value ? getLevelById(schedule.value.levelId) : undefined))
const activeGrade = computed(() => schedule.value?.grades[activeGradeIndex.value])

async function handleSaveChanges(): Promise<void> {
  if (!schedule.value) return
  await schedulesStore.save(schedule.value)
}

async function handleExportImage(): Promise<void> {
  if (!gridContainer.value || !schedule.value) return
  isExportingImage.value = true
  try {
    const gradeName = activeGrade.value ? `-payeh-${activeGrade.value.grade}` : ''
    await exportElementAsImage(gridContainer.value, `${schedule.value.title}${gradeName}`)
  } finally {
    isExportingImage.value = false
  }
}

function handlePrint(): void {
  printPage()
}

async function handleDelete(): Promise<void> {
  if (!schedule.value) return
  if (!confirm('این برنامه برای همیشه حذف شود؟')) return
  await schedulesStore.remove(schedule.value.id)
  router.push('/schedules')
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-16 print:bg-white">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400">در حال بارگذاری…</div>

    <div v-else-if="!schedule" class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600">برنامه‌ای با این شناسه پیدا نشد؛ ممکن است حذف شده باشد.</p>
      <RouterLink to="/schedules" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به لیست برنامه‌ها</RouterLink>
    </div>

    <div v-else class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900">{{ schedule.title }}</h1>
            <p class="mt-1 text-sm text-ink-500">
              {{ level?.name }} — {{ schedule.shiftConfig.name }} ({{ schedule.shiftConfig.startTime }}–{{ schedule.shiftConfig.endTime }})
            </p>
          </div>
          <RouterLink to="/schedules" class="text-sm text-ink-500 hover:text-brand-600">بازگشت به لیست ←</RouterLink>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="(g, i) in schedule.grades"
            :key="g.grade"
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="i === activeGradeIndex ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600'"
            @click="activeGradeIndex = i"
          >
            پایه {{ gradeLabel(g.grade) }}
          </button>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700"
            @click="isEditable = !isEditable"
          >
            {{ isEditable ? 'پایان ویرایش' : 'ویرایش برنامه' }}
          </button>
          <button v-if="isEditable" type="button" class="rounded-lg bg-ink-900 px-4 py-2 text-xs font-medium text-white" @click="handleSaveChanges">
            ذخیره تقییرات
          </button>
          <button type="button" class="rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700" @click="handlePrint">
            چاپ / PDF
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 disabled:opacity-50"
            :disabled="isExportingImage"
            @click="handleExportImage"
          >
            {{ isExportingImage ? 'در حال ساخت تصویر…' : 'دانلود تصویر' }}
          </button>
          <button type="button" class="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600" @click="handleDelete">
            حذف برنامه
          </button>
        </div>

        <p v-if="isEditable" class="mb-4 text-xs text-ink-400">
          برای جابجایی، یک خانه پُر را بکشید و روی خانه مقصد رها کنید؛ برای تفییر درس یا معلم یک خانه، روی آن کلیک کنید.
        </p>

        <div ref="gridContainer" class="rounded-2xl border border-ink-100 bg-white p-3">
          <ScheduleGrid
            v-if="activeGrade"
            v-model:cells="activeGrade.cells"
            :grade-schedule="activeGrade"
            :shift-config="schedule.shiftConfig"
            :courses="BASE_COURSES"
            :teachers="schedule.teachers"
            :editable="isEditable"
          />
        </div>
      </div>

      <div id="print-root" class="hidden print:block">
        <PrintableSchedule v-if="activeGrade" :schedule="schedule" :grade-schedule="activeGrade" :courses="BASE_COURSES" />
      </div>
    </div>
  </div>
</template>
