/** Внутрішній href (pathname + query, без hash). */
export function normalizeInternalHref(href: string): string | null {
  if (!href || href.startsWith('//') || href.startsWith('http') || href.startsWith('mailto:')) {
    return null
  }
  if (!href.startsWith('/')) return null
  const withoutHash = href.split('#')[0]?.trim()
  return withoutHash && withoutHash.startsWith('/') ? withoutHash : null
}

/** Лише pathname — для порівнянь маршруту. */
export function normalizeInternalPath(href: string): string | null {
  const full = normalizeInternalHref(href)
  if (!full) return null
  return full.split('?')[0] || full
}
