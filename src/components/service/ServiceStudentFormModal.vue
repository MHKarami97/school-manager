<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { GeoPoint, ServiceStudentProfile } from '@/types'
import StudentProfileModal from '@/components/attendance/StudentProfileModal.vue'
import { useClassroomsStore } from '@/stores/classrooms'
import { useServiceStudentsStore } from '@/stores/service-students'
import { labelledPhonesOf } from '@/utils/attendance-domain'
import { ServiceDomainError } from '@/utils/service-domain'
import AddressFields from './AddressFields.vue'

const LocationPickerModal = defineAsyncComponent(() => import('./LocationPickerModal.vue'))

const props = defineProps<{ modelValue: boolean; studentId: string; studentName: string; regionSuggestions: string[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const serviceStudents = useServiceStudentsStore()
const classroomsStore = useClassroomsStore()

const form = ref<ServiceStudentProfile | null>(null)
const errorMessage = ref('')
const isPickerOpen = ref(false)
const isContactOpen = ref(false)

const phones = computed(() => labelledPhonesOf(classroomsStore.profiles[props.studentId]))

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    errorMessage.value = ''
    form.value = serviceStudents.draftFor(props.studentId)
    await classroomsStore.loadProfiles([props.studentId])
  },
)

function close(): void {
  emit('update:modelValue', false)
}

function onLocation(point: GeoPoint | null): void {
  if (form.value) form.value.location = point
}

async function submit(): Promise<void> {
  if (!form.value) return
  errorMessage.value = ''
  try {
    await serviceStudents.save(form.value)
    emit('saved')
    close()
  } catch (error) {
    errorMessage.value = error instanceof ServiceDomainError ? error.message : 'ذخیره انجام نشد.'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && form" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4" @click.self="close">
      <form class="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="svc-student-title" @submit.prevent="submit">
        <p id="svc-student-title" class="mb-1 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات سرویس - {{ studentName }}</p>
        <p class="mb-4 text-xs text-ink-500 dark:text-ink-400">همه‌ی فیلدهای آدرس اختیاری‌اند.</p>

        <div class="mb-4 rounded-xl bg-ink-50 p-3 text-xs dark:bg-ink-800">
          <p class="mb-1 font-medium text-ink-700 dark:text-ink-200">شماره‌ی والدین</p>
          <p v-if="!phones.length" class="text-amber-700 dark:text-amber-300">⚠ ثبت نشده است.</p>
          <p v-for="item in phones" :key="item.phone" class="text-ink-600 dark:text-ink-300" dir="ltr">{{ item.phone }} ({{ item.relation }})</p>
          <button type="button" class="mt-1 min-h-11 text-xs font-medium text-brand-600 dark:text-brand-400" @click="isContactOpen = true">ویرایش اطلاعات تماس والدین</button>
        </div>

        <AddressFields v-model="form.address" :region-suggestions="regionSuggestions" id-prefix="svc-edit" />

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="isPickerOpen = true">
            📍 {{ form.location ? 'تغییر موقعیت روی نقشه' : 'انتخاب موقعیت از نقشه' }}
          </button>
          <span v-if="form.location" class="text-11px text-ink-500" dir="ltr">{{ form.location.lat.toFixed(5) }}, {{ form.location.lng.toFixed(5) }}</span>
        </div>

        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="svc-pickup">ساعت سوار شدن (اختیاری)</label>
            <input id="svc-pickup" v-model="form.pickupTime" type="time" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="svc-receiver">تحویل‌گیرنده (اگر والدین نیستند)</label>
            <input id="svc-receiver" v-model="form.receiverName" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="svc-receiver-phone">شماره‌ی تحویل‌گیرنده</label>
            <input id="svc-receiver-phone" v-model="form.receiverPhone" type="tel" inputmode="tel" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="svc-return">آدرس برگشت (اگر متفاوت است)</label>
            <input id="svc-return" v-model="form.returnAddressNote" type="text" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="svc-note">یادداشت</label>
            <textarea id="svc-note" v-model="form.note" rows="2" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"></textarea>
          </div>
        </div>

        <p v-if="errorMessage" class="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">{{ errorMessage }}</p>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="submit" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700">ذخیره</button>
        </div>
      </form>
    </div>
  </Teleport>
  <LocationPickerModal v-if="form" v-model="isPickerOpen" :point="form.location" :title="`موقعیت ${studentName}`" @save="onLocation" />
  <StudentProfileModal v-model="isContactOpen" :student-id="studentId" :student-name="studentName" @saved="classroomsStore.loadProfiles([studentId])" />
</template>
