import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env має завантажитись ДО імпорту роутів (Google Sheets, Stripe тощо читають process.env при старті).
dotenv.config({
  path: path.join(__dirname, '.env'),
  override: false,
  quiet: true,
});

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import shopRoutes from './routes/shop.routes.ts';
import orderRoutes from './routes/order.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import productRoutes from './routes/product.routes.ts';
import promoRoutes from './routes/promo.routes.ts';
import cityRoutes from './routes/city.routes.ts';
import bannerRoutes from './routes/banner.routes.ts';
import countryRoutes from './routes/country.routes.ts';
import deliveryZoneRoutes from './routes/deliveryZone.routes.ts';
import deliveryCheckRoutes from './routes/deliveryCheck.routes.ts';
import teamRoutes from './routes/team.routes.ts';
import settingsRoutes from './routes/settings.routes.ts';
import promotionsRoutes from './routes/promotions.routes.ts';
import newsletterRoutes from './routes/newsletter.routes.ts';
import favoriteRoutes from './routes/favorite.routes.ts';
import ingredientRoutes from './routes/ingredients.routes.ts';
import paymentRoutes from './routes/payment.routes.ts';
import blogRoutes from './routes/blog.routes.ts';
import reviewRoutes from './routes/review.routes.ts';
import crmRoutes from './routes/crm.routes.ts';
import contactRoutes from './routes/contact.routes.ts';
import notificationRoutes from './routes/notification.routes.ts';
import cartUpsellRoutes from './routes/cartUpsell.routes.ts';
import stripeWebhookRouter from './routes/stripe-webhook.routes.ts';
import { getUploadsDir } from './lib/uploadsDir.js';
import { getStorageHealthSnapshot } from './lib/storageHealth.js';
import cookieParser from 'cookie-parser'
;
const uploadsPublicDir = getUploadsDir();

// --- КОНФИГУРАЦИЯ ОКРУЖЕНИЯ ---
const envPath = path.join(__dirname, '.env');
if (process.env.NODE_ENV !== 'production') {
  try {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    const n = Object.keys(parsed).length;
    if (n > 0) {
      console.log(`📦 Загружено ${n} переменных из ${path.basename(envPath)}`);
    }
  } catch {
    console.warn(`⚠️  Не удалось прочитать .env (${envPath})`);
  }
}

// Диагностика переменных
console.log('🔍 Диагностика переменных окружения:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Проверка DATABASE_URL
if (!process.env.DATABASE_URL?.trim()) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL не установлен!');
  process.exit(1);
}
console.log('✅ DATABASE_URL найден');
console.log('📁 Uploads directory:', uploadsPublicDir, process.env.UPLOAD_DIR ? '(UPLOAD_DIR)' : '(default)');

const isProd = process.env.NODE_ENV === 'production';
const shouldLogApiRequests =
  process.env.LOG_API_REQUESTS === '1' ||
  process.env.LOG_API_REQUESTS === 'true' ||
  isProd;
if (isProd && !process.env.JWT_SECRET?.trim()) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: в production нужен JWT_SECRET');
  process.exit(1);
}
if (isProd) {
  console.log('✅ JWT_SECRET задан');
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050; // 5000 на macOS часто зайнятий AirPlay

// --- 1. БЕЗОПАСНОСТЬ (Security Middleware) ---
app.use(helmet()); // Заголовки безопасности

// Настройка CORS (FRONTEND_URL + CORS_ORIGINS через запятую — свой домен / превью Render)
function normalizeOrigin(url) {
  const s = String(url || '').trim().replace(/\/$/, '');
  return s || null;
}
const extraCors = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => normalizeOrigin(s))
  .filter(Boolean);
const whitelist = [
  ...new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://watta-sushi-web.onrender.com',
      normalizeOrigin(process.env.FRONTEND_URL),
      ...extraCors,
    ].filter(Boolean)
  ),
];

const corsOptions = isProd
  ? {
      origin(origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log('Blocked by CORS:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));

// Gzip/Brotli-friendly smaller JSON over the wire — faster TTFB on slow links (Next proxy → API).
app.use(
  compression({
    threshold: 1024,
    level: isProd ? 6 : 3,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }),
);

/** Liveness for balancers / Render / uptime monitors — keep DB out of the hot path for speed */
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, uptime: Math.round(process.uptime()), ts: Date.now() });
});

