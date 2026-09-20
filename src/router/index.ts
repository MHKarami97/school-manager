import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/wizard',
    name: 'wizard',
    component: () => import('@/views/WizardView.vue'),
  },
  {
    path: '/schedules',
    name: 'schedules',
    component: () => import('@/views/SavedSchedulesView.vue'),
  },
  {
    path: '/schedules/:id',
    name: 'schedule-editor',
    component: () => import('@/views/ScheduleEditorView.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
