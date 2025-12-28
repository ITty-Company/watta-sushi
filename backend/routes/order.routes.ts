import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// Функция отправки в Telegram (без изменений)
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
`;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId, text: message, parse_mode: 'HTML'
    });
  } catch (e) { console.error('Ошибка Telegram:', e); }
};

// 1. Получить все заказы (для Админа)
router.get('/', checkAdmin, async (req, res) => {
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

// 2. Получить заказы КОНКРЕТНОГО пользователя (Новое!)
router.get('/user/:userId', checkAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) }, // Фильтруем по ID
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения истории' });
  }
});

// 3. Создать заказ
router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    // Добавили userId в запрос
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
        
        // Связываем с пользователем, если он вошел
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

// 4. Обновить статус
router.patch('/:id/status', checkAdmin, async (req: Request, res: Response) => {
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