<script setup lang="ts">
import type { GroupingRuleConfig } from '@/types'

const rules = defineModel<GroupingRuleConfig[]>({ required: true })

function toggleRule(ruleId: string): void {
  rules.value = rules.value.map((r) => (r.ruleId === ruleId ? { ...r, enabled: !r.enabled } : r))
}

function updateWeight(ruleId: string, value: number): void {
  rules.value = rules.value.map((r) => (r.ruleId === ruleId ? { ...r, weight: value } : r))
}
</script>

<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
    <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-100">قوانین گروه‌بندی</p>
    <div class="space-y-4">
      <div v-for="rule in rules" :key="rule.ruleId" class="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-ink-700 dark:text-ink-200">{{ rule.label }}</p>
            <p class="mt-0.5 text-[11px] leading-5 text-ink-400 dark:text-ink-500">{{ rule.description }}</p>
          </div>
          <button
            type="button"
            class="relative h-6 w-11 shrink-0 rounded-full transition"
            :class="[rule.enabled ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700', rule.ruleId === 'gender-separation' ? 'opacity-50' : '']"
            :disabled="rule.ruleId === 'gender-separation'"
            @click="rule.ruleId !== 'gender-separation' && toggleRule(rule.ruleId)"
          >
            <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" :style="{ right: rule.enabled ? '2px' : '22px' }"></span>
          </button>
        </div>
        <div v-if="rule.enabled && rule.ruleId !== 'gender-separation'" class="mt-3 flex items-center gap-3">
          <span class="text-[11px] text-ink-400 dark:text-ink-500">وزن</span>
          <input
            type="range"
            min="1"
            max="30"
            :value="rule.weight"
            class="flex-1"
            @input="updateWeight(rule.ruleId, Number(($event.target as HTMLInputElement).value))"
          />
          <span class="w-6 text-center text-[11px] text-ink-500 dark:text-ink-400">{{ rule.weight }}</span>
        </div>
      </div>
    </div>

    <div v-if="rules.some((r) => !r.enabled)" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      شما یکی از قوانین پیش‌فرض را قیرفعال کرده‌اید؛ نتیجه گروه‌بندی ممکن است دیگر کاملاً «عادلانه» طبق تعریف استاندارد نباشد.
    </div>
  </div>
</template>
