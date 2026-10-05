<script setup lang="ts">
import { computed } from 'vue'
import type { ExamRoom, ExamSession, SeatAssignment } from '../../types'
import { findCourse, BASE_COURSES } from '../../config/courses.config'
import { assignmentsOfRoom, jalaaliDateLabel, seatLabel } from '../../utils/exam-seating-helpers'
import SeatGrid from './SeatGrid.vue'

const props = defineProps<{
  session: ExamSession
  rooms: ExamRoom[]
  mode: 'map' | 'cards' | 'attendance'
  nameOf: (studentId: string) => string
  classLabelOf: (studentId: string) => string
  colorOf: (studentId: string) => string | null
}>()

const CARDS_PER_PAGE = 10
const ATTENDANCE_ROWS_PER_PAGE = 26

interface PrintPage {
  key: string
  room: ExamRoom | null
  assignments: SeatAssignment[]
  startIndex: number
  pageNumber: number
  pageCount: number
}

const usedRooms = computed(() =>
  props.rooms.filter((room) => props.session.assignments.some((a) => a.roomId === room.id)),
)

const courseName = computed(() => findCourse(BASE_COURSES, props.session.courseId)?.name ?? '')
const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })

function roomName(roomId: string): string {
  return props.rooms.find((r) => r.id === roomId)?.name ?? '—'
}

/** هر صفحه یک جعبه‌ی ثابت (mm) است؛ پس محتوا هرگز از صفحه بیرون نمی‌زند. */
const mapPages = computed<PrintPage[]>(() =>
  usedRooms.value.map((room, index) => ({
    key: room.id,
    room,
    assignments: [],
    startIndex: 0,
    pageNumber: index + 1,
    pageCount: usedRooms.value.length,
  })),
)

const cardPages = computed<PrintPage[]>(() => {
  const roomOrder = new Map(props.rooms.map((room, index) => [room.id, index]))
  const sorted = [...props.session.assignments].sort(
    (a, b) => (roomOrder.get(a.roomId) ?? 0) - (roomOrder.get(b.roomId) ?? 0) || a.row - b.row || a.col - b.col,
  )
  const pageCount = Math.max(1, Math.ceil(sorted.length / CARDS_PER_PAGE))
  return Array.from({ length: pageCount }, (_, index) => ({
    key: `cards-${index}`,
    room: null,
    assignments: sorted.slice(index * CARDS_PER_PAGE, (index + 1) * CARDS_PER_PAGE),
    startIndex: index * CARDS_PER_PAGE,
    pageNumber: index + 1,
    pageCount,
  }))
})

/** لیست حضور هر سالن به صفحه‌های ۲۶ ردیفی تقسیم می‌شود تا جدول از صفحه بیرون نزند. */
const attendancePages = computed<PrintPage[]>(() => {
  const pages: PrintPage[] = []
  for (const room of usedRooms.value) {
    const all = assignmentsOfRoom(props.session.assignments, room.id)
    const pageCount = Math.max(1, Math.ceil(all.length / ATTENDANCE_ROWS_PER_PAGE))
    for (let index = 0; index < pageCount; index += 1) {
      pages.push({
        key: `${room.id}-${index}`,
        room,
        assignments: all.slice(index * ATTENDANCE_ROWS_PER_PAGE, (index + 1) * ATTENDANCE_ROWS_PER_PAGE),
        startIndex: index * ATTENDANCE_ROWS_PER_PAGE,
        pageNumber: index + 1,
        pageCount,
      })
    }
  }
  return pages
})

const legend = computed(() => {
  const seen = new Map<string, { label: string; color: string }>()
  for (const assignment of props.session.assignments) {
    const color = props.colorOf(assignment.studentId)
    const label = props.classLabelOf(assignment.studentId)
    if (color && !seen.has(label)) seen.set(label, { label, color })
  }
  return Array.from(seen.values())
})

const pages = computed(() => {
  if (props.mode === 'map') return mapPages.value
  if (props.mode === 'cards') return cardPages.value
  return attendancePages.value
})
</script>

