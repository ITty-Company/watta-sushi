/**
 * Stripe Webhook Handler
 *
 * ВАЖНО: этот роут должен получать RAW body (Buffer), а не распарсенный JSON.
 * Stripe верифицирует подпись по точному байтовому содержимому запроса.
 * После JSON.parse → JSON.stringify байты отличаются → подпись не совпадёт.
 *
 * Регистрация в server.js:
 *   app.use('/webhooks/stripe', express.raw({ type: 'application/json' }))
 *   app.use('/webhooks', stripeWebhookRouter)
 *   // ↑ Оба — ДО app.use(express.json())
 */

import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { fulfillStripeCheckoutSession, requireStripeClient } from '../lib/stripeOrderPayment.js'
import { notifyUserOrderStatusChange } from '../services/orderUserNotification.service.js'

const router = Router()
const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Вспомогательные функции
// ---------------------------------------------------------------------------

/** Получаем секрет подписи webhook или бросаем ошибку. */
function requireWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET не задан')
  return secret
}

// ---------------------------------------------------------------------------
// Обработчики конкретных событий
// ---------------------------------------------------------------------------

/**
 * checkout.session.completed — пользователь успешно оплатил.
 * Переводим заказ в PAID + CONFIRMED, рассылаем уведомления.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const result = await fulfillStripeCheckoutSession(session)
  if (result.ok) {
    console.log(`[Stripe Webhook] ✅ Заказ #${result.orderId} → PAID (сессия ${session.id})`)
  } else {
    console.error('[Stripe Webhook] checkout.session.completed failed:', result)
  }
}

/**
 * checkout.session.expired — пользователь не оплатил вовремя (30 мин истекло).
 * Отменяем заказ и возвращаем бонусы.
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = Number(session.metadata?.orderId)
  if (!Number.isFinite(orderId) || orderId <= 0) return

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return

  // Не трогаем уже оплаченные заказы (на случай гонки событий)
  if (order.paymentStatus === 'PAID') {
    console.log(`[Stripe Webhook] Заказ #${orderId} уже PAID — не отменяем по expired`)
    return
  }

  // Уже отменён — идемпотентность
  if (order.status === 'CANCELLED') return

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
    })

    // Возвращаем бонусы, если были списаны при создании заказа
    if (order.usedBonuses > 0 && order.userId) {
      await tx.user.update({
        where: { id: order.userId },
        data: { bonusBalance: { increment: order.usedBonuses } },
      })
      console.log(`[Stripe Webhook] Возвращено ${order.usedBonuses} бонусов пользователю #${order.userId}`)
    }
  })

  console.log(`[Stripe Webhook] Заказ #${orderId} отменён (сессия истекла)`)

  // Уведомляем пользователя
  if (order.userId) {
    await notifyUserOrderStatusChange(prisma, order.userId, orderId, 'CANCELLED', order.status)
      .catch((e) => console.error('[Stripe Webhook] notifyUserOrderStatusChange (expired) failed:', e))
  }
}

// ---------------------------------------------------------------------------
// Основной роут: POST /webhooks/stripe
// ---------------------------------------------------------------------------

router.post('/stripe', async (req: Request, res: Response) => {
  // ── 1. Проверяем конфигурацию ──────────────────────────────────────────
  let stripe: Stripe
  let webhookSecret: string
  try {
    stripe = requireStripeClient()
    webhookSecret = requireWebhookSecret()
  } catch (configErr: any) {
    console.error('[Stripe Webhook] Ошибка конфигурации:', configErr.message)
    // 500 вместо 400 — это наша ошибка, не Stripe, Stripe будет повторять
    return res.status(500).json({ error: 'Webhook не настроен на сервере' })
  }

  // ── 2. Получаем заголовок подписи ─────────────────────────────────────
  const sig = req.headers['stripe-signature']
  if (!sig) {
    console.warn('[Stripe Webhook] Запрос без заголовка stripe-signature')
    return res.status(400).json({ error: 'Отсутствует stripe-signature' })
  }

  // ── 3. Верифицируем подпись ────────────────────────────────────────────
  // req.body здесь — Buffer (express.raw), не объект — это обязательно!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer, // raw bytes
      sig,
      webhookSecret,
    )
  } catch (verifyErr: any) {
    // Подпись не совпала: либо неверный секрет, либо подделка, либо body был распарсен
    console.error('[Stripe Webhook] Ошибка верификации подписи:', verifyErr.message)
    return res.status(400).json({ error: `Webhook Error: ${verifyErr.message}` })
  }

  // ── 4. Отвечаем 200 немедленно ────────────────────────────────────────
  // Stripe считает webhook обработанным, если получит 2xx в течение 30 сек.
  // Вся бизнес-логика выполняется ПОСЛЕ ответа, чтобы не рисковать таймаутом.
  res.json({ received: true, type: event.type })

  // ── 5. Диспетчеризация событий ────────────────────────────────────────
  console.log(`[Stripe Webhook] Получено событие: ${event.type} (id: ${event.id})`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      default:
        // Неизвестное событие — ничего не делаем, не падаем
        console.log(`[Stripe Webhook] Событие ${event.type} не обрабатывается — игнорируем`)
        break
    }
  } catch (handlerErr) {
    // Логируем ошибку, но НЕ возвращаем 5xx (ответ 200 уже отправлен).
    // Stripe не будет делать retry, но мы видим проблему в логах.
    console.error(`[Stripe Webhook] Необработанная ошибка в обработчике ${event.type}:`, handlerErr)
  }
})

export default router
