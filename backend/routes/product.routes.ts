import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAdmin } from '../authMiddleware'; // Твой вышибала

const router = Router();
const prisma = new PrismaClient();

// 1. Получить ВСЕ товары (для Меню)
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true } // Подгружаем название категории
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
});

// 2. Получить ВСЕ категории (для выпадающего списка в Админке)
// Важно: этот маршрут должен быть ДО '/:id', иначе сервер подумает, что "categories" это ID
router.get('/categories', async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка получения категорий' });
    }
  });

// 3. Создать товар (ТОЛЬКО АДМИН) 🛡️
router.post('/', checkAdmin, async (req: any, res: any) => {
  try {
    const { name_ru, price, description, imageUrl, categoryId } = req.body;

    // Простая валидация
    if (!name_ru || !price || !categoryId) {
      return res.status(400).json({ message: 'Заполните обязательные поля' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name_ru,
        price: parseFloat(price),
        description: description || '',
        imageUrl: imageUrl || '',
        category: { connect: { id: parseInt(categoryId) } } // Связываем с категорией
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось создать товар' });
  }
});

// 4. Удалить товар (ТОЛЬКО АДМИН) 🛡️
router.delete('/:id', checkAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Товар удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

export default router;