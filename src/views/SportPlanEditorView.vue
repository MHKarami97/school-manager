<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useSportPlansStore } from '@/stores/sport-plans'
import { formatTeacherName } from '@/utils/teacher-format'
import { printPage } from '@/utils/export'
import AppHeader from '@/components/layout/AppHeader.vue'
import SportGrid from '@/components/sport/SportGrid.vue'
import SportSchoolOverview from '@/components/sport/SportSchoolOverview.vue'
import PrintableSportPlan from '@/components/sport/PrintableSportPlan.vue'
import type { SportPlan } from '@/types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const sportPlansStore = useSportPlansStore()

const isLoading = ref(true)
const viewMode = ref<'class' | 'overview'>('class')
const activeClassIndex = ref(0)
const isEditable = ref(false)
const printMode = ref<'class' | 'teacher' | 'school' | 'school-by-period'>('class')
const printTeacherId = ref<string>('')
const isPrinting = ref(false)

onMounted(async () => {
  await sportPlansStore.loadFromDb()
  isLoading.value = false
})

const plan = computed<SportPlan | undefined>(() => (props.id ? sportPlansStore.byId(props.id) : undefined))
const activeClass = computed(() => plan.value?.classes[activeClassIndex.value])

async function handleSaveChanges(): Promise<void> {
  if (!plan.value) return
  await sportPlansStore.save(plan.value)
}

async function handleDelete(): Promise<void> {
  if (!plan.value) return
  if (!confirm('این برنامه ورزش حذف شود؟')) return
  await sportPlansStore.remove(plan.value.id)
  router.push('/sport')
}

async function handlePrint(mode: 'class' | 'teacher' | 'school' | 'school-by-period'): Promise<void> {
  printMode.value = mode
  if (mode === 'teacher' && !printTeacherId.value && plan.value?.teachers.length) {
    printTeacherId.value = plan.value.teachers[0].id
  }
  isPrinting.value = true
  await new Promise((resolve) => setTimeout(resolve, 0))
  printPage()
  window.addEventListener('afterprint', () => (isPrinting.value = false), { once: true })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:bg-white sm:pb-16">
    <div class="print:hidden"><AppHeader /></div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500">در حال بارگذاری...</div>

    <div v-else-if="!plan" class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-ink-600 dark:text-ink-300">برنامه ورزش یافت نشد.</p>
      <RouterLink to="/sport" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به لیست</RouterLink>
    </div>

    <div v-else class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div class="print:hidden">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ plan.title }}</h1>
            <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {{ plan.shiftConfig.name }} · {{ plan.teachers.length }} معلم · {{ plan.classes.length }} کلاس
            </p>
          </div>
          <RouterLink to="/sport" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">بازگشت به لیست</RouterLink>
        </div>

        <!-- تعویض بین «نمایش تک‌کلاس» (قابل ویرایش) و «نمایش کلی مدرسه» (فقط نمایش) -->
        <div class="mb-4 flex gap-2">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="viewMode === 'class' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
            @click="viewMode = 'class'"
          >
            نمایش تک‌کلاس
          </button>
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="viewMode === 'overview' ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
            @click="viewMode = 'overview'; isEditable = false"
          >
            نمایش کلی مدرسه
          </button>
        </div>

        <template v-if="viewMode === 'class'">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="(klass, index) in plan.classes"
              :key="klass.id"
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium transition"
              :class="index === activeClassIndex ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'"
              @click="activeClassIndex = index"
            >
              {{ klass.label }}
            </button>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              class="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              @click="isEditable = !isEditable"
            >
              {{ isEditable ? 'پایان ویرایش' : 'ویرایش دستی' }}
            </button>
            <button
              v-if="isEditable"
              type="button"
              class="rounded-lg bg-ink-900 px-3 py-2.5 text-xs font-medium text-white dark:bg-brand-600"
              @click="handleSaveChanges"
            >
              ذخیره تغییرات
            </button>
            <button
              type="button"
              class="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              @click="handlePrint('class')"
            >
              چاپ این کلاس
            </button>
            <div class="flex items-center gap-1">
              <select
                v-model="printTeacherId"
                class="rounded-lg border border-ink-200 bg-white px-2 py-2.5 text-xs text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              >
                <option v-for="t in plan.teachers" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
              </select>
              <button
                type="button"
                class="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                @click="handlePrint('teacher')"
              >
                چاپ این معلم
              </button>
            </div>
            <button
              type="button"
              class="col-span-1 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              @click="handlePrint('school')"
            >
              چاپ کل مدرسه (یک جدول)
            </button>
            <button
              type="button"
              class="col-span-1 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              @click="handlePrint('school-by-period')"
            >
              چاپ کل مدرسه (به تفکیک هر زنگ)
            </button>
            <button
              type="button"
              class="col-span-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-medium text-red-600 sm:col-span-1 dark:border-red-900/30 dark:bg-ink-900 dark:text-red-400"
              @click="handleDelete"
            >
              حذف برنامه
            </button>
          </div>

          <p v-if="isEditable" class="mb-4 text-xs text-ink-400 dark:text-ink-500">
            برای جابجایی، خانه‌ای که معلم دارد را درگ کن و روی خانه‌ی مقصد رها کن؛ جای دو خانه با هم عوض می‌شود. برای
            تخصیص دستی، روی هر خانه کلیک کن.
          </p>

          <div v-if="activeClass" class="rounded-2xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
            <SportGrid
              v-model:slots="plan.slots"
              :class-id="activeClass.id"
              :shift-config="plan.shiftConfig"
              :teachers="plan.teachers"
              :facilities="plan.facilities"
              :editable="isEditable"
            />
          </div>
        </template>

        <!-- نمای کلی: همه‌ی پایه‌ها/کلاس‌ها، همه‌ی زنگ‌ها، همه‌ی معلمان، در یک جدول -->
        <template v-else>
          <SportSchoolOverview :plan="plan" />
        </template>
      </div>

      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableSportPlan
          :plan="plan"
          :mode="printMode"
          :class-id="activeClass?.id"
          :teacher-id="printTeacherId"
        />
      </div>
    </div>
  </div>
</template>