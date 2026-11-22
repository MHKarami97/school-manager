import { onBeforeUnmount, onMounted } from 'vue'

const HEADER_SELECTOR = '.game-root header, .game-root [class~="sticky"]'

function measureTopInset(): number {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR)
  if (!header) return 0
  return Math.max(0, Math.round(header.getBoundingClientRect().bottom))
}

function measureBottomInset(): number {
  let inset = 0
  document.querySelectorAll<HTMLElement>('nav, [class~="fixed"]').forEach((element) => {
    const style = getComputedStyle(element)
    if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') return

    const rect = element.getBoundingClientRect()
    const isBottomBar =
      rect.height > 0 &&
      rect.height < window.innerHeight * 0.3 &&
      rect.top > window.innerHeight / 2 &&
      window.innerHeight - rect.bottom <= 2

    if (isBottomBar) inset = Math.max(inset, Math.round(window.innerHeight - rect.top))
  })
  return inset
}

/**
 * مقدار فضایی را که هدر بالا و منوی پایین موبایل اشغال کرده‌اند به‌صورت
 * --game-top و --game-bottom روی html می‌نویسد تا صفحه‌ی انتخاب مشخصات زیر آن‌ها نرود.
 */
export function useGameChromeInsets(): void {
  let frame = 0

  function apply(): void {
    frame = 0
    const root = document.documentElement
    root.style.setProperty('--game-top', `${measureTopInset()}px`)
    root.style.setProperty('--game-bottom', `${measureBottomInset()}px`)
  }

  function schedule(): void {
    if (frame === 0) frame = requestAnimationFrame(apply)
  }

  onMounted(() => {
    apply()
    window.setTimeout(apply, 300)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
  })

  onBeforeUnmount(() => {
    if (frame !== 0) cancelAnimationFrame(frame)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
    window.removeEventListener('scroll', schedule)
    const root = document.documentElement
    root.style.removeProperty('--game-top')
    root.style.removeProperty('--game-bottom')
  })
}
