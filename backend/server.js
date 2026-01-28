import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Загружаем переменные окружения из .env файла (если существует)
// На Render переменные окружения уже установлены, поэтому это не перезапишет их
// Используем override: false чтобы не перезаписывать существующие переменные
const dotenvResult = dotenv.config({ override: false });
if (dotenvResult.error && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Не удалось загрузить .env файл:', dotenvResult.error.message);
}

// ДИАГНОСТИКА: Выводим все переменные окружения для отладки
console.log('🔍 Диагностика переменных окружения:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Все переменные с DATABASE:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')));
console.log('Все переменные окружения:', Object.keys(process.env).sort().join(', '));

// Проверяем наличие критически важных переменных окружения
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === '') {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: DATABASE_URL не установлен или пустой!');
  console.error('');
  console.error('📋 ИНСТРУКЦИИ ПО ИСПРАВЛЕНИЮ:');
  console.error('1. Убедитесь, что база данных "watta-sushi-db" создана на Render');
  console.error('2. Проверьте, что сервис "watta-sushi-backend" связан с базой данных');
  console.error('3. В Render Dashboard -> watta-sushi-backend -> Environment проверьте наличие DATABASE_URL');
  console.error('4. Убедитесь, что в render.yaml правильно указано:');
  console.error('   - key: DATABASE_URL');
  console.error('     fromDatabase:');
  console.error('       name: watta-sushi-db');
  console.error('       property: connectionString');
  console.error('');
  console.error('Текущие переменные с DATABASE:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')));
  console.error('Всего переменных окружения:', Object.keys(process.env).length);
  process.exit(1);
}

console.log('✅ DATABASE_URL найден:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'НЕ НАЙДЕН');

// Импорт наших роутов
// Мы используем .ts файлы, так как запускаем через tsx
import shopRoutes from './routes/shop.routes.ts';
import orderRoutes from './routes/order.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import productRoutes from './routes/product.routes.ts';
import promoRoutes from './routes/promo.routes.ts';
import cityRoutes from './routes/city.routes.ts';
import bannerRoutes from './routes/banner.routes.ts';
import countryRoutes from './routes/country.routes.ts';
import deliveryZoneRoutes from './routes/deliveryZone.routes.ts';
import teamRoutes from './routes/team.routes.ts';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 1. Настройки безопасности и парсинга
app.use(cors({
  origin: true, // Разрешает все источники
  credentials: true
})); // Разрешает запросы с фронтенда
app.use(express.json({ limit: '50mb' })); // Позволяет читать JSON из тела запроса (увеличен лимит для изображений)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Для form-data

// 2. Логирование (чтобы видеть запросы в консоли)
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    message: err.message || 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 3. Подключение маршрутов API
app.use('/api/shop', shopRoutes);     // Меню: /api/shop/menu
app.use('/api/orders', orderRoutes);  // Заказы: /api/orders
app.use('/api/auth', authRoutes);     // Вход: /api/auth/login
app.use('/api/products', productRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/cities', cityRoutes);   // Города: /api/cities
app.use('/api/countries', countryRoutes); // Страны: /api/countries
app.use('/api/delivery-zones', deliveryZoneRoutes); // Зоны доставки: /api/delivery-zones
app.use('/api/banners', bannerRoutes); // Баннеры: /api/banners
app.use('/api/team', teamRoutes); // Команда: /api/team

// 4. Тестовый маршрут
app.get('/', (req, res) => {
  res.send('🍣 Sushi API is running cleanly!');
});

// 5. Проверка подключения к базе данных перед запуском
async function startServer() {
  try {
    // Дополнительная проверка DATABASE_URL перед подключением
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL не установлен в переменных окружения');
    }
    
    console.log('🔌 Попытка подключения к базе данных...');
    console.log('DATABASE_URL (первые 30 символов):', process.env.DATABASE_URL.substring(0, 30) + '...');
    
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');

    // На Render база может быть новой/пустой (без таблиц). Если схемы нет — создаем через db push.
    // Это делает бэкенд "самовосстанавливающимся" и убирает P2021 на первом старте.
    try {
      await prisma.user.count();
    } catch (error) {
      const isMissingTables =
        error?.code === 'P2021' ||
        (typeof error?.message === 'string' && error.message.includes('does not exist'));

      if (!isMissingTables) {
        throw error;
      }

      console.warn('⚠️  Таблицы не найдены (P2021). Выполняем prisma db push...');
      execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });

      // После создания схемы можно засидить базу через существующий init-db скрипт.
      // Он безопасен (upsert) и не будет дублировать данные при повторном запуске.
      console.warn('🌱 Запускаем init-db для заполнения базовых данных...');
      execSync('npx tsx scripts/init-db.js', { stdio: 'inherit' });

      // На всякий случай переподключаемся после db push/init
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('✅ Схема создана и база инициализирована');
    }
    
    // Проверяем наличие JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  ВНИМАНИЕ: JWT_SECRET не установлен! Аутентификация может не работать.');
    } else {
      console.log('✅ JWT_SECRET настроен');
    }
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`
  🚀 Сервер успешно запущен!
  ---------------------------
  Local:      http://localhost:${PORT}
  Menu:       http://localhost:${PORT}/api/shop/menu
  ---------------------------
  `);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();