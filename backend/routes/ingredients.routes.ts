import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Получить все ингредиенты
router.get('/', async (req: any, res: any) => {
  const list = await prisma.ingredient.findMany();
  res.json(list);
});

// Создать ингредиент
router.post('/', checkAdmin, async (req: any, res: any) => {
  const { name_ru, name_ua, name_en, name_nl, imageUrl } = req.body;
  const ing = await prisma.ingredient.create({
    data: { name_ru, name_ua, name_en, name_nl, imageUrl }
  });
  res.json(ing);
});

// Удалить ингредиент
router.delete('/:id', checkAdmin, async (req: any, res: any) => {
  await prisma.ingredient.delete({ where: { id: Number(req.params.id) } });
  res.sendStatus(200);
});

export default router;