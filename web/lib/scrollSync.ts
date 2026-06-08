import { readStickyChromeScrollOffset } from '@/lib/wattaChromeScroll'

type RafScrollListenerOptions = {
  /** Мінімальний інтервал між викликами fn (мс) — для телефону, щоб не ганяти layout кожен кадр. */
  minIntervalMs?: number
}

/** One callback per animation frame (coalesces scroll/resize bursts). */
export function createRafScrollListener(fn: () => void, options?: RafScrollListenerOptions) {
  let raf = 0
  let lastRun = 0
  const minIntervalMs = options?.minIntervalMs ?? 0
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      if (minIntervalMs > 0) {
        const now = performance.now()
        if (now - lastRun < minIntervalMs) return
        lastRun = now
      }
      fn()
    })
  }
  const cancel = () => {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
  return { onScroll, cancel }
}

/** Publish highlight slug only when it changes (avoids strip re-renders on every scroll tick). */
export function publishMenuCategoryHighlight(slug: string, lastSlugRef: { current: string }) {
  if (!slug || slug === lastSlugRef.current) return
  lastSlugRef.current = slug
  window.dispatchEvent(new CustomEvent('wattaMenuCategoryHighlight', { detail: { slug } }))
}

export type MenuScrollSection = { slug: string; el: HTMLElement }

export type ResolveActiveMenuCategoryOptions = {
  /** Лінія під fixed chrome (compact-aware). */
  anchorPx?: number
  catalogEl?: HTMLElement | null
  /** Slug, поки блок каталогу ще нижче anchor. */
  beforeCatalogSlug?: string
  catalogGapPx?: number
  /** Slug, поки заголовок першої секції ще не дійшов до anchor. */
  beforeFirstSectionSlug?: string
  firstSectionTopFudgePx?: number
}

/**
 * Активна категорія за положенням заголовків секцій — однаково коректно при скролі вниз і вгору.
 * Остання секція, чий top ≤ anchor, виграє (класичний scroll-spy).
 */
export function resolveActiveMenuCategoryFromScroll(
  sections: MenuScrollSection[],
  options: ResolveActiveMenuCategoryOptions = {},
): string | null {
  const anchor = options.anchorPx ?? readStickyChromeScrollOffset()
  const catalogGap = options.catalogGapPx ?? 24
  const firstFudge = options.firstSectionTopFudgePx ?? 8

  if (options.catalogEl && options.beforeCatalogSlug) {
    const catalogTop = options.catalogEl.getBoundingClientRect().top
    if (catalogTop > anchor + catalogGap) {
      return options.beforeCatalogSlug
    }
  }

  if (sections.length === 0) return null

  const firstTop = sections[0].el.getBoundingClientRect().top
  if (options.beforeFirstSectionSlug && firstTop > anchor - firstFudge) {
    return options.beforeFirstSectionSlug
  }

  let active = sections[0].slug
  for (const { slug, el } of sections) {
    if (el.getBoundingClientRect().top <= anchor) {
      active = slug
    }
  }
  return active
}
