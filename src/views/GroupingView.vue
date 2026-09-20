<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStudentsStore } from '@/stores/students'
import { useStudentGroupsStore } from '@/stores/student-groups'
import { LEVELS, getLevelById, gradeLabel } from '@/config/levels.config'
import { cloneDefaultGroupingRules } from '@/config/grouping-rules.config'
import { GroupingEngine, type GroupSetup } from '@/utils/grouping-engine'
import { createAllGroupingRules } from '@/utils/grouping-rules'
import AppHeader from '@/components/layout/AppHeader.vue'
import GroupingRulesPanel from '@/components/students/GroupingRulesPanel.vue'
import type { Gender, GroupingRuleConfig, LevelId, Student, StudentGroup } from '@/types'

const route = useRoute()
const studentsStore = useStudentsStore()
const studentGroupsStore = useStudentGroupsStore()

onMounted(async () => {
  await Promise.all([studentsStore.loadFromDb(), studentGroupsStore.loadFromDb()])
})

const phase = ref<'setup' | 'rules' | 'result'>('setup')

const levelId = ref<LevelId>((route.query.level as LevelId) || 'elementary')
const grade = ref<number>(Number(route.query.grade) || LEVELS.find((l) => l.id === levelId.value)?.grades[0] || 1)
const groupCount = ref(2)
const maxCapacity = ref(30)
const gender = ref<Gender>('male')
const teacherStrengths = ref<number[]>([3, 3])

watch(groupCount, (count) => {
  const arr = [...teacherStrengths.value]
  while (arr.length < count) arr.push(3)
  while (arr.length > count) arr.pop()
  teacherStrengths.value = arr
})

const gradeStudents = computed(() => studentsStore.byGrade(grade.value))
const gendersPresent = computed(() => {
  const set = new Set(gradeStudents.value.map((s) => s.gender))
  return Array.from(set)
})
const targetStudents = computed(() => gradeStudents.value.filter((s) => s.gender === gender.value))

const ruleConfigs = ref<GroupingRuleConfig[]>(cloneDefaultGroupingRules())

const resultGroups = ref<{ id: string; title: string; studentIds: string[] }[]>([])
const isGenerating = ref(false)

function goToRules(): void {
  phase.value = 'rules'
}

function goBackToSetup(): void {
  phase.value = 'setup'
}

async function runGrouping(): Promise<void> {
  isGenerating.value = true
  try {
    const setups: GroupSetup[] = Array.from({ length: groupCount.value }, (_, i) => ({
      id: crypto.randomUUID(),
      gender: gender.value,
      capacity: maxCapacity.value,
      teacherStrengthScore: teacherStrengths.value[i] ?? 3,
    }))

    const engine = new GroupingEngine(createAllGroupingRules())
    const { groups } = engine.run(targetStudents.value, setups, ruleConfigs.value)

    resultGroups.value = groups.map((g, i) => ({
      id: g.id,
      title: `پایه ${gradeLabel(grade.value)} - گروه ${i + 1}`,
      studentIds: [...g.studentIds],
    }))

    phase.value = 'result'
  } finally {
    isGenerating.value = false
  }
}

function studentOf(id: string): Student | undefined {
  return studentsStore.byId(id)
}

function groupStats(group: { studentIds: string[] }) {
  const students = group.studentIds.map((id) => studentOf(id)).filter((s): s is Student => !!s)
  const gpas = students.map((s) => s.gpa).filter((v): v is number => v !== null)
  const disciplines = students.map((s) => s.disciplineScore).filter((v): v is number => v !== null)
  return {
    count: students.length,
    avgGpa: gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(1) : '-',
    avgDiscipline: disciplines.length ? (disciplines.reduce((a, b) => a + b, 0) / disciplines.length).toFixed(1) : '-',
    weakCount: students.filter((s) => s.isAcademicallyWeak).length,
    disruptiveCount: students.filter((s) => s.isDisruptive).length,
  }
}

const draggedStudentId = ref<string | null>(null)
const draggedFromGroupIndex = ref<number | null>(null)

function onDragStart(studentId: string, groupIndex: number): void {
  draggedStudentId.value = studentId
  draggedFromGroupIndex.value = groupIndex
}

function onDropToGroup(targetIndex: number): void {
  if (draggedStudentId.value === null || draggedFromGroupIndex.value === null) return
  const fromIndex = draggedFromGroupIndex.value
  const studentId = draggedStudentId.value
  if (fromIndex === targetIndex) return

  resultGroups.value[fromIndex].studentIds = resultGroups.value[fromIndex].studentIds.filter((id) => id !== studentId)
  resultGroups.value[targetIndex].studentIds.push(studentId)
  draggedStudentId.value = null
  draggedFromGroupIndex.value = null
}

const saveMessage = ref('')

