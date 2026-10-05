<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useExamSessionsStore } from '../stores/exam-sessions'
import { useExamRoomsStore } from '../stores/exam-rooms'
import { useStudentsStore } from '../stores/students'
import { useStudentGroupsStore } from '../stores/student-groups'
import {
  SEATING_STRATEGIES,
  SEATING_STRATEGY_DESCRIPTIONS,
  SEATING_STRATEGY_LABELS,
  SEAT_ADJACENCIES,
  SEAT_ADJACENCY_LABELS,
  SEAT_SPACINGS,
  SEAT_SPACING_LABELS,
  createEmptyExamSession,
} from '../config/exam-seating.config'
import { BASE_COURSES } from '../config/courses.config'
import { gradeLabel } from '../config/levels.config'
import { SeatingEngine, computeConflicts } from '../utils/seating-engine'
import type { SeatingParticipant } from '../utils/seating-engine'
import { buildClassColorMap, roomCapacity, seatKey } from '../utils/exam-seating-helpers'
import { printWithPageSize } from '../utils/print-page'
import AppHeader from '../components/layout/AppHeader.vue'
import JalaliDatePicker from '../components/lessonPlan/JalaliDatePicker.vue'
import SeatGrid from '../components/exam-seating/SeatGrid.vue'
import ParticipantsPicker from '../components/exam-seating/ParticipantsPicker.vue'
import SeparationPairsPanel from '../components/exam-seating/SeparationPairsPanel.vue'
import PrintableSeating from '../components/exam-seating/PrintableSeating.vue'
import type { ExamRoom, ExamSession } from '../types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const sessionsStore = useExamSessionsStore()
const roomsStore = useExamRoomsStore()
const studentsStore = useStudentsStore()
const groupsStore = useStudentGroupsStore()

const isLoading = ref(true)
const session = ref<ExamSession | null>(null)
const saveMessage = ref('')
const engineWarnings = ref<string[]>([])
const hasManualEdits = ref(false)
const activeRoomId = ref('')
const selectedSeat = ref<{ roomId: string; row: number; col: number } | null>(null)

onMounted(async () => {
  await Promise.all([
    sessionsStore.loadFromDb(),
    roomsStore.loadFromDb(),
    studentsStore.loadFromDb(),
    groupsStore.loadFromDb(),
  ])
  if (props.id) {
    const existing = sessionsStore.byId(props.id)
    session.value = existing ? (JSON.parse(JSON.stringify(existing)) as ExamSession) : null
  } else {
    session.value = createEmptyExamSession()
  }
  activeRoomId.value = session.value?.roomIds[0] ?? ''
  isLoading.value = false
})

// --- اطلاعات دانش‌آموزان --------------------------------------------------
function classKeyOf(studentId: string): string {
  const student = studentsStore.byId(studentId)
  if (!student) return 'unknown'
  return student.currentGroupId ?? `grade-${student.grade}`
}

function classLabelOf(studentId: string): string {
  const student = studentsStore.byId(studentId)
  if (!student) return '—'
  if (student.currentGroupId) {
    const group = groupsStore.byId(student.currentGroupId)
    if (group) return group.title
  }
  return gradeLabel(student.grade)
}

function nameOf(studentId: string): string {
  const student = studentsStore.byId(studentId)
  return student ? `${student.firstName} ${student.lastName}` : '— (حذف‌شده)'
}

const validParticipantIds = computed(() =>
  (session.value?.participantIds ?? []).filter((id) => !!studentsStore.byId(id)),
)

