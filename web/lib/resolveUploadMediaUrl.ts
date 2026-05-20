import { getApiUrl } from '@/lib/utils'

/** Для <video src> / <img src>: /uploads/* на проді йде напряму на Express API. */
export function resolveUploadMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('/uploads/')) return getApiUrl(trimmed)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  return trimmed
}
