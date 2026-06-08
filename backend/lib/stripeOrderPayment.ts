import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { sendOrderReceipt } from '../services/email.service.js'
import { sendTelegramNotification } from '../services/telegram.service.js'
import { addOrderToSheet } from '../services/sheets.service.js'
import { awardOrderCashbackIfEligible } from './bonusCashback.js'
import { notifyUserOrderStatusChange } from '../services/orderUserNotification.service.js'

const prisma = new PrismaClient()

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) return null
  return new Stripe(key)
}

export function requireStripeClient(): Stripe {
  const stripe = getStripeClient()
  if (!stripe) throw new Error('STRIPE_SECRET_KEY не задан')
  return stripe
}

/** Помечает заказ оплаченным после успешной Stripe Checkout Session. */
export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; orderId?: number; alreadyPaid?: boolean; reason?: string }> {
  const orderId = Number(session.metadata?.orderId)
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return { ok: false, reason: 'invalid_order_id' }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true } },
    },
  })

  if (!order) {
    return { ok: false, orderId, reason: 'order_not_found' }
  }

  if (order.paymentStatus === 'PAID') {
    return { ok: true, orderId, alreadyPaid: true }
  }

  if (session.payment_status !== 'paid') {
    return { ok: false, orderId, reason: 'not_paid' }
  }

  if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) {
    return { ok: false, orderId, reason: 'session_mismatch' }
  }

  const previousStatus = order.status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      status: 'CONFIRMED',
    },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true } },
    },
  })

  if (updatedOrder.userId) {
    await notifyUserOrderStatusChange(
      prisma,
      updatedOrder.userId,
      updatedOrder.id,
      'CONFIRMED',
      previousStatus,
      { fulfillmentType: updatedOrder.fulfillmentType },
    ).catch((e) => console.error('[Stripe] notifyUserOrderStatusChange failed:', e))
  }

  if (updatedOrder.userId) {
    await awardOrderCashbackIfEligible(prisma, orderId, updatedOrder.userId).catch((e) =>
      console.error('[Stripe] awardOrderCashbackIfEligible failed:', e),
    )
  }

  const userEmail = updatedOrder.user?.email
  if (userEmail) {
    await sendOrderReceipt(updatedOrder as never, userEmail).catch((e) =>
      console.error('[Stripe] sendOrderReceipt failed:', e),
    )
  }

  await Promise.allSettled([
    sendTelegramNotification(updatedOrder, updatedOrder.items).catch((e) =>
      console.error('[Stripe] sendTelegramNotification failed:', e),
    ),
    addOrderToSheet(updatedOrder, updatedOrder.items).catch((e) =>
      console.error('[Stripe] addOrderToSheet failed:', e),
    ),
  ])

  return { ok: true, orderId }
}

/** Синхронизация статуса оплаты по orderId (fallback без webhook, напр. локальная разработка). */
export async function syncStripeOrderPayment(orderId: number, userId: number | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return { ok: false as const, reason: 'order_not_found' as const }
  if (userId != null && order.userId != null && order.userId !== userId) {
    return { ok: false as const, reason: 'forbidden' as const }
  }
  if (order.paymentMethod !== 'CARD' || !order.stripeCheckoutSessionId) {
    return { ok: false as const, reason: 'not_stripe_order' as const }
  }
  if (order.paymentStatus === 'PAID') {
    return { ok: true as const, alreadyPaid: true as const, paymentStatus: 'PAID' as const }
  }

  const stripe = requireStripeClient()
  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId)
  const result = await fulfillStripeCheckoutSession(session)
  return {
    ok: result.ok,
    alreadyPaid: result.alreadyPaid,
    paymentStatus: result.ok ? ('PAID' as const) : order.paymentStatus,
    reason: result.reason,
  }
}
