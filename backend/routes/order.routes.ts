import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { checkAdmin } from '../authMiddleware'; // Если нужно будет в будущем
import axios from 'axios';
import jwt from 'jsonwebtoken'; // <--- НУЖНО ДОБАВИТЬ ЭТОТ ИМПОРТ

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
    const { cartItems, totalPrice, customer, userId } = req.body;
    console.log('📌 БЭКЕНД ВИДИТ ЗАКАЗ. User ID:', userId);
    
    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ message: 'Корзина пуста' });
      return;
    }

    const newOrder = await prisma.order.create({
      data: {
        totalPrice: parseFloat(totalPrice),
        status: 'PENDING',
        customerName: customer?.name || 'Гость',
        phone: customer?.phone || '',
        address: customer?.address || '',
        paymentMethod: customer?.paymentMethod || 'CASH',
        comment: customer?.comment || '',
        
        userId: userId ? parseInt(userId) : null,

        items: {
          create: cartItems.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price 
          }))
        }
      },
      include: { items: { include: { product: true } } }
    });

    sendToTelegram(newOrder, newOrder.items);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка создания заказа' });
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