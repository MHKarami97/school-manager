/**
 * چاپ با اندازه/جهت صفحه‌ی مشخص.
 * - @page کامپوننت‌های چاپی دیگر سراسری است؛ این <style> موقت آخر head می‌آید تا برنده شود.
 * - style.css پروژه برای html/body/#app ارتفاع ۱۰۰٪ می‌گذارد که هنگام چاپ محتوای بلندتر
 *   از یک صفحه را می‌بُرد؛ اینجا فقط برای زمان چاپ آزاد می‌شود.
 */
export function printWithPageSize(size: string, margin = '10mm'): void {
  const style = document.createElement('style')
  style.dataset.printPage = 'true'
  style.textContent = `
@media print {
  @page { size: ${size}; margin: ${margin}; }
  html, body, #app {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
}`
  document.head.appendChild(style)

  const cleanup = (): void => {
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
