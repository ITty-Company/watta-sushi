import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      name_ru, name_ua, name_en, name_nl, 
      price, 
      description_ru, description_ua, description_en, description_nl,
      categoryId, imageUrl 
    } = req.body;

    const product = await prisma.product.create({
      data: {
        // Названия
        name_ru,
        name_ua: name_ua || name_ru,
        name_en: name_en || name_ru,
        name_nl: name_nl || name_ru,
        
        price: parseFloat(price),
        
        // Описания
        description_ru: description_ru || "", 
        description_ua: description_ua || description_ru || "",
        description_en: description_en || description_ru || "",
        description_nl: description_nl || description_ru || "",
        
        categoryId: parseInt(categoryId),
        imageUrl
      }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка создания товара' });
  }
});

// 4. Обновить товар
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name_ru, name_ua, name_en, name_nl,
      price, 
      description_ru, description_ua, description_en, description_nl,
      imageUrl, categoryId 
    } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name_ru,
        name_ua,
        name_en,
        name_nl,
        
        price: parseFloat(price),
        
        description_ru,
        description_ua,
        description_en,
        description_nl,

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
router.delete('/:id', async (req: Request, res: Response) => {
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