<template>
  <div class="es-print" dir="rtl">
    <section
      v-for="(page, index) in pages"
      :key="page.key"
      class="es-page"
      :class="[mode === 'map' ? 'es-page--landscape' : 'es-page--portrait', index < pages.length - 1 ? 'es-page--break' : '']"
    >
      <!-- نقشه‌ی سالن -->
      <template v-if="mode === 'map' && page.room">
        <header class="es-header">
          <div>
            <h1 class="es-title">{{ page.room.name }} — {{ session.title }}</h1>
            <p class="es-sub">
              <template v-if="courseName">{{ courseName }} — </template>{{ jalaaliDateLabel(session.date) }}<template v-if="session.time"> — ساعت {{ session.time }}</template>
            </p>
          </div>
          <p class="es-muted">{{ printDate }}</p>
        </header>
        <div class="es-map">
          <SeatGrid
            :room="page.room"
            :assignments="session.assignments"
            mode="view"
            :label-of="nameOf"
            :color-of="colorOf"
            compact
            fill
            light-only
          />
        </div>
        <footer v-if="legend.length" class="es-legend">
          <span v-for="item in legend" :key="item.label" class="es-legend-item">
            <i class="es-dot" :style="{ backgroundColor: item.color }"></i>{{ item.label }}
          </span>
        </footer>
      </template>

      <!-- کارت صندلی -->
      <div v-else-if="mode === 'cards'" class="es-cards">
        <article v-for="assignment in page.assignments" :key="assignment.studentId" class="es-card">
          <div>
            <p class="es-card-name">{{ nameOf(assignment.studentId) }}</p>
            <p class="es-card-class">{{ classLabelOf(assignment.studentId) }}</p>
          </div>
          <div class="es-card-seat">
            <p class="es-card-room">{{ roomName(assignment.roomId) }}</p>
            <p class="es-card-pos">{{ seatLabel(assignment.row, assignment.col) }}</p>
          </div>
          <p class="es-card-meta">
            {{ session.title }}<template v-if="courseName"> — {{ courseName }}</template> — {{ jalaaliDateLabel(session.date) }}<template v-if="session.time"> — {{ session.time }}</template>
          </p>
        </article>
      </div>

      <!-- لیست حضور -->
      <template v-else-if="page.room">
        <header class="es-header">
          <div>
            <h1 class="es-title">لیست حضور و غیاب — {{ page.room.name }}</h1>
            <p class="es-sub">
              {{ session.title }}<template v-if="courseName"> — {{ courseName }}</template> — {{ jalaaliDateLabel(session.date) }}<template v-if="session.time"> — ساعت {{ session.time }}</template>
            </p>
          </div>
          <p class="es-muted">{{ printDate }}<template v-if="page.pageCount > 1"> — صفحه {{ page.pageNumber }} از {{ page.pageCount }}</template></p>
        </header>
        <table class="es-table">
          <thead>
            <tr>
              <th style="width: 9mm">#</th>
              <th style="width: 20mm">صندلی</th>
              <th>نام و نام‌خانوادگی</th>
              <th style="width: 32mm">کلاس</th>
              <th style="width: 13mm">حاضر</th>
              <th style="width: 13mm">غایب</th>
              <th style="width: 34mm">امضا</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(assignment, rowIndex) in page.assignments" :key="assignment.studentId">
              <td class="es-center">{{ page.startIndex + rowIndex + 1 }}</td>
              <td class="es-center">{{ assignment.row + 1 }}-{{ assignment.col + 1 }}</td>
              <td>{{ nameOf(assignment.studentId) }}</td>
              <td class="es-center">{{ classLabelOf(assignment.studentId) }}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <p class="es-muted es-footer-note">school.mhkarami97.ir</p>
      </template>
    </section>
  </div>
</template>

<style>
/* A4 با حاشیه‌ی ۱۰mm: ناحیه‌ی قابل چاپ ۱۹۰×۲۷۷ (عمودی) یا ۲۷۷×۱۹۰ (افقی)؛ جعبه‌ها کمی کوچک‌ترند تا گرد شدن، صفحه‌ی اضافه نسازد. */
.es-print {
  color: #171a26;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.es-print * {
  box-sizing: border-box;
}
.es-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}
.es-page--landscape {
  width: 274mm;
  height: 187mm;
}
.es-page--portrait {
  width: 188mm;
  height: 274mm;
}
.es-page--break {
  break-after: page;
  page-break-after: always;
}
.es-header {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4mm;
  padding-bottom: 3mm;
  margin-bottom: 3mm;
  border-bottom: 2px solid #262b3d;
}
.es-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}
.es-sub {
  margin: 1mm 0 0;
  font-size: 11px;
  color: #4d5670;
}
.es-muted {
  margin: 0;
  font-size: 10px;
  color: #66708a;
}
.es-map {
  flex: 1;
  min-height: 0;
}
.es-legend {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 3mm;
  margin-top: 3mm;
  font-size: 10px;
  color: #4d5670;
}
.es-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
}
.es-dot {
  display: inline-block;
  width: 3mm;
  height: 3mm;
  border-radius: 0.8mm;
}
.es-cards {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(5, minmax(0, 1fr));
  gap: 3mm;
}
.es-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  padding: 3mm;
  overflow: hidden;
  border: 1.5px dashed #8892a6;
  border-radius: 3mm;
}
.es-card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}
.es-card-class {
  margin: 0;
  font-size: 10px;
  color: #66708a;
}
.es-card-seat {
  padding: 1.5mm 2mm;
  text-align: center;
  background: #eceef2;
  border-radius: 2mm;
}
.es-card-room {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
}
.es-card-pos {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}
.es-card-meta {
  margin: 0;
  font-size: 9px;
  color: #66708a;
}
.es-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.es-table th,
.es-table td {
  height: 8mm;
  padding: 0 2mm;
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
  border: 1px solid #66708a;
}
.es-table th {
  background: #eceef2;
}
.es-center {
  text-align: center;
}
.es-footer-note {
  margin-top: 3mm;
}
</style>
