const path = require('path');

/** Bundle analyzer — запускается только при ANALYZE=true */
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true,
        openAnalyzer: false,
        analyzerMode: 'static',
        reportFilename: 'bundle-analysis.html',
      })
    : (config) => config;

/** База для rewrites — та сама нормалізація, що web/lib/backendBaseUrl.ts (BACKEND_URL для Render без перезбірки фронту). */
function backendProxyBaseUrl() {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://127.0.0.1:5050';
  const trimmed = String(raw).replace(/\/$/, '');
  try {
    const u = new URL(trimmed);
    if (u.hostname === 'localhost') u.hostname = '127.0.0.1';
    return u.origin;
  } catch {
    return 'http://127.0.0.1:5050';
  }
}

/** Запобігає 508 Loop Detected: /api на web не повинен проксуватись на той самий web-сервіс. */
function assertBackendProxyNotFrontendLoop() {
  if (process.env.USE_LOCAL_MOCK === '1') return;
  const apiOrigin = backendProxyBaseUrl();
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '');
  if (!siteRaw) return;
  try {
    const siteOrigin = new URL(siteRaw).origin;
    if (siteOrigin === apiOrigin) {
      throw new Error(
        `[next.config] BACKEND_URL / NEXT_PUBLIC_API_URL must point to Express backend, not the Next.js frontend. ` +
          `Both are "${apiOrigin}". On Render: API → watta-sushi-backend (e.g. watta-sushi-9qfh.onrender.com), ` +
          `SITE → watta-sushi-web.onrender.com.`,
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('[next.config]')) throw e;
  }
}

