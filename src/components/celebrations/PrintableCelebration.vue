<script setup lang="ts">
import type { Celebration } from '../../types'
import { CELEBRATION_STATUS_LABELS, CELEBRATION_TASK_STATUS_LABELS } from '../../config/celebration.config'
import { jalaaliDateLabel } from '../../utils/celebration-helpers'

defineProps<{
  celebration: Celebration
}>()

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="celebration-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ celebration.title }}</h1>
        <p class="text-xs text-ink-600">
          {{ jalaaliDateLabel(celebration.date) }} - {{ celebration.location || '—' }} -
          {{ CELEBRATION_STATUS_LABELS[celebration.status] }}
        </p>
      </div>
      <p class="text-xs text-ink-500">{{ printDate }}</p>
    </div>

    <p class="mb-2 text-xs text-ink-600"><strong>مسئول برگزاری:</strong> {{ celebration.organizer || '—' }}</p>
    <p class="mb-4 text-xs text-ink-600">
      <strong>بودجه:</strong> تخمینی {{ celebration.budget.estimatedCost.toLocaleString('fa-IR') }} تومان -
      واقعی {{ celebration.budget.actualCost.toLocaleString('fa-IR') }} تومان
    </p>

    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="w-10 border border-ink-400 bg-ink-100 p-2">#</th>
          <th class="border border-ink-400 bg-ink-100 p-2">عنوان کار</th>
          <th class="border border-ink-400 bg-ink-100 p-2">مسئول</th>
          <th class="border border-ink-400 bg-ink-100 p-2">سررسید</th>
          <th class="border border-ink-400 bg-ink-100 p-2">وضعیت</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(task, index) in celebration.tasks" :key="task.id">
          <td class="border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
          <td class="border border-ink-400 p-2">{{ task.title }}</td>
          <td class="border border-ink-400 p-2">{{ task.assignee || '—' }}</td>
          <td class="border border-ink-400 p-2 text-center">{{ jalaaliDateLabel(task.dueDate) }}</td>
          <td class="border border-ink-400 p-2 text-center">{{ CELEBRATION_TASK_STATUS_LABELS[task.status] }}</td>
        </tr>
        <tr v-if="!celebration.tasks.length">
          <td colspan="5" class="border border-ink-400 p-4 text-center text-ink-400">کاری برای این جشن ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex items-center justify-between border-t border-ink-300 pt-3">
      <p class="text-10px text-ink-500">school.mhkarami97.ir</p>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
}
</style>
