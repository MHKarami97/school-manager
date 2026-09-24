<script setup lang="ts">
import { computed } from "vue";
import { useWizardStore } from "@/stores/wizard";
import { getCurriculumForGrade } from "@/config/curriculum.config";
import { buildBellSchedule } from "@/config/schedule-defaults.config";
import { gradeLabel } from "@/config/levels.config";
import { WEEK_DAYS } from "@/types";
import type { RuleToggles, LessonCell } from "@/types";
import { partialExemptGrades } from "@/utils/schedule-feasibility";

const wizard = useWizardStore();

const isElementary = computed(() => wizard.levelId === "elementary");

const ruleItems: {
  key: keyof RuleToggles;
  label: string;
  onlyElementary?: boolean;
}[] = [
  {
    key: "noSameDayRepeat",
    label: "هیچ درسی در یک روز تکرار نمی‌شود (قانون عرضی)",
  },
  {
    key: "noSameColumnRepeat",
    label: "هیچ درسی در یک شماره‌زنگ ثابت هفته تکرار نمی‌شود (قانون طولی)",
  },
  {
    key: "quranAlwaysFirstPeriod",
    label: "قرآن/دینی همیشه در زنگ اول قرار می‌گیرد",
  },
  {
    key: "persianWritingAdjacency",
    label: "انشا/املا بلافاصله بعد از فارسی می‌آید (فقط ابتدایی)",
    onlyElementary: true,
  },
];

const visibleRuleItems = computed(() =>
  ruleItems.filter((r) => !r.onlyElementary || isElementary.value),
);

const exemptGradesInMix = computed(() =>
  partialExemptGrades(wizard.levelId, wizard.selectedGrades),
);

function toggleRule(key: keyof RuleToggles): void {
  wizard.setRuleToggle(key, !wizard.ruleToggles[key]);
}

const bellSchedule = computed(() =>
  buildBellSchedule(wizard.shiftConfigs[wizard.shiftId]).filter(
    (p) => p.type === "lesson",
  ),
);

function gradeHasSport(grade: number): boolean {
  if (!wizard.levelId) return false;
  return (getCurriculumForGrade(wizard.levelId, grade).sport ?? 0) > 0;
}

function sportHours(grade: number): number {
  if (!wizard.levelId) return 0;
  return getCurriculumForGrade(wizard.levelId, grade).sport ?? 0;
}

const sportGrades = computed(() =>
  wizard.selectedGrades.filter((g) => gradeHasSport(g)),
);

function isSportCell(grade: number, day: number, period: number): boolean {
  return (wizard.lockedSportCells[grade] ?? []).some(
    (c) => c.dayIndex === day && c.periodIndex === period,
  );
}

function toggleSportCell(grade: number, day: number, period: number): void {
  const current = wizard.lockedSportCells[grade] ?? [];
  const exists = current.some(
    (c) => c.dayIndex === day && c.periodIndex === period,
  );
  if (exists) {
    wizard.setLockedSportCells(
      grade,
      current.filter((c) => !(c.dayIndex === day && c.periodIndex === period)),
    );
    return;
  }
  if (current.length >= sportHours(grade)) return;
  const newCell: LessonCell = {
    dayIndex: day,
    periodIndex: period,
    courseId: "sport",
    teacherId: null,
  };
  wizard.setLockedSportCells(grade, [...current, newCell]);
}

function clearSportCells(grade: number): void {
  wizard.setLockedSportCells(grade, []);
}
</script>

