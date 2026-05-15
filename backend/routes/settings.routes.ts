import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { checkAdmin } from '../authMiddleware'

const router = Router()
const prisma = new PrismaClient()

const defaultSettings = {
  id: 1,
  bannerInterval: 5000,
  telegramUrl: 'https://t.me/wattasushiwork',
  whatsappUrl: '',
  instagramUrl: 'https://www.instagram.com/watta_sushi/',
  restaurantPickupAddress: '',
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
  deliveryKitchenAddress: 'Helicopterstraat 20, 1059 CG Amsterdam, Netherlands',
  deliveryKitchenLat: null,
  deliveryKitchenLng: null,
  deliveryTariffStepKm: 3,
  deliveryTariffStepEur: 1.5,
}

async function geocodeKitchenLatLng(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim()
  if (!q) return null
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (key) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&region=nl&key=${encodeURIComponent(key)}`
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const data = (await res.json()) as {
        status?: string
        results?: { geometry?: { location?: { lat?: number; lng?: number } } }[]
      }
      if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) return null
      const loc = data.results[0].geometry!.location!
      const lat = Number(loc.lat)
      const lng = Number(loc.lng)
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    } catch {
      return null
    }
  }
  return null
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
    const deliveryTariffStepKm =
      b.deliveryTariffStepKm != null && b.deliveryTariffStepKm !== ''
        ? parseFloat(String(b.deliveryTariffStepKm))
        : undefined
    const deliveryTariffStepEur =
      b.deliveryTariffStepEur != null && b.deliveryTariffStepEur !== ''
        ? parseFloat(String(b.deliveryTariffStepEur))
        : undefined

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
    if (b.deliveryKitchenAddress !== undefined) {
      update.deliveryKitchenAddress = String(b.deliveryKitchenAddress ?? '').trim()
    }
    if (
      deliveryTariffStepKm != null &&
      !Number.isNaN(deliveryTariffStepKm) &&
      deliveryTariffStepKm > 0
    ) {
      update.deliveryTariffStepKm = deliveryTariffStepKm
    }
    if (
      deliveryTariffStepEur != null &&
      !Number.isNaN(deliveryTariffStepEur) &&
      deliveryTariffStepEur >= 0
    ) {
      update.deliveryTariffStepEur = deliveryTariffStepEur
    }

    const cleanUpdate = Object.fromEntries(
      Object.entries(update).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>

    if (typeof cleanUpdate.deliveryKitchenAddress === 'string') {
      const coords = await geocodeKitchenLatLng(cleanUpdate.deliveryKitchenAddress)
      if (coords) {
        cleanUpdate.deliveryKitchenLat = coords.lat
        cleanUpdate.deliveryKitchenLng = coords.lng
      } else {
        cleanUpdate.deliveryKitchenLat = null
        cleanUpdate.deliveryKitchenLng = null
      }
    }

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
