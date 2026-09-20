const ASCII_TO_PERSIAN_DIGITS: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
}

/** تبدیل ارقام انگلیسی درون یک رشته به معادل فارسی؛ سایر کاراکترها دست‌نخورده می‌مانند. */
export function toPersianDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => ASCII_TO_PERSIAN_DIGITS[digit] ?? digit)
}
