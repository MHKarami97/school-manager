<script setup lang="ts">
import { ref, watch } from 'vue'
import { PARENT_RELATIONS } from '@/config/attendance.config'
import { useClassroomsStore } from '@/stores/classrooms'
import { AttendanceDomainError, type ProfileInput } from '@/utils/attendance-domain'

const props = defineProps<{ modelValue: boolean; studentId: string; studentName: string }>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const store = useClassroomsStore()
const form = ref<ProfileInput>({
  primaryPhone: '',
  primaryRelation: PARENT_RELATIONS[0],
  secondaryPhone: '',
  secondaryRelation: PARENT_RELATIONS[1],
  nfcSerial: '',
})
const guid = ref('')
const errorMessage = ref('')

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    errorMessage.value = ''
    await store.loadProfiles([props.studentId])
    const profile = store.profiles[props.studentId]
    guid.value = profile.guid
    form.value = {
      primaryPhone: profile.primaryParent.phone,
      primaryRelation: profile.primaryParent.relation || PARENT_RELATIONS[0],
      secondaryPhone: profile.secondaryParent?.phone ?? '',
      secondaryRelation: profile.secondaryParent?.relation || PARENT_RELATIONS[1],
      nfcSerial: profile.nfcSerial ?? '',
    }
  },
)

function close(): void {
  emit('update:modelValue', false)
}

async function submit(): Promise<void> {
  errorMessage.value = ''
  try {
    await store.saveProfile(props.studentId, form.value)
    emit('saved')
    close()
  } catch (error) {
    errorMessage.value = error instanceof AttendanceDomainError ? error.message : 'ذخیره انجام نشد.'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" @click.self="close">
      <form class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" @submit.prevent="submit">
        <p id="profile-modal-title" class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">اطلاعات تماس و شناسه - {{ studentName }}</p>

        <div class="mb-3 grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="p1-phone">شماره‌ی اصلی والدین</label>
            <input id="p1-phone" v-model="form.primaryPhone" type="tel" inputmode="tel" dir="ltr" placeholder="09123456789" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="p1-rel">نسبت</label>
            <select id="p1-rel" v-model="form.primaryRelation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>

        <div class="mb-3 grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="p2-phone">شماره‌ی دوم (اختیاری)</label>
            <input id="p2-phone" v-model="form.secondaryPhone" type="tel" inputmode="tel" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11 text-left" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="p2-rel">نسبت</label>
            <select id="p2-rel" v-model="form.secondaryRelation" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 min-h-11">
              <option v-for="item in PARENT_RELATIONS" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300" for="nfc-serial">شماره‌ی سریال تگ NFC (اختیاری، برای فاز ۲)</label>
        <input id="nfc-serial" v-model="form.nfcSerial" type="text" dir="ltr" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 mb-3 min-h-11 text-left" />

        <p class="mb-1 text-xs font-medium text-ink-600 dark:text-ink-300">شناسه‌ی یکتا (GUID)</p>
        <p class="mb-3 break-all rounded-lg bg-ink-50 px-3 py-2 text-left text-11px text-ink-500 dark:bg-ink-800 dark:text-ink-400" dir="ltr">{{ guid }}</p>

        <p v-if="errorMessage" class="mb-3 text-xs text-red-600 dark:text-red-400" role="alert">{{ errorMessage }}</p>

        <div class="flex justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg border border-ink-200 px-4 text-xs dark:border-ink-700 dark:text-ink-200" @click="close">انصراف</button>
          <button type="submit" class="min-h-11 rounded-lg bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-700">ذخیره</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
