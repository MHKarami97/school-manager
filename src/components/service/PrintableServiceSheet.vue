<script setup lang="ts">
import type { SheetPayload } from '@/utils/service-print'

defineProps<{ payload: SheetPayload }>()

const generatedAt = new Date().toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="service-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-start justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ payload.title }}</h1>
        <p class="text-xs text-ink-600">{{ payload.subtitle }}</p>
      </div>
      <p class="text-xs text-ink-500">تولید: {{ generatedAt }}</p>
    </div>

    <section v-for="(section, index) in payload.sections" :key="section.title + index" class="service-section mb-6">
      <h2 class="text-sm font-bold">{{ section.title }}</h2>
      <p class="mb-2 text-11px text-ink-600">{{ section.subtitle }}</p>
      <table class="w-full border-collapse text-11px">
        <thead>
          <tr>
            <th class="border border-ink-400 bg-ink-100 p-1.5 w-8">ردیف</th>
            <th v-if="payload.mode === 'roster'" class="border border-ink-400 bg-ink-100 p-1.5">صندلی</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">دانش‌آموز</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">پایه</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">شماره‌ی والدین</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">آدرس</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">ساعت</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in section.rows" :key="row.name + rowIndex" class="break-inside-avoid">
            <td class="border border-ink-400 p-1.5 text-center">{{ (rowIndex + 1).toLocaleString('fa-IR') }}</td>
            <td v-if="payload.mode === 'roster'" class="border border-ink-400 p-1.5">{{ row.seat }}</td>
            <td class="border border-ink-400 p-1.5">{{ row.name }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ row.grade }}</td>
            <td class="border border-ink-400 p-1.5 text-center" dir="ltr">{{ row.phones || '—' }}</td>
            <td class="border border-ink-400 p-1.5">{{ row.address || '—' }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ row.pickup || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p v-if="!payload.sections.length" class="text-center text-xs text-ink-400">موردی برای نمایش نیست.</p>
    <p class="mt-4 text-10px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  .service-print thead {
    display: table-header-group;
  }
  .service-print .service-section {
    break-after: page;
  }
  .service-print .service-section:last-of-type {
    break-after: auto;
  }
}
</style>
