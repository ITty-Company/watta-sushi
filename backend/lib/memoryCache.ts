/**
 * Простий in-memory TTL-кеш для публічних GET-відповідей (товари / категорії).
 * Мета: не ходити в БД на кожен анонімний запит вітрини — після першого прогріву
 * відповідь віддається миттєво з памʼяті. Мутації в адмінці чистять кеш (інвалідація),
 * тож зміни видно одразу.
 *
 * Кеш — на рівні процесу. На кількох інстансах кожен прогрівається сам; TTL короткий,
 * тому розбіжність обмежена секундами і покривається `clear*` після мутацій.
 */
type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();

/** Обмеження RAM на free-tier: LRU + максимум записів. */
const MAX_ENTRIES = 48;

function evictIfNeeded(): void {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expires) store.delete(key);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest == null) break;
    store.delete(oldest);
  }
}

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  // LRU: свіжий доступ — в кінець Map.
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

export function setCached(key: string, value: unknown, ttlSec: number): void {
  if (store.has(key)) store.delete(key);
  store.set(key, { value, expires: Date.now() + ttlSec * 1000 });
  evictIfNeeded();
}

/** Видалити всі ключі з префіксом (напр. `products:` для всіх міст). */
export function clearCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Скинути весь кеш каталогу (товари + категорії) — викликати після будь-якої мутації. */
export function clearCatalogCache(): void {
  clearCachePrefix('products:');
  clearCachePrefix('product:');
  clearCachePrefix('categories:');
}

export function clearCachedKey(key: string): void {
  store.delete(key);
}
