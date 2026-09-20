<script setup lang="ts">
import { RouterView } from 'vue-router'
import UpdateToast from '@/components/UpdateToast.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
</script>

<template>
  <RouterView />
  <UpdateToast />
  <MobileBottomNav />
</template>
