<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Teacher, SportFacility, SportSlot } from '@/types'
import { formatTeacherName } from '@/utils/teacher-format'
import { findTeacherConflict, teacherWeeklyLoad } from '@/utils/sport-scheduler'

const props = defineProps<{
  modelValue: boolean
  teacherId: string | null
  facilityId: string | null
  dayIndex: number
  periodIndex: number
  classId: string
  teachers: Teacher[]
  facilities: SportFacility[]
  allSlots: SportSlot[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', teacherId: string | null, facilityId: string | null): void
}>()

const selectedTeacherId = ref<string | null>(props.teacherId)
const selectedFacilityId = ref<string | null>(props.facilityId)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedTeacherId.value = props.teacherId
      selectedFacilityId.value = props.facilityId
    }
  },
)

const conflict = computed(() => {
  if (!selectedTeacherId.value) return null
  return findTeacherConflict(props.allSlots, selectedTeacherId.value, props.dayIndex, props.periodIndex, props.classId)
})

const weeklyLoad = computed(() => (selectedTeacherId.value ? teacherWeeklyLoad(props.allSlots, selectedTeacherId.value) : 0))
const selectedTeacher = computed(() => props.teachers.find((t) => t.id === selectedTeacherId.value) ?? null)
const isOverCapacity = computed(
  () => !!selectedTeacher.value?.maxWeeklyHours && weeklyLoad.value > selectedTeacher.value.maxWeeklyHours,
)

function close(): void {
  emit('update:modelValue', false)
}
function save(): void {
  emit('apply', selectedTeacherId.value, selectedFacilityId.value)
  close()
}
function clear(): void {
  emit('apply', null, null)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="close">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">تخصیص معلم و فضای ورزشی</p>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">معلم</label>
        <select
          v-model="selectedTeacherId"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option :value="null">- بدون معلم -</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ formatTeacherName(t) }}</option>
        </select>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">فضای ورزشی</label>
        <select
          v-model="selectedFacilityId"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          <option :value="null">- بدون فضای مشخص -</option>
          <option v-for="f in facilities" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>

        <div v-if="conflict" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-11px leading-5 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          تداخل: این معلم در همین روز/زنگ، در یک کلاس دیگر هم تخصیص دارد.
        </div>
        <div v-else-if="isOverCapacity" class="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-11px leading-5 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
          این معلم از سقف ساعت هفتگی‌اش ({{ selectedTeacher?.maxWeeklyHours }} ساعت) عبور کرده است.
        </div>

        <div class="mt-2 flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="clear">
            پاک کردن
          </button>
          <div class="flex gap-2">
            <button type="button" class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">
              انصراف
            </button>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white" @click="save">
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
