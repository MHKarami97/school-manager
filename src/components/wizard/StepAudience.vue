<script setup lang="ts">
import { useWizardStore } from '@/stores/wizard'
import type { Audience } from '@/types'

const wizard = useWizardStore()

function choose(audience: Audience): void {
  wizard.setAudience(audience)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        class="rounded-2xl border-2 p-6 text-right transition"
        :class="wizard.audience === 'self' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-200'"
        @click="choose('self')"
      >
        <p class="text-base font-semibold text-ink-800">برای خودم</p>
        <p class="mt-2 text-sm text-ink-500">من یک معلم هستم و می‌خواهم برنامه کلاس/پایه خودم را بچینم.</p>
      </button>
      <button
        type="button"
        class="rounded-2xl border-2 p-6 text-right transition"
        :class="wizard.audience === 'school' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-200'"
        @click="choose('school')"
      >
        <p class="text-base font-semibold text-ink-800">برای مدرسه</p>
        <p class="mt-2 text-sm text-ink-500">می‌خواهم برنامه هفتگی چند پایه یا کل مدرسه را بچینم.</p>
      </button>
    </div>

    <div v-if="wizard.audience === 'school'">
      <label class="mb-2 block text-sm font-medium text-ink-700">نام مدرسه</label>
      <input
        :value="wizard.schoolName"
        type="text"
        placeholder="مثلاً دبستان دخترانه فردوسی"
        class="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
        @input="wizard.setSchoolName(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
