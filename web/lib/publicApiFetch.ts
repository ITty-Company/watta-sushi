/**
 * Публічні GET до /api/* — покладаємось на Cache-Control з бекенду (браузерний HTTP-кеш).
 * Не передавайте `cache: 'no-store'`, якщо не потрібен примусовий refetch (напр. після зміни hero в адмінці).
 *
 * Одночасні однакові GET дедуплікуються — один мережевий запит на URL, поки попередній не завершився.
 */
const inflightGets = new Map<string, Promise<Response>>()

function inflightGetKey(input: RequestInfo | URL, init?: RequestInit): string | null {
  const method = (init?.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return null
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

export function fetchPublicApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const key = inflightGetKey(input, init)
  if (!key) return fetch(input, init)

  const existing = inflightGets.get(key)
  if (existing) return existing.then((res) => res.clone())

  const request = fetch(input, init).finally(() => {
    if (inflightGets.get(key) === request) inflightGets.delete(key)
  })
  inflightGets.set(key, request)
  return request
}

/** Примусове оновлення (після збереження в адмінці, інвалідація кешу). */
export function fetchPublicApiFresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' });
}
