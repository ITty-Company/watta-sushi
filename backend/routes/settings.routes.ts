import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Получить настройки
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.siteSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: { id: 1, bannerInterval: 5000 }
      })
    }
    res.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Error fetching settings' })
  }
})

// Сохранить настройки
router.post('/', async (req, res) => {
  try {
    const { bannerInterval } = req.body
    const settings = await prisma.siteSetting.upsert({
      where: { id: 1 },
      update: { bannerInterval: parseInt(bannerInterval) },
      create: { id: 1, bannerInterval: parseInt(bannerInterval) }
    })
    res.json(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    res.status(500).json({ error: 'Error saving settings' })
  }
})

export default router