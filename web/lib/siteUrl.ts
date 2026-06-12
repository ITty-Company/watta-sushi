/** Публічний URL сайту (SEO, preconnect). На Render задайте NEXT_PUBLIC_SITE_URL. */
export function getPublicSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '')
}

export function getPublicSiteOrigin(): string | null {
  const url = getPublicSiteUrl()
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}
