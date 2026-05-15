import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwtSecret';
import { sendTelegramNotification } from '../services/telegram.service';
import { addOrderToSheet } from '../services/sheets.service';
import { sendOrderReceipt } from '../services/email.service';
import Stripe from 'stripe';

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  return new Stripe(key)
}

const router = Router();
const prisma = new PrismaClient();
function getAuthUserId(req: Request): number | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string | number };
    const parsed = Number(decoded.userId);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function buildLiqPayPayload(orderId: number, amount: number) {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  
  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // 1. Формируем параметры (обязательно добавляем public_key)
  const params = {
    public_key: publicKey,
    action: 'pay',
    amount: Number(amount).toFixed(2),
    currency: 'UAH',
    description: `Order #${orderId}`,
    order_id: String(orderId),
    result_url: `${frontendUrl}/checkout/success?orderId=${orderId}`,
    version: '3',
  };
// 2. Кодируем данные в Base64
const data = Buffer.from(JSON.stringify(params)).toString('base64');

// 3. Создаем подпись: base64(sha1(private_key + data + private_key))
const signString = privateKey + data + privateKey;
const signature = crypto.createHash('sha1').update(signString).digest('base64');

return { data, signature };
}
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
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string | number };
    
    // 3. Ищем заказы этого пользователя
    const orders = await prisma.order.findMany({
      where: { userId: Number(decoded.userId) },
      orderBy: { createdAt: 'desc' },
      include: { 
        items: { 
          include: { product: true } 
        },
        review: true,
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения моих заказов:', error);
    res.status(401).json({ message: 'Неверный токен или ошибка сервера' });
  }
});

router.get('/bonus', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Нет токена авторизации' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bonusBalance: true },
    });
    res.json({ bonusBalance: Number(user?.bonusBalance ?? 0) });
  } catch (error) {
    console.error('Ошибка получения бонусов:', error);
    res.status(500).json({ message: 'Ошибка получения бонусов' });
  }
});

// ==========================================
// Агрегована статистика (тільки ADMIN, з БД)
// ==========================================
router.get('/stats', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalOrders, statusGroups, revenueAgg, paymentPaidCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: {
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
    ]);

    const raw: Record<string, number> = {};
    for (const g of statusGroups) {
      raw[g.status] = g._count._all;
    }
    const n = (s: string) => raw[s] ?? 0;

    res.json({
      totalOrders,
      revenueCompleted: Number(revenueAgg._sum.totalPrice ?? 0),
      paymentPaidCount,
      byStatus: {
        PENDING: n('PENDING'),
        COOKING: n('COOKING'),
        DELIVERING: n('DELIVERING'),
        /** COMPLETED + DELIVERED (legacy) — одна колонка «виконані» */
        COMPLETED: n('COMPLETED') + n('DELIVERED'),
        CANCELLED: n('CANCELLED'),
      },
      rawStatusCounts: raw,
    });
  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({ message: 'Помилка статистики замовлень' });
  }
});

