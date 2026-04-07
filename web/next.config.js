const path = require('path');

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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Меньше нативных file watchers (на macOS часто EMFILE); плюс npm script с WATCHPACK_POLLING
  webpack: (config, { dev }) => {
    if (dev) {
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
    }
    return config;
  },

  // Оптимизация производительности
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Оптимизация компиляции
  swcMinify: true,
  
  // Экспериментальные функции для производительности
  // optimizeCss отключен, так как требует модуль 'critters'
  // experimental: {
  //   optimizeCss: true,
  // },
  
  async rewrites() {
    // Локальна вёрстка без Express: middleware + route handlers, без проксі на :5000
    if (process.env.USE_LOCAL_MOCK === '1') {
      return [];
    }
    // Proxy /api and /uploads to Express. Override with NEXT_PUBLIC_API_URL (no trailing slash).
    const apiUrl = backendProxyBaseUrl();

    return [
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

    const heroVideoHeaders = [
      { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
      { key: 'Accept-Ranges', value: 'bytes' },
    ];

    return [
      // Спочатку явні шляхи — щоб Cache-Control для чанків не «губився» після catch-all
      { source: '/_next/static/:path*', headers: nextStaticCache },
      { source: '/watta-sushi-2-hero.mp4', headers: heroVideoHeaders },
      { source: '/welcome.mp4', headers: heroVideoHeaders },
      { source: '/logo.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // Не кешировать API: иначе CDN/edge отдаёт чужие или устаревшие 401/403 и ломает админку.
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, must-revalidate' }],
      },
      { source: '/:path*', headers: securityHeaders },
    ];
  },
};

module.exports = nextConfig;