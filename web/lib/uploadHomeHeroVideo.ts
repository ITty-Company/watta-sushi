/** Бінарне завантаження hero-відео без base64 у JSON — файл на диску 1:1. */
export async function uploadHomeHeroVideoFile(
  file: File,
  token: string | null,
): Promise<string> {
  const form = new FormData()
  form.append('video', file, file.name)
  const res = await fetch('/api/settings/home-hero-video/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null
    const code = err?.error || (res.status === 503 ? 'mock_mode_no_backend' : 'upload_failed')
    throw new Error(code)
  }
  const data = (await res.json()) as { url?: string }
  const url = typeof data.url === 'string' ? data.url.trim() : ''
  if (!url) throw new Error('upload_failed')
  return url
}