async function saveResult(): Promise<void> {
  const now = Date.now()
  const groupsToSave: StudentGroup[] = resultGroups.value.map((g, i) => ({
    id: g.id,
    title: g.title,
    grade: grade.value,
    levelId: levelId.value,
    gender: gender.value,
    capacity: maxCapacity.value,
    teacherId: null,
    teacherStrengthScore: teacherStrengths.value[i] ?? 3,
    studentIds: g.studentIds,
    createdAt: now,
    updatedAt: now,
  }))

  await studentGroupsStore.saveGroups(groupsToSave)

  for (const group of groupsToSave) {
    for (const studentId of group.studentIds) {
      const student = studentsStore.byId(studentId)
      if (student) await studentsStore.updateStudent({ ...student, currentGroupId: group.id })
    }
  }

  saveMessage.value = 'گروه‌ها با موفقیت ذخیره شدند.'
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 pb-20 sm:pb-16">
    <AppHeader />

    <div class="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <h1 class="mb-6 text-xl font-bold text-ink-900 dark:text-ink-50">گروه‌بندی عادلانه دانش‌آموزان</h1>

      <div v-if="phase === 'setup'" class="space-y-4">
        <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">دوره تحصیلی</label>
              <select v-model="levelId" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
                <option v-for="l in LEVELS" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">پایه</label>
              <select v-model.number="grade" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
                <option v-for="g in getLevelById(levelId)?.grades ?? []" :key="g" :value="g">پایه {{ gradeLabel(g) }}</option>
              </select>
            </div>
            <div v-if="gendersPresent.length > 1">
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">جنسیت هدف</label>
              <select v-model="gender" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100">
                <option value="male">پسر</option>
                <option value="female">دختر</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">تعداد گروه‌ها</label>
              <input v-model.number="groupCount" type="number" min="2" max="8" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">حداکثر ظرفیت هر گروه</label>
              <input v-model.number="maxCapacity" type="number" min="5" max="45" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
            </div>
          </div>

          <p class="mt-4 mb-2 text-xs font-medium text-ink-600 dark:text-ink-300">امتیاز قدرت معلم هر گروه (۱ ضعیف‌تر تا ۵ باتجربه‌تر)</p>
          <div class="flex flex-wrap gap-3">
            <div v-for="(_, i) in teacherStrengths" :key="i" class="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 dark:border-ink-700">
              <span class="text-xs text-ink-500 dark:text-ink-400">گروه {{ i + 1 }}</span>
              <input v-model.number="teacherStrengths[i]" type="number" min="1" max="5" class="w-12 rounded border border-ink-200 bg-white px-1 py-0.5 text-xs text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100" />
            </div>
          </div>

          <p class="mt-4 text-xs text-ink-400 dark:text-ink-500">{{ targetStudents.length }} دانش‌آموز واجد شرایط برای این پایه/جنسیت یافت شد.</p>
        </div>

        <button type="button" class="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700" @click="goToRules">
          مرحله بعد: بازبینی قوانین
        </button>
      </div>

      <div v-else-if="phase === 'rules'" class="space-y-4">
        <GroupingRulesPanel v-model="ruleConfigs" />
        <div class="flex items-center justify-between">
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="goBackToSetup">مرحله قبل</button>
          <button
            type="button"
            class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            :disabled="isGenerating || !targetStudents.length"
            @click="runGrouping"
          >
            {{ isGenerating ? 'در حال گروه‌بندی…' : 'ساخت گروه‌ها' }}
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="(group, index) in resultGroups"
            :key="group.id"
            class="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
            @dragover.prevent
            @drop="onDropToGroup(index)"
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ group.title }}</p>
              <span class="text-[11px] text-ink-400 dark:text-ink-500">{{ groupStats(group).count }} / {{ maxCapacity }} نفر</span>
            </div>
            <div class="mb-3 grid grid-cols-2 gap-2 text-[11px] text-ink-500 dark:text-ink-400">
              <span>میانگین معدل: {{ groupStats(group).avgGpa }}</span>
              <span>میانگین انضباط: {{ groupStats(group).avgDiscipline }}</span>
              <span>ضعیف علمی: {{ groupStats(group).weakCount }}</span>
              <span>بی‌انضباط: {{ groupStats(group).disruptiveCount }}</span>
            </div>
            <div class="min-h-[80px] space-y-1.5 rounded-xl border border-dashed border-ink-100 p-2 dark:border-ink-800">
              <div
                v-for="studentId in group.studentIds"
                :key="studentId"
                draggable="true"
                class="flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                @dragstart="onDragStart(studentId, index)"
              >
                <span>{{ studentOf(studentId)?.firstName }} {{ studentOf(studentId)?.lastName }}</span>
                <span v-if="studentOf(studentId)?.isAcademicallyWeak" class="text-[10px] text-amber-500">ض</span>
                <span v-if="studentOf(studentId)?.isDisruptive" class="text-[10px] text-red-500">ب</span>
              </div>
            </div>
          </div>
        </div>

        <p class="text-xs text-ink-400 dark:text-ink-500">برای جابجایی دستی، یک دانش‌آموز را بکشید و روی کارت گروه مقصد رها کنید.</p>

        <div class="flex items-center gap-3">
          <button type="button" class="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300" @click="phase = 'rules'">
            بازگشت و ساخت مجدد
          </button>
          <button type="button" class="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" @click="saveResult">
            ذخیره گروه‌ها
          </button>
          <span v-if="saveMessage" class="text-xs text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
