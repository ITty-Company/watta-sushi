import { backendBaseUrl } from '@/lib/backendBaseUrl'

/** Шляхи, які в dev/prod віддає Next (public/ або rewrites), а не прямий Express origin. */
function isSameOriginMediaPath(pathname: string): boolean {
  return (
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/watta-') ||
    pathname.endsWith('.mp4') ||
    pathname.endsWith('.webm')
  )
}

/**
 * Абсолютні URL бекенду (127.0.0.1:5050, Render API) → відносний шлях для браузера.
 * Інакше Safari блокує fetch/video через Cross-Origin-Resource-Policy на Express (helmet).
 */
export function normalizeSameOriginMediaPath(url: string): string {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return trimmed
  try {
    const u = new URL(trimmed)
    const path = `${u.pathname}${u.search}${u.hash}`
    if (!isSameOriginMediaPath(u.pathname)) return trimmed
    if (typeof window !== 'undefined') return path
    const backend = backendBaseUrl()
    if (u.origin === backend || u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      return path
    }
    return trimmed
  } catch {
    return trimmed
  }
}

/** Для <video src> / <img src>: /uploads/* на проді йде напряму на Express API. */
export function resolveUploadMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  let trimmed = normalizeSameOriginMediaPath(url.trim())
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) {
    const pathname = trimmed.split('?')[0]?.split('#')[0] ?? trimmed
    // Hero mp4, /uploads/* — завжди через origin Next (public/ або rewrites), не прямий Express.
    // SSR client components інакше отримують http://127.0.0.1:5050/… → CORP (helmet) на localhost:3000.
    if (isSameOriginMediaPath(pathname)) {
      return trimmed
    }
    // Інші відносні шляхи в браузері — same-origin; на сервері — абсолютний URL для fetch.
    if (typeof window !== 'undefined') {
      return trimmed
    }
    return `${backendBaseUrl()}${trimmed}`
  }
  return trimmed
}
