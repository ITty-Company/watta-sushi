import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { productGalleryFromApi } from '@/lib/productGallery'
import { resolveUploadMediaUrl } from '@/lib/resolveUploadMediaUrl'

/** Тестові placeholder-URL — показуємо фірмовий плейсхолдер замість кольорових блоків. */
export function isGenericPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true
  const u = url.trim().toLowerCase()
  if (!u) return true
  return (
    /placehold\.(co|it)/.test(u) ||
    /via\.placeholder\.com/.test(u) ||
    /dummyimage\.com/.test(u) ||
    /picsum\.photos\/seed\/placeholder/.test(u)
  )
}

/** URL обкладинки товару для карток адмінки (з cache-bust після зміни каталогу). */
export function adminProductCoverSrc(p: {
  imageUrl?: string | null
  imageUrls?: unknown
}): string | null {
  const raw = productGalleryFromApi(p)[0]
  if (!raw) return null
  return resolveCatalogMediaUrl(raw) ?? resolveUploadMediaUrl(raw)
}

/** Превʼю в формі редагування (data URL або /uploads). */
export function adminProductPreviewSrc(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  return resolveCatalogMediaUrl(trimmed) ?? resolveUploadMediaUrl(trimmed) ?? trimmed
}

export function normalizeAdminProductRow<T extends { imageUrl?: string | null; imageUrls?: unknown }>(
  row: T,
): T & { imageUrl: string; imageUrls: string[] } {
  const gallery = productGalleryFromApi(row)
  return {
    ...row,
    imageUrl: gallery[0] ?? (row.imageUrl != null ? String(row.imageUrl) : ''),
    imageUrls: gallery,
  }
}
