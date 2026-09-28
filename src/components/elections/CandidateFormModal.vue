<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Candidate } from '../../types'
import { readImageAsDataUrl } from '../../utils/election-helpers'

const props = defineProps<{
  modelValue: boolean
  candidate: Candidate | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', candidate: Candidate): void
  (e: 'delete', candidateId: string): void
}>()

const name = ref('')
const gradeOrClass = ref('')
const statement = ref('')
const photoDataUrl = ref<string | null>(null)
const isUploadingPhoto = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.candidate) {
      name.value = props.candidate.name
      gradeOrClass.value = props.candidate.gradeOrClass
      statement.value = props.candidate.statement
      photoDataUrl.value = props.candidate.photoDataUrl
    }
  },
)

async function onPhotoSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isUploadingPhoto.value = true
  try {
    photoDataUrl.value = await readImageAsDataUrl(file)
  } finally {
    isUploadingPhoto.value = false
  }
}

function removePhoto(): void {
  photoDataUrl.value = null
}

function close(): void {
  emit('update:modelValue', false)
}

function save(): void {
  if (!props.candidate || !name.value.trim()) return
  emit('save', {
    ...props.candidate,
    name: name.value.trim(),
    gradeOrClass: gradeOrClass.value.trim(),
    statement: statement.value.trim(),
    photoDataUrl: photoDataUrl.value,
  })
  close()
}

function removeCandidate(): void {
  if (!props.candidate) return
  emit('delete', props.candidate.id)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && candidate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="close"
    >
      <div class="max-h-90vh w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-ink-900">
        <p class="mb-4 text-sm font-semibold text-ink-800 dark:text-ink-200">ثبت‌نام نامزد</p>

        <div class="mb-4 flex items-center gap-3">
          <img v-if="photoDataUrl" :src="photoDataUrl" alt="" class="h-16 w-16 rounded-full object-cover" />
          <div
            v-else
            class="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-[8px] text-ink-400 dark:bg-ink-800 dark:text-ink-500"
          >
            بدون عکس
          </div>
          <div class="flex flex-col gap-1">
            <label class="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-11px font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300">
              {{ isUploadingPhoto ? 'در حال بارگذاری...' : 'انتخاب عکس' }}
              <input type="file" accept="image/*" class="hidden" @change="onPhotoSelected" />
            </label>
            <button v-if="photoDataUrl" type="button" class="text-11px text-red-600 dark:text-red-400" @click="removePhoto">
              حذف عکس
            </button>
          </div>
        </div>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">نام کامل نامزد</label>
        <input
          v-model="name"
          type="text"
          class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        />

        <template v-if="candidate.type === 'student'">
          <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">کلاس/پایه</label>
          <input
            v-model="gradeOrClass"
            type="text"
            placeholder="مثلاً: هفتم الف"
            class="mb-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          />
        </template>

        <label class="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">بیانیه / شعار انتخاباتی</label>
        <textarea
          v-model="statement"
          rows="3"
          placeholder="مثلاً: پیگیری کتابخانه و فعالیت‌های فرهنگی"
          class="mb-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        ></textarea>

        <div class="flex items-center justify-between gap-2">
          <button type="button" class="text-xs text-red-600 hover:underline dark:text-red-400" @click="removeCandidate">
            حذف نامزد
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-ink-200 px-4 py-2 text-xs dark:border-ink-700 dark:text-ink-200"
              @click="close"
            >
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
