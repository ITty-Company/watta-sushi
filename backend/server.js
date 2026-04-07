import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
import crmRoutes from './routes/crm.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPublicDir = path.resolve(__dirname, '../web/public/uploads');
try {
  fs.mkdirSync(uploadsPublicDir, { recursive: true });
} catch {
  /* ignore */
}

// --- КОНФИГУРАЦИЯ ОКРУЖЕНИЯ ---
const dotenvResult = dotenv.config({ override: false });
if (dotenvResult.error && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Не удалось загрузить .env файл:', dotenvResult.error.message);
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

const isProd = process.env.NODE_ENV === 'production';
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

// --- 2. ПАРСИНГ И ЛОГИРОВАНИЕ ---
app.use(express.json({ limit: '50mb' })); // Увеличенный лимит для загрузки картинок
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Логирование запросов
app.use((req, res, next) => {
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
app.use('/api/crm', crmRoutes);

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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT} (0.0.0.0:${PORT})`);
    });

  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();