// ==========================================
// 2. Получить все заказы (Админ)
// ==========================================
router.get('/', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, user: true },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==========================================
// 3. Получить заказы по ID (для Админки или дебага)
// ==========================================
router.get('/user/:userId', checkAdmin, async (req, res) => {
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
      deliveryPrice,
      usedBonuses,
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
          instagramUrl: 'https://www.instagram.com/watta_sushi/',
          restaurantPickupAddress: '',
          freeDeliveryThreshold: 1000,
          deliveryFee: 50,
          deliveryKitchenAddress: 'Helicopterstraat 20, 1059 CG Amsterdam, Netherlands',
          deliveryTariffStepKm: 3,
          deliveryTariffStepEur: 1.5,
        },
      });
    }

    const fulfillment = fulfillmentType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';

    let deliveryFeeApplied = 0;
    if (fulfillment === 'DELIVERY') {
      const clientDelivery = Number(deliveryPrice)
      deliveryFeeApplied =
        Number.isFinite(clientDelivery) && clientDelivery >= 0
          ? Math.round(clientDelivery * 100) / 100
          : 0
    }

    const totalPrice = Math.round((merchandise + deliveryFeeApplied) * 100) / 100;

    const clientTotal = totalAmount != null ? Number(totalAmount) : NaN;
    if (Number.isFinite(clientTotal) && Math.abs(clientTotal - totalPrice) > 2) {
      console.warn(
        `Order total mismatch: client ${clientTotal}, server ${totalPrice} (merchandise ${merchandise}, delivery ${deliveryFeeApplied})`
      );
    }

    const parsedUserId = userId != null && userId !== '' ? parseInt(String(userId), 10) : NaN;
    const authUserId = getAuthUserId(req);
    /** Не довіряємо body userId без JWT; при токені — лише id з токена. */
    if (Number.isFinite(parsedUserId) && (!authUserId || authUserId !== parsedUserId)) {
      res.status(403).json({ message: 'Нельзя привязать заказ к чужому аккаунту' });
      return;
    }
    const effectiveUserId = authUserId ?? null;
    const requestedBonuses = Number(usedBonuses);
    const safeUsedBonuses =
      Number.isFinite(requestedBonuses) && requestedBonuses > 0 ? requestedBonuses : 0;

    let totalWithBonuses = totalPrice;
    if (safeUsedBonuses > 0) {
      if (!effectiveUserId) {
        res.status(400).json({ message: 'Списывать бонусы можно только авторизованному пользователю' });
        return;
      }
      const userForBonus = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { bonusBalance: true },
      });
      const currentBonus = Number(userForBonus?.bonusBalance ?? 0);
      if (safeUsedBonuses > currentBonus) {
        res.status(400).json({ message: 'Недостаточно бонусов на балансе' });
        return;
      }
      totalWithBonuses = Math.max(0, Math.round((totalPrice - safeUsedBonuses) * 100) / 100);
    }

    const order = await prisma.$transaction(async (tx) => {
      if (safeUsedBonuses > 0 && effectiveUserId) {
        await tx.user.update({
          where: { id: effectiveUserId },
          data: { bonusBalance: { decrement: safeUsedBonuses } },
        });
      }

      return tx.order.create({
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
          totalPrice: totalWithBonuses,
          usedBonuses: safeUsedBonuses,
          status: 'PENDING',
          userId: effectiveUserId,
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
    });

    // 2. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ
    // order.items теперь существует, так как мы добавили include выше
    if (paymentMethod === 'CASH') {
      Promise.allSettled([
          sendTelegramNotification(order, order.items),
          addOrderToSheet(order, order.items)
      ]).then(() => console.log('Notifications processed'));

      if (effectiveUserId) {
        const user = await prisma.user.findUnique({
          where: { id: effectiveUserId },
          select: { email: true },
        });
        if (user?.email) {
          sendOrderReceipt(order as any, user.email).catch((e) =>
            console.error('Failed to send CASH receipt:', e)
          );
        }
      }
    }

    if (paymentMethod === 'CARD') {
      const stripe = getStripeClient()
      if (!stripe) {
        res.status(503).json({
          message:
            'Оплата карткою недоступна: додайте STRIPE_SECRET_KEY у backend/.env (локально) або на Render.',
        })
        return
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: order.items.map((item: any) => ({
          price_data: {
            currency: 'uah', // Валюта
            product_data: { 
              name: item.product?.name_ru || 'Товар из Watta Sushi' 
            },
            unit_amount: Math.round(item.price * 100), // Stripe принимает сумму в копейках
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
        cancel_url: `${frontendUrl}/cart`,
        client_reference_id: String(order.id),
      });

      // Сохраняем ID сессии Stripe в заказ (у тебя уже есть это поле в Prisma)
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeCheckoutSessionId: session.id }
      });

      // Возвращаем клиенту ссылку на оплату
      res.json({ ...order, stripeUrl: session.url });
      return;
    }

    res.json(order);

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
});

// ==========================================
// 5. Обновить статус
// ==========================================
router.patch('/:id/status', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(String(id)) },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      },
      include: {
        items: { include: { product: true } },
      },
    });

    if ((status === 'DELIVERED' || status === 'COMPLETED') && updatedOrder.userId) {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: updatedOrder.id },
        select: { price: true, quantity: true },
      });
      const merchandiseTotal = orderItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );
      const cashback = Math.round(merchandiseTotal * 0.05 * 100) / 100;
      if (cashback > 0) {
        await prisma.user.update({
          where: { id: updatedOrder.userId },
          data: { bonusBalance: { increment: cashback } },
        });
      }
    }

    if (updatedOrder.userId) {
      const shouldSendCardReceipt =
        updatedOrder.paymentMethod === 'CARD' &&
        (paymentStatus === 'PAID' || status === 'DELIVERED' || status === 'COMPLETED');

      if (shouldSendCardReceipt) {
        const user = await prisma.user.findUnique({
          where: { id: updatedOrder.userId },
          select: { email: true },
        });
        if (user?.email) {
          sendOrderReceipt(updatedOrder as any, user.email).catch((e) =>
            console.error('Failed to send CARD receipt:', e)
          );
        }
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления' });
  }
});

export default router;