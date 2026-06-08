export type CatalogImagePreset = {
  maxEdgePx: number
  jpegQuality: number
  maxBytes: number
  /** Не перекодовувати, якщо вже достатньо легкий JPEG/WebP. */
  skipBelowBytes?: number
  /** PNG менше цього — лишаємо (рідко вигідно стискати). */
  skipPngBelowBytes?: number
}

export async function compressCatalogImageFile(
  file: File,
  preset: CatalogImagePreset,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const skipBelow = preset.skipBelowBytes ?? 0
  if (file.size <= skipBelow && !file.type.includes('png')) return file
  if (file.type.includes('png') && preset.skipPngBelowBytes && file.size <= preset.skipPngBelowBytes) {
    return file
  }
  if (typeof document === 'undefined') return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const scale = Math.min(1, preset.maxEdgePx / Math.max(bitmap.width, bitmap.height, 1))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let quality = preset.jpegQuality
  let best: File | null = null
  for (let i = 0; i < 6; i++) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
    if (!blob) break
    const candidate = new File([blob], file.name.replace(/\.\w+$/i, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
    best = candidate
    if (candidate.size <= preset.maxBytes) break
    quality = Math.max(0.5, quality - 0.08)
  }

  if (!best) return file
  if (best.size >= file.size && file.size <= preset.maxBytes) return file
  return best
}

export const PRODUCT_IMAGE_PRESET: CatalogImagePreset = {
  maxEdgePx: 1600,
  jpegQuality: 0.82,
  maxBytes: 2 * 1024 * 1024,
  skipBelowBytes: 400_000,
}

/** Іконки інгредієнтів у сітці ~96px — достатньо 512px JPEG. */
export const INGREDIENT_IMAGE_PRESET: CatalogImagePreset = {
  maxEdgePx: 512,
  jpegQuality: 0.84,
  maxBytes: 160_000,
  skipBelowBytes: 55_000,
  skipPngBelowBytes: 100_000,
}
