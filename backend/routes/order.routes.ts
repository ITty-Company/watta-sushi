import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { checkAdmin } from '../authMiddleware'; // Если нужно будет в будущем
import axios from 'axios';
import jwt from 'jsonwebtoken'; // <--- НУЖНО ДОБАВИТЬ ЭТОТ ИМПОРТ
import { sendTelegramNotification } from '../services/telegram.service';
import { addOrderToSheet } from '../services/sheets.service';

const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key'; // <--- КЛЮЧ ДЛЯ РАСШИФРОВКИ

// Функция отправки в Telegram
const sendToTelegram = async (order: any, items: any[]) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const itemsList = items
    .map((item, index) => `${index + 1}. ${item.product.name_ru} x${item.quantity}`)
    .join('\n');

  const message = `
🔥 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>
👤 ${order.customerName}
📞 ${order.phone}
📍 ${order.address}
💳 ${order.paymentMethod === 'CARD' ? 'Картой' : 'Наличными'}
💬 ${order.comment || 'Без комментария'}
💰 <b>Сумма: ${order.totalPrice} ₴</b>

📦 <b>Состав:</b>
${itemsList}
`;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId, text: message, parse_mode: 'HTML'
    });
  } catch (e) { console.error('Ошибка Telegram:', e); }
};

// ==========================================
// 1. Получить МОИ заказы (по Токену) - НОВОЕ
// ==========================================
router.get('/my', async (req: Request, res: Response) => {
  try {
    // 1. Берем токен из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Нет токена авторизации' });
      return;
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>" -> "<token>"

    // 2. Расшифровываем токен, чтобы узнать userId
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string | number };
    
    // 3. Ищем заказы этого пользователя
    const orders = await prisma.order.findMany({
      where: { userId: Number(decoded.userId) },
      orderBy: { createdAt: 'desc' },
      include: { 
        items: { 
          include: { product: true } 
        } 
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения моих заказов:', error);
    res.status(401).json({ message: 'Неверный токен или ошибка сервера' });
  }
});

// ==========================================
// 2. Получить все заказы (Админ)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, user: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// 3. Получить заказы по ID (для Админки или дебага)
// ==========================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения истории' });
  }
});

// ==========================================
// 4. Создать заказ
// ==========================================
router.post('/', async (req: Request, res: Response) => {
  try {
    // Получаем данные с фронтенда (там они называются name, phone, totalAmount)
    const { name, phone, address, paymentMethod, comment, items, totalAmount } = req.body;

    // 1. Сохраняем в БД (Используем поля из ВАШЕЙ схемы Prisma)
    const order = await prisma.order.create({
      data: {
        customerName: name,      // Было userName, стало customerName
        phone: phone,            // Было userPhone, стало phone
        address: address,
        paymentMethod: paymentMethod, 
        comment: comment,
        totalPrice: Number(totalAmount), // Было totalAmount, стало totalPrice
        status: 'PENDING',
        
        // Создаем связанные товары
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: { product: true } // Подгружаем названия продуктов для уведомлений
        }
      }
    });

    // 2. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ
    // order.items теперь существует, так как мы добавили include выше
    Promise.allSettled([
        sendTelegramNotification(order, order.items),
        addOrderToSheet(order, order.items)
    ]).then(() => console.log('Notifications processed'));

    // 3. Отвечаем клиенту
    res.json(order);

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
});

// ==========================================
// 5. Обновить статус
// ==========================================
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления' });
  }
});

export default router;