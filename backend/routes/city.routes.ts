import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все города
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(cities);
  } catch (error) {
    console.error('Ошибка получения городов:', error);
    res.status(500).json({ message: 'Ошибка получения городов' });
  }
});

// Получить все города (включая неактивные) - для админа
router.get('/all', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(cities);
  } catch (error) {
    console.error('Ошибка получения всех городов:', error);
    res.status(500).json({ message: 'Ошибка получения городов' });
  }
});

// Создать город
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, name_nl } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Название города обязательно' });
    }

    const city = await prisma.city.create({
      data: {
        name,
        name_nl: name_nl || name,
        isActive: true
      }
    });

    res.json(city);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Город с таким названием уже существует' });
    }
    console.error('Ошибка создания города:', error);
    res.status(500).json({ message: 'Ошибка создания города' });
  }
});

// Обновить город
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, name_nl, isActive } = req.body;

    const city = await prisma.city.update({
      where: { id: parseInt(id) },
      data: {
        name,
        name_nl: name_nl || name,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(city);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Город не найден' });
    }
    console.error('Ошибка обновления города:', error);
    res.status(500).json({ message: 'Ошибка обновления города' });
  }
});

// Удалить город
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.city.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Город удален' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Город не найден' });
    }
    console.error('Ошибка удаления города:', error);
    res.status(500).json({ message: 'Ошибка удаления города' });
  }
});

export default router;
