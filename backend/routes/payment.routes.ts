import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwtSecret.js';
import { syncStripeOrderPayment } from '../lib/stripeOrderPayment.js';

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

type LiqPayCallbackPayload = {
  order_id?: string;
  status?: string;
  amount?: number | string;
  currency?: string;
  transaction_id?: number | string;
};

function liqPayKeys() {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

function verifyLiqPaySignature(data: string, signature: string, privateKey: string): boolean {
  const expected = crypto.createHash('sha1').update(privateKey + data + privateKey).digest('base64');
  return expected === signature;
}

function parseLiqPayPayload(data: string): LiqPayCallbackPayload | null {
  try {
    const json = Buffer.from(data, 'base64').toString('utf8');
    return JSON.parse(json) as LiqPayCallbackPayload;
  } catch {
    return null;
  }
}

function isLiqPayPaidStatus(status: string | undefined): boolean {
  return status === 'success' || status === 'sandbox';
}

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body as { orderId?: number | string };
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { product: true } } },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const keys = liqPayKeys();
    if (!keys) {
      throw new Error('LIQPAY_PUBLIC_KEY/LIQPAY_PRIVATE_KEY are not set');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const params = {
      public_key: keys.publicKey,
      action: 'pay',
      amount: Number(order.totalPrice).toFixed(2),
      currency: 'EUR',
      description: `Order #${order.id}`,
      order_id: String(order.id),
      result_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
      version: '3',
    };

    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = crypto
      .createHash('sha1')
      .update(keys.privateKey + data + keys.privateKey)
      .digest('base64');

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PENDING' },
    });

    return res.json({ data, signature });
  } catch (e: unknown) {
    console.error('LiqPay create checkout error:', e);
    const message = e instanceof Error ? e.message : 'Payment create failed';
    return res.status(500).json({ message });
  }
});

router.post('/stripe/sync-order', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const orderId = Number((req.body as { orderId?: number | string })?.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const result = await syncStripeOrderPayment(orderId, userId);
    if (result.reason === 'forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (result.reason === 'order_not_found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (result.reason === 'not_stripe_order') {
      return res.status(400).json({ message: 'Not a Stripe card order' });
    }

    return res.json(result);
  } catch (e) {
    console.error('[Stripe] sync-order error:', e);
    return res.status(500).json({ message: 'Failed to sync Stripe payment' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const keys = liqPayKeys();
    if (!keys) {
      return res.status(503).json({ message: 'LiqPay is not configured' });
    }

    const data = typeof req.body?.data === 'string' ? req.body.data : '';
    const signature = typeof req.body?.signature === 'string' ? req.body.signature : '';
    if (!data || !signature) {
      return res.status(400).json({ message: 'Invalid callback payload' });
    }

    if (!verifyLiqPaySignature(data, signature, keys.privateKey)) {
      console.warn('[LiqPay] Invalid webhook signature');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const payload = parseLiqPayPayload(data);
    const orderId = Number(payload?.order_id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid order_id' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({ ok: true, alreadyPaid: true });
    }

    const status = String(payload?.status || '');

    if (isLiqPayPaidStatus(status)) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID' },
      });
      return res.json({ ok: true, status: 'paid' });
    }

    if (status === 'failure' || status === 'error' || status === 'reversed') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return res.json({ ok: true, status: 'failed' });
    }

    return res.json({ ok: true, status: status || 'ignored' });
  } catch (e) {
    console.error('[LiqPay] Webhook error:', e);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;
