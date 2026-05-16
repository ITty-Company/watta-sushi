/** One callback per animation frame (coalesces scroll/resize bursts). */
export function createRafScrollListener(fn: () => void) {
  let raf = 0
  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
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
