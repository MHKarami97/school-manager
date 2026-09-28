<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSportWizardStore } from '@/stores/sport-wizard'
import { useTeachersStore } from '@/stores/teachers'
import { WEEK_DAYS } from '@/types'
import type { Teacher, TeacherAvailabilitySlot } from '@/types'
import { formatTeacherName } from '@/utils/teacher-format'

const wizard = useSportWizardStore()
const teachersStore = useTeachersStore()

onMounted(() => teachersStore.loadFromDb())

const sportTeachers = computed(() => teachersStore.items.filter((t) => t.courseIds.includes('sport')))

function isSelected(teacherId: string): boolean {
  return wizard.selectedTeacherIds.includes(teacherId)
}

function toggleSelected(teacherId: string): void {
  const set = new Set(wizard.selectedTeacherIds)
  if (set.has(teacherId)) set.delete(teacherId)
  else set.add(teacherId)
  wizard.setSelectedTeacherIds(Array.from(set))
}

const newTeacherName = ref('')

async function addNewSportTeacher(): Promise<void> {
  const name = newTeacherName.value.trim()
  if (!name) return
  const teacher = await teachersStore.addTeacher(name, ['sport'])
  wizard.setSelectedTeacherIds([...wizard.selectedTeacherIds, teacher.id])
  newTeacherName.value = ''
}

/** ساعت‌های شروع/پایان شیفتی که در مرحله قبل (صبح/ظهر) انتخاب شده است. */
const activeShiftConfig = computed(() => wizard.shiftConfigs[wizard.shiftId])

function availabilityOf(teacher: Teacher, dayIndex: number): TeacherAvailabilitySlot | undefined {
  return teacher.availability?.find((a) => a.dayIndex === dayIndex)
}

/** فاصله‌ی زمانی دو ساعت "HH:MM" به ساعت (اعشاری). */
function hoursBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  return Math.max(0, minutes / 60)
}

/** مجموع ساعت‌های حضور از روی روزهای انتخاب‌شده، برای همگام‌سازی خودکار سقف ساعت هفتگی. */
function totalWeeklyHoursOf(availability: TeacherAvailabilitySlot[]): number {
  const total = availability.reduce((sum, slot) => sum + hoursBetween(slot.startTime, slot.endTime), 0)
  return Math.round(total * 4) / 4
}

async function toggleDayAvailability(teacher: Teacher, dayIndex: number): Promise<void> {
  const current = teacher.availability ?? []
  const exists = availabilityOf(teacher, dayIndex)
  const next = exists
    ? current.filter((a) => a.dayIndex !== dayIndex)
    : [
        ...current,
        {
          dayIndex,
          startTime: activeShiftConfig.value.startTime,
          endTime: activeShiftConfig.value.endTime,
        },
      ]
  await teachersStore.updateTeacher({
    ...teacher,
    availability: next,
    maxWeeklyHours: totalWeeklyHoursOf(next),
  })
}

async function updateDayTime(teacher: Teacher, dayIndex: number, patch: Partial<TeacherAvailabilitySlot>): Promise<void> {
  const current = teacher.availability ?? []
  const next = current.map((a) => (a.dayIndex === dayIndex ? { ...a, ...patch } : a))
  await teachersStore.updateTeacher({
    ...teacher,
    availability: next,
    maxWeeklyHours: totalWeeklyHoursOf(next),
  })
}

async function updateMaxWeeklyHours(teacher: Teacher, value: number): Promise<void> {
  await teachersStore.updateTeacher({ ...teacher, maxWeeklyHours: value })
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">افزودن معلم ورزش جدید</p>
      <div class="flex gap-2">
        <input
          v-model="newTeacherName"
          type="text"
          placeholder="نام معلم ورزش"
          class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          @keyup.enter="addNewSportTeacher"
        />
        <button
          type="button"
          class="shrink-0 rounded-lg bg-ink-800 px-4 text-xs font-medium text-white dark:bg-ink-700"
          @click="addNewSportTeacher"
        >
          افزودن
        </button>
      </div>
      <p v-if="!sportTeachers.length" class="mt-2 text-sm text-ink-400 dark:text-ink-500">
        هنوز معلم ورزشی ثبت نشده است.
      </p>
    </div>

    <div
      v-for="teacher in sportTeachers"
      :key="teacher.id"
      class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="isSelected(teacher.id)"
            class="h-4 w-4 rounded border-ink-300"
            @change="toggleSelected(teacher.id)"
          />
          <span class="text-sm font-semibold text-ink-800 dark:text-ink-200">{{ formatTeacherName(teacher) }}</span>
        </label>
        <div class="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <span>سقف ساعت هفتگی</span>
          <input
            type="number"
            min="1"
            max="40"
            step="0.25"
            :value="teacher.maxWeeklyHours ?? 24"
            class="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1 text-center dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            @change="updateMaxWeeklyHours(teacher, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
      <p class="mb-2 text-sm font-medium text-ink-500 dark:text-ink-400">
        روزهای حضور و بازه‌ی زمانی (سقف ساعت هفتگی بالا به‌صورت خودکار از مجموع همین روزها محاسبه می‌شود)
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(day, dayIndex) in WEEK_DAYS"
          :key="day"
          class="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
          :class="
            availabilityOf(teacher, dayIndex)
              ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/10'
              : 'border-ink-200 dark:border-ink-700'
          "
        >
          <button
            type="button"
            class="text-xs font-medium"
            :class="availabilityOf(teacher, dayIndex) ? 'text-brand-700 dark:text-brand-300' : 'text-ink-500 dark:text-ink-400'"
            @click="toggleDayAvailability(teacher, dayIndex)"
          >
            {{ day }}
          </button>
          <template v-if="availabilityOf(teacher, dayIndex)">
            <input
              type="time"
              :value="availabilityOf(teacher, dayIndex)?.startTime"
              class="w-24 rounded border border-ink-200 bg-white px-1 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              @change="updateDayTime(teacher, dayIndex, { startTime: ($event.target as HTMLInputElement).value })"
            />
            <span class="text-ink-400">-</span>
            <input
              type="time"
              :value="availabilityOf(teacher, dayIndex)?.endTime"
              class="w-24 rounded border border-ink-200 bg-white px-1 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              @change="updateDayTime(teacher, dayIndex, { endTime: ($event.target as HTMLInputElement).value })"
            />
          </template>
        </div>
      </div>
      <p class="mt-2 text-sm text-ink-400 dark:text-ink-500">
        زنگ اول هر روزی که فعال می‌کنی، پیش‌فرض بازه‌ی شیفت {{ activeShiftConfig.name }} ({{ activeShiftConfig.startTime }}
        تا {{ activeShiftConfig.endTime }}) پر می‌شود؛ در صورت نیاز می‌توانی همان روز را دستی اصلاح کنی.
      </p>
    </div>
  </div>
</template>
