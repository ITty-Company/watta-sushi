import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 1. Получить список ID избранного для текущего пользователя
router.get('/', async (req: any, res: any) => {
  try {
    // Мы ожидаем, что userId придет из middleware авторизации или query (для простоты берем из query пока, но лучше из токена)
    // В вашем случае, скорее всего, вы будете слать заголовок Authorization. 
    // Для простоты реализации сейчас я достану userId из заголовка кастомного, если у вас нет middleware на этот роут.
    // НО ПРАВИЛЬНЕЕ: использовать decoded token. 
    // Предположим, вы передаете userId в query для скорости, или парсите токен.
    
    // ВАЖНО: Здесь нужен реальный userId. 
    // Если у вас есть authMiddleware, раскомментируйте его использование.
    const userId = Number(req.headers['x-user-id']); // Временное решение для простоты, на фронте передадим

    if (!userId) return res.json([]);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { productId: true }
    });

    res.json(favorites.map(f => f.productId)); // Возвращаем просто массив ID: [1, 5, 12]
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

// 2. Переключить избранное (Toggle)
router.post('/toggle', async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    const userId = Number(req.headers['x-user-id']); // Получаем ID юзера

    if (!userId) return res.status(401).json({ message: 'Нужна авторизация' });

    // Проверяем, лайкнуто ли уже
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });

    if (existing) {
      // Если есть - удаляем (дизлайк)
      await prisma.favorite.delete({
        where: { userId_productId: { userId, productId } }
      });
      return res.json({ added: false });
    } else {
      // Если нет - создаем (лайк)
      await prisma.favorite.create({
        data: { userId, productId }
      });
      return res.json({ added: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/list', async (req: any, res: any) => {
  try {
    const userId = Number(req.headers['x-user-id']); 
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true // Если нужно название категории
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Возвращаем чистый массив продуктов
    const products = favorites.map(f => f.product);
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching favorites list' });
  }
});

export default router;