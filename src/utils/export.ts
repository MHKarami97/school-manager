import { toPng } from 'html-to-image'

/**
 * خروجی تصویر (PNG) از یک المنت DOM؛ برای گرفتن عکس از جدول برنامه استفاده می‌شود.
 * pixelRatio بالاتر برای وضوح بهتر در چاپ/اشتراک‌گذاری تصویر است.
 */
export async function exportElementAsImage(element: HTMLElement, fileName: string): Promise<void> {
  const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${fileName}.png`
  link.click()
}

/**
 * خروجی PDF از طریق دیالوگ چاپ خود مرورگر (کاربر می‌تواند «ذخیره به‌صورت PDF» را انتخاب کند).
 * استایل‌دهی چاپ در PrintableSchedule.vue و کلاس‌های print:hidden/print:block در style.css مدیریت می‌شود.
 */
export function printPage(): void {
  window.print()
}
