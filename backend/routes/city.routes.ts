import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все города
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        country: true,
        deliveryZones: true
      },
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
      include: {
        country: true,
        deliveryZones: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(cities);
  } catch (error) {
    console.error('Ошибка получения всех городов:', error);
    res.status(500).json({ message: 'Ошибка получения городов' });
  }
});

// Получить города по стране
router.get('/country/:countryId', async (req, res) => {
  try {
    const { countryId } = req.params;
    const cities = await prisma.city.findMany({
      where: {
        countryId: parseInt(countryId),
        isActive: true
      },
      include: {
        country: true,
        deliveryZones: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(cities);
  } catch (error) {
    console.error('Ошибка получения городов по стране:', error);
    res.status(500).json({ message: 'Ошибка получения городов' });
  }
});

// Создать город
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, name_ua, name_nl, name_en, countryId, latitude, longitude, zoom } = req.body;

    if (!name || !countryId) {
      return res.status(400).json({ message: 'Название города и страна обязательны' });
    }

    const city = await prisma.city.create({
      data: {
        name,
        name_ua: name_ua || name,
        name_nl: name_nl || name,
        name_en: name_en || name,
        countryId: parseInt(countryId),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        zoom: zoom ? parseInt(zoom) : 12,
        isActive: true
      },
      include: {
        country: true
      }
    });

    res.json(city);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Город с таким названием уже существует в этой стране' });
    }
    console.error('Ошибка создания города:', error);
    res.status(500).json({ message: 'Ошибка создания города' });
  }
});

// Обновить город
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, name_ua, name_nl, name_en, countryId, latitude, longitude, zoom, isActive } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (name_ua !== undefined) updateData.name_ua = name_ua;
    if (name_nl !== undefined) updateData.name_nl = name_nl;
    if (name_en !== undefined) updateData.name_en = name_en;
    if (countryId) updateData.countryId = parseInt(countryId);
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (zoom !== undefined) updateData.zoom = parseInt(zoom);
    if (isActive !== undefined) updateData.isActive = isActive;

    const city = await prisma.city.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        country: true,
        deliveryZones: true
      }
    });

    res.json(city);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Город не найден' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Город с таким названием уже существует в этой стране' });
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
