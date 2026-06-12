/** Домени без DNS — не використовуємо для metadataBase / preconnect. */
const UNRESOLVED_SITE_HOSTS = new Set(['wattasushi.com.ua', 'www.wattasushi.com.ua'])

function normalizeSiteUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  try {
    const host = new URL(trimmed).hostname.toLowerCase()
    if (UNRESOLVED_SITE_HOSTS.has(host)) return null
    return trimmed.replace(/\/$/, '')
  } catch {
    return null
  }
}

/** Публічний URL сайту (SEO, preconnect). На Render: https://watta-sushi-web.onrender.com */
export function getPublicSiteUrl(): string | null {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.RENDER_EXTERNAL_URL)
  )
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
