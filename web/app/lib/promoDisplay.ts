function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

/** Нормалізація галереї промо/новин з API (Prisma Json або legacy imageUrl) */
export function promoGalleryUrls(promo: {
  imageUrl?: string | null
  galleryUrls?: unknown
}): string[] {
  const g = parseJsonArray(promo.galleryUrls).filter((u): u is string => typeof u === 'string' && u.length > 0)
  if (g.length > 0) return g
  if (promo.imageUrl) return [promo.imageUrl]
  return []
}

export function promoCoverUrl(promo: { imageUrl?: string | null; galleryUrls?: unknown }): string | null {
  const urls = promoGalleryUrls(promo)
  return urls[0] || promo.imageUrl || null
}

export function promoTpl(template: string, vars: Record<string, string | number>): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v))
  }
  return s
}

export type PromoListItem = {
  id: number
  title: string
  description?: string | null
  content?: string | null
  imageUrl?: string | null
  galleryUrls?: unknown
  productOffers?: unknown
  isHit?: boolean
  createdAt?: string
  displayDate?: string
  categoryLabel?: string
  offerProducts?: unknown
  error?: string
}

/** Публічний список: лише валідні записи, без об’єктів помилки API */
export function normalizePromoList(data: unknown): PromoListItem[] {
  if (!Array.isArray(data)) return []
  const out: PromoListItem[] = []
  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    if ('error' in r) continue
    const id = Number(r.id)
    const title = typeof r.title === 'string' ? r.title.trim() : ''
    if (!Number.isFinite(id) || id < 1 || !title) continue
    out.push(row as PromoListItem)
  }
  return out
}

/** Кількість прив’язаних до новини акційних страв (з productOffers) */
export function promoProductOffersCount(productOffers: unknown): number {
  const rows = parseJsonArray(productOffers)
  let n = 0
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const id = Number((row as { productId?: unknown }).productId)
    if (Number.isFinite(id) && id >= 1) n++
  }
  return n
}
