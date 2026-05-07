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

export function scrollMenuToTop(behavior: ScrollBehavior = 'smooth') {
  const scroller = getMenuScrollParent(null)
  scroller?.scrollTo({ top: 0, left: 0, behavior })
}

/**
 * Документ + усі `.content-web` (головна з height:100vh — скрол усередині контейнера, не window).
 * Викликати після зміни маршруту або вкладки, щоб зверху була початкова секція.
 */
export function scrollEntireAppToTop() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const reset = () => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll<HTMLElement>('.content-web').forEach((el) => {
      el.scrollTop = 0
    })
  }
  reset()
  /* Другий кадр: дочірні useEffect інколи крутять скрол після батьківського useLayoutEffect */
  requestAnimationFrame(() => {
    requestAnimationFrame(reset)
  })
}
