/** Стиснення перед upload — менше 502/таймаутів на Render. */
const MAX_EDGE_PX = 1600
const JPEG_QUALITY = 0.82
const MAX_BYTES = 2 * 1024 * 1024

export async function compressProductImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= 400_000 && !file.type.includes('png')) return file

  if (typeof document === 'undefined') return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height, 1))
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

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
  })
  if (!blob) return file
  if (blob.size >= file.size && file.size <= MAX_BYTES) return file

  const out = new File([blob], file.name.replace(/\.\w+$/i, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
  return out.size <= MAX_BYTES ? out : out
}
