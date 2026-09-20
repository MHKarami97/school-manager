<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GradeSchedule, ShiftTimeConfig, CourseDefinition, Teacher, LessonCell } from '@/types'
import { WEEK_DAYS } from '@/types'
import { buildBellSchedule } from '@/config/schedule-defaults.config'
import CellEditorModal from './CellEditorModal.vue'

const props = defineProps<{
  gradeSchedule: GradeSchedule
  shiftConfig: ShiftTimeConfig
  courses: CourseDefinition[]
  teachers: Teacher[]
  editable?: boolean
}>()

const cells = defineModel<LessonCell[]>('cells', { required: true })

const lessonPeriods = computed(() => buildBellSchedule(props.shiftConfig).filter((p) => p.type === 'lesson'))

function cellAt(dayIndex: number, periodIndex: number): LessonCell {
  return (
    cells.value.find((c) => c.dayIndex === dayIndex && c.periodIndex === periodIndex) ?? {
      dayIndex,
      periodIndex,
      courseId: null,
      teacherId: null,
    }
  )
}

function courseOf(cell: LessonCell): CourseDefinition | undefined {
  return cell.courseId ? props.courses.find((c) => c.id === cell.courseId) : undefined
}

function teacherOf(cell: LessonCell): Teacher | undefined {
  return cell.teacherId ? props.teachers.find((t) => t.id === cell.teacherId) : undefined
}

function setCell(dayIndex: number, periodIndex: number, patch: Partial<LessonCell>): void {
  const others = cells.value.filter((c) => !(c.dayIndex === dayIndex && c.periodIndex === periodIndex))
  cells.value = [...others, { dayIndex, periodIndex, courseId: null, teacherId: null, ...patch }]
}

const draggedFrom = ref<{ day: number; period: number } | null>(null)

function onDragStart(day: number, period: number): void {
  if (!props.editable) return
  draggedFrom.value = { day, period }
}

function onDrop(day: number, period: number): void {
  if (!draggedFrom.value || !props.editable) return
  const from = draggedFrom.value
  const fromCell = cellAt(from.day, from.period)
  const toCell = cellAt(day, period)
  setCell(from.day, from.period, { courseId: toCell.courseId, teacherId: toCell.teacherId })
  setCell(day, period, { courseId: fromCell.courseId, teacherId: fromCell.teacherId })
  draggedFrom.value = null
}

const editingCell = ref<{ day: number; period: number } | null>(null)
const isModalOpen = ref(false)

function openEditor(day: number, period: number): void {
  if (!props.editable) return
  editingCell.value = { day, period }
  isModalOpen.value = true
}

function applyEdit(courseId: string | null, teacherId: string | null): void {
  if (!editingCell.value) return
  setCell(editingCell.value.day, editingCell.value.period, { courseId, teacherId })
  editingCell.value = null
}

const editingCourseId = computed(() => (editingCell.value ? cellAt(editingCell.value.day, editingCell.value.period).courseId : null))
const editingTeacherId = computed(() => (editingCell.value ? cellAt(editingCell.value.day, editingCell.value.period).teacherId : null))
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
      <thead>
        <tr>
          <th class="w-20 border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-500">زنگ</th>
          <th v-for="day in WEEK_DAYS" :key="day" class="border border-ink-100 bg-ink-50 p-2 text-center font-medium text-ink-600">
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in lessonPeriods" :key="p.index">
          <td class="border border-ink-100 p-2 text-center text-ink-500">
            زنگ {{ p.index }}
            <br />
            <span class="text-[10px] text-ink-400">{{ p.start }}–{{ p.end }}</span>
          </td>
          <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day" class="border border-ink-100 p-1 align-top">
            <div
              class="flex min-h-16 flex-col justify-center gap-0.5 rounded-lg border p-2 text-center transition"
              :class="props.editable ? 'cursor-pointer hover:brightness-95' : ''"
              :draggable="props.editable && !!cellAt(dayIndex, p.index - 1).courseId"
              :style="{
                backgroundColor: courseOf(cellAt(dayIndex, p.index - 1)) ? courseOf(cellAt(dayIndex, p.index - 1))!.color + '14' : 'transparent',
                borderColor: courseOf(cellAt(dayIndex, p.index - 1)) ? courseOf(cellAt(dayIndex, p.index - 1))!.color + '55' : '#e5e7eb',
              }"
              @dragstart="onDragStart(dayIndex, p.index - 1)"
              @dragover.prevent
              @drop="onDrop(dayIndex, p.index - 1)"
              @click="openEditor(dayIndex, p.index - 1)"
            >
              <p v-if="courseOf(cellAt(dayIndex, p.index - 1))" class="font-medium text-ink-800">
                {{ courseOf(cellAt(dayIndex, p.index - 1))!.name }}
              </p>
              <p v-else class="text-ink-300">—</p>
              <p v-if="teacherOf(cellAt(dayIndex, p.index - 1))" class="text-[10px] text-ink-500">
                {{ teacherOf(cellAt(dayIndex, p.index - 1))!.name }}
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <CellEditorModal
    v-model="isModalOpen"
    :course-id="editingCourseId"
    :teacher-id="editingTeacherId"
    :courses="courses"
    :teachers="teachers"
    @apply="applyEdit"
  />
</template>
