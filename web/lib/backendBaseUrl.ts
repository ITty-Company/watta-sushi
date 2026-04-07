/**
 * Базовый URL API для server-side fetch (Route Handlers).
 * Совпадает с логикой rewrites в next.config.js: localhost → 127.0.0.1, без хвостового /.
 */
export function backendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://127.0.0.1:5050'
  const trimmed = String(raw).replace(/\/$/, '')
  try {
    const u = new URL(trimmed)
    if (u.hostname === 'localhost') u.hostname = '127.0.0.1'
    return u.origin
  } catch {
    return 'http://127.0.0.1:5050'
  }
}
