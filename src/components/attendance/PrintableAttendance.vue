<script setup lang="ts">
import type { PrintPayload } from '@/types'

defineProps<{ payload: PrintPayload }>()

const generatedAt = new Date().toLocaleString('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
</script>

<template>
  <div class="attendance-print p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-start justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ payload.title }}</h1>
        <p class="text-xs text-ink-600">{{ payload.subtitle }}</p>
        <p v-if="payload.teacherName" class="text-xs text-ink-600">معلم: {{ payload.teacherName }}</p>
      </div>
      <p class="text-xs text-ink-500">تولید: {{ generatedAt }}</p>
    </div>

    <table v-if="payload.mode === 'summary'" class="w-full border-collapse text-11px">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1.5 w-8">ردیف</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">نام</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">حاضر</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">غایب</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">تأخیر</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">موجه</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">خروج</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">نرخ حضور</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in payload.summaryRows" :key="row.name + index" class="break-inside-avoid">
          <td class="border border-ink-400 p-1.5 text-center">{{ (index + 1).toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5">{{ row.name }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.present.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.absent.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.late.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.excused.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.exits.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.rateText }}</td>
        </tr>
        <tr v-if="!payload.summaryRows.length">
          <td colspan="8" class="border border-ink-400 p-1.5 p-3 text-center text-ink-400">داده‌ای ثبت نشده است.</td>
        </tr>
      </tbody>
      <tfoot v-if="payload.summaryTotals">
        <tr class="font-bold">
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center" colspan="2">جمع</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.present.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.absent.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.late.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.excused.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.exits.toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 bg-ink-100 p-1.5 text-center">{{ payload.summaryTotals.rateText }}</td>
        </tr>
      </tfoot>
    </table>

    <table v-else-if="payload.mode === 'absentees'" class="w-full border-collapse text-11px">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-1.5 w-8">ردیف</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">تاریخ</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">کلاس</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">نام</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">شماره‌ی والدین</th>
          <th class="border border-ink-400 bg-ink-100 p-1.5">پیگیری</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in payload.absenteeRows" :key="row.date + row.name + index" class="break-inside-avoid">
          <td class="border border-ink-400 p-1.5 text-center">{{ (index + 1).toLocaleString('fa-IR') }}</td>
          <td class="border border-ink-400 p-1.5 text-center">{{ row.date }}</td>
          <td class="border border-ink-400 p-1.5">{{ row.className }}</td>
          <td class="border border-ink-400 p-1.5">{{ row.name }}</td>
          <td class="border border-ink-400 p-1.5 text-center" dir="ltr">
            <span v-for="item in row.phones" :key="item.phone" class="block">{{ item.phone }} ({{ item.relation }})</span>
            <span v-if="!row.phones.length">—</span>
          </td>
          <td class="border border-ink-400 p-1.5">{{ row.followUpText }}<template v-if="row.note"> - {{ row.note }}</template></td>
        </tr>
        <tr v-if="!payload.absenteeRows.length">
          <td colspan="6" class="border border-ink-400 p-1.5 p-3 text-center text-ink-400">غایبی ثبت نشده است.</td>
        </tr>
      </tbody>
    </table>

    <template v-else>
      <table class="w-full border-collapse text-11px">
        <thead>
          <tr>
            <th class="border border-ink-400 bg-ink-100 p-1.5 w-8">ردیف</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">تاریخ</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">وضعیت</th>
            <th class="border border-ink-400 bg-ink-100 p-1.5">توضیح</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in payload.studentRows" :key="row.date + index" class="break-inside-avoid">
            <td class="border border-ink-400 p-1.5 text-center">{{ (index + 1).toLocaleString('fa-IR') }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ row.date }}</td>
            <td class="border border-ink-400 p-1.5 text-center">{{ row.statusText }}</td>
            <td class="border border-ink-400 p-1.5">{{ row.detail }}</td>
          </tr>
          <tr v-if="!payload.studentRows.length">
            <td colspan="4" class="border border-ink-400 p-1.5 p-3 text-center text-ink-400">داده‌ای ثبت نشده است.</td>
          </tr>
        </tbody>
      </table>
      <p v-if="payload.studentTotals" class="mt-3 text-xs">
        حاضر {{ payload.studentTotals.present.toLocaleString('fa-IR') }} - غایب {{ payload.studentTotals.absent.toLocaleString('fa-IR') }} —
        تأخیر {{ payload.studentTotals.late.toLocaleString('fa-IR') }} - موجه {{ payload.studentTotals.excused.toLocaleString('fa-IR') }} —
        خروج {{ payload.studentTotals.exits.toLocaleString('fa-IR') }} - نرخ حضور {{ payload.studentTotals.rateText }}
      </p>
    </template>

    <p class="mt-4 text-10px text-ink-400">school.mhkarami97.ir</p>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  .attendance-print thead {
    display: table-header-group;
  }
  .attendance-print tfoot {
    display: table-footer-group;
  }
}
</style>
