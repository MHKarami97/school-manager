<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ShiftTimeConfig, Teacher, SportFacility, SportSlot } from '@/types'
import { WEEK_DAYS } from '@/types'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import { formatTeacherName } from '@/utils/teacher-format'
import { findTeacherConflict } from '@/utils/sport-scheduler'
import SportCellEditorModal from './SportCellEditorModal.vue'

const props = defineProps<{
  classId: string
  shiftConfig: ShiftTimeConfig
  teachers: Teacher[]
  facilities: SportFacility[]
  editable?: boolean
}>()

const slots = defineModel<SportSlot[]>('slots', { required: true })

const lessonPeriods = computed(() => buildBellSchedule(props.shiftConfig).filter((p) => p.type === 'lesson'))

function slotAt(dayIndex: number, periodIndex: number): SportSlot | undefined {
  return slots.value.find(
    (s) => s.classId === props.classId && s.dayIndex === dayIndex && s.periodIndex === periodIndex,
  )
}

function teacherOf(slot: SportSlot | undefined): Teacher | undefined {
  return slot?.teacherId ? props.teachers.find((t) => t.id === slot.teacherId) : undefined
}
function facilityOf(slot: SportSlot | undefined): SportFacility | undefined {
  return slot?.facilityId ? props.facilities.find((f) => f.id === slot.facilityId) : undefined
}

function hasConflict(dayIndex: number, periodIndex: number): boolean {
  const slot = slotAt(dayIndex, periodIndex)
  if (!slot?.teacherId) return false
  return !!findTeacherConflict(slots.value, slot.teacherId, dayIndex, periodIndex, props.classId)
}

function setSlot(dayIndex: number, periodIndex: number, patch: Partial<SportSlot>): void {
  const others = slots.value.filter(
    (s) => !(s.classId === props.classId && s.dayIndex === dayIndex && s.periodIndex === periodIndex),
  )
  slots.value = [
    ...others,
    { classId: props.classId, dayIndex, periodIndex, teacherId: null, facilityId: null, ...patch },
  ]
}

// --- درگ‌ودراپ: تبادل اتمیک دو خانه در یک نوشتن واحد (بدون باگ کپی‌شدن) ---
const draggedFrom = ref<{ day: number; period: number } | null>(null)

function onDragStart(day: number, period: number): void {
  if (!props.editable) return
  draggedFrom.value = { day, period }
}

function onDrop(day: number, period: number): void {
  if (!draggedFrom.value || !props.editable) return
  const from = draggedFrom.value
  draggedFrom.value = null
  if (from.day === day && from.period === period) return

  const fromSlot = slotAt(from.day, from.period)
  const toSlot = slotAt(day, period)

  const others = slots.value.filter(
    (s) =>
      !(s.classId === props.classId && s.dayIndex === from.day && s.periodIndex === from.period) &&
      !(s.classId === props.classId && s.dayIndex === day && s.periodIndex === period),
  )

  slots.value = [
    ...others,
    {
      classId: props.classId,
      dayIndex: from.day,
      periodIndex: from.period,
      teacherId: toSlot?.teacherId ?? null,
      facilityId: toSlot?.facilityId ?? null,
    },
    {
      classId: props.classId,
      dayIndex: day,
      periodIndex: period,
      teacherId: fromSlot?.teacherId ?? null,
      facilityId: fromSlot?.facilityId ?? null,
    },
  ]
}

const editingCell = ref<{ day: number; period: number } | null>(null)
const isModalOpen = ref(false)

function openEditor(day: number, period: number): void {
  if (!props.editable) return
  editingCell.value = { day, period }
  isModalOpen.value = true
}

function applyEdit(teacherId: string | null, facilityId: string | null): void {
  if (!editingCell.value) return
  setSlot(editingCell.value.day, editingCell.value.period, { teacherId, facilityId })
  editingCell.value = null
}

const editingSlot = computed(() => (editingCell.value ? slotAt(editingCell.value.day, editingCell.value.period) : undefined))
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
      <thead>
        <tr>
          <th class="w-20 border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-500 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-400"></th>
          <th
            v-for="day in WEEK_DAYS"
            :key="day"
            class="border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-300"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-100 p-2 text-center text-ink-500 dark:border-ink-800 dark:text-ink-400">
            {{ p.index }}
            <br />
            <span class="text-10px text-ink-400 dark:text-ink-500">{{ p.start }}-{{ p.end }}</span>
          </td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-100 p-1 align-top dark:border-ink-800">
            <div
              class="flex min-h-16 flex-col justify-center gap-0.5 rounded-lg border p-2 text-center transition"
              :class="[
                editable ? 'cursor-pointer hover:brightness-95' : '',
                hasConflict(dayIndex, p.index - 1) ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-ink-100 dark:border-ink-800',
              ]"
              :draggable="editable && !!slotAt(dayIndex, p.index - 1)?.teacherId"
              @dragstart="onDragStart(dayIndex, p.index - 1)"
              @dragover.prevent
              @drop="onDrop(dayIndex, p.index - 1)"
              @click="openEditor(dayIndex, p.index - 1)"
            >
              <template v-if="teacherOf(slotAt(dayIndex, p.index - 1))">
                <p class="font-medium text-ink-800 dark:text-ink-200">
                  {{ formatTeacherName(teacherOf(slotAt(dayIndex, p.index - 1))) }}
                </p>
                <p v-if="facilityOf(slotAt(dayIndex, p.index - 1))" class="text-10px text-ink-500 dark:text-ink-400">
                  {{ facilityOf(slotAt(dayIndex, p.index - 1))?.name }}
                </p>
              </template>
              <p v-else class="text-ink-300 dark:text-ink-600">-</p>
              <span v-if="hasConflict(dayIndex, p.index - 1)" class="text-10px font-medium text-red-600 dark:text-red-400">تداخل!</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <SportCellEditorModal
      v-model="isModalOpen"
      :teacher-id="editingSlot?.teacherId ?? null"
      :facility-id="editingSlot?.facilityId ?? null"
      :day-index="editingCell?.day ?? 0"
      :period-index="editingCell?.period ?? 0"
      :class-id="classId"
      :teachers="teachers"
      :facilities="facilities"
      :all-slots="slots"
      @apply="applyEdit"
    />
  </div>
</template>
