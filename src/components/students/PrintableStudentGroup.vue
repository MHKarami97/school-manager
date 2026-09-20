<script setup lang="ts">
import type { StudentGroup, Student } from '@/types'
import { gradeLabel } from '@/config/levels.config'

const props = defineProps<{
  group: StudentGroup
  students: Student[]
}>()

const printDate = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="p-6 text-ink-900" dir="rtl">
    <div class="mb-4 flex items-center justify-between border-b-2 border-ink-800 pb-3">
      <div>
        <h1 class="text-lg font-bold">{{ props.group.title }}</h1>
        <p class="text-xs text-ink-600">
          پایه {{ gradeLabel(props.group.grade) }} - {{ props.group.gender === 'female' ? 'دختر' : 'پسر' }} -
          {{ props.students.length }} نفر از ظرفیت {{ props.group.capacity }}
        </p>
      </div>
      <p class="text-xs text-ink-500">تاریخ چاپ: {{ printDate }}</p>
    </div>

    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="border border-ink-400 bg-ink-100 p-2 w-12">ردیف</th>
          <th class="border border-ink-400 bg-ink-100 p-2">نام</th>
          <th class="border border-ink-400 bg-ink-100 p-2">نام‌خانوادگی</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(student, index) in props.students" :key="student.id">
          <td class="border border-ink-400 p-2 text-center">{{ index + 1 }}</td>
          <td class="border border-ink-400 p-2">{{ student.firstName }}</td>
          <td class="border border-ink-400 p-2">{{ student.lastName }}</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex items-center justify-between border-t border-ink-300 pt-3">
      <p class="text-[10px] text-ink-500">مدیریار - سامانه مدیریت مدرسه</p>
      <p class="text-[10px] text-ink-400">school.mhkarami97.ir</p>
    </div>
  </div>
</template>
