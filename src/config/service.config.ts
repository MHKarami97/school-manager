import type { AssignMode, DriverGender, PaymentMethod, SeatLayout, VehicleKind } from '@/types'

export const VEHICLE_KINDS: VehicleKind[] = ['sedan', 'van', 'minibus', 'other']

export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  sedan: 'سواری',
  van: 'ون / وانت‌بار مسافربر',
  minibus: 'مینی‌بوس',
  other: 'سایر',
}

/** ظرفیت = تعداد صندلی دانش‌آموزی، بدون راننده. سواری: ۱ جلو + ۳ عقب = ۴. */
export const DEFAULT_SEAT_LAYOUTS: Record<VehicleKind, SeatLayout> = {
  sedan: { rows: [1, 3] },
  van: { rows: [1, 3, 3] },
  minibus: { rows: [2, 3, 3, 3, 3, 3, 3] },
  other: { rows: [1, 3] },
}

export const DEFAULT_VEHICLE_KIND: VehicleKind = 'sedan'
export const MAX_ROW_SEATS = 6
export const MAX_ROWS = 12
export const MAX_CAPACITY = 60

export const DRIVER_GENDERS: DriverGender[] = ['male', 'female']
export const DRIVER_GENDER_LABELS: Record<DriverGender, string> = { male: 'آقا', female: 'خانم' }

export const VEHICLE_COLORS: string[] = [
  'سفید',
  'مشکی',
  'نقره‌ای',
  'خاکستری',
  'سرمه‌ای',
  'آبی',
  'قرمز',
  'زرد',
  'سبز',
  'قهوه‌ای',
  'بژ',
]

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'other']
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقدی',
  card: 'کارت‌خوان',
  transfer: 'کارت‌به‌کارت / واریز',
  other: 'سایر',
}

export const ASSIGN_MODES: AssignMode[] = ['smart', 'region', 'location']
export const ASSIGN_MODE_LABELS: Record<AssignMode, string> = {
  smart: 'هوشمند (منطقه + نزدیکی روی نقشه)',
  region: 'فقط بر اساس منطقه',
  location: 'فقط بر اساس نزدیکی روی نقشه',
}

/** پایه‌ی ۱ تا ۶ (ابتدایی) = سن کم؛ صندلی جلو برایشان با رنگ زرد هشدار داده می‌شود (ممنوعیت نیست). */
export const YOUNG_MAX_GRADE = 6

export const PROVINCES: string[] = [
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'تهران',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد',
]

export const ACTIVE_PLAN_STORAGE_KEY = 'school-manager-service-active-plan'
export const LAST_PROVINCE_STORAGE_KEY = 'school-manager-service-last-province'
export const LAST_CITY_STORAGE_KEY = 'school-manager-service-last-city'
