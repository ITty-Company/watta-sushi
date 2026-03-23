import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body as { orderId?: number | string };
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { product: true } } }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 1. Получаем ключи
    const publicKey = process.env.LIQPAY_PUBLIC_KEY;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      throw new Error('LIQPAY_PUBLIC_KEY/LIQPAY_PRIVATE_KEY are not set');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // 2. Формируем параметры (ОБЯЗАТЕЛЬНО с public_key)
    const params = {
      public_key: publicKey,
      action: 'pay',
      amount: Number(order.totalPrice).toFixed(2),
      currency: 'UAH',
      description: `Order #${order.id}`,
      order_id: String(order.id),
      result_url: `${frontendUrl}/checkout/success?orderId=${order.id}`,
      version: '3',
    };

    // 3. Кодируем в Base64
    const data = Buffer.from(JSON.stringify(params)).toString('base64');

    // 4. Создаем подпись с помощью встроенного crypto
    const signString = privateKey + data + privateKey;
    const signature = crypto.createHash('sha1').update(signString).digest('base64');

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PENDING' }
    });

    // 5. Возвращаем готовые строки на фронтенд
    return res.json({ data, signature });
    
  } catch (e: any) {
    console.error('LiqPay create checkout error:', e);
    return res.status(500).json({ message: e?.message || 'Payment create failed' });
  }
});

// Reserved endpoint (LiqPay server callbacks can be handled here in next step)
router.post('/webhook', async (req: Request, res: Response) => {
  return res.json({ received: true, provider: 'liqpay' });
});

export default router;