const participantOptions = computed(() =>
  validParticipantIds.value
    .map((id) => ({ id, name: nameOf(id) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fa')),
)

const classColors = computed(() => {
  const keys = (session.value?.assignments ?? []).map((a) => classKeyOf(a.studentId))
  return buildClassColorMap(keys)
})

function colorOf(studentId: string): string | null {
  return classColors.value.get(classKeyOf(studentId)) ?? null
}

const legend = computed(() => {
  const counts = new Map<string, { label: string; color: string; count: number }>()
  for (const assignment of session.value?.assignments ?? []) {
    const key = classKeyOf(assignment.studentId)
    const color = classColors.value.get(key)
    if (!color) continue
    const entry = counts.get(key) ?? { label: classLabelOf(assignment.studentId), color, count: 0 }
    entry.count += 1
    counts.set(key, entry)
  }
  return Array.from(counts.values()).sort((a, b) => a.label.localeCompare(b.label, 'fa'))
})

// --- سالن‌ها --------------------------------------------------
const selectedRooms = computed<ExamRoom[]>(() =>
  (session.value?.roomIds ?? []).map((id) => roomsStore.byId(id)).filter((r): r is ExamRoom => !!r),
)

const totalCapacity = computed(() => selectedRooms.value.reduce((sum, room) => sum + roomCapacity(room), 0))

const activeRoom = computed(() => selectedRooms.value.find((r) => r.id === activeRoomId.value) ?? selectedRooms.value[0] ?? null)

function toggleRoom(roomId: string): void {
  if (!session.value) return
  const ids = session.value.roomIds
  session.value.roomIds = ids.includes(roomId) ? ids.filter((id) => id !== roomId) : [...ids, roomId]
  if (!session.value.roomIds.includes(activeRoomId.value)) activeRoomId.value = session.value.roomIds[0] ?? ''
}

// --- تولید چیدمان --------------------------------------------------
const canGenerate = computed(() => selectedRooms.value.length > 0 && validParticipantIds.value.length > 0)

function generate(useNewSeed = false): void {
  const current = session.value
  if (!current || !canGenerate.value) return
  if (current.assignments.length && hasManualEdits.value && !confirm('چیدمان فعلی (شامل جابه‌جایی‌های دستی) دوباره تولید و جایگزین شود؟')) return

  if (useNewSeed) current.settings.seed = Math.floor(Math.random() * 1_000_000) + 1

  const participants: SeatingParticipant[] = validParticipantIds.value.map((id) => {
    const student = studentsStore.byId(id)!
    return { id, sortKey: `${student.lastName} ${student.firstName}`, classKey: classKeyOf(id) }
  })
  const pairs = current.separationPairs.filter(
    (p) => validParticipantIds.value.includes(p.studentAId) && validParticipantIds.value.includes(p.studentBId),
  )

  const result = new SeatingEngine().run({
    examSessionId: current.id,
    rooms: selectedRooms.value,
    participants,
    separationPairs: pairs,
    settings: current.settings,
  })

  current.assignments = result.assignments
  current.unseatedIds = result.unseatedIds
  current.generatedAt = Date.now()
  engineWarnings.value = result.warnings
  hasManualEdits.value = false
  selectedSeat.value = null
  activeRoomId.value = activeRoomId.value || current.roomIds[0] || ''
}

// --- مجاورت‌های ممنوع (بعد از جابه‌جایی دستی هم دوباره محاسبه می‌شود) ------------
const conflicts = computed(() =>
  session.value
    ? computeConflicts(session.value.assignments, classKeyOf, session.value.separationPairs, session.value.settings)
    : [],
)

function conflictKeysOf(roomId: string): Set<string> {
  const keys = new Set<string>()
  for (const conflict of conflicts.value) {
    if (conflict.roomId !== roomId) continue
    keys.add(seatKey(conflict.rowA, conflict.colA))
    keys.add(seatKey(conflict.rowB, conflict.colB))
  }
  return keys
}

// --- جابه‌جایی دستی: کلیک روی یک صندلی پر، سپس صندلی مقصد --------------------------
function onSeatClick(roomId: string, row: number, col: number): void {
  const current = session.value
  if (!current) return
  const occupiedAt = (r: string, rw: number, cl: number) =>
    current.assignments.find((a) => a.roomId === r && a.row === rw && a.col === cl)

  if (!selectedSeat.value) {
    if (occupiedAt(roomId, row, col)) selectedSeat.value = { roomId, row, col }
    return
  }

  const from = selectedSeat.value
  selectedSeat.value = null
  if (from.roomId === roomId && from.row === row && from.col === col) return

  const first = occupiedAt(from.roomId, from.row, from.col)
  const second = occupiedAt(roomId, row, col)
  if (!first) return

  current.assignments = current.assignments.map((a) => {
    if (a.studentId === first.studentId) return { ...a, roomId, row, col }
    if (second && a.studentId === second.studentId) return { ...a, roomId: from.roomId, row: from.row, col: from.col }
    return a
  })
  hasManualEdits.value = true
}

function selectedKeyOf(roomId: string): string | null {
  return selectedSeat.value && selectedSeat.value.roomId === roomId ? seatKey(selectedSeat.value.row, selectedSeat.value.col) : null
}

// --- ذخیره / حذف --------------------------------------------------
async function handleSave(): Promise<void> {
  if (!session.value || !session.value.title.trim()) return
  session.value.participantIds = validParticipantIds.value
  const isNew = !props.id
  await sessionsStore.save(session.value)
  saveMessage.value = 'ذخیره شد.'
  if (isNew) router.push(`/exam-seating/${session.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!session.value || !props.id) return
  if (!confirm('این جلسه‌ی امتحان حذف شود؟')) return
  await sessionsStore.remove(session.value.id)
  router.push('/exam-seating')
}

// --- چاپ / PDF --------------------------------------------------
const printMode = ref<'map' | 'cards' | 'attendance'>('map')
const isPrinting = ref(false)

async function handlePrint(mode: 'map' | 'cards' | 'attendance'): Promise<void> {
  printMode.value = mode
  isPrinting.value = true
  await nextTick()
  printWithPageSize(mode === 'map' ? 'A4 landscape' : 'A4 portrait')
  window.addEventListener('afterprint', () => { isPrinting.value = false }, { once: true })
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 print:min-h-0 print:bg-white print:pb-0 sm:pb-16 dark:bg-ink-950 print:dark:bg-white">
    <div class="print:hidden">
      <AppHeader />
    </div>

    <div v-if="isLoading" class="p-10 text-center text-ink-400 dark:text-ink-500 print:hidden">در حال بارگذاری...</div>
    <div v-else-if="!session" class="flex min-h-60vh flex-col items-center justify-center gap-4 px-4 text-center print:hidden">
      <p class="text-ink-600 dark:text-ink-300">این جلسه یافت نشد.</p>
      <RouterLink to="/exam-seating" class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">بازگشت به فهرست جلسه‌ها</RouterLink>
    </div>

    <template v-else>
      <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6 print:hidden">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-xl font-bold text-ink-900 dark:text-ink-200">{{ props.id ? 'ویرایش جلسه‌ی امتحان' : 'جلسه‌ی امتحان جدید' }}</h1>
            <RouterLink to="/exam-seating" class="text-sm text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400">بازگشت به فهرست</RouterLink>
          </div>

          <!-- اطلاعات جلسه -->
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات جلسه</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">عنوان</label>
                <input v-model="session.title" type="text" placeholder="مثلاً: امتحان میان‌ترم ریاضی" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">درس (اختیاری)</label>
                <select v-model="session.courseId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                  <option value="">— بدون درس —</option>
                  <option v-for="course in BASE_COURSES" :key="course.id" :value="course.id">{{ course.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تاریخ (شمسی)</label>
                  <JalaliDatePicker v-model="session.date" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">ساعت</label>
                  <input v-model="session.time" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
                </div>
              </div>
            </div>
          </div>

          <!-- سالن‌ها -->
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">سالن‌های استفاده‌شده</p>
              <RouterLink to="/exam-seating/rooms" class="text-11px font-medium text-brand-600 hover:underline dark:text-brand-400">مدیریت سالن‌ها</RouterLink>
            </div>
            <div v-if="roomsStore.items.length" class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="room in roomsStore.items"
                :key="room.id"
                class="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
                :class="session.roomIds.includes(room.id) ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/10' : 'border-ink-200 dark:border-ink-700'"
              >
                <input type="checkbox" class="h-4 w-4 rounded border-ink-300" :checked="session.roomIds.includes(room.id)" @change="toggleRoom(room.id)" />
                <span class="text-ink-700 dark:text-ink-200">{{ room.name }}</span>
                <span class="mr-auto text-ink-400 dark:text-ink-500">{{ roomCapacity(room) }} صندلی</span>
              </label>
            </div>
            <p v-else class="text-11px text-ink-400 dark:text-ink-500">هنوز سالنی تعریف نشده است.</p>
            <p class="mt-2 text-11px" :class="validParticipantIds.length > totalCapacity ? 'font-medium text-red-600 dark:text-red-400' : 'text-ink-400 dark:text-ink-500'">
              ظرفیت کل: {{ totalCapacity }} — شرکت‌کنندگان: {{ validParticipantIds.length }}
            </p>
          </div>

          <ParticipantsPicker v-model="session.participantIds" />
          <SeparationPairsPanel v-model="session.separationPairs" :participants="participantOptions" />

          <!-- تنظیمات الگوریتم -->
          <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">تنظیمات چیدمان</p>

            <div class="mb-4 grid gap-2 sm:grid-cols-3">
              <button
                v-for="strategy in SEATING_STRATEGIES"
                :key="strategy"
                type="button"
                class="rounded-xl border-2 p-3 text-right transition"
                :class="session.settings.strategy === strategy ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-ink-200 dark:border-ink-700'"
                @click="session.settings.strategy = strategy"
              >
                <p class="text-xs font-semibold text-ink-800 dark:text-ink-200">{{ SEATING_STRATEGY_LABELS[strategy] }}</p>
                <p class="mt-1 text-10px leading-5 text-ink-500 dark:text-ink-400">{{ SEATING_STRATEGY_DESCRIPTIONS[strategy] }}</p>
              </button>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">الگوی فاصله‌گذاری</label>
                <select v-model="session.settings.spacing" class="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                  <option v-for="spacing in SEAT_SPACINGS" :key="spacing" :value="spacing">{{ SEAT_SPACING_LABELS[spacing] }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">همسایگی ممنوع</label>
                <select v-model="session.settings.adjacency" class="w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
                  <option v-for="adjacency in SEAT_ADJACENCIES" :key="adjacency" :value="adjacency">{{ SEAT_ADJACENCY_LABELS[adjacency] }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">کد‌یکتا (برای تکرارپذیری)</label>
                <input v-model.number="session.settings.seed" type="number" min="1" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200" />
              </div>
            </div>

            <label class="mt-3 flex items-center gap-2 text-xs text-ink-700 dark:text-ink-200">
              <input v-model="session.settings.avoidSameClass" type="checkbox" class="h-4 w-4 rounded border-ink-300" />
              هم‌کلاسی‌ها کنار هم ننشینند
            </label>
            <p class="mt-1 text-10px text-ink-400 dark:text-ink-500">
              با همین کد‌یکتا و همین شرکت‌کنندگان/سالن‌ها/تنظیمات، هر بار دقیقاً همین چیدمان تولید می‌شود.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canGenerate" @click="generate(false)">
                تولید چیدمان
              </button>
              <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 disabled:opacity-40 dark:border-ink-700 dark:text-ink-200" :disabled="!canGenerate" @click="generate(true)">
                کد‌یکتا جدید و تولید دوباره
              </button>
            </div>
          </div>

          <!-- نتیجه -->
          <div v-if="session.assignments.length || session.unseatedIds.length" class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-200">نقشه‌ی صندلی‌ها</p>
              <div class="flex flex-wrap gap-2 text-11px">
                <span class="rounded-lg bg-ink-50 px-2 py-1 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{{ session.assignments.length }} نفر چیده شد</span>
                <span class="rounded-lg px-2 py-1" :class="conflicts.length ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'">
                  {{ conflicts.length ? `${conflicts.length} مجاورت ممنوع` : 'بدون مجاورت ممنوع' }}
                </span>
                <span v-if="session.unseatedIds.length" class="rounded-lg bg-red-50 px-2 py-1 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {{ session.unseatedIds.length }} نفر بدون صندلی
                </span>
              </div>
            </div>

            <div v-if="engineWarnings.length" class="mb-3 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-11px text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
              <p v-for="(warning, index) in engineWarnings" :key="index">{{ warning }}</p>
            </div>

            <div v-if="selectedRooms.length > 1" class="mb-3 flex flex-wrap gap-2">
              <button
                v-for="room in selectedRooms"
                :key="room.id"
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                :class="activeRoom?.id === room.id ? 'bg-ink-900 text-white dark:bg-brand-600' : 'border border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'"
                @click="activeRoomId = room.id"
              >
                {{ room.name }}
              </button>
            </div>

            <SeatGrid
              v-if="activeRoom"
              :room="activeRoom"
              :assignments="session.assignments"
              mode="view"
              :label-of="nameOf"
              :color-of="colorOf"
              :conflict-keys="conflictKeysOf(activeRoom.id)"
              :selected-key="selectedKeyOf(activeRoom.id)"
              @cell-click="(row, col) => onSeatClick(activeRoom!.id, row, col)"
            />
            <p class="mt-2 text-10px text-ink-400 dark:text-ink-500">
              برای جابه‌جایی دستی، روی یک صندلی پر و بعد روی صندلی مقصد (پر یا خالی) کلیک کن. کادر قرمز یعنی مجاورت ممنوع.
            </p>

            <div v-if="legend.length" class="mt-3 flex flex-wrap gap-3 text-11px text-ink-600 dark:text-ink-300">
              <span v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
                <span class="inline-block h-3 w-3 rounded" :style="{ backgroundColor: item.color }"></span>{{ item.label }} ({{ item.count }})
              </span>
            </div>

            <div v-if="session.unseatedIds.length" class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-11px text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
              بدون صندلی: {{ session.unseatedIds.map(nameOf).join('، ') }}
            </div>
          </div>

          <!-- چاپ -->
          <div v-if="session.assignments.length" class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">چاپ / خروجی PDF</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('map')">نقشه‌ی سالن (برای درب)</button>
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('cards')">کارت صندلی هر نفر</button>
              <button type="button" class="rounded-xl border border-ink-200 px-4 py-2 text-xs font-medium text-ink-700 dark:border-ink-700 dark:text-ink-200" @click="handlePrint('attendance')">لیست حضور بر اساس صندلی</button>
            </div>
            <p class="mt-2 text-10px text-ink-400 dark:text-ink-500">می‌توانید لیست ساخته شده را خودتان ویرایش کنید.</p>
          </div>

          <div class="mb-8 flex flex-wrap items-center gap-3">
            <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="handleSave">ذخیره جلسه</button>
            <button v-if="props.id" type="button" class="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/30 dark:text-red-400" @click="handleDelete">حذف جلسه</button>
            <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
          </div>
        </div>
      </div>

      <!-- خارج از کانتینر max-w/padding تا حاشیه‌های صفحه‌ی ویو روی چاپ اثر نگذارد -->
      <div v-if="isPrinting" id="print-root" class="hidden print:block">
        <PrintableSeating
          :session="session"
          :rooms="selectedRooms"
          :mode="printMode"
          :name-of="nameOf"
          :class-label-of="classLabelOf"
          :color-of="colorOf"
        />
      </div>
    </template>
  </div>
</template>
