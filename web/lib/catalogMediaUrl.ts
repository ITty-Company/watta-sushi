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
