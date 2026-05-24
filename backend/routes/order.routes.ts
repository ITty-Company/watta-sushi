import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwtSecret';
import { sendTelegramNotification } from '../services/telegram.service';
import { addOrderToSheet } from '../services/sheets.service';
import { sendOrderReceipt } from '../services/email.service';
import { notifyUserOrderStatusChange } from '../services/orderUserNotification.service';
import Stripe from 'stripe';
import crypto from 'crypto';
import {
  hasLiqPayConfigured,
  hasStripeConfigured,
  isCardOnlinePaymentAvailable,
} from '../lib/paymentProviders.js';
import { awardOrderCashbackIfEligible } from '../lib/bonusCashback.js';
import { linkGuestOrdersToUser } from '../lib/linkGuestOrders.js';
import {
  buildByStatus,
  buildDailySeries14,
  buildTodayMetrics,
} from '../lib/orderAdminStats.js';

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

function effectiveProductUnitPrice(price: number, promoPercent: number): number {
  const p = Math.min(100, Math.max(0, Math.round(Number(promoPercent) || 0)));
  if (p <= 0) return price;
  return Math.round(price * (100 - p) * 100) / 10000;
}

function buildLiqPayCheckout(orderId: number, amount: number) {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const safeAmount = Math.max(0.01, Math.round(Number(amount) * 100) / 100);

  const params = {
    public_key: publicKey,
    action: 'pay',
    amount: safeAmount.toFixed(2),
    currency: 'EUR',
    description: `Watta Sushi #${orderId}`,
    order_id: String(orderId),
    result_url: `${frontendUrl}/checkout/success?orderId=${orderId}`,
    version: '3',
  };

  const data = Buffer.from(JSON.stringify(params)).toString('base64');
  const signString = privateKey + data + privateKey;
  const signature = crypto.createHash('sha1').update(signString).digest('base64');

  return { data, signature };
}

function prismaOrderErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'P2003') {
    return 'Один або кілька товарів недоступні. Оновіть кошик і спробуйте знову.';
  }
  return 'Помилка при створенні замовлення';
}

async function rollbackFailedCardOrder(
  orderId: number,
  usedBonuses: number,
  userId: number | null,
) {
  await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  if (usedBonuses > 0 && userId) {
    await prisma.user
      .update({
        where: { id: userId },
        data: { bonusBalance: { increment: usedBonuses } },
      })
      .catch(() => {});
  }
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
    const userId = Number(decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (user?.phone) {
      await linkGuestOrdersToUser(prisma, userId, user.phone);
    }

    // 3. Ищем заказы этого пользователя (усі, без ліміту)
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        items: { 
          include: { product: true } 
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      }
    });

    res.json(
      orders.map((o) => {
        const { reviews, ...rest } = o;
        return { ...rest, review: reviews[0] ?? null };
      }),
    );
  } catch (error) {
    console.error('Ошибка получения моих заказов:', error);
    res.status(401).json({ message: 'Неверный токен или ошибка сервера' });
  }
});

