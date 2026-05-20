import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMassPromo } from '../services/email.service';
import { checkAdmin } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

function phoneDigits(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

function matchesSearch(
  q: string,
  fields: (string | null | undefined)[],
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => String(f || '').toLowerCase().includes(needle));
}

type CustomerAggregate = {
  phoneKey: string;
  displayPhone: string;
  customerName: string;
  email: string | null;
  userId: number | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  dataProcessingConsentAt: string | null;
  bonusBalance: number;
  registered: boolean;
};

function buildCustomerDirectory(
  orders: {
    id: number;
    phone: string;
    customerName: string;
    totalPrice: number;
    createdAt: Date;
    dataProcessingConsentAt: Date | null;
    userId: number | null;
    user: { id: number; name: string | null; email: string; phone: string | null; bonusBalance: number } | null;
  }[],
  users: {
    id: number;
    name: string | null;
    email: string;
    phone: string | null;
    bonusBalance: number;
    createdAt: Date;
  }[],
): Map<string, CustomerAggregate> {
  const map = new Map<string, CustomerAggregate>();

  for (const order of orders) {
    const key = phoneDigits(order.phone);
    if (!key) continue;
    const existing = map.get(key);
    const consentIso = order.dataProcessingConsentAt?.toISOString() ?? null;
    const orderAt = order.createdAt.toISOString();
    if (!existing) {
      map.set(key, {
        phoneKey: key,
        displayPhone: order.phone.trim() || order.phone,
        customerName: order.customerName || order.user?.name || '—',
        email: order.user?.email ?? null,
        userId: order.userId ?? order.user?.id ?? null,
        orderCount: 1,
        totalSpent: order.totalPrice,
        lastOrderAt: orderAt,
        dataProcessingConsentAt: consentIso,
        bonusBalance: Number(order.user?.bonusBalance ?? 0),
        registered: Boolean(order.userId ?? order.user),
      });
      continue;
    }
    existing.orderCount += 1;
    existing.totalSpent += order.totalPrice;
    if (orderAt > (existing.lastOrderAt || '')) {
      existing.lastOrderAt = orderAt;
      existing.displayPhone = order.phone.trim() || order.phone;
      existing.customerName = order.customerName || existing.customerName;
      if (consentIso) existing.dataProcessingConsentAt = consentIso;
    }
    if (!existing.email && order.user?.email) existing.email = order.user.email;
    if (!existing.userId && (order.userId ?? order.user?.id)) {
      existing.userId = order.userId ?? order.user?.id ?? null;
      existing.registered = true;
      existing.bonusBalance = Number(order.user?.bonusBalance ?? existing.bonusBalance);
    }
  }

  for (const user of users) {
    const key = phoneDigits(user.phone || '');
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      if (!existing.email) existing.email = user.email;
      if (!existing.userId) {
        existing.userId = user.id;
        existing.registered = true;
        existing.bonusBalance = Number(user.bonusBalance ?? 0);
      }
      if (!existing.customerName || existing.customerName === '—') {
        existing.customerName = user.name || existing.customerName;
      }
      continue;
    }
    map.set(key, {
      phoneKey: key,
      displayPhone: String(user.phone || '').trim(),
      customerName: user.name || '—',
      email: user.email,
      userId: user.id,
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
      dataProcessingConsentAt: null,
      bonusBalance: Number(user.bonusBalance ?? 0),
      registered: true,
    });
  }

  return map;
}

router.get('/users', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        bonusBalance: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('CRM users error:', error);
    res.status(500).json({ message: 'Ошибка получения пользователей CRM' });
  }
});

