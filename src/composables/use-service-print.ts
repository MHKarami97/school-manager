import { nextTick, ref, shallowRef, type Component } from 'vue'
import type { SheetPayload } from '@/utils/service-print'
import { printPage } from '@/utils/export'

export function useServicePrint() {
  const payload = ref<SheetPayload | null>(null)
  const component = shallowRef<Component | null>(null)
  const isPrinting = ref(false)

  async function print(next: SheetPayload): Promise<void> {
    if (!component.value) {
      component.value = (await import('@/components/service/PrintableServiceSheet.vue')).default
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
