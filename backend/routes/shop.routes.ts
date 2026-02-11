import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить всё меню (Категории + Товары)
router.get('/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true // Подгружаем товары для каждой категории
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Ошибка загрузки меню:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один товар (например, для модального окна)
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Ошибка товара:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;