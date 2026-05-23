/** Скрол основного меню (`.content-web` на десктопі / body на телефоні). */

export type VerticalScrollTarget = Window | HTMLElement

export function normCategorySlug(s: string): string {
  const t = s.trim().toLowerCase()
  return t.length > 0 ? t : 'misc'
}

function isElementVerticallyScrollable(el: HTMLElement): boolean {
  const oy = getComputedStyle(el).overflowY
  if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false
  return el.scrollHeight > el.clientHeight + 2
}

/** Куди йде вертикальний скрол: внутрішній `.content-web` або window/body. */
export function getVerticalScrollTarget(): VerticalScrollTarget {
  if (typeof window === 'undefined') return window as unknown as VerticalScrollTarget
  const content =
    (document.querySelector('.content-web--watta-craft') as HTMLElement | null) ??
    (document.querySelector('.content-web') as HTMLElement | null)
  if (content && isElementVerticallyScrollable(content)) return content
  return window
}

export function readScrollTop(target: VerticalScrollTarget): number {
  if (target instanceof Window) return target.scrollY
  return target.scrollTop
}

export function writeScrollTop(
  target: VerticalScrollTarget,
  top: number,
  behavior: ScrollBehavior = 'auto',
) {
  const y = Math.max(0, top)
  if (target instanceof Window) {
    target.scrollTo({ top: y, left: 0, behavior })
    document.documentElement.scrollTop = y
    document.body.scrollTop = y
  } else {
    target.scrollTo({ top: y, left: 0, behavior })
  }
}

export function scrollElementWithChromeOffset(
  el: HTMLElement,
  headerOffset: number,
  behavior: ScrollBehavior = 'auto',
) {
  const target = getVerticalScrollTarget()
  const top = el.getBoundingClientRect().top + readScrollTop(target) - headerOffset
  writeScrollTop(target, top, behavior)
}

/** Повторні спроби, поки секція ще не змонтована (завантаження каталогу). */
export function runUntilScrollSuccess(
  tryScroll: () => boolean,
  delaysMs: number[] = [0, 32, 64, 120, 200, 350, 550, 800],
) {
  if (typeof window === 'undefined') return
  if (tryScroll()) return
  let i = 0
  const step = () => {
    if (tryScroll()) return
    i += 1
    if (i < delaysMs.length) window.setTimeout(step, delaysMs[i]!)
  }
  requestAnimationFrame(step)
}

/** Головна `/`: скрол до блоку категорії (window або `.content-web`). */
export function scrollHomeCatalogToCategory(slug: string): boolean {
  if (typeof document === 'undefined') return false
  const norm = normCategorySlug(slug)
  const el =
    document.getElementById(`home-menu-cat-${norm}`) ??
    document.getElementById(`home-menu-cat-${slug.trim()}`)
  if (!el) return false
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  const headerOffset = w <= 768 ? 148 : w <= 1024 ? 118 : 168
  scrollElementWithChromeOffset(el, headerOffset, 'auto')
  return true
}

/** @deprecated Використовуйте getVerticalScrollTarget — null означає window. */
export function getMenuScrollParent(el: HTMLElement | null): HTMLElement | null {
  const target = getVerticalScrollTarget()
  if (target instanceof Window) return el?.closest('.content-web') as HTMLElement | null
  return target
}

export function scrollMenuToSelector(selector: string, offset = 20) {
  const target = document.querySelector(selector)
  if (!target || !(target instanceof HTMLElement)) return
  scrollElementWithChromeOffset(target, offset, 'smooth')
}

export function scrollMenuToTop(behavior: ScrollBehavior = 'smooth') {
  writeScrollTop(getVerticalScrollTarget(), 0, behavior)
}

/**
 * Документ + усі `.content-web` (головна з height:100vh — скрол усередині контейнера, не window).
 * Викликати після зміни маршруту або вкладки, щоб зверху була початкова секція.
 */
export function scrollEntireAppToTop() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const reset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll<HTMLElement>('.content-web').forEach((el) => {
      el.scrollTop = 0
    })
  }
  reset()
  requestAnimationFrame(reset)
}
