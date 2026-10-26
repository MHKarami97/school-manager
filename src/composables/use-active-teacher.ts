import { computed, ref, watch } from 'vue'
import { ACTIVE_TEACHER_STORAGE_KEY, ALL_TEACHERS } from '@/config/attendance.config'
import { useTeachersStore } from '@/stores/teachers'
import { formatTeacherName } from '@/utils/teacher-format'

const activeTeacherId = ref<string>(localStorage.getItem(ACTIVE_TEACHER_STORAGE_KEY) ?? ALL_TEACHERS)

watch(activeTeacherId, (value) => {
  localStorage.setItem(ACTIVE_TEACHER_STORAGE_KEY, value)
})

export function useActiveTeacher() {
  const teachersStore = useTeachersStore()

  function teacherNameOf(teacherId: string | null): string {
    if (!teacherId) return ''
    return formatTeacherName(teachersStore.byId(teacherId))
  }

  const activeTeacherName = computed(() => teacherNameOf(activeTeacherId.value || null))

  return { activeTeacherId, activeTeacherName, teacherNameOf }
}
