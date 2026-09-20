import { toPersianDigits } from './persian-digits'

/** این المنت‌ها از تبدیل مستثنا هستند تا مقدار واقعی و قابل‌ویرایش آن‌ها (ساعت، شماره و...) دست‌نخورده بماند. */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'])

function convertTextNode(node: Text): void {
  const original = node.textContent
  if (!original) return
  const converted = toPersianDigits(original)
  if (converted !== original) node.textContent = converted
}

function walk(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    convertTextNode(node as Text)
    return
  }
  if (node.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has((node as Element).tagName)) {
    return
  }
  node.childNodes.forEach(walk)
}

/**
 * تمام اعداد لاتین رندرشده در DOM را به‌صورت خودکار و بدون نیاز به تفییر تک‌تک
 * کامپوننت‌ها به رقم فارسی تبدیل می‌کند (با MutationObserver روی کل درخت DOM).
 * چون فقط گره‌های متنی واقعی (Text Node) پردازش می‌شوند، مقدار input/textarea
 * (که به‌صورت property نگه‌داری می‌شود، نه Text Node) دست‌نخورده باقی می‌ماند و
 * منطق فرم‌ها/محاسبات خراب نمی‌شود.
 */
export function enablePersianDigitsAutoConversion(root: Element): () => void {
  walk(root)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        convertTextNode(mutation.target as Text)
      } else {
        mutation.addedNodes.forEach(walk)
      }
    }
  })

  observer.observe(root, { childList: true, subtree: true, characterData: true })
  return () => observer.disconnect()
}
