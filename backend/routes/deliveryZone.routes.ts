import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все зоны доставки города
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const zones = await prisma.deliveryZone.findMany({
      where: { cityId: parseInt(cityId) },
      include: {
        city: {
          include: {
            country: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(zones);
  } catch (error) {
    console.error('Ошибка получения зон доставки:', error);
    res.status(500).json({ message: 'Ошибка получения зон доставки' });
  }
});

// Создать зону доставки
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color, cityId, coordinates } = req.body;

    if (!name || !cityId || !coordinates) {
      return res.status(400).json({ message: 'Название, город и координаты обязательны' });
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        color: color || '#4ade80',
        cityId: parseInt(cityId),
        coordinates: typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates)
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    res.json(zone);
  } catch (error: any) {
    console.error('Ошибка создания зоны доставки:', error);
    res.status(500).json({ message: 'Ошибка создания зоны доставки' });
  }
});

// Обновить зону доставки
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, coordinates } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (color) updateData.color = color;
    if (coordinates) {
      updateData.coordinates = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
    }

    const zone = await prisma.deliveryZone.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    res.json(zone);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Зона доставки не найдена' });
    }
    console.error('Ошибка обновления зоны доставки:', error);
    res.status(500).json({ message: 'Ошибка обновления зоны доставки' });
  }
});

// Удалить зону доставки
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.deliveryZone.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Зона доставки удалена' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Зона доставки не найдена' });
    }
    console.error('Ошибка удаления зоны доставки:', error);
    res.status(500).json({ message: 'Ошибка удаления зоны доставки' });
  }
});

export default router;
