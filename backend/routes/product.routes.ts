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
        },
        ingredients: true // <-- Добавили, чтобы сразу видеть ингредиенты
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

// 2. Получить ВСЕ категории (ВАЖНО: должен быть ПЕРЕД роутом /:id)
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения категорий' });
  }
});

// 2.1. Создать категорию
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive } = req.body;
    
    if (!name_ru) {
      return res.status(400).json({ error: 'Название категории (name_ru) обязательно' });
    }
    
    let categorySlug = slug || name_ru.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let finalSlug = categorySlug;
    let counter = 1;
    const maxAttempts = 100;
    
    while (counter <= maxAttempts) {
      const existing = await prisma.category.findUnique({
        where: { slug: finalSlug }
      });
      if (!existing) break;
      finalSlug = `${categorySlug}-${counter}`;
      counter++;
    }
    
    if (counter > maxAttempts) finalSlug = `${categorySlug}-${Date.now()}`;
    
    const category = await prisma.category.create({
      data: {
        name_ru,
        name_ua: name_ua || name_ru,
        name_en: name_en || name_ru,
        name_nl: name_nl || name_ru,
        slug: finalSlug,
        emoji: emoji || '🍣',
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.json(category);
  } catch (error: any) {
    console.error('Ошибка создания категории:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания категории', message: error.message });
  }
});

// 2.2. Обновить категорию
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive } = req.body;
    
    const category = await prisma.category.update({
      where: { id },
      data: { name_ru, name_ua, name_en, name_nl, slug, emoji, order, isActive }
    });
    res.json(category);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// 2.3. Удалить категорию
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    
    if (productsCount > 0) {
      return res.status(400).json({ error: 'Нельзя удалить категорию с товарами.' });
    }
    
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
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
      cityIds, // массив ID городов
      ingredientIds // массив ID ингредиентов
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name_ru,
        name_ua: name_ua || name_ru,
        name_en: name_en || name_ru,
        name_nl: name_nl || name_ru,
        price: Number(price),
        description_ru: description_ru || "", 
        description_ua: description_ua || description_ru || "",
        description_en: description_en || description_ru || "",
        description_nl: description_nl || description_ru || "",
        categoryId: parseInt(categoryId as string), // Исправили ошибку типов
        imageUrl,
        
        // Связь с городами
        cities: cityIds && Array.isArray(cityIds) && cityIds.length > 0 ? {
          create: cityIds.map((cityId: any) => ({
            cityId: parseInt(cityId)
          }))
        } : undefined,

        // Связь с ингредиентами
        ingredients: ingredientIds && Array.isArray(ingredientIds) && ingredientIds.length > 0 ? {
            connect: ingredientIds.map((id: any) => ({ id: Number(id) }))
        } : undefined
      },
      include: {
        cities: { include: { city: true } },
        ingredients: true
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
      cityIds,
      ingredientIds // массив ID ингредиентов
    } = req.body;

    // Сначала удаляем все связи с городами (старый метод)
    await prisma.productCity.deleteMany({
      where: { productId: parseInt(id) }
    });

    // Для ингредиентов проще использовать set: [] внутри update, Prisma сама разберется

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name_ru, name_ua, name_en, name_nl,
        price: Number(price),
        description_ru, description_ua, description_en, description_nl,
        imageUrl: imageUrl || '',
        category: { connect: { id: parseInt(categoryId as string) } },
        
        // Обновляем связи с городами
        cities: cityIds && Array.isArray(cityIds) && cityIds.length > 0 ? {
          create: cityIds.map((cityId: any) => ({
            cityId: parseInt(cityId)
          }))
        } : undefined,

        // Обновляем ингредиенты (перезаписываем список)
        ingredients: {
            set: ingredientIds && Array.isArray(ingredientIds) 
                 ? ingredientIds.map((ingId: any) => ({ id: Number(ingId) }))
                 : []
        }
      },
      include: {
        cities: { include: { city: true } },
        ingredients: true
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

// 6. Получить один товар по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'categories') return res.status(404).json({ message: 'Use /categories endpoint' });
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: 'Invalid ID' });
    
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        cities: { include: { city: true } },
        ingredients: true // <-- Добавили
      }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ message: 'Ошибка получения товара' });
  }
});

router.get('/recommendations', async (req: any, res: any) => {
  try {
    const count = await prisma.product.count();
    const skip = Math.max(0, Math.floor(Math.random() * (count - 4)));
    
    const recommendations = await prisma.product.findMany({
      take: 4,
      skip: skip,
      include: { category: true }
    });
    
    res.json(recommendations);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
});

export default router;