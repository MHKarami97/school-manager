import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/ContactView.vue'),
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
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
