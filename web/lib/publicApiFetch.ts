/**
 * Публічні GET до /api/* — покладаємось на Cache-Control з бекенду (браузерний HTTP-кеш).
 * Не передавайте `cache: 'no-store'`, якщо не потрібен примусовий refetch (напр. після зміни hero в адмінці).
 *
 * Одночасні однакові GET дедуплікуються — один мережевий запит на URL, поки попередній не завершився.
 *
 * У Safari «access control checks» на `/api/*` часто означає мережеву помилку (API не запущений,
 * змішані localhost vs 127.0.0.1) або скасований запит — не справжній CORS для same-origin fetch.
 */
const inflightGets = new Map<string, Promise<Response>>()

const PUBLIC_GET_DEFAULTS: RequestInit = {
  credentials: 'same-origin',
}

/** Помилки прогріву / фонового fetch — не показувати в UI. */
export function isBenignPublicFetchError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err ? String((err as { name?: string }).name) : ''
  if (name === 'AbortError') return true
  const msg = 'message' in err ? String((err as { message?: string }).message) : ''
  return /load failed|failed to fetch|networkerror|access control/i.test(msg)
}

function normalizeBrowserApiInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof window === 'undefined') return input
  if (typeof input === 'string') {
    if (input.startsWith('/api/')) return input
    return input
  }
  if (input instanceof URL && input.pathname.startsWith('/api/')) {
    return input.pathname + input.search
  }
  return input
}

function inflightGetKey(input: RequestInfo | URL, init?: RequestInit): string | null {
  const method = (init?.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return null
  const normalized = normalizeBrowserApiInput(input)
  if (typeof normalized === 'string') return normalized
  if (normalized instanceof URL) return normalized.href
  return normalized.url
}

export function fetchPublicApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const resolvedInput = normalizeBrowserApiInput(input)
  const mergedInit = { ...PUBLIC_GET_DEFAULTS, ...init }
  const key = inflightGetKey(resolvedInput, mergedInit)
  if (!key) return fetch(resolvedInput, mergedInit)

  const existing = inflightGets.get(key)
  if (existing) return existing.then((res) => res.clone())

  const request = fetch(resolvedInput, mergedInit).finally(() => {
    if (inflightGets.get(key) === request) inflightGets.delete(key)
  })
  inflightGets.set(key, request)
  /** Кожен підписник отримує clone — body оригіналу не читається двічі. */
  return request.then((res) => res.clone())
}

/** Примусове оновлення (після збереження в адмінці, інвалідація кешу). */
export function fetchPublicApiFresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' });
}
