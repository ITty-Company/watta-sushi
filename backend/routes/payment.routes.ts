import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  // Stripe Checkout session API
  return new Stripe(secretKey, { apiVersion: '2024-06-20' });
}

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body as { orderId?: number | string };
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { product: true } } }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const lineItems = order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'uah',
        unit_amount: Math.round(item.price * 100), // ₴ -> копейки
        product_data: {
          name: item.product?.name_ru || item.product?.name_en || 'Item'
        }
      }
    }));

    if (order.deliveryFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'uah',
          unit_amount: Math.round(order.deliveryFee * 100),
          product_data: { name: 'Доставка' },
        },
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ message: 'Order has no items' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${frontendUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cart?payment=cancel&session_id={CHECKOUT_SESSION_ID}`,
      metadata: { orderId: String(order.id) }
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        stripeCheckoutSessionId: session.id
      }
    });

    return res.json({ paymentUrl: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('Stripe create session error:', e);
    return res.status(500).json({ message: e?.message || 'Payment create failed' });
  }
});

// Phase 1: minimal webhook handler (signature verification later)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body as any;
    if (!event?.type || !event?.data?.object) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session?.metadata?.orderId;
      if (!orderId) return res.status(200).json({ received: true });

      const paymentStatus = session?.payment_status === 'paid' ? 'PAID' : 'FAILED';

      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          paymentStatus,
          paidAt: paymentStatus === 'PAID' ? new Date() : null,
          // Optional: align order lifecycle with payment
          status: paymentStatus === 'PAID' ? 'CONFIRMED' : undefined
        }
      });
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error('Stripe webhook error:', e);
    return res.status(500).json({ message: e?.message || 'Webhook failed' });
  }
});

export default router;