router.get('/my/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Нет токена авторизации' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string | number };
    const orderId = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(orderId)) {
      res.status(400).json({ message: 'Некорректный id заказа' });
      return;
    }

    const userId = Number(decoded.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (user?.phone) {
      await linkGuestOrdersToUser(prisma, userId, user.phone);
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Заказ не найден' });
      return;
    }

    const { reviews, ...rest } = order;
    res.json({ ...rest, review: reviews[0] ?? null });
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
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
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
    fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    twoDaysAgo.setUTCHours(0, 0, 0, 0);

    const [totalOrders, statusGroups, revenueAgg, paymentPaidCount, recentOrders, todayWindowOrders] =
      await Promise.all([
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
        prisma.order.findMany({
          where: { createdAt: { gte: fourteenDaysAgo } },
          select: { createdAt: true, totalPrice: true, status: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.order.findMany({
          where: { createdAt: { gte: twoDaysAgo } },
          select: { createdAt: true, totalPrice: true, status: true },
        }),
      ]);

    const raw: Record<string, number> = {};
    for (const g of statusGroups) {
      raw[g.status] = g._count._all;
    }

    const { todayOrders, todayRevenue } = buildTodayMetrics(todayWindowOrders);

    res.json({
      totalOrders,
      revenueCompleted: Number(revenueAgg._sum.totalPrice ?? 0),
      paymentPaidCount,
      todayOrders,
      todayRevenue,
      byStatus: buildByStatus(raw),
      rawStatusCounts: raw,
      dailySeries14: buildDailySeries14(recentOrders),
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
      noCallbackConfirm,
      noDoorbellRing,
      dataProcessingConsent,
    } = req.body;

    if (dataProcessingConsent !== true) {
      res.status(400).json({
        message:
          'Потрібна згода на обробку персональних даних. Поставте галочку під номером телефону.',
      });
      return;
    }

    const payMethod = String(paymentMethod || 'CASH').toUpperCase() === 'CARD' ? 'CARD' : 'CASH';
    if (payMethod === 'CARD' && !isCardOnlinePaymentAvailable()) {
      const devHint =
        process.env.NODE_ENV !== 'production' &&
        !hasStripeConfigured() &&
        !hasLiqPayConfigured()
          ? ' Для розробки додайте STRIPE_SECRET_KEY або LIQPAY_* у backend/.env.'
          : '';
      res.status(503).json({
        message: `Онлайн-оплата тимчасово недоступна. Оберіть «Готівка».${devHint}`,
      });
      return;
    }

    const rawItems = Array.isArray(items) ? items : [];
    if (rawItems.length === 0) {
      res.status(400).json({ message: 'Кошик порожній' });
      return;
    }

    const requestedLines: { productId: number; quantity: number }[] = [];
    for (const item of rawItems) {
      const productId = parseInt(String(item?.id ?? item?.productId), 10);
      const quantity = Math.min(99, Math.max(1, Math.round(Number(item?.quantity ?? 1))));
      if (!Number.isFinite(productId) || productId <= 0) continue;
      requestedLines.push({ productId, quantity });
    }

    if (requestedLines.length === 0) {
      res.status(400).json({ message: 'Некоректні товари в кошику. Оновіть кошик.' });
      return;
    }

    const productIds = [...new Set(requestedLines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isArchived: false },
    });
    if (products.length !== productIds.length) {
      res.status(400).json({ message: 'Деякі товари більше недоступні. Оновіть кошик.' });
      return;
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const normalizedLines = requestedLines.map((line) => {
      const p = productById.get(line.productId)!;
      return {
        productId: line.productId,
        quantity: line.quantity,
        price: effectiveProductUnitPrice(Number(p.price), Number(p.promoDiscountPercent ?? 0)),
      };
    });

    const lineSubtotal = normalizedLines.reduce((s, l) => s + l.price * l.quantity, 0);
    const merchParsed = merchandiseTotal != null ? Number(merchandiseTotal) : NaN;
    const merchandise =
      Number.isFinite(merchParsed) && merchParsed >= 0 ? merchParsed : lineSubtotal;

    let siteSettings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    if (!siteSettings) {
      siteSettings = await prisma.siteSetting.create({
        data: {
          id: 1,
          bannerInterval: 4000,
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

    const effectiveUserId = getAuthUserId(req);
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
          paymentMethod: payMethod,
          comment: comment || null,
          noCallbackConfirm: Boolean(noCallbackConfirm),
          noDoorbellRing: Boolean(noDoorbellRing),
          dataProcessingConsentAt: new Date(),
          totalPrice: totalWithBonuses,
          usedBonuses: safeUsedBonuses,
          status: 'PENDING',
          userId: effectiveUserId,
          items: {
            create: normalizedLines.map((line) => {
              const p = productById.get(line.productId)!;
              return {
                productId: line.productId,
                quantity: line.quantity,
                price: line.price,
                productNameSnapshot: String(p.name_ru || '').trim(),
              };
            }),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    });

    if (effectiveUserId) {
      const linkedUser = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { phone: true },
      });
      if (linkedUser?.phone) {
        await linkGuestOrdersToUser(prisma, effectiveUserId, linkedUser.phone);
      }
      const orderPhone = String(phone || '').trim();
      if (orderPhone) {
        await linkGuestOrdersToUser(prisma, effectiveUserId, orderPhone);
      }
      await notifyUserOrderStatusChange(prisma, effectiveUserId, order.id, 'PENDING', null);
    }

    // 2. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЯ
    // order.items теперь существует, так как мы добавили include выше
    if (payMethod === 'CASH') {
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

      res.json(order);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripeClient();

    if (stripe) {
      try {
        const amountCents = Math.max(50, Math.round(totalWithBonuses * 100));
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'ideal'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Watta Sushi — замовлення #${order.id}`,
                },
                unit_amount: amountCents,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
          cancel_url: `${frontendUrl}/cart`,
          client_reference_id: String(order.id),
          metadata: { orderId: String(order.id) },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { stripeCheckoutSessionId: session.id },
        });

        res.json({ ...order, stripeUrl: session.url });
        return;
      } catch (stripeErr) {
        console.error('Stripe checkout session error:', stripeErr);
        await rollbackFailedCardOrder(order.id, safeUsedBonuses, effectiveUserId);
        res.status(502).json({
          message:
            'Не вдалося відкрити оплату карткою. Спробуйте готівку або повторіть пізніше.',
        });
        return;
      }
    }

    if (hasLiqPayConfigured()) {
      try {
        const liqpay = buildLiqPayCheckout(order.id, totalWithBonuses);
        res.json({ ...order, liqpay });
        return;
      } catch (liqErr) {
        console.error('LiqPay checkout error:', liqErr);
        await rollbackFailedCardOrder(order.id, safeUsedBonuses, effectiveUserId);
        res.status(502).json({
          message: 'Не вдалося відкрити онлайн-оплату. Спробуйте готівку.',
        });
        return;
      }
    }

    await rollbackFailedCardOrder(order.id, safeUsedBonuses, effectiveUserId);
    res.status(503).json({
      message: 'Онлайн-оплата тимчасово недоступна. Оберіть «Готівка».',
    });
    return;

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ message: prismaOrderErrorMessage(error) });
  }
});

