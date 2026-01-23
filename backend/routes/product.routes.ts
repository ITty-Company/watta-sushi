import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 1. Получить ВСЕ товары (с фильтрацией по городу)
router.get('/', async (req, res) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : null;
    
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        cities: {
          include: { city: true }
        }
      },
      where: cityId ? {
        cities: {
          some: {
            cityId: cityId
          }
        }
      } : undefined
    });
    res.json(products);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ message: 'Ошибка получения товаров' });
  }
});

// Получить один товар по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        cities: {
          include: { city: true }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ message: 'Ошибка получения товара' });
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
      categoryId, imageUrl,
      cityIds // массив ID городов
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
        imageUrl,
        // Связь с городами
        cities: cityIds && Array.isArray(cityIds) && cityIds.length > 0 ? {
          create: cityIds.map((cityId: number) => ({
            cityId: parseInt(cityId)
          }))
        } : undefined
      },
      include: {
        cities: {
          include: { city: true }
        }
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
      imageUrl, categoryId,
      cityIds // массив ID городов
    } = req.body;

    // Сначала удаляем все связи с городами
    await prisma.productCity.deleteMany({
      where: { productId: parseInt(id) }
    });

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
        category: { connect: { id: parseInt(categoryId) } },
        // Обновляем связи с городами
        cities: cityIds && Array.isArray(cityIds) && cityIds.length > 0 ? {
          create: cityIds.map((cityId: number) => ({
            cityId: parseInt(cityId)
          }))
        } : undefined
      },
      include: {
        cities: {
          include: { city: true }
        }
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