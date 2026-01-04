import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { checkAdmin } from '../authMiddleware'; // Временно отключаем

const router = Router();
const prisma = new PrismaClient();

// 1. Получить ВСЕ товары
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
});

// 2. Получить ВСЕ категории
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения категорий' });
  }
});

// 3. Создать товар
router.post('/', async (req: any, res: any) => {
  try {
    const { name_ru, price, description, imageUrl, categoryId } = req.body;

    if (!name_ru || !price || !categoryId) {
      return res.status(400).json({ message: 'Заполните обязательные поля' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name_ru,
        price: parseFloat(price),
        // ИСПРАВЛЕНО: description -> description_ru
        description_ru: description || '', 
        imageUrl: imageUrl || '',
        category: { connect: { id: parseInt(categoryId) } }
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось создать товар' });
  }
});

// 4. Обновить товар
router.put('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name_ru, price, description, imageUrl, categoryId } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name_ru,
        price: parseFloat(price),
        // ИСПРАВЛЕНО: description -> description_ru
        description_ru: description || '',
        imageUrl: imageUrl || '',
        category: { connect: { id: parseInt(categoryId) } }
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка обновления товара' });
  }
});

// 5. Удалить товар
router.delete('/:id', async (req: any, res: any) => {
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