// ==========================================
// 5. Обновить статус
// ==========================================
router.patch('/:id/status', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, readyAt } = req.body;
    const orderId = parseInt(String(id), 10);
    const previous = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, userId: true, fulfillmentType: true, readyAt: true },
    });

    let parsedReadyAt: Date | undefined;
    if (readyAt !== undefined && readyAt !== null && readyAt !== '') {
      const d = new Date(String(readyAt));
      if (!Number.isNaN(d.getTime())) parsedReadyAt = d;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(String(id)) },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(paymentStatus !== undefined ? { paymentStatus } : {}),
        ...(parsedReadyAt !== undefined ? { readyAt: parsedReadyAt } : {}),
      },
      include: {
        items: { include: { product: true } },
      },
    });

    if ((status === 'DELIVERED' || status === 'COMPLETED') && updatedOrder.userId) {
      await awardOrderCashbackIfEligible(prisma, updatedOrder.id, updatedOrder.userId);
    }

    if (status !== undefined && updatedOrder.userId) {
      await notifyUserOrderStatusChange(
        prisma,
        updatedOrder.userId,
        updatedOrder.id,
        String(status),
        previous?.status ?? null,
        {
          readyAt: updatedOrder.readyAt ?? parsedReadyAt ?? null,
          fulfillmentType: updatedOrder.fulfillmentType ?? previous?.fulfillmentType ?? null,
        },
      );
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