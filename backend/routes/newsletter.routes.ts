import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNewsletterEmail } from '../utils/mailer';
import { checkAdmin } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Отправка рассылки (только ADMIN)
router.post('/send', checkAdmin, async (req: any, res: any) => {
  const { subject, message, promoCode } = req.body;

  try {
    // Получаем всех пользователей (или только подписанных, если добавите поле isSubscribed)
    const users = await prisma.user.findMany({
      select: { email: true }
    });

    const emails = users.map(u => u.email);
    
    if (emails.length === 0) {
      return res.status(400).json({ message: 'Нет пользователей для рассылки' });
    }

    // Формируем красивый HTML
    const safeMessage = escapeHtml(String(message || '')).replace(/\n/g, '<br>')
    const safePromo = promoCode ? escapeHtml(String(promoCode)) : ''
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h1 style="color: #155044;">Watta Sushi News</h1>
        <div style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          ${safeMessage}
        </div>
        ${promoCode ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Ваш промокод:</p>
            <h2 style="color: #ff6b35; margin: 10px 0; font-size: 24px;">${safePromo}</h2>
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Вы получили это письмо, так как зарегистрированы в Watta Sushi.</p>
      </div>
    `;

    await sendNewsletterEmail(emails, subject, htmlContent);

    res.json({ success: true, count: emails.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка отправки рассылки' });
  }
});

export default router;