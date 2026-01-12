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
import promoRoutes from './routes/promo.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// 1. Настройки безопасности и парсинга
app.use(cors()); // Разрешает запросы с фронтенда
app.use(express.json()); // Позволяет читать JSON из тела запроса

// 2. Логирование (чтобы видеть запросы в консоли)
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// 3. Подключение маршрутов API
app.use('/api/shop', shopRoutes);     // Меню: /api/shop/menu
app.use('/api/orders', orderRoutes);  // Заказы: /api/orders
app.use('/api/auth', authRoutes);     // Вход: /api/auth/login
app.use('/api/products', productRoutes);
app.use('/api/promo', promoRoutes);

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