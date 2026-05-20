import { backendBaseUrl } from '@/lib/backendBaseUrl'

/** Для <video src> / <img src>: /uploads/* на проді йде напряму на Express API. */
export function resolveUploadMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  // У браузері — той самий origin, що й адмінка/сайт (Next rewrites /uploads → API).
  // NEXT_PUBLIC_API_URL часто вказує на окремий Render-сервіс, який може бути вимкнений,
  // тоді прямий https://…-backend.onrender.com/uploads/… дає 404, а /uploads/… на web — 200.
  if (typeof window !== 'undefined') {
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return `${window.location.origin}${trimmed}`
    }
    return trimmed
  }
  if (trimmed.startsWith('/')) {
    return `${backendBaseUrl()}${trimmed}`
  }
  return trimmed
}
