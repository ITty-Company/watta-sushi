import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMassPromo } from '../services/email.service';
import { checkAdmin } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

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
