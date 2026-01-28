import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все страны
router.get('/', async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(countries);
  } catch (error) {
    console.error('Ошибка получения стран:', error);
    res.status(500).json({ message: 'Ошибка получения стран' });
  }
});

// Получить все страны (включая неактивные) - для админа
router.get('/all', async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        cities: {
          include: {
            deliveryZones: true
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(countries);
  } catch (error) {
    console.error('Ошибка получения всех стран:', error);
    res.status(500).json({ message: 'Ошибка получения стран' });
  }
});

// Получить страну по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const country = await prisma.country.findUnique({
      where: { id: parseInt(id) },
      include: {
        cities: {
          include: {
            deliveryZones: true
          }
        }
      }
    });
    if (!country) {
      return res.status(404).json({ message: 'Страна не найдена' });
    }
    res.json(country);
  } catch (error) {
    console.error('Ошибка получения страны:', error);
    res.status(500).json({ message: 'Ошибка получения страны' });
  }
});

// Создать страну
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    const name_ua = typeof body.name_ua === 'string' ? body.name_ua.trim() || rawName : rawName;
    const name_en = typeof body.name_en === 'string' ? body.name_en.trim() || rawName : rawName;
    const name_nl = typeof body.name_nl === 'string' ? body.name_nl.trim() || rawName : rawName;
    const flag = typeof body.flag === 'string' && body.flag.trim() ? body.flag.trim() : '🌍';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';

    if (!rawName) {
      return res.status(400).json({ message: 'Название страны обязательно' });
    }

    const codeMap: { [key: string]: string } = {
      'Украина': 'UA', 'Україна': 'UA',
      'Нидерланды': 'NL', 'Nederland': 'NL', 'Нідерланди': 'NL',
      'Россия': 'RU', 'Russia': 'RU',
      'United States': 'US', 'США': 'US',
      'United Kingdom': 'GB', 'Великобритания': 'GB',
      'Germany': 'DE', 'Германия': 'DE',
      'France': 'FR', 'Франция': 'FR',
      'Italy': 'IT', 'Италия': 'IT',
      'Spain': 'ES', 'Испания': 'ES',
      'Poland': 'PL', 'Польша': 'PL'
    };

    let countryCode = code || codeMap[rawName] || codeMap[name_en] || codeMap[name_ua] ||
      rawName.substring(0, 2).toUpperCase() || 'XX';
    countryCode = String(countryCode).toUpperCase().slice(0, 10) || 'XX';

    const existingByName = await prisma.country.findFirst({ where: { name: rawName } });
    if (existingByName) {
      return res.status(400).json({ message: 'Страна с таким названием уже существует' });
    }
    const existingByCode = await prisma.country.findFirst({ where: { code: countryCode } });
    if (existingByCode) {
      return res.status(400).json({ message: `Страна с кодом «${countryCode}» уже существует` });
    }

    const country = await prisma.country.create({
      data: {
        name: rawName,
        name_ua,
        name_en,
        name_nl,
        flag,
        code: countryCode,
        isActive: true
      }
    });

    res.json(country);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Страна с таким названием или кодом уже существует' });
    }
    console.error('Ошибка создания страны:', error?.message ?? error);
    console.error('Stack:', error?.stack);
    const msg = process.env.NODE_ENV !== 'production' && error?.message
      ? `Ошибка создания страны: ${error.message}`
      : 'Ошибка создания страны';
    res.status(500).json({ message: msg });
  }
});

// Обновить страну
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName) {
      return res.status(400).json({ message: 'Название страны обязательно' });
    }
    const name_ua = typeof body.name_ua === 'string' ? body.name_ua.trim() || rawName : rawName;
    const name_en = typeof body.name_en === 'string' ? body.name_en.trim() || rawName : rawName;
    const name_nl = typeof body.name_nl === 'string' ? body.name_nl.trim() || rawName : rawName;
    const flag = typeof body.flag === 'string' && body.flag.trim() ? body.flag.trim() : '🌍';
    const code = (typeof body.code === 'string' ? body.code.trim().toUpperCase() : '').slice(0, 10) || 'XX';
    const isActive = body.isActive !== undefined ? !!body.isActive : true;

    const country = await prisma.country.update({
      where: { id: parseInt(id) },
      data: {
        name: rawName,
        name_ua,
        name_en,
        name_nl,
        flag,
        code,
        isActive
      }
    });

    res.json(country);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Страна не найдена' });
    }
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Страна с таким названием или кодом уже существует' });
    }
    console.error('Ошибка обновления страны:', error);
    res.status(500).json({ message: 'Ошибка обновления страны' });
  }
});

// Удалить страну
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.country.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Страна удалена' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Страна не найдена' });
    }
    console.error('Ошибка удаления страны:', error);
    res.status(500).json({ message: 'Ошибка удаления страны' });
  }
});

export default router;
