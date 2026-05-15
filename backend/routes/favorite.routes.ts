import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

/** Публічно: скільки користувачів додали товар у обране (для лічильника на картці). ids=1,2,3 */
router.get('/counts-by-product', async (req, res) => {
  try {
    const raw = req.query.ids;
    const ids =
      typeof raw === 'string'
        ? raw
            .split(',')
            .map((x) => parseInt(x.trim(), 10))
            .filter((n) => Number.isFinite(n) && n > 0)
        : [];
    if (ids.length === 0) {
      return res.json({});
    }
    const grouped = await prisma.favorite.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _count: { _all: true },
    });
    const out: Record<string, number> = {};
    for (const id of ids) {
      out[String(id)] = 0;
    }
    for (const row of grouped) {
      out[String(row.productId)] = row._count._all;
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({});
  }
});

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
      const count = await prisma.favorite.count({ where: { productId } });
      return res.json({ added: false, count });
    }
    await prisma.favorite.create({
      data: { userId, productId }
    });
    const count = await prisma.favorite.count({ where: { productId } });
    return res.json({ added: true, count });
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
