import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { productId: true }
    });

    res.json(favorites.map(f => f.productId));
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

router.post('/toggle', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.id;

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_productId: { userId, productId } }
      });
      return res.json({ added: false });
    }
    await prisma.favorite.create({
      data: { userId, productId }
    });
    return res.json({ added: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/list', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const products = favorites.map(f => f.product);
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching favorites list' });
  }
});

export default router;
