/**
 * URL фото для каруселі товару: `imageUrls` з API або fallback на одне `imageUrl`.
 */
export function productGalleryFromApi(p: {
  imageUrl?: string | null
  imageUrls?: unknown
}): string[] {
  const raw = p.imageUrls
  if (Array.isArray(raw)) {
    const urls = raw.map((x) => (x == null ? '' : String(x).trim())).filter((s) => s.length > 0)
    if (urls.length > 0) return urls
  }
  if (p.imageUrl != null && String(p.imageUrl).trim() !== '') {
    return [String(p.imageUrl).trim()]
  }
  return []
}
