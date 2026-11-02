<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      role="status"
      class="fixed inset-x-0 bottom-16 sm:bottom-0 z-40 bg-amber-500 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
    >
      <div class="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold">
        <div class="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="w-4 h-4 shrink-0">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M2 2l20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="leading-relaxed truncate sm:whitespace-normal">{{ store.failureBarMessage }}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            :disabled="isRetrying"
            class="px-3 py-1 rounded-lg bg-white text-amber-700 font-bold hover:bg-amber-50 transition-colors disabled:opacity-60"
            @click="retry"
          >
            {{ isRetrying ? 'در حال تلاش...' : 'تلاش دوباره' }}
          </button>
          <button type="button" class="p-1 opacity-80 hover:opacity-100" title="بستن" @click="dismiss">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCloudSyncStore } from '@/stores/cloudSyncStore'

const store = useCloudSyncStore()

const dismissedKey = ref('')
const isRetrying = ref(false)

const currentKey = computed(() => `${store.snapshot.status}|${store.snapshot.lastError ?? ''}`)
const isVisible = computed(
  () => store.showFailureBar && dismissedKey.value !== currentKey.value
)

function dismiss() {
  dismissedKey.value = currentKey.value
}

async function retry() {
  isRetrying.value = true
  try {
    await store.connect()
  } catch {
    // Error stays stored in store
  } finally {
    isRetrying.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
