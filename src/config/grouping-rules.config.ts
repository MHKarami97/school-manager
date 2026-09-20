import type { GroupingRuleConfig } from '@/types'

/**
 * وزن و وضعیت پیش‌فرض هر قانون گروه‌بندی. این‌ها فقط پیش‌فرض هستند؛ کاربر در
 * صفحه بازبینی ویزارد گروه‌بندی می‌تواند هرکدام را فعال یا وزن آن را عوض کند
 * (وزن‌ها مستقیم در کد اصلی الگوریتم Hardcode نشده‌اند).
 */
export const DEFAULT_GROUPING_RULES: GroupingRuleConfig[] = [
  {
    ruleId: 'gender-separation',
    label: 'تفکیک جنسیتی',
    description: 'هیچ گروهی نباید دو جنسیت داشته باشد (قید سخت، همیشه رعایت می‌شود).',
    weight: 1000,
    enabled: true,
  },
  {
    ruleId: 'name-duplication',
    label: 'پرهیز از هم‌نامی در یک گروه',
    description: 'دانش‌آموزان با نام یا نام‌خانوادگی مشابه تا حد امکان در گروه‌های مختلف قرار می‌گیرند.',
    weight: 8,
    enabled: true,
  },
  {
    ruleId: 'gpa-balance',
    label: 'توازن معدل',
    description: 'میانگین معدل هر گروه تا حد امکان نزدیک به میانگین کل پایه نگه داشته می‌شود.',
    weight: 10,
    enabled: true,
  },
  {
    ruleId: 'discipline-balance',
    label: 'توازن انضباط',
    description: 'میانگین امتیاز انضباطی هر گروه تا حد امکان نزدیک به میانگین کل پایه نگه داشته می‌شود.',
    weight: 10,
    enabled: true,
  },
  {
    ruleId: 'weak-to-strong-teacher',
    label: 'تخصیص دانش‌آموز ضعیف/بی‌انضباط به معلم قوی‌تر',
    description: 'دانش‌آموزان با برچسب ضعیف علمی یا بی‌انضباط، در اولویت، به گروه‌هایی با امتیاز قدرت معلم بالاتر می‌روند.',
    weight: 12,
    enabled: true,
  },
  {
    ruleId: 'group-size-balance',
    label: 'توازن حجم گروه‌ها',
    description: 'اختلاف تعداد نفرات بین گروه‌ها حداکثر یک نفر نگه داشته می‌شود.',
    weight: 15,
    enabled: true,
  },
]

export function cloneDefaultGroupingRules(): GroupingRuleConfig[] {
  return JSON.parse(JSON.stringify(DEFAULT_GROUPING_RULES))
}
