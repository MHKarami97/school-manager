import { nextTick, ref, shallowRef, type Component } from 'vue'
import type { PrintPayload } from '@/types'
import { printPage } from '@/utils/export'

export function useAttendancePrint() {
  const payload = ref<PrintPayload | null>(null)
  const component = shallowRef<Component | null>(null)
  const isPrinting = ref(false)

  async function print(next: PrintPayload): Promise<void> {
    if (!component.value) {
      component.value = (await import('@/components/attendance/PrintableAttendance.vue')).default
    }
    payload.value = next
    isPrinting.value = true
    await nextTick()
    window.addEventListener(
      'afterprint',
      () => {
        isPrinting.value = false
        payload.value = null
      },
      { once: true },
    )
    printPage()
  }

  return { payload, component, isPrinting, print }
}
