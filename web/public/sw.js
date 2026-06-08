/*
 * Watta Sushi — service worker.
 *
 * Мета: інтерфейс і статика мають відкриватись миттєво (з кешу) і НЕ «висіти
 * нескінченно», коли сервер недоступний або повільний.
 *
 * Стратегії:
 *  - Навігація (HTML-документ): network-first з ТАЙМАУТОМ. Якщо мережа не
 *    відповіла за NAV_TIMEOUT_MS — віддаємо останній закешований документ,
 *    а якщо його немає — /offline.html. Саме це лікує «грузиться бесконечно».
 *  - /_next/static, шрифти: cache-first (імутабельні, хеш у імені).
 *  - Зображення, /uploads: stale-while-revalidate (показуємо з кешу, тихо оновлюємо).
 *  - /api/*: завжди мережа, нічого не кешуємо (інакше застряглі 401/меню/кошик).
 *  - Великі відео (.mp4) і Range-запити: не чіпаємо (хай браузер тягне напряму).
 *
 * Версію кешу піднімай при зміні логіки SW — старі кеші чистяться в activate.
 */

const CACHE_VERSION = 'watta-3ee90cc';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

/*
 * KILL-SWITCH для dev (localhost).
 *
 * Проблема: у dev Next.js чанки `/_next/static/` НЕ імутабельні, а стратегія
 * cacheFirst віддавала їх зі старого кешу. Якщо SW лишився з прод-білда, він
 * контролює localhost і віддає СТАРИЙ bundle (оболонка є, контент порожній,
 * без помилок). Перереєстрація з боку сторінки не рятує — старий bundle і є
 * тим кодом, що грузиться. Єдиний надійний канал — сам `sw.js` (його браузер
 * завжди тягне свіжим: no-store). Тому на localhost новий SW самознищується:
 * знімає реєстрацію, чистить усі кеші й перезавантажує вкладки вже без SW.
 */
const HOST = self.location.hostname;
const IS_LOCAL =
  HOST === 'localhost' ||
  HOST === '127.0.0.1' ||
  HOST === '[::1]' ||
  HOST === '::1' ||
  HOST.endsWith('.local');

if (IS_LOCAL) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
          /* ignore */
        }
        try {
          await self.registration.unregister();
        } catch {
          /* ignore */
        }
        // НЕ робимо self.clients.claim() і НЕ викликаємо navigate():
        // claim + reload з боку SW створює петлю перезавантажень. Просто знімаємо
        // реєстрацію та кеші — наступне ручне оновлення сторінки піде вже без SW.
      })(),
    );
  });
  // Жодних fetch-перехоплень: усе йде напряму в мережу, без застряглого кешу.
}

const OFFLINE_URL = '/offline.html';
const NAV_TIMEOUT_MS = 3500;

/** App-shell: те, що має бути офлайн одразу після встановлення. */
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/logo.webp',
  '/logo-splash-1x.webp',
  '/favicon.ico',
  '/site.webmanifest',
];

if (!IS_LOCAL) {
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // addAll падає весь, якщо хоч один файл 404 — тому додаємо поштучно.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Дозволяє сторінці попросити SW активуватись негайно (при оновленні). */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

function isImage(url) {
  return (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname)
  );
}

/** Мережа з таймаутом — щоб «мертвий» сервер не тримав запит вічно. */
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network-timeout')), timeoutMs);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function handleNavigation(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const network = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    if (network && network.ok) cache.put(request, network.clone());
    return network;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match('/'));
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  if (network && network.ok) cache.put(request, network.clone());
  return network;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Тільки GET; усе інше (POST/PUT…) — повз SW.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Чужі домени — не чіпаємо.
  if (url.origin !== self.location.origin) return;

  // API — завжди мережа, без кешу.
  if (url.pathname.startsWith('/api/')) return;

  // Range-запити (відео seek) і важкі медіа — напряму в браузер.
  if (request.headers.has('range') || /\.(?:mp4|webm|mov|m4v)$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
  }
});
} // end if (!IS_LOCAL)
