<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import UpdateToast from './components/UpdateToast.vue'
import MobileBottomNav from './components/MobileBottomNav.vue'
import SyncFailedBar from './components/common/SyncFailedBar.vue'
import CloudConflictModal from './components/cloud/CloudConflictModal.vue'
import { useCloudSyncStore } from './stores/cloudSyncStore'

const cloudSyncStore = useCloudSyncStore()

onMounted(() => {
  void cloudSyncStore.start()
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <SyncFailedBar />
  <CloudConflictModal />
  <UpdateToast />
  <MobileBottomNav />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>