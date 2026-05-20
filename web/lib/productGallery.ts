function normalizeGalleryUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (x == null ? '' : String(x).trim()))
      .filter((s) => s.length > 0 && !s.startsWith('data:') && !s.startsWith('blob:'))
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[')) {
      try {
        return normalizeGalleryUrls(JSON.parse(trimmed) as unknown)
      } catch {
        /* fall through */
      }
    }
    if (
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return [trimmed]
    }
  }
  return []
}

/**
 * URL фото для каруселі товару: `imageUrls` з API або fallback на одне `imageUrl`.
 */
export function productGalleryFromApi(p: {
  imageUrl?: string | null
  imageUrls?: unknown
}): string[] {
  const fromList = normalizeGalleryUrls(p.imageUrls)
  if (fromList.length > 0) return fromList
  const single =
    p.imageUrl != null ? String(p.imageUrl).trim() : ''
  if (
    single &&
    !single.startsWith('data:') &&
    !single.startsWith('blob:')
  ) {
    return [single]
  }
  return []
}

export function productHasGalleryImages(p: {
  imageUrl?: string | null
  imageUrls?: unknown
}): boolean {
  return productGalleryFromApi(p).length > 0
}
