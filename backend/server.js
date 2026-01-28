import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

dotenv.config();

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

// 5. Запуск сервера
app.listen(PORT, () => {
  console.log(`
  🚀 Сервер успешно запущен!
  ---------------------------
  Local:      http://localhost:${PORT}
  Menu:       http://localhost:${PORT}/api/shop/menu
  ---------------------------
  `);
});