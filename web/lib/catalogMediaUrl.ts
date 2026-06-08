import { getMenuCatalogCacheRev } from '@/lib/i18n/menuDataCacheBust'
import { resolveUploadMediaUrl } from '@/lib/resolveUploadMediaUrl'

/** Query `v` для обходу HTTP-кешу браузера після зміни фото в адмінці. */
export function withCatalogMediaCacheBust(
  url: string | null | undefined,
  rev?: string,
): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed

  const v = rev ?? getMenuCatalogCacheRev()
  if (!v || v === '0') return trimmed

  if (/[?&]v=/.test(trimmed)) {
    return trimmed.replace(/([?&])v=[^&]*/, `$1v=${encodeURIComponent(v)}`)
  }
  const sep = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${sep}v=${encodeURIComponent(v)}`
}

/** Абсолютний URL uploads + cache-bust за ревізією каталогу. */
export function resolveCatalogMediaUrl(url: string | null | undefined): string | null {
  const resolved = resolveUploadMediaUrl(url)
  if (!resolved) return null
  return withCatalogMediaCacheBust(resolved)
}

/** next/image — лише same-origin /uploads (placehold.co та інші зовнішні — raw <img>). */
export function isNextImageOptimizableCatalogUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false

  const pathname = (() => {
    if (trimmed.startsWith('/')) return trimmed.split('?')[0] ?? trimmed
    try {
      return new URL(trimmed).pathname
    } catch {
      return ''
    }
  })()

  if (!pathname.startsWith('/uploads/')) return false

  if (trimmed.startsWith('/')) return true

  try {
    const u = new URL(trimmed)
    if (typeof window !== 'undefined') return u.origin === window.location.origin
    return u.pathname.startsWith('/uploads/')
  } catch {
    return false
  }
}
