import { onBeforeUnmount, ref } from 'vue'

export function useFlashMessage(durationMs = 3000) {
  const message = ref('')
  const isError = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(text: string, error = false): void {
    message.value = text
    isError.value = error
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
    }, durationMs)
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { message, isError, show }
}
