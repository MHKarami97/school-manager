export interface JalaaliDate {
  jy: number
  jm: number
  jd: number
}

export const JALAALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

export const JALAALI_WEEKDAY_NAMES = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
]

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
]

function div(a: number, b: number): number {
  return ~~(a / b)
}
function mod(a: number, b: number): number {
  return a - ~~(a / b) * b
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0]
  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new RangeError(`Invalid Jalaali year ${jy}`)
  }
  let jump = 0
  let jm = 0
  for (let i = 1; i < bl; i += 1) {
    jm = BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

// Fliegel & Van Flandern — تبدیل میلادی به شماره‌ی روز ژولیَنی (JDN)
function g2d(gy: number, gm: number, gd: number): number {
  const a = div(gm - 14, 12)
  return (
    div(1461 * (gy + 4800 + a), 4) +
    div(367 * (gm - 2 - 12 * a), 12) -
    div(3 * div(gy + 4900 + a, 100), 4) +
    gd -
    32075
  )
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let l = jdn + 68569
  const n = div(4 * l, 146097)
  l = l - div(146097 * n + 3, 4)
  const i = div(4000 * (l + 1), 1461001)
  l = l - div(1461 * i, 4) + 31
  const j = div(80 * l, 2447)
  const gd = l - div(2447 * j, 80)
  l = div(j, 11)
  const gm = j + 2 - 12 * l
  const gy = 100 * (n - 49) + i + l
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): JalaaliDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(r.gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    const isLeap = r.leap === 1
    jy -= 1
    k += 179
    if (isLeap) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

/** تعداد روزهای یک ماه شمسی (۳۱ برای ۱-۶، ۳۰ برای ۷-۱۱، ۲۹ یا ۳۰ برای اسفند) */
export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return jalCal(jy).leap === 1 ? 30 : 29
}

export function toJalaali(gy: number, gm: number, gd: number): JalaaliDate {
  return d2j(g2d(gy, gm, gd))
}

export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd))
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** رشته‌ی ISO میلادی (yyyy-mm-dd) از روی تاریخ شمسی — برای ذخیره‌سازی سازگار با فرمت فعلی */
export function jalaaliToIsoString(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return `${gy}-${pad2(gm)}-${pad2(gd)}`
}

/** خواندن یک رشته‌ی ISO میلادی (yyyy-mm-dd) و تبدیل به تاریخ شمسی */
export function isoStringToJalaali(iso: string): JalaaliDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [, gy, gm, gd] = match
  return toJalaali(Number(gy), Number(gm), Number(gd))
}

/** فرمت نمایشی: ۱۴۰۳/۰۷/۰۵ */
export function formatJalaaliDate(date: JalaaliDate): string {
  return `${date.jy}/${pad2(date.jm)}/${pad2(date.jd)}`
}

export function todayJalaali(): JalaaliDate {
  const now = new Date()
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
}
