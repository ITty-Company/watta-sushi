import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { checkAdmin } from '../authMiddleware'; // Если нужно будет в будущем
import jwt from 'jsonwebtoken'; // <--- НУЖНО ДОБАВИТЬ ЭТОТ ИМПОРТ
import { sendTelegramNotification } from '../services/telegram.service';
import { addOrderToSheet } from '../services/sheets.service';

const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key'; // <--- КЛЮЧ ДЛЯ РАСШИФРОВКИ

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
    const {
      name,
      customerName,
      phone,
      address,
      paymentMethod,
      comment,
      items,
      totalAmount,
      fulfillmentType,
      merchandiseTotal,
      userId,
      noCallbackConfirm,
      noDoorbellRing,
    } = req.body;

    const clientItems = Array.isArray(items) ? items : [];
    const lineSubtotal = clientItems.reduce(
      (s: number, item: any) => s + Number(item.price) * Number(item.quantity ?? 1),
      0
    );
    const merchParsed = merchandiseTotal != null ? Number(merchandiseTotal) : NaN;
    const merchandise =
      Number.isFinite(merchParsed) && merchParsed >= 0 ? merchParsed : lineSubtotal;

    let siteSettings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    if (!siteSettings) {
      siteSettings = await prisma.siteSetting.create({
        data: {
          id: 1,
          bannerInterval: 5000,
          telegramUrl: '',
          whatsappUrl: '',
          instagramUrl: '',
          restaurantPickupAddress: '',
          freeDeliveryThreshold: 1000,
          deliveryFee: 50,
        },
      });
    }

    const threshold = siteSettings.freeDeliveryThreshold;
    const fixedFee = siteSettings.deliveryFee;
    const fulfillment = fulfillmentType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';

    let deliveryFeeApplied = 0;
    if (fulfillment === 'DELIVERY' && merchandise < threshold) {
      deliveryFeeApplied = fixedFee;
    }

    const totalPrice = Math.round((merchandise + deliveryFeeApplied) * 100) / 100;

    const clientTotal = totalAmount != null ? Number(totalAmount) : NaN;
    if (Number.isFinite(clientTotal) && Math.abs(clientTotal - totalPrice) > 2) {
      console.warn(
        `Order total mismatch: client ${clientTotal}, server ${totalPrice} (merchandise ${merchandise}, delivery ${deliveryFeeApplied})`
      );
    }

    const parsedUserId = userId != null && userId !== '' ? parseInt(String(userId), 10) : NaN;

    const order = await prisma.order.create({
      data: {
        customerName: String(name || customerName || 'Гость'),
        phone: String(phone || ''),
        address: String(address || ''),
        fulfillmentType: fulfillment,
        deliveryFee: deliveryFeeApplied,
        paymentMethod: paymentMethod || 'CASH',
        comment: comment || null,
        noCallbackConfirm: Boolean(noCallbackConfirm),
        noDoorbellRing: Boolean(noDoorbellRing),
        totalPrice,
        status: 'PENDING',
        userId: Number.isFinite(parsedUserId) ? parsedUserId : null,
        items: {
          create: clientItems.map((item: any) => ({
            productId: item.id,
            quantity: Number(item.quantity ?? 1),
            price: Number(item.price),
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
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