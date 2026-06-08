import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwtSecret';
import { sendTelegramNotification } from '../services/telegram.service';
import { addOrderToSheet } from '../services/sheets.service';
import { sendOrderReceipt } from '../services/email.service';
import { notifyUserOrderStatusChange } from '../services/orderUserNotification.service.js';
import crypto from 'crypto';
import {
  getPublicApiUrl,
  hasLiqPayConfigured,
  hasStripeConfigured,
  canProcessCardPayment,
} from '../lib/paymentProviders.js';
import { getStripeClient } from '../lib/stripeOrderPayment.js';
import { awardOrderCashbackIfEligible } from '../lib/bonusCashback.js';
import { linkGuestOrdersToUser } from '../lib/linkGuestOrders.js';
import {
  assertScheduledDeliveryAllowed,
  getAmsterdamTodayKey,
  parseScheduledForDate,
  parseScheduledForSlot,
} from '../lib/deliverySchedule.js';
import { saveUserAddressIfNew } from '../lib/userAddressBook.js';
import { verifyDeliveryQuote } from '../lib/deliveryQuote.js';
import {
  buildByStatus,
  buildDailySeries14,
  buildTodayMetrics,
} from '../lib/orderAdminStats.js';
import {
  MAX_ITEM_QUANTITY,
  buildPricingLine,
  lineSubtotalCents,
  applyFreeDeliveryThreshold,
  capBonusDiscount,
  calculateFinalTotalCents,
  centsToEur,
  eurToCents,
  type PricingLine,
} from '../lib/orderPricing.js';

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

function buildLiqPayCheckout(orderId: number, amount: number) {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const safeAmount = Math.max(0.01, Math.round(Number(amount) * 100) / 100);

  const params: Record<string, string> = {
    public_key: publicKey,
    action: 'pay',
    amount: safeAmount.toFixed(2),
    currency: 'EUR',
    description: `Watta Sushi #${orderId}`,
    order_id: String(orderId),
    result_url: `${frontendUrl}/checkout/success?orderId=${orderId}`,
    version: '3',
  };

  const apiPublicUrl = getPublicApiUrl();
  if (apiPublicUrl) {
    params.server_url = `${apiPublicUrl}/api/payment/webhook`;
  }

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
  if (code === 'P2022') {
    return 'Сервер потребує оновлення бази даних. Зверніться до підтримки або спробуйте пізніше.';
  }
  return 'Помилка при створенні замовлення';
}

/**
 * Compensating transaction: rolls back a failed CARD order.
 * Deletes the order and restores bonus balance (in EUR).
 * Errors are logged but not re-thrown — we're already in an error path.
 */
