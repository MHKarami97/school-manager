import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/tools",
    name: "tools",
    component: () => import("@/views/ToolsView.vue"),
  },
  {
    path: "/history",
    name: "history",
    component: () => import("@/views/HistoryView.vue"),
  },
  {
    path: "/guide",
    name: "guide",
    component: () => import("@/views/GuideView.vue"),
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/AboutView.vue"),
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("@/views/ContactView.vue"),
  },
  {
    path: "/wizard",
    name: "wizard",
    component: () => import("@/views/WizardView.vue"),
  },
  {
    path: "/schedules",
    name: "schedules",
    component: () => import("@/views/SavedSchedulesView.vue"),
  },
  {
    path: "/schedules/:id",
    name: "schedule-editor",
    component: () => import("@/views/ScheduleEditorView.vue"),
    props: true,
  },
  {
    path: "/students",
    name: "students",
    component: () => import("@/views/StudentsView.vue"),
  },
  {
    path: "/students/groups",
    name: "student-groups-list",
    component: () => import("@/views/StudentGroupsListView.vue"),
  },
  {
    path: "/students/grouping",
    name: "students-grouping",
    component: () => import("@/views/GroupingView.vue"),
  },
  {
    path: "/lesson-plans",
    name: "lesson-plans",
    component: () => import("@/views/LessonPlansView.vue"),
  },
  {
    path: "/lesson-plans/new",
    name: "lesson-plan-new",
    component: () => import("@/views/LessonPlanEditorView.vue"),
  },
  {
    path: "/lesson-plans/:id",
    name: "lesson-plan-editor",
    component: () => import("@/views/LessonPlanEditorView.vue"),
    props: true,
  },
  {
    path: "/sport",
    name: "sport-plans",
    component: () => import("@/views/SportPlansView.vue"),
  },
  {
    path: "/sport/new",
    name: "sport-wizard",
    component: () => import("@/views/SportWizardView.vue"),
  },
  {
    path: "/sport/:id",
    name: "sport-plan-editor",
    component: () => import("@/views/SportPlanEditorView.vue"),
    props: true,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0 };
  },
});

export default router;
