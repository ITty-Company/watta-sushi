import express from 'express'
import { PrismaClient } from '@prisma/client'
import { checkAdmin } from '../authMiddleware.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/team - Получить всех членов команды
router.get('/', async (req: any, res: any) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    res.json(teamMembers)
  } catch (error) {
    console.error('Ошибка получения команды:', error)
    res.status(500).json({ message: 'Ошибка получения команды' })
  }
})

// GET /api/team/all - Получить всех (включая неактивных) - только для админов
router.get('/all', checkAdmin, async (req: any, res: any) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      orderBy: { order: 'asc' }
    })
    res.json(teamMembers)
  } catch (error) {
    console.error('Ошибка получения команды:', error)
    res.status(500).json({ message: 'Ошибка получения команды' })
  }
})

// POST /api/team - Создать нового члена команды (только для админов)
router.post('/', checkAdmin, async (req: any, res: any) => {
  try {
    const { name_ru, name_ua, name_en, name_nl, position_ru, position_ua, position_en, position_nl, bio_ru, bio_ua, bio_en, bio_nl, imageUrl, order, isActive } = req.body

    if (!name_ru || !position_ru) {
      return res.status(400).json({ message: 'Имя и должность обязательны' })
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        name_ru,
        name_ua: name_ua || null,
        name_en: name_en || null,
        name_nl: name_nl || null,
        position_ru,
        position_ua: position_ua || null,
        position_en: position_en || null,
        position_nl: position_nl || null,
        bio_ru: bio_ru || null,
        bio_ua: bio_ua || null,
        bio_en: bio_en || null,
        bio_nl: bio_nl || null,
        imageUrl: imageUrl || null,
        order: order ? parseInt(order) : 0,
        isActive: isActive !== undefined ? isActive === 'true' : true
      }
    })

    res.json(teamMember)
  } catch (error) {
    console.error('Ошибка создания члена команды:', error)
    res.status(500).json({ message: 'Ошибка создания члена команды' })
  }
})

// PUT /api/team/:id - Обновить члена команды (только для админов)
router.put('/:id', checkAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { name_ru, name_ua, name_en, name_nl, position_ru, position_ua, position_en, position_nl, bio_ru, bio_ua, bio_en, bio_nl, imageUrl, order, isActive } = req.body

    const existing = await prisma.teamMember.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return res.status(404).json({ message: 'Член команды не найден' })
    }

    const teamMember = await prisma.teamMember.update({
      where: { id: parseInt(id) },
      data: {
        name_ru: name_ru || existing.name_ru,
        name_ua: name_ua !== undefined ? name_ua : existing.name_ua,
        name_en: name_en !== undefined ? name_en : existing.name_en,
        name_nl: name_nl !== undefined ? name_nl : existing.name_nl,
        position_ru: position_ru || existing.position_ru,
        position_ua: position_ua !== undefined ? position_ua : existing.position_ua,
        position_en: position_en !== undefined ? position_en : existing.position_en,
        position_nl: position_nl !== undefined ? position_nl : existing.position_nl,
        bio_ru: bio_ru !== undefined ? bio_ru : existing.bio_ru,
        bio_ua: bio_ua !== undefined ? bio_ua : existing.bio_ua,
        bio_en: bio_en !== undefined ? bio_en : existing.bio_en,
        bio_nl: bio_nl !== undefined ? bio_nl : existing.bio_nl,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        order: order !== undefined ? parseInt(order) : existing.order,
        isActive: isActive !== undefined ? isActive === 'true' : existing.isActive
      }
    })

    res.json(teamMember)
  } catch (error) {
    console.error('Ошибка обновления члена команды:', error)
    res.status(500).json({ message: 'Ошибка обновления члена команды' })
  }
})

// DELETE /api/team/:id - Удалить члена команды (только для админов)
router.delete('/:id', checkAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params

    const teamMember = await prisma.teamMember.findUnique({ where: { id: parseInt(id) } })
    if (!teamMember) {
      return res.status(404).json({ message: 'Член команды не найден' })
    }

    await prisma.teamMember.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Член команды удален' })
  } catch (error) {
    console.error('Ошибка удаления члена команды:', error)
    res.status(500).json({ message: 'Ошибка удаления члена команды' })
  }
})

export default router
