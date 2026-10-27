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
  {
    path: "/celebrations",
    name: "celebrations",
    component: () => import("../views/CelebrationsView.vue"),
  },
  {
    path: "/celebrations/new",
    name: "celebration-new",
    component: () => import("../views/CelebrationEditorView.vue"),
  },
  {
    path: "/celebrations/:id",
    name: "celebration-editor",
    component: () => import("../views/CelebrationEditorView.vue"),
    props: true,
  },
  {
    path: "/elections",
    name: "elections",
    component: () => import("../views/ElectionsView.vue"),
  },
  {
    path: "/elections/new",
    name: "election-new",
    component: () => import("../views/ElectionEditorView.vue"),
  },
  {
    path: "/elections/:id",
    name: "election-editor",
    component: () => import("../views/ElectionEditorView.vue"),
    props: true,
  },
  {
    path: "/extra-classes",
    name: "extra-classes",
    component: () => import("../views/ExtraClassesView.vue"),
  },
  {
    path: "/extra-classes/new",
    name: "extra-class-new",
    component: () => import("../views/ExtraClassEditorView.vue"),
  },
  {
    path: "/extra-classes/:id",
    name: "extra-class-editor",
    component: () => import("../views/ExtraClassEditorView.vue"),
    props: true,
  },
  {
    path: "/budget",
    name: "budget",
    component: () => import("../views/BudgetView.vue"),
  },
  {
    path: "/question-bank",
    name: "question-bank",
    component: () => import("../views/QuestionBankView.vue"),
  },
  {
    path: "/question-bank/new",
    name: "question-new",
    component: () => import("../views/QuestionEditorView.vue"),
  },
  {
    path: "/question-bank/:id",
    name: "question-editor",
    component: () => import("../views/QuestionEditorView.vue"),
    props: true,
  },
  {
    path: "/exams",
    name: "exams",
    component: () => import("../views/ExamsListView.vue"),
  },
  {
    path: "/exams/new",
    name: "exam-new",
    component: () => import("../views/ExamBuilderView.vue"),
  },
  {
    path: "/exams/:id",
    name: "exam-builder",
    component: () => import("../views/ExamBuilderView.vue"),
    props: true,
  },
  {
    path: "/invitations",
    name: "invitations",
    component: () => import("../views/InvitationsView.vue"),
  },
  {
    path: "/invitations/new",
    name: "invitation-new",
    component: () => import("../views/InvitationEditorView.vue"),
  },
  {
    path: "/invitations/:id",
    name: "invitation-editor",
    component: () => import("../views/InvitationEditorView.vue"),
    props: true,
  },
  {
    path: "/exam-seating",
    name: "exam-seating",
    component: () => import("../views/ExamSeatingView.vue"),
  },
  {
    path: "/exam-seating/rooms",
    name: "exam-rooms",
    component: () => import("../views/ExamRoomsView.vue"),
  },
  {
    path: "/exam-seating/new",
    name: "exam-seating-new",
    component: () => import("../views/ExamSeatingEditorView.vue"),
  },
  {
    path: "/exam-seating/:id",
    name: "exam-seating-editor",
    component: () => import("../views/ExamSeatingEditorView.vue"),
    props: true,
  },
  {
    path: "/teaching-plans",
    name: "teaching-plans",
    component: () => import("../views/TeachingPlansView.vue"),
  },
  {
    path: "/teaching-plans/teachers",
    name: "teacher-constraints",
    component: () => import("../views/TeacherConstraintsView.vue"),
  },
  {
    path: "/teaching-plans/new",
    name: "teaching-plan-new",
    component: () => import("../views/TeachingPlanEditorView.vue"),
  },
  {
    path: "/teaching-plans/:id",
    name: "teaching-plan-editor",
    component: () => import("../views/TeachingPlanEditorView.vue"),
    props: true,
  },
  {
    path: "/attendance",
    name: "attendance",
    component: () => import("@/views/AttendanceClassesView.vue"),
  },
  {
    path: "/attendance/principal",
    name: "attendance-principal",
    component: () => import("@/views/AttendancePrincipalView.vue"),
  },
  {
    path: "/attendance/absentees",
    name: "attendance-absentees",
    component: () => import("@/views/AttendanceAbsenteesView.vue"),
  },
  {
    path: "/attendance/reports",
    name: "attendance-reports",
    component: () => import("@/views/AttendanceReportsView.vue"),
  },
  {
    path: "/attendance/guide",
    name: "attendance-guide",
    component: () => import("@/views/AttendanceGuideView.vue"),
  },
  {
    path: "/attendance/classes/:id",
    name: "attendance-sheet",
    component: () => import("@/views/AttendanceSheetView.vue"),
    props: true,
  },
  {
    path: "/service",
    redirect: "/service/assign",
  },
  {
    path: "/service/drivers",
    name: "service-drivers",
    component: () => import("@/views/ServiceDriversView.vue"),
  },
  {
    path: "/service/students",
    name: "service-students",
    component: () => import("@/views/ServiceStudentsView.vue"),
  },
  {
    path: "/service/assign",
    name: "service-assign",
    component: () => import("@/views/ServiceAssignView.vue"),
  },
  {
    path: "/service/absentees",
    name: "service-absentees",
    component: () => import("@/views/ServiceAbsenteesView.vue"),
  },
  {
    path: "/service/payments",
    name: "service-payments",
    component: () => import("@/views/ServicePaymentsView.vue"),
  },
  {
    path: "/service/guide",
    name: "service-guide",
    component: () => import("@/views/ServiceGuideView.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/SettingsView.vue"),
  },
  {
    path: "/settings/data",
    name: "settings-data",
    component: () => import("@/views/DataManagerView.vue"),
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