async function rollbackFailedCardOrder(
  orderId: number,
  usedBonusEur: number,
  userId: number | null,
) {
  try {
    await prisma.order.delete({ where: { id: orderId } });
  } catch (e) {
    console.error(`[Rollback] Failed to delete order #${orderId}:`, e);
  }
  if (usedBonusEur > 0 && userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { bonusBalance: { increment: usedBonusEur } },
      });
    } catch (e) {
      console.error(`[Rollback] CRITICAL: failed to restore ${usedBonusEur} EUR bonus for user #${userId}:`, e);
    }
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
      totalAmount,        // CLIENT value — audit logging only, NEVER used in price calculations
      // merchandiseTotal — intentionally excluded from trusted inputs.
      //   It was a price-manipulation vector: client could send 0.01 to pay near-nothing.
      //   Server always computes merchandise from DB prices via lineSubtotalCents().
      deliveryPrice,      // CLIENT value — used ONLY in legacy CASH fallback (Path 3, see below).
      //   Ignored when deliveryQuoteToken or deliveryZoneId is present.
      //   Fully disabled when DELIVERY_STRICT_VERIFICATION=1.
      fulfillmentType,
      deliveryQuoteToken,  // HMAC-signed token from /delivery/check (primary path)
      deliveryZoneId,      // Zone ID for DB-lookup path (map zone selection)
      usedBonuses,
      noCallbackConfirm,
      noDoorbellRing,
      dataProcessingConsent,
      clientRequestId,     // Client-generated UUID for idempotency (optional but recommended)
      scheduledForDate,
      scheduledForSlot,
    } = req.body;

    if (dataProcessingConsent !== true) {
      res.status(400).json({
        message:
          'Потрібна згода на обробку персональних даних. Поставте галочку під номером телефону.',
      });
      return;
    }

    const payMethod = String(paymentMethod || 'CASH').toUpperCase() === 'CARD' ? 'CARD' : 'CASH';
    const sitePay = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { cardOnlineEnabled: true },
    });
    if (payMethod === 'CARD' && !canProcessCardPayment(sitePay?.cardOnlineEnabled)) {
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

    // ── Idempotency check ───────────────────────────────────────────────────
    // Guards against: double-click, network retry, mobile reconnect, frontend retry.
    // The clientRequestId is a UUID generated by the frontend per checkout session.
    // If found in DB → return cached response without creating a duplicate order.
    const crid =
      typeof clientRequestId === 'string' && clientRequestId.trim()
        ? clientRequestId.trim().slice(0, 64)
        : null;

    if (crid) {
      const existing = await prisma.order.findUnique({
        where: { clientRequestId: crid },
        include: { items: { include: { product: true } } },
      });
      if (existing) {
        // For CARD orders, try to retrieve and return the Stripe session URL
        if (existing.paymentMethod === 'CARD' && existing.stripeCheckoutSessionId) {
          const stripe = getStripeClient();
          if (stripe) {
            try {
              const session = await stripe.checkout.sessions.retrieve(
                existing.stripeCheckoutSessionId,
              );
              if (session.url && session.status !== 'expired') {
                res.json({ ...existing, stripeUrl: session.url });
                return;
              }
            } catch {
              // Session expired or Stripe error — inform client
            }
          }
          res.status(409).json({
            message:
              'Платіж вже ініційований, але сесія оплати закінчилась. Оновіть сторінку для нового замовлення.',
            existingOrderId: existing.id,
          });
          return;
        }
        // CASH or pickup: idempotent success — return existing order
        res.json(existing);
        return;
      }
    }

    // ── Cart items: parse and deduplicate ───────────────────────────────────
    const rawItems = Array.isArray(items) ? items : [];
    if (rawItems.length === 0) {
      res.status(400).json({ message: 'Кошик порожній' });
      return;
    }

    // Accumulate quantities for the same productId (handles duplicates gracefully)
    const quantityByProductId = new Map<number, number>();
    for (const item of rawItems) {
      const productId = parseInt(String(item?.id ?? item?.productId), 10);
      if (!Number.isFinite(productId) || productId <= 0) continue;
      const qty = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(Number(item?.quantity ?? 1))));
      quantityByProductId.set(productId, (quantityByProductId.get(productId) ?? 0) + qty);
    }

    if (quantityByProductId.size === 0) {
      res.status(400).json({ message: 'Некоректні товари в кошику. Оновіть кошик.' });
      return;
    }

    const parsedScheduleDate =
      parseScheduledForDate(scheduledForDate) ?? getAmsterdamTodayKey();
    const parsedScheduleSlot = parseScheduledForSlot(scheduledForSlot) ?? 'asap';
    const scheduleCheck = assertScheduledDeliveryAllowed(
      parsedScheduleDate,
      parsedScheduleSlot,
    );
    if (!scheduleCheck.ok) {
      res.status(400).json({ message: scheduleCheck.message });
      return;
    }

    // ── Load products from DB ────────────────────────────────────────────────
    // ONLY non-archived products. Prices come exclusively from DB — client prices are IGNORED.
    const productIds = [...quantityByProductId.keys()];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isArchived: false },
    });

    if (products.length !== productIds.length) {
      // One or more products were archived, deleted, or have an invalid ID.
      // This can happen when the user has stale cart data from before a menu change.
      res.status(409).json({
        message:
          'Деякі товари в кошику більше недоступні або були змінені. Оновіть кошик і спробуйте знову.',
      });
      return;
    }

    // ── Build DB-authoritative pricing lines ─────────────────────────────────
    // buildPricingLine() uses DB price + DB promoDiscountPercent.
    // The client-supplied `price` field in each item is completely disregarded.
    const productById = new Map(products.map((p) => [p.id, p]));
    const pricingLines: PricingLine[] = [];
    for (const [productId, rawQty] of quantityByProductId) {
      const p = productById.get(productId)!;
      pricingLines.push(
        buildPricingLine(
          productId,
          rawQty,
          Number(p.price),
          Number(p.promoDiscountPercent ?? 0),
        ),
      );
    }

    // All subsequent price calculations use integer cents (avoids float accumulation).
    const subtotalCents = lineSubtotalCents(pricingLines);

    // ── Site settings ────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // Delivery fee — server-authoritative, three paths in priority order.
    //
    // Staged deployment strategy (set DELIVERY_STRICT_VERIFICATION in Render):
    //   Phase 1 — default (unset): Path 3 CASH fallback ON for backward compat.
    //             Old frontend (no token) still works. CARD always strict.
    //   Phase 2 — DELIVERY_STRICT_VERIFICATION=1: Path 3 disabled for ALL.
    //             Set this AFTER confirming new frontend is fully deployed + CDN cache expired.
    // ─────────────────────────────────────────────────────────────────────────
    const deliveryStrictMode = process.env.DELIVERY_STRICT_VERIFICATION === '1';
    let deliveryCents = 0;

    if (fulfillment === 'DELIVERY') {

      if (deliveryQuoteToken) {
        // ── Path 1 (primary): HMAC-signed token from /delivery/check ─────────
        // Token embeds the fee calculated by the server during geocoding.
        // Client cannot alter the fee without invalidating the HMAC signature.
        const quoteResult = verifyDeliveryQuote(String(deliveryQuoteToken));

        if (!quoteResult.ok) {
          const hint =
            quoteResult.reason === 'expired'
              ? 'Сесія доставки закінчилась (більше 30 хв). Оновіть адресу і спробуйте знову.'
              : 'Некоректні дані доставки. Оновіть сторінку і спробуйте знову.';
          res.status(400).json({ message: hint });
          return;
        }

        deliveryCents = eurToCents(quoteResult.payload.fee);
        console.log(
          `[Order] Delivery fee from signed quote: ${centsToEur(deliveryCents)} EUR ` +
            `(cityId=${quoteResult.payload.cityId}, NL=${quoteResult.payload.isNlTariff ?? false})`,
        );

      } else if (deliveryZoneId) {
        // ── Path 2 (map zone selection): fee from DB by zone ID ──────────────
        // Client supplies a zone ID; server fetches the fee from DB.
        // Client cannot manipulate the fee — only the zone choice.
        const zid = Number(deliveryZoneId);
        if (Number.isFinite(zid) && zid > 0) {
          const zone = await prisma.deliveryZone.findUnique({ where: { id: zid } });
          if (zone) {
            if (zone.isFreeDelivery) {
              deliveryCents = 0;
            } else if (zone.flatDeliveryFee != null) {
              deliveryCents = eurToCents(Number(zone.flatDeliveryFee));
            } else {
              // Zone exists but has no explicit fee → use site default
              deliveryCents = eurToCents(siteSettings?.deliveryFee ?? 0);
            }
            console.log(
              `[Order] Delivery fee from zone #${zid} DB lookup: ${centsToEur(deliveryCents)} EUR`,
            );
          } else {
            console.warn(
              `[Order] deliveryZoneId=${zid} not found in DB — delivery fee defaults to 0`,
            );
          }
        }

      } else if (!deliveryStrictMode && payMethod === 'CASH') {
        // ── Path 3 (legacy CASH fallback — backward compatibility) ────────────
        // Active when DELIVERY_STRICT_VERIFICATION is unset (default).
        // Allows old frontend clients (without deliveryQuoteToken) to still place
        // CASH orders during the deployment transition window.
        //
        // CARD is ALWAYS rejected here — financial risk is too high.
        // CASH: we accept the client-supplied deliveryPrice with a warning.
        //
        // To disable this path (after frontend is confirmed fully deployed):
        //   Set DELIVERY_STRICT_VERIFICATION=1 in Render environment variables.
        const clientDelivery = Number(deliveryPrice);
        if (Number.isFinite(clientDelivery) && clientDelivery >= 0) {
          deliveryCents = eurToCents(clientDelivery);
          console.warn(
            `[Order] LEGACY CASH fallback used — no deliveryQuoteToken from client. ` +
              `clientDeliveryPrice=${clientDelivery} EUR. ` +
              `Set DELIVERY_STRICT_VERIFICATION=1 after frontend fully deployed.`,
          );
        }

      } else {
        // ── Path 3 blocked: strict mode or CARD without token ────────────────
        // Fires when:
        //   a) DELIVERY_STRICT_VERIFICATION=1 and no token/zoneId provided, OR
        //   b) CARD order with no token at any time (always strict for CARD)
        const reason = deliveryStrictMode
          ? 'strict mode active (DELIVERY_STRICT_VERIFICATION=1)'
          : `CARD order without token, payMethod=${payMethod}`;
        console.error(
          `[Order] Delivery rejected — no valid verification. ${reason}. ` +
            `address="${String(address || '').slice(0, 60)}"`,
        );
        res.status(400).json({
          message:
            'Адреса доставки не підтверджена. Будь ласка, перевірте адресу та спробуйте ще раз.',
        });
        return;
      }

      // ── Server-enforced free delivery threshold ───────────────────────────
      // This runs unconditionally after any of the paths above.
      // Even a valid signed token cannot claim free delivery if the order doesn't qualify.
      const freeThreshold = siteSettings?.freeDeliveryThreshold ?? Infinity;
      const deliveryCentsAfterThreshold = applyFreeDeliveryThreshold(
        deliveryCents,
        subtotalCents,
        freeThreshold,
      );
      if (deliveryCentsAfterThreshold === 0 && deliveryCents > 0) {
        console.log(
          `[Order] Free delivery applied: subtotal=${centsToEur(subtotalCents)} EUR >= threshold=${freeThreshold} EUR`,
        );
      }
      deliveryCents = deliveryCentsAfterThreshold;
    }

    // ── Bonus calculation ─────────────────────────────────────────────────────
    const preBonusTotalCents = subtotalCents + deliveryCents;
    const requestedBonusEur = Number(usedBonuses) || 0;
    let safeUsedBonusCents = 0;
    const effectiveUserId = getAuthUserId(req);

    if (requestedBonusEur > 0) {
      if (!effectiveUserId) {
        res.status(400).json({
          message: 'Списувати бонуси може лише авторизований користувач',
        });
        return;
      }
      // capBonusDiscount prevents over-deduction (bonus capped at pre-discount order total)
      safeUsedBonusCents = capBonusDiscount(requestedBonusEur, preBonusTotalCents);
    }

    const finalTotalCents = calculateFinalTotalCents(subtotalCents, deliveryCents, safeUsedBonusCents);
    const finalTotalEur = centsToEur(finalTotalCents);
    const deliveryFeeEur = centsToEur(deliveryCents);
    const safeUsedBonusEur = centsToEur(safeUsedBonusCents);

    // Audit: compare server total with what the client expected (logging only, no effect on flow)
    const clientTotal = totalAmount != null ? Number(totalAmount) : NaN;
    if (Number.isFinite(clientTotal) && Math.abs(clientTotal - finalTotalEur) > 0.05) {
      console.warn(
        `[Order] Total mismatch AUDIT — client=${clientTotal}, server=${finalTotalEur} ` +
          `(subtotal=${centsToEur(subtotalCents)}, delivery=${deliveryFeeEur}, bonus=${safeUsedBonusEur})`,
      );
    }

    // ── Atomic order creation with race-safe bonus deduction ─────────────────
    // The bonus deduction uses a conditional SQL UPDATE inside the transaction.
    // This eliminates the TOCTOU race condition: two concurrent requests reading
    // the same balance would both try to decrement, but only one WHERE clause
    // (balance >= amount) can succeed. The other gets affected=0 → throws.
    const order = await prisma.$transaction(async (tx) => {
      if (safeUsedBonusCents > 0 && effectiveUserId) {
        const affected: number = await tx.$executeRaw`
          UPDATE "User"
          SET "bonusBalance" = "bonusBalance" - ${safeUsedBonusEur}
          WHERE id = ${effectiveUserId}
            AND "bonusBalance" >= ${safeUsedBonusEur}
        `;
        if (affected === 0) {
          // Either insufficient balance OR a concurrent request already spent the bonus
          throw Object.assign(
            new Error('Недостатньо бонусів на балансі'),
            { code: 'INSUFFICIENT_BONUS' },
          );
        }
      }

      return tx.order.create({
        data: {
          clientRequestId: crid,
          customerName: String(name || customerName || 'Гість'),
          phone: String(phone || ''),
          address: String(address || ''),
          fulfillmentType: fulfillment,
          deliveryFee: deliveryFeeEur,
          paymentMethod: payMethod,
          comment: comment || null,
          scheduledForDate: parsedScheduleDate,
          scheduledForSlot: parsedScheduleSlot,
          noCallbackConfirm: Boolean(noCallbackConfirm),
          noDoorbellRing: Boolean(noDoorbellRing),
          dataProcessingConsentAt: new Date(),
          totalPrice: finalTotalEur,
          usedBonuses: safeUsedBonusEur,
          status: 'PENDING',
          userId: effectiveUserId,
          items: {
            create: pricingLines.map((line) => {
              const p = productById.get(line.productId)!;
              return {
                productId: line.productId,
                quantity: line.quantity,
                price: line.unitPriceEur,
                productNameSnapshot: String(p.name_ru || '').trim(),
              };
            }),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });

    // ── Post-creation side effects ────────────────────────────────────────────
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
      if (fulfillment === 'DELIVERY') {
        try {
          await saveUserAddressIfNew(prisma, effectiveUserId, String(address || ''));
        } catch (saveAddrErr) {
          console.error('[Order] saveUserAddressIfNew:', saveAddrErr);
        }
      }
    }

    // ── CASH: fire notifications and respond ──────────────────────────────────
    if (payMethod === 'CASH') {
      Promise.allSettled([
        sendTelegramNotification(order, order.items),
        addOrderToSheet(order, order.items),
      ]).then(() => console.log('Notifications processed'));

      if (effectiveUserId) {
        const user = await prisma.user.findUnique({
          where: { id: effectiveUserId },
          select: { email: true },
        });
        if (user?.email) {
          sendOrderReceipt(order as any, user.email).catch((e) =>
            console.error('Failed to send CASH receipt:', e),
          );
        }
      }

      res.json(order);
      return;
    }

    // ── CARD: Stripe checkout ─────────────────────────────────────────────────
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripeClient();

    if (stripe) {
      try {
        // finalTotalCents is server-authoritative. Stripe minimum is 50 cents.
        const amountCents = Math.max(50, finalTotalCents);
        const session = await stripe.checkout.sessions.create(
          {
            payment_method_types: ['card', 'ideal'],
            line_items: [
              {
                price_data: {
                  currency: 'eur',
                  product_data: { name: `Watta Sushi — замовлення #${order.id}` },
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
          },
          // Idempotency key: if the network fails and the request is retried with the same
          // order ID, Stripe returns the same session instead of creating a duplicate.
          { idempotencyKey: `watta-order-${order.id}` },
        );

        await prisma.order.update({
          where: { id: order.id },
          data: { stripeCheckoutSessionId: session.id },
        });

        res.json({ ...order, stripeUrl: session.url });
        return;
      } catch (stripeErr) {
        console.error('Stripe checkout session error:', stripeErr);
        await rollbackFailedCardOrder(order.id, safeUsedBonusEur, effectiveUserId);
        res.status(502).json({
          message:
            'Не вдалося відкрити оплату карткою. Спробуйте готівку або повторіть пізніше.',
        });
        return;
      }
    }

    // ── CARD: LiqPay fallback ─────────────────────────────────────────────────
    if (hasLiqPayConfigured()) {
      try {
        const liqpay = buildLiqPayCheckout(order.id, finalTotalEur);
        res.json({ ...order, liqpay });
        return;
      } catch (liqErr) {
        console.error('LiqPay checkout error:', liqErr);
        await rollbackFailedCardOrder(order.id, safeUsedBonusEur, effectiveUserId);
        res.status(502).json({
          message: 'Не вдалося відкрити онлайн-оплату. Спробуйте готівку.',
        });
        return;
      }
    }

    await rollbackFailedCardOrder(order.id, safeUsedBonusEur, effectiveUserId);
    res.status(503).json({
      message: 'Онлайн-оплата тимчасово недоступна. Оберіть «Готівка».',
    });

  } catch (error) {
    // INSUFFICIENT_BONUS: atomic deduction failed (race condition or genuinely empty balance)
    if ((error as { code?: string }).code === 'INSUFFICIENT_BONUS') {
      res.status(400).json({ message: (error as Error).message });
      return;
    }
    // P2002: unique constraint violation on clientRequestId — two concurrent identical requests.
    // The second one loses the race and gets a 409.
    if ((error as { code?: string }).code === 'P2002') {
      console.warn('[Order] Duplicate clientRequestId race — returning 409');
      res.status(409).json({
        message: 'Замовлення вже обробляється. Будь ласка, зачекайте або оновіть сторінку.',
      });
      return;
    }
    console.error('Order creation error:', error);
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