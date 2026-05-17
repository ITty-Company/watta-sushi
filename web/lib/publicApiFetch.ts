/**
 * Публічні GET до /api/* — покладаємось на Cache-Control з бекенду (браузерний HTTP-кеш).
 * Не передавайте `cache: 'no-store'`, якщо не потрібен примусовий refetch (напр. після зміни hero в адмінці).
 */
export function fetchPublicApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

/** Примусове оновлення (після збереження в адмінці, інвалідація кешу). */
export function fetchPublicApiFresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store' });
}
