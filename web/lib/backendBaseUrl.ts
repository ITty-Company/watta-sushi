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

/** Node 18+ / undici: відмова в з'єднанні інколи в `cause` (AggregateError). */
export function isBackendConnectionError(fetchError: unknown): boolean {
  const walk = (e: unknown): boolean => {
    if (e == null) return false
    const o = e as { code?: string; message?: string; cause?: unknown; errors?: unknown[] }
    if (o.code === 'ECONNREFUSED' || o.code === 'ENOTFOUND') return true
    const msg = String(o.message || '')
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) return true
    if (o.cause) return walk(o.cause)
    if (Array.isArray(o.errors)) return o.errors.some((x) => walk(x))
    return false
  }
  return walk(fetchError)
}

/** Текст для форми логіна / реєстрації, коли Express недоступний з Next (мова нейтральна RU/UK). */
export function backendUnreachableMessage(apiBase: string): string {
  if (process.env.USE_LOCAL_MOCK === '1') {
    return (
      'Увімкнено USE_LOCAL_MOCK — без проксі на Express. Для входу запустіть backend: з кореня «npm run local:all» або «npm run local:backend» (порт 5050), ' +
      'або фронт без моку: «npm run dev» / «npm run local:web».'
    )
  }
  if (process.env.NODE_ENV === 'production') {
    return 'Сервіс тимчасово недоступний. Спробуйте пізніше.'
  }
  return (
    `Не вдалося підключитися до API (${apiBase}). Запустіть Express з кореня репозиторію: «npm run local:all» або «npm run local:backend» (порт 5050), оновіть сторінку. ` +
    `Якщо API на іншому хості — задайте BACKEND_URL або NEXT_PUBLIC_API_URL у web/.env.local.`
  )
}