<template>
  <div class="space-y-5">
    <div
      class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
    >
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">
        قوانین چیدمان برنامه
      </p>
      <div class="space-y-3">
        <div
          v-for="rule in visibleRuleItems"
          :key="rule.key"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-xs text-ink-600 dark:text-ink-300">{{
            rule.label
          }}</span>
          <button
            type="button"
            class="relative h-6 w-11 shrink-0 rounded-full transition"
            :class="
              wizard.ruleToggles[rule.key]
                ? 'bg-brand-600'
                : 'bg-ink-200 dark:bg-ink-700'
            "
            :aria-pressed="wizard.ruleToggles[rule.key]"
            @click="toggleRule(rule.key)"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :style="{ right: wizard.ruleToggles[rule.key] ? '2px' : '22px' }"
            ></span>
          </button>
        </div>
      </div>

      <p class="mt-4 text-xs leading-6 text-ink-400 dark:text-ink-500">
        همچنین: درس ورزش با استثنا می‌تواند طبق زمان دلخواهی که پایین همین صفحه
        مشخص می‌کنید پشت‌سرهم باشد؛ و در پایه‌های سوم، چهارم و پنجم برخی دروس
        («تک‌زنگ») یک زنگ مشترک دارند که موتور خودکار مدیریت می‌کند.
      </p>

      <div
        v-if="wizard.hasCustomizedRules"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      >
        شما یکی از قوانین پیش‌فرض را قیرفعال کرده‌اید؛ ممکن است برنامه ساخته‌شده
        دیگر کاملاً «معتبر» (مطابق قوانین رسمی) نباشد.
      </div>
    </div>

    <div
      v-if="exemptGradesInMix.length"
      class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300"
    >
      برای پایه{{ exemptGradesInMix.length > 1 ? "‌های" : "‌ی" }}
      {{ exemptGradesInMix.map((g) => gradeLabel(g)).join("، ") }}
      این دو قانون به‌صورت خودکار در چیدمان نادیده گرفته می‌شود؛ برای بقیه
      پایه‌های انتخاب‌شده طبق همین تنظیم شما اعمال می‌گردد.
    </div>

    <div
      v-if="isElementary && sportGrades.length"
      class="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
    >
      <p class="mb-3 text-sm font-semibold text-ink-800 dark:text-ink-200">
        زمان‌بندی دلخواه ورزش (اختیاری)
      </p>
      <p class="mb-4 text-xs text-ink-500 dark:text-ink-400">
        اگر مشخص نکنید، موتور خودش برای ورزش هم مثل باقی درس‌ها جای مناسب پیدا
        می‌کند. با کلیک روی خانه‌ها، دقیقاً به تعداد ساعت هفتگی ورزش همان پایه
        انتخاب کنید (مثلاً دو زنگ پشت‌سرهم در یک روز).
      </p>

      <div v-for="grade in sportGrades" :key="grade" class="mb-5 last:mb-0">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-xs font-semibold text-ink-700 dark:text-ink-200">
            پایه {{ gradeLabel(grade) }} -
            {{ (wizard.lockedSportCells[grade] ?? []).length }} از
            {{ sportHours(grade) }} انتخاب‌شده
          </p>
          <button
            type="button"
            class="text-[11px] text-ink-400 hover:text-red-500 dark:text-ink-500"
            @click="clearSportCells(grade)"
          >
            پاک کردن
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[420px] border-collapse text-[11px]">
            <thead>
              <tr>
                <th
                  class="border border-ink-100 bg-ink-50 p-1 dark:border-ink-800 dark:bg-ink-800"
                ></th>
                <th
                  v-for="day in WEEK_DAYS"
                  :key="day"
                  class="border border-ink-100 bg-ink-50 p-1 text-ink-600 dark:border-ink-800 dark:bg-ink-800 dark:text-ink-300"
                >
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in bellSchedule" :key="p.index">
                <td
                  class="border border-ink-100 p-1 text-center text-ink-400 dark:border-ink-800 dark:text-ink-500"
                >
                  {{ p.index }}
                </td>
                <td
                  v-for="(day, dayIndex) in WEEK_DAYS"
                  :key="day"
                  class="border border-ink-100 p-1 text-center dark:border-ink-800"
                >
                  <button
                    type="button"
                    class="h-6 w-full rounded"
                    :class="
                      isSportCell(grade, dayIndex, p.index - 1)
                        ? 'bg-red-500'
                        : 'bg-ink-50 hover:bg-red-50 dark:bg-ink-800 dark:hover:bg-red-500/10'
                    "
                    @click="toggleSportCell(grade, dayIndex, p.index - 1)"
                  ></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