assertBackendProxyNotFrontendLoop();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // При ANALYZE=true — отдельная папка сборки, чтобы не ломать dev-сервер (.next)
  distDir: process.env.ANALYZE === 'true' ? '.next-analyze' : '.next',

  // Меньше нативных file watchers (на macOS часто EMFILE); плюс npm script с WATCHPACK_POLLING
  webpack: (config, { dev }) => {
    if (dev) {
      // Стабільніше для dev: прибирає eval-source-map, який інколи ламає чанки/HMR (Safari/Chrome).
      config.devtool = 'cheap-module-source-map';
      // Персистентний (filesystem) кеш Webpack + HMR/concurrently давали зламані чанки:
      // «Cannot find module './vendor-chunks/next.js'», 404 на /_next/static/*.
      // У dev вимикаємо кеш — збірка трохи повільніша, зате стабільна.
      if (process.env.NEXT_WEBPACK_FS_CACHE === '1') {
        config.cache = {
          type: 'filesystem',
          cacheDirectory: path.join(__dirname, 'node_modules', '.cache', 'webpack'),
          compression: 'gzip',
          buildDependencies: { config: [__filename] },
        };
      } else {
        config.cache = false;
      }
      config.watchOptions = {
        poll: process.env.WATCHPACK_POLLING ? 1000 : undefined,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      // layout.js з 30+ CSS/шрифтами — перша збірка може тривати 10–15 с; дефолтний timeout дає ChunkLoadError.
      config.output = { ...config.output, chunkLoadTimeout: 300000 };
    }
    return config;
  },

  // Оптимизация производительности
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация изображений
  images: {
    // Тільки WebP: AVIF дає ~20% менший файл, але кодується в рази довше CPU.
    // На Render (обмежений CPU) перша оптимізація кожного фото з AVIF — головна
    // причина повільних картинок каталогу. WebP кодується швидко → фото з'являються одразу.
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    /** 30 діб кеша оптимізованих варіантів — Next переоптимізує тільки коли джерело змінилось. */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    /** Швидше віддавати оптимізовані зображення без додаткових запитів.
     *  Обмежуємо тільки доменами, з яких реально тягнемо фото. */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wattasushi.com.ua',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
    ],
  },
  
  // Оптимизация компиляции
  swcMinify: true,
  productionBrowserSourceMaps: false,

  /**
   * Прибираємо console.* з production-бандла (лишаємо error/warn для діагностики на проді).
   * У dev нічого не чіпаємо — логи лишаються. Менший JS + менше роботи в main thread у клієнта.
   */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  /**
   * `optimizePackageImports` — тільки безпечні пакети з простими named exports:
   * `lucide-react` (іконки) та `recharts` (тільки в lazy admin-дешборді — великий пакет,
   * tree-shaking прибирає невикористані графіки з admin-чанку).
   * НЕ додавати сюди `react-hot-toast` / `sonner` / `date-fns` — Next 14.2 barrel optimizer
   * для них іноді віддавав `undefined` замість named export (`Toaster`),
   * що валило сторінку через `Unsupported Server Component type: undefined`.
   * framer-motion не потрібен у списку: публічні сторінки використовують `m` + `LazyMotion`
   * (рушій анімацій вантажиться окремим async-чанком через lib/framerLazyFeatures).
   */
  experimental: {
    // У dev barrel-optimizer інколи ламає HMR/чанки (ChunkLoadError, cannot find module vendor-chunks/*).
    // У production залишаємо для меншого бандла; у development вимикаємо заради стабільності.
    optimizePackageImports: process.env.NODE_ENV === 'production' ? ['lucide-react', 'recharts'] : [],
    /** Довше тримати prefetched RSC у клієнті — повторні переходи майже без затримки. */
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
    /** CSS-оптимізація: критический CSS инлайнится, остальное откладывается.
     *  УВАГА: з 1.6MB CSS це може збільшити HTML payload. Тестуйте на проді. */
    optimizeCss: process.env.NODE_ENV === 'production',
  },
  
  async redirects() {
    return [
      {
        source: '/menu/category/:slug',
        destination: '/menu?cat=:slug',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    // Локальна вёрстка без Express: middleware + route handlers, без проксі на :5000
    if (process.env.USE_LOCAL_MOCK === '1') {
      return [];
    }
    // Proxy /api and /uploads to Express. Override with NEXT_PUBLIC_API_URL (no trailing slash).
    const apiUrl = backendProxyBaseUrl();

    return [
      {
        source: '/products/:id',
        destination: '/product/:id',
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
  
  // Заголовки для кэширования — быстрая загрузка
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const nextStaticCache = isDev
      ? [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }]
      : [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
    ];

    const heroVideoHeaders = isDev
      ? [
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Content-Type', value: 'video/mp4' },
        ]
      : [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Content-Type', value: 'video/mp4' },
        ];

    /** 1 рік immutable — стандартний шаблон для /_next/static у prod. Підходить будь-яким assets у /public, які не міняються. */
    const longImmutable = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ];

    return [
      // Спочатку явні шляхи — щоб Cache-Control для чанків не «губився» після catch-all
      { source: '/_next/static/:path*', headers: nextStaticCache },
      // Service worker не кешуємо — інакше браузер не побачить оновлену логіку SW.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      { source: '/offline.html', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/watta-sushi-2-hero.mp4', headers: heroVideoHeaders },
      { source: '/menu-hero-keeping-safe-road-ready.mp4', headers: heroVideoHeaders },
      { source: '/watta-home-hero-poster.jpg', headers: longImmutable },
      /* Картинки/іконки — імутабельні. При заміні файлу — оновити ім'я або bust через query. */
      { source: '/logo.png', headers: longImmutable },
      { source: '/logo.webp', headers: longImmutable },
      { source: '/logo-splash-1x.webp', headers: longImmutable },
      { source: '/logo-splash.webp', headers: longImmutable },
      { source: '/sushi.png', headers: longImmutable },
      { source: '/sushi.webp', headers: longImmutable },
      { source: '/watta-sushi.jpg', headers: longImmutable },
      { source: '/favicon.ico', headers: longImmutable },
      { source: '/apple-touch-icon.png', headers: longImmutable },
      { source: '/apple-touch-icon-precomposed.png', headers: longImmutable },
      { source: '/watta-page-texture.png', headers: longImmutable },
      { source: '/location-picker-mascot.png', headers: longImmutable },
      { source: '/category-icons/:path*', headers: longImmutable },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=2592000, immutable',
          },
        ],
      },
      // Не кешировать API: иначе CDN/edge отдаёт чужие или устаревшие 401/403 и ломает админку.
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, must-revalidate' }],
      },
      { source: '/:path*', headers: securityHeaders },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);