import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwtSecret';

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

router.get('/my', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '30'), 10) || 30));
    const items = await prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const unreadCount = await prisma.userNotification.count({
      where: { userId, isRead: false },
    });
    res.json({ items, unreadCount });
  } catch (e) {
    console.error('GET notifications/my:', e);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  try {
    const updated = await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (updated.count === 0) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/read-all', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
