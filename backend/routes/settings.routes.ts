import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { checkAdmin } from '../authMiddleware'

const router = Router()
const prisma = new PrismaClient()

const defaultSettings = {
  id: 1,
  bannerInterval: 5000,
  telegramUrl: '',
  whatsappUrl: '',
  instagramUrl: 'https://www.instagram.com/watta_sushi/',
  restaurantPickupAddress: '',
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
}

// Получить настройки
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.siteSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.siteSetting.create({ data: defaultSettings })
    }
    res.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Error fetching settings' })
  }
})

// Сохранить настройки (только ADMIN)
router.post('/', checkAdmin, async (req, res) => {
  try {
    const b = req.body || {}
    const bannerInterval =
      b.bannerInterval != null && b.bannerInterval !== ''
        ? parseInt(String(b.bannerInterval), 10)
        : undefined
    const freeDeliveryThreshold =
      b.freeDeliveryThreshold != null && b.freeDeliveryThreshold !== ''
        ? parseFloat(String(b.freeDeliveryThreshold))
        : undefined
    const deliveryFee =
      b.deliveryFee != null && b.deliveryFee !== '' ? parseFloat(String(b.deliveryFee)) : undefined

    const update: Record<string, unknown> = {}
    if (bannerInterval != null && !Number.isNaN(bannerInterval)) update.bannerInterval = bannerInterval
    if (b.telegramUrl !== undefined) update.telegramUrl = String(b.telegramUrl ?? '')
    if (b.whatsappUrl !== undefined) update.whatsappUrl = String(b.whatsappUrl ?? '')
    if (b.instagramUrl !== undefined) update.instagramUrl = String(b.instagramUrl ?? '')
    if (b.restaurantPickupAddress !== undefined)
      update.restaurantPickupAddress = String(b.restaurantPickupAddress ?? '')
    if (freeDeliveryThreshold != null && !Number.isNaN(freeDeliveryThreshold))
      update.freeDeliveryThreshold = freeDeliveryThreshold
    if (deliveryFee != null && !Number.isNaN(deliveryFee)) update.deliveryFee = deliveryFee

    const cleanUpdate = Object.fromEntries(
      Object.entries(update).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>

    const settings = await prisma.siteSetting.upsert({
      where: { id: 1 },
      update: cleanUpdate,
      create: { ...defaultSettings, ...cleanUpdate },
    })
    res.json(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    res.status(500).json({ error: 'Error saving settings' })
  }
})

export default router
