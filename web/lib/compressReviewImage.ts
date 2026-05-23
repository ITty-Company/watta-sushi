/**
 * Стиснення фото для відгуків (base64 у JSON).
 * Бекенд: до ~1.2M символів на фото, ~4M сумарно.
 */
const DEFAULT_MAX_EDGE_PX = 1280
const DEFAULT_MAX_BYTES = 880_000
const MIN_QUALITY = 0.48

type CompressOpts = {
  maxEdgePx?: number
  maxBytes?: number
}

export async function compressReviewImageFile(
  file: File,
  opts?: CompressOpts,
): Promise<File | null> {
  if (!file.type.startsWith('image/')) return null
  if (typeof document === 'undefined') {
    const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES
    return file.size <= maxBytes ? file : null
  }

  const maxEdgePx = opts?.maxEdgePx ?? DEFAULT_MAX_EDGE_PX
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }

  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height, 1))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return null
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let quality = 0.82
  let best: File | null = null

  while (quality >= MIN_QUALITY) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
    if (!blob) break

    const out = new File([blob], file.name.replace(/\.\w+$/i, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    if (!best || out.size < best.size) best = out
    if (out.size <= maxBytes) return out

    quality -= 0.08
  }

  return best
}

async function fileToDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '') || null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

const MAX_DATA_URL_LEN = 1_150_000

export async function readReviewImageDataUrl(file: File): Promise<string | null> {
  const attempts: CompressOpts[] = [
    { maxEdgePx: DEFAULT_MAX_EDGE_PX, maxBytes: DEFAULT_MAX_BYTES },
    { maxEdgePx: 960, maxBytes: 650_000 },
    { maxEdgePx: 720, maxBytes: 480_000 },
  ]

  for (const opts of attempts) {
    const compressed = await compressReviewImageFile(file, opts)
    if (!compressed) continue
    const dataUrl = await fileToDataUrl(compressed)
    if (dataUrl && dataUrl.length <= MAX_DATA_URL_LEN) return dataUrl
  }

  return null
}
