/** Скрол основного меню (`.content-web` у HomeClient) — hero, cinematic footer, секції. */

export function getMenuScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return (
    (el?.closest('.content-web') as HTMLElement | null) ??
    (document.querySelector('.content-web') as HTMLElement | null)
  )
}

export function scrollMenuToSelector(selector: string, offset = 20) {
  const scroller = getMenuScrollParent(null)
  const target = document.querySelector(selector)
  if (!scroller || !target) return
  const top =
    (target as HTMLElement).getBoundingClientRect().top + scroller.scrollTop - offset
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

export function scrollMenuToTop() {
  const scroller = getMenuScrollParent(null)
  scroller?.scrollTo({ top: 0, behavior: 'smooth' })
}
