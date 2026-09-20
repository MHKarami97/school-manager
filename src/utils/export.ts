import { toPng } from 'html-to-image'

function releaseScrollableOverflow(root: HTMLElement): () => void {
  const scrollables = Array.from(root.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const style = window.getComputedStyle(el)
    return ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY)
  })

  const originalOverflow = scrollables.map((el) => el.style.overflow)
  scrollables.forEach((el) => {
    el.style.overflow = 'visible'
  })

  return () => {
    scrollables.forEach((el, index) => {
      el.style.overflow = originalOverflow[index]
    })
  }
}

/**
 * خروجی تصویر (PNG) از یک المنت DOM. قبل از کپی، تمام المنت‌های دارای اسکرول داخلی
 * (مثل جدول برنامه که روی موبایل اسکرول افقی می‌u06afیرد) موقتاً overflow:visible می‌شوند و ابعاد
 * واقعی محتوا (scrollWidth/scrollHeight) به toPng داده می‌شود تا تصویر خروجی هیچ
 * اسکرول‌باری نداشته باشد و کل جدول دیده شود.
 */
export async function exportElementAsImage(element: HTMLElement, fileName: string): Promise<void> {
  const restoreOverflow = releaseScrollableOverflow(element)

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      width: element.scrollWidth,
      height: element.scrollHeight,
    })
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${fileName}.png`
    link.click()
  } finally {
    restoreOverflow()
  }
}

export function printPage(): void {
  window.print()
}
