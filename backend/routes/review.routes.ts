import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';

function getAuthUserId(req: Request): number | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, SECRET_KEY) as { userId?: string | number };
    const parsed = Number(decoded.userId);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function maskAuthorName(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'Гість';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const w = parts[0];
    return w.length <= 2 ? `${w}*` : `${w.slice(0, 2)}***`;
  }
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function normalizeImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string').slice(0, 8);
}

/** Публічна стрічка відгуків */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.orderReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true } },
      },
    });
    res.json(
      rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        images: normalizeImages(r.images as unknown),
        createdAt: r.createdAt,
        authorName: maskAuthorName(r.user?.name),
      }))
    );
  } catch (error) {
    console.error('reviews list error:', error);
    res.status(500).json({ message: 'Помилка завантаження відгуків' });
  }
});

/** Створити відгук (лише власник замовлення, після COMPLETED/DELIVERED) */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Потрібна авторизація' });
      return;
    }

    const { orderId, rating, text, images } = req.body;
    const oid = Number(orderId);
    if (!Number.isFinite(oid)) {
      res.status(400).json({ message: 'Невірний orderId' });
      return;
    }
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      res.status(400).json({ message: 'Оцінка від 1 до 5' });
      return;
    }
    const txt = String(text ?? '').trim();
    if (txt.length < 3) {
      res.status(400).json({ message: 'Напишіть хоча б кілька слів' });
      return;
    }
    if (txt.length > 4000) {
      res.status(400).json({ message: 'Текст занадто довгий' });
      return;
    }

    const imgArr = normalizeImages(images);
    let totalChars = 0;
    for (const s of imgArr) {
      if (s.length > 1_200_000) {
        res.status(400).json({ message: 'Одне з фото занадто велике' });
        return;
      }
      totalChars += s.length;
    }
    if (totalChars > 4_000_000) {
      res.status(400).json({ message: 'Занадто багато вкладень' });
      return;
    }

    const order = await prisma.order.findFirst({
      where: { id: oid, userId },
    });
    if (!order) {
      res.status(404).json({ message: 'Замовлення не знайдено' });
      return;
    }
    const terminal = order.status === 'COMPLETED' || order.status === 'DELIVERED';
    if (!terminal) {
      res.status(400).json({ message: 'Відгук можна залишити після отримання замовлення' });
      return;
    }

    const exists = await prisma.orderReview.findUnique({ where: { orderId: oid } });
    if (exists) {
      res.status(400).json({ message: 'Ви вже залишили відгук на це замовлення' });
      return;
    }

    const created = await prisma.orderReview.create({
      data: {
        orderId: oid,
        userId,
        rating: Math.round(r),
        text: txt,
        images: imgArr as object,
      },
    });

    res.json(created);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(400).json({ message: 'Відгук вже існує' });
      return;
    }
    console.error('review create error:', error);
    res.status(500).json({ message: 'Не вдалося зберегти відгук' });
  }
});

export default router;
