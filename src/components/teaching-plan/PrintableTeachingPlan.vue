<script setup lang="ts">
import { computed } from 'vue'
import type { Teacher, TeachingClass, TeachingPlan } from '../../types'
import { WEEK_DAYS } from '../../types'
import { BASE_COURSES, findCourse } from '../../config/courses.config'
import { formatTeacherName } from '../../utils/teacher-format'
import type { PlanAnalysis, CurriculumDiff, TeacherWorkload } from '../../utils/teaching-analysis'
import { formatJalaaliDate, isoStringToJalaali } from '../../utils/jalaali'
import type { GridPeriod } from './teaching-grid.types'

const props = defineProps<{
  plan: TeachingPlan
  teachers: Teacher[]
  periods: GridPeriod[]
  analysis: PlanAnalysis
  mode: 'class' | 'all-classes' | 'teacher' | 'all-teachers' | 'workload' | 'diffs'
  classId?: string
  teacherId?: string
}>()

const WORKLOAD_ROWS_PER_PAGE = 16
const DIFF_ROWS_PER_PAGE = 20

type PrintPage =
  | { key: string; kind: 'class'; cls: TeachingClass }
  | { key: string; kind: 'teacher'; teacher: Teacher }
  | { key: string; kind: 'workload'; rows: TeacherWorkload[]; pageNumber: number; pageCount: number }
  | { key: string; kind: 'diffs'; rows: CurriculumDiff[]; pageNumber: number; pageCount: number }

function jalaaliDateLabel(iso: string): string {
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })

const rangeLabel = computed(() => {
  const from = props.plan.effectiveFrom ? jalaaliDateLabel(props.plan.effectiveFrom) : ''
  const to = props.plan.effectiveTo ? jalaaliDateLabel(props.plan.effectiveTo) : ''
  if (from && to) return `اعتبار: ${from} تا ${to}`
  if (from) return `از تاریخ ${from}`
  return ''
})

function teacherById(id: string | null): Teacher | undefined {
  return id ? props.teachers.find((t) => t.id === id) : undefined
}
function teacherName(id: string | null): string {
  const teacher = teacherById(id)
  return teacher ? formatTeacherName(teacher) : '— بدون معلم —'
}
function courseName(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.name ?? courseId
}
function courseColor(courseId: string): string {
  return findCourse(BASE_COURSES, courseId)?.color ?? '#8892a6'
}
function classLabel(classId: string): string {
  return props.plan.classes.find((c) => c.id === classId)?.label ?? classId
}

const pages = computed<PrintPage[]>(() => {
  if (props.mode === 'class') {
    const cls = props.plan.classes.find((c) => c.id === props.classId)
    return cls ? [{ key: cls.id, kind: 'class', cls }] : []
  }
  if (props.mode === 'all-classes') return props.plan.classes.map((cls) => ({ key: cls.id, kind: 'class' as const, cls }))
  if (props.mode === 'teacher') {
    const teacher = teacherById(props.teacherId ?? null)
    return teacher ? [{ key: teacher.id, kind: 'teacher', teacher }] : []
  }
  if (props.mode === 'all-teachers') {
    return props.plan.teacherIds
      .map((id) => teacherById(id))
      .filter((t): t is Teacher => !!t)
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
      .map((teacher) => ({ key: teacher.id, kind: 'teacher' as const, teacher }))
  }
  if (props.mode === 'workload') {
    const rows = [...props.analysis.workloads].sort((a, b) => b.weekly - a.weekly)
    const pageCount = Math.max(1, Math.ceil(rows.length / WORKLOAD_ROWS_PER_PAGE))
    return Array.from({ length: pageCount }, (_, i) => ({
      key: `workload-${i}`,
      kind: 'workload' as const,
      rows: rows.slice(i * WORKLOAD_ROWS_PER_PAGE, (i + 1) * WORKLOAD_ROWS_PER_PAGE),
      pageNumber: i + 1,
      pageCount,
    }))
  }
  const mismatches = props.analysis.diffs.filter((d) => d.diff !== 0)
  const pageCount = Math.max(1, Math.ceil(mismatches.length / DIFF_ROWS_PER_PAGE))
  return Array.from({ length: pageCount }, (_, i) => ({
    key: `diffs-${i}`,
    kind: 'diffs' as const,
    rows: mismatches.slice(i * DIFF_ROWS_PER_PAGE, (i + 1) * DIFF_ROWS_PER_PAGE),
    pageNumber: i + 1,
    pageCount,
  }))
})

function classCell(classId: string, dayIndex: number, periodIndex: number) {
  return props.plan.slots.find((s) => s.classId === classId && s.dayIndex === dayIndex && s.periodIndex === periodIndex)
}
function teacherCells(teacherId: string, dayIndex: number, periodIndex: number) {
  return props.plan.slots.filter((s) => s.teacherId === teacherId && s.dayIndex === dayIndex && s.periodIndex === periodIndex)
}
function weeklyOf(teacherId: string): number {
  return props.plan.slots.filter((s) => s.teacherId === teacherId).length
}
function classCourseSummary(classId: string): { courseId: string; teacher: string; hours: number }[] {
  const map = new Map<string, { courseId: string; teacher: string; hours: number }>()
  for (const slot of props.plan.slots) {
    if (slot.classId !== classId) continue
    const key = `${slot.courseId}|${slot.teacherId ?? ''}`
    const entry = map.get(key) ?? { courseId: slot.courseId, teacher: teacherName(slot.teacherId), hours: 0 }
    entry.hours += 1
    map.set(key, entry)
  }
  return Array.from(map.values()).sort((a, b) => courseName(a.courseId).localeCompare(courseName(b.courseId), 'fa'))
}
</script>

<template>
  <div class="tp-print" dir="rtl">
    <section v-for="(page, index) in pages" :key="page.key" class="tp-page" :class="index < pages.length - 1 ? 'tp-page--break' : ''">
      <!-- برنامه‌ی یک کلاس یا یک معلم -->
      <template v-if="page.kind === 'class' || page.kind === 'teacher'">
        <header class="tp-header">
          <div>
            <h1 class="tp-title">
              <template v-if="page.kind === 'class'">برنامه‌ی هفتگی کلاس {{ page.cls.label }}</template>
              <template v-else>برنامه‌ی هفتگی {{ formatTeacherName(page.teacher) }}</template>
            </h1>
            <p class="tp-sub">{{ plan.title }} - {{ plan.shiftConfig.name }}<template v-if="rangeLabel"> - {{ rangeLabel }}</template></p>
          </div>
          <p class="tp-muted">{{ printDate }}</p>
        </header>

        <div class="tp-grid-wrap">
          <table class="tp-grid">
            <thead>
              <tr>
                <th style="width: 22mm">زنگ</th>
                <th v-for="day in WEEK_DAYS" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in periods" :key="period.index">
                <th class="tp-period">{{ period.index + 1 }}<br /><span>{{ period.start }}-{{ period.end }}</span></th>
                <td v-for="(day, dayIndex) in WEEK_DAYS" :key="day">
                  <template v-if="page.kind === 'class'">
                    <div
                      v-if="classCell(page.cls.id, dayIndex, period.index)"
                      class="tp-lesson"
                      :style="{ backgroundColor: courseColor(classCell(page.cls.id, dayIndex, period.index)!.courseId) + '33', borderColor: courseColor(classCell(page.cls.id, dayIndex, period.index)!.courseId) }"
                    >
                      <strong>{{ courseName(classCell(page.cls.id, dayIndex, period.index)!.courseId) }}</strong>
                      <span>{{ teacherName(classCell(page.cls.id, dayIndex, period.index)!.teacherId) }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div
                      v-for="slot in teacherCells(page.teacher.id, dayIndex, period.index)"
                      :key="slot.classId"
                      class="tp-lesson"
                      :style="{ backgroundColor: courseColor(slot.courseId) + '33', borderColor: courseColor(slot.courseId) }"
                    >
                      <strong>{{ courseName(slot.courseId) }}</strong>
                      <span>{{ classLabel(slot.classId) }}</span>
                    </div>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="tp-footer">
          <template v-if="page.kind === 'class'">
            <span v-for="item in classCourseSummary(page.cls.id)" :key="item.courseId + item.teacher" class="tp-chip">
              {{ courseName(item.courseId) }}: {{ item.teacher }} ({{ item.hours }})
            </span>
          </template>
          <template v-else>
            <span class="tp-chip">جمع ساعت هفتگی: {{ weeklyOf(page.teacher.id) }}<template v-if="page.teacher.maxWeeklyHours"> از سقف {{ Math.floor(page.teacher.maxWeeklyHours) }}</template></span>
          </template>
          <span class="tp-muted tp-spacer">school.mhkarami97.ir</span>
        </footer>
      </template>

      <!-- گزارش ساعت معلمان -->
      <template v-else-if="page.kind === 'workload'">
        <header class="tp-header">
          <div>
            <h1 class="tp-title">گزارش ساعت تدریس معلمان</h1>
            <p class="tp-sub">{{ plan.title }}<template v-if="rangeLabel"> - {{ rangeLabel }}</template></p>
          </div>
          <p class="tp-muted">{{ printDate }} - صفحه {{ page.pageNumber }} از {{ page.pageCount }}</p>
        </header>
        <table class="tp-table">
          <thead>
            <tr>
              <th>معلم</th>
              <th v-for="day in WEEK_DAYS" :key="day" style="width: 17mm">{{ day }}</th>
              <th style="width: 20mm">جمع هفتگی</th>
              <th style="width: 20mm">سقف هفتگی</th>
              <th style="width: 20mm">سقف روزانه</th>
              <th style="width: 22mm">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in page.rows" :key="row.teacherId">
              <td>{{ teacherName(row.teacherId) }}</td>
              <td v-for="(count, dayIndex) in row.daily" :key="dayIndex" class="tp-center">{{ count }}</td>
              <td class="tp-center"><strong>{{ row.weekly }}</strong></td>
              <td class="tp-center">{{ row.maxWeekly ?? '—' }}</td>
              <td class="tp-center">{{ row.maxDaily ?? '—' }}</td>
              <td class="tp-center">{{ row.overWeekly || row.overDaily ? 'بیش از سقف' : 'عادی' }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- کسری / اضافه ساعت نسبت به curriculum -->
      <template v-else>
        <header class="tp-header">
          <div>
            <h1 class="tp-title">کسری و اضافه‌ی ساعت نسبت به سرفصل</h1>
            <p class="tp-sub">{{ plan.title }}<template v-if="rangeLabel"> - {{ rangeLabel }}</template></p>
          </div>
          <p class="tp-muted">{{ printDate }} - صفحه {{ page.pageNumber }} از {{ page.pageCount }}</p>
        </header>
        <p v-if="!page.rows.length" class="tp-sub">هیچ کسری یا اضافه‌ای وجود ندارد؛ همه‌ی دروس مطابق سرفصل چیده شده‌اند.</p>
        <table v-else class="tp-table">
          <thead>
            <tr>
              <th>کلاس</th>
              <th>درس</th>
              <th style="width: 25mm">الزام سرفصل</th>
              <th style="width: 25mm">چیده‌شده</th>
              <th style="width: 25mm">اختلاف</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in page.rows" :key="row.classId + row.courseId">
              <td>{{ classLabel(row.classId) }}</td>
              <td>{{ courseName(row.courseId) }}</td>
              <td class="tp-center">{{ row.required }}</td>
              <td class="tp-center">{{ row.placed }}</td>
              <td class="tp-center"><strong>{{ row.diff > 0 ? '+' : '' }}{{ row.diff }}</strong></td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
  </div>
</template>

<style>
.tp-print {
  color: #171a26;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.tp-print * {
  box-sizing: border-box;
}
.tp-page {
  display: flex;
  flex-direction: column;
  width: 274mm;
  height: 187mm;
  overflow: hidden;
  background: #ffffff;
}
.tp-page--break {
  break-after: page;
  page-break-after: always;
}
.tp-header {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4mm;
  padding-bottom: 2.5mm;
  margin-bottom: 2.5mm;
  border-bottom: 2px solid #262b3d;
}
.tp-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}
.tp-sub {
  margin: 1mm 0 0;
  font-size: 11px;
  color: #4d5670;
}
.tp-muted {
  margin: 0;
  font-size: 10px;
  color: #66708a;
}
.tp-spacer {
  margin-right: auto;
}
.tp-grid-wrap {
  flex: 1;
  min-height: 0;
}
.tp-grid {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.tp-grid th,
.tp-grid td {
  padding: 1mm;
  vertical-align: middle;
  text-align: center;
  border: 1px solid #8892a6;
}
.tp-grid thead th {
  height: 8mm;
  font-size: 11px;
  background: #eceef2;
}
.tp-period {
  font-size: 11px;
  background: #eceef2;
}
.tp-period span {
  font-size: 9px;
  font-weight: 400;
  color: #66708a;
}
.tp-lesson {
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
  padding: 1mm 1.5mm;
  margin: 0.5mm 0;
  font-size: 10.5px;
  border: 1px solid;
  border-radius: 1.5mm;
}
.tp-lesson span {
  font-size: 9px;
  color: #4d5670;
}
.tp-footer {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5mm;
  align-items: center;
  margin-top: 2mm;
  max-height: 22mm;
  overflow: hidden;
}
.tp-chip {
  padding: 0.5mm 2mm;
  font-size: 9px;
  background: #eceef2;
  border-radius: 1mm;
}
.tp-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}
.tp-table th,
.tp-table td {
  height: 8mm;
  padding: 0 2mm;
  font-size: 11px;
  border: 1px solid #66708a;
}
.tp-table th {
  background: #eceef2;
}
.tp-center {
  text-align: center;
}
</style>