/** Діагностика БД + uploads (Render Persistent Disk). Відкрийте https://ВАШ-API.onrender.com/health/storage */
app.get('/health/storage', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const storage = getStorageHealthSnapshot();
  let database = { connected: false };
  try {
    const [products, categories] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
    ]);
    database = { connected: true, products, categories };
  } catch {
    database = { connected: false };
  }
  res.json({
    ok: storage.ok && database.connected,
    uptime: Math.round(process.uptime()),
    storage: storage.uploads,
    hintUk: storage.hintUk,
    database,
    ts: Date.now(),
  });
});

// Лимит запросов: в dev админка дергает десятки эндпоинтов подряд — 200/15мин даёт 429
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 8000,
  message: 'Слишком много запросов, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.DISABLE_RATE_LIMIT === '1' || process.env.DISABLE_RATE_LIMIT === 'true',
});
app.use('/api/', limiter);

// --- 2. STRIPE WEBHOOK (raw body — ОБЯЗАТЕЛЬНО до express.json()) ---
// Stripe верифицирует HMAC-SHA256 подпись по точным байтам тела запроса.
// Если express.json() отработает первым — он распарсит и пересоберёт JSON,
// байты изменятся, и stripe.webhooks.constructEvent() бросит ошибку 400.
// Поэтому: сначала express.raw() для /webhooks/stripe, потом express.json() для всего остального.
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/webhooks', stripeWebhookRouter);

// --- 3. ПАРСИНГ И ЛОГИРОВАНИЕ ---
// Адмінка може слати в JSON base64-фото (галерея товару) — 10mb часто мало (413 request entity too large).
// Multer/окремі upload-роуты — для великих файлів; JSON лімит обмежуйте в nginx/Render за потреби.
const jsonBodyLimit = String(process.env.JSON_BODY_LIMIT || '50mb').trim() || '50mb';
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

// Логирование запросов
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/health/storage') return next();
  if (!shouldLogApiRequests && req.path.startsWith('/api/')) return next();
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Статика завантажених файлів (Next на проді проксує /uploads сюди)
app.use(
  '/uploads',
  express.static(uploadsPublicDir, {
    maxAge: isProd ? '7d' : 0,
    index: false,
    fallthrough: true,
  }),
);
const legacyUploadsDir = path.resolve(__dirname, '../web/public/uploads');
if (legacyUploadsDir !== uploadsPublicDir && fs.existsSync(legacyUploadsDir)) {
  app.use(
    '/uploads',
    express.static(legacyUploadsDir, {
      maxAge: isProd ? '7d' : 0,
      index: false,
      fallthrough: true,
    }),
  );
}

// --- 3. ПОДКЛЮЧЕНИЕ РОУТОВ ---
app.use('/api/shop', shopRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/delivery', deliveryCheckRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart-upsell', cartUpsellRoutes);
app.use(cookieParser());

// Тестовый маршрут
app.get('/', (req, res) => {
  res.send('🍣 Watta Sushi API is running cleanly!');
});

// Обработка ошибок (всегда в конце)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    message: err.message || 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// --- 4. ЗАПУСК СЕРВЕРА ---
async function startServer() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');

    // Авто-фикс базы данных (если таблиц нет)
    try {
      await prisma.user.count();
    } catch (error) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.warn('⚠️  Таблицы не найдены. Выполняем prisma db push...');
        execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
        
        console.warn('🌱 Запускаем init-db...');
        // Проверяем, существует ли скрипт, прежде чем запускать
        try {
           execSync('npx tsx scripts/init-db.js', { stdio: 'inherit' });
        } catch (e) {
           console.log('⚠️ Скрипт init-db не найден или упал, пропускаем.');
        }
      }
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT} (0.0.0.0:${PORT})`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal}: graceful shutdown…`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('✅ Prisma disconnected');
        } catch (e) {
          console.error('Prisma disconnect:', e);
        }
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 12_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();