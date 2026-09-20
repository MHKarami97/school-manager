<script setup lang="ts">
import { RouterView } from 'vue-router'
import UpdateToast from '@/components/UpdateToast.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <RouterView />
  <UpdateToast />
  <ThemeToggle />
</template>