router.get('/customers', checkAdmin, async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');

    const [orders, users] = await Promise.all([
      prisma.order.findMany({
        where: { phone: { not: '' } },
        select: {
          id: true,
          phone: true,
          customerName: true,
          totalPrice: true,
          createdAt: true,
          dataProcessingConsentAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              bonusBalance: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bonusBalance: true,
          createdAt: true,
        },
      }),
    ]);

    const directory = buildCustomerDirectory(orders, users);
    let customers = [...directory.values()].sort((a, b) => {
      const aT = a.lastOrderAt || '';
      const bT = b.lastOrderAt || '';
      return bT.localeCompare(aT);
    });

    if (q.trim()) {
      customers = customers.filter((c) =>
        matchesSearch(q, [
          c.customerName,
          c.displayPhone,
          c.phoneKey,
          c.email,
        ]),
      );
    }

    res.json(customers);
  } catch (error) {
    console.error('CRM customers error:', error);
    res.status(500).json({ message: 'Ошибка получения базы клиентов' });
  }
});

router.get('/customers/detail', checkAdmin, async (req: Request, res: Response) => {
  try {
    const phoneKey = phoneDigits(String(req.query.phone || ''));
    if (!phoneKey) {
      return res.status(400).json({ message: 'Укажите phone' });
    }

    const orders = await prisma.order.findMany({
      where: {
        phone: { not: '' },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name_ru: true,
                name_ua: true,
                name_en: true,
                name_nl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            bonusBalance: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const matchedOrders = orders.filter((o) => phoneDigits(o.phone) === phoneKey);
    const linkedUser = matchedOrders.find((o) => o.user)?.user ?? null;
    const user =
      linkedUser ??
      (await prisma.user
        .findMany({
          where: { phone: { not: '' } },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            bonusBalance: true,
            createdAt: true,
          },
        })
        .then((list) => list.find((u) => phoneDigits(u.phone || '') === phoneKey) ?? null));

    const latest = matchedOrders[0];
    const totalSpent = matchedOrders.reduce((s, o) => s + o.totalPrice, 0);

    res.json({
      phoneKey,
      displayPhone: latest?.phone || user?.phone || phoneKey,
      customerName: latest?.customerName || user?.name || '—',
      email: user?.email ?? null,
      userId: user?.id ?? latest?.userId ?? null,
      bonusBalance: Number(user?.bonusBalance ?? 0),
      registered: Boolean(user),
      orderCount: matchedOrders.length,
      totalSpent,
      dataProcessingConsentAt:
        matchedOrders.find((o) => o.dataProcessingConsentAt)?.dataProcessingConsentAt?.toISOString() ??
        null,
      orders: matchedOrders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        totalPrice: o.totalPrice,
        usedBonuses: o.usedBonuses,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        fulfillmentType: o.fulfillmentType,
        deliveryFee: o.deliveryFee,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        comment: o.comment,
        noCallbackConfirm: o.noCallbackConfirm,
        noDoorbellRing: o.noDoorbellRing,
        dataProcessingConsentAt: o.dataProcessingConsentAt,
        items: o.items.map((line) => ({
          id: line.id,
          quantity: line.quantity,
          price: line.price,
          productId: line.productId,
          productName: line.product?.name_ru || `ID ${line.productId}`,
        })),
      })),
    });
  } catch (error) {
    console.error('CRM customer detail error:', error);
    res.status(500).json({ message: 'Ошибка получения карточки клиента' });
  }
});

router.post('/send-promo', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { channel, subject, message } = req.body as {
      channel?: 'email' | 'sms';
      subject?: string;
      message?: string;
    };

    if (!channel || !message) {
      return res.status(400).json({ message: 'channel и message обязательны' });
    }

    const users = await prisma.user.findMany({
      select: { email: true, phone: true, name: true },
    });

    if (channel === 'email') {
      const emails = users.map((u) => String(u.email || '').trim()).filter(Boolean);
      await sendMassPromo(emails, subject || 'Watta Sushi promo', message);
      return res.json({ success: true, channel: 'email', count: emails.length });
    }

    const phones = users.map((u) => String(u.phone || '').trim()).filter(Boolean);
    console.log('SMS promo placeholder:', { subject, message, phonesCount: phones.length });
    return res.json({ success: true, channel: 'sms', count: phones.length });
  } catch (error) {
    console.error('CRM send-promo error:', error);
    res.status(500).json({ message: 'Ошибка отправки рассылки' });
  }
});

export default router;
