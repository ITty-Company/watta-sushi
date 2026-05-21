import { compressProductImageFile } from '@/lib/compressProductImage'

/**
 * Перед PUT/POST товару: data URL у JSON дають 502 на Render — спочатку multipart upload.
 */
export async function dataUrlToFile(dataUrl: string): Promise<File> {
  if (dataUrl.length > 6_000_000) {
    throw new Error(
      'Зображення занадто велике. Завантажте через кнопку «Додати», не вставляйте з буфера обміну.',
    )
  }
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const raw = new File([blob], `product-${Date.now()}.${ext}`, { type })
  return compressProductImageFile(raw)
}

export async function resolveProductImageUrlsForSave(
  urls: string[],
  uploadFiles: (files: File[]) => Promise<string[]>,
  max = 24,
): Promise<string[]> {
  const resolved: string[] = []
  const pendingFiles: File[] = []

  for (const raw of urls) {
    const url = typeof raw === 'string' ? raw.trim() : ''
    if (!url || url.startsWith('blob:')) continue
    if (url.startsWith('data:image/')) {
      try {
        pendingFiles.push(await dataUrlToFile(url))
      } catch {
        /* skip broken data url */
      }
      continue
    }
    resolved.push(url)
  }

  if (pendingFiles.length > 0) {
    const uploaded = await uploadFiles(pendingFiles)
    resolved.push(...uploaded)
  }

  const out = resolved.slice(0, max)
  const hasData = out.some((u) => u.startsWith('data:image/'))
  if (hasData) {
    throw new Error(
      'Залишились великі фото в форматі base64. Натисніть «Додати» і дочекайтесь «Фото завантажено», потім збережіть.',
    )
  }
  return out
}
