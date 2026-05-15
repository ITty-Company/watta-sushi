import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { checkAdmin } from '../authMiddleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const prisma = new PrismaClient()

const uploadDir = path.join(__dirname, '../../web/public/uploads')
const DEFAULT_HOME_HERO_VIDEO = '/watta-sushi-2-hero.mp4'
const MAX_VIDEO_URL_LENGTH = 2048
/** Захист від надто великого JSON у SiteSetting (адмінка без жорсткого ліміту в UI). */
const MAX_HOME_HERO_VIDEOS = 100

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}

const heroVideoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir()
      cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
      const extFromName = path.extname(file.originalname || '').toLowerCase()
      const ext =
        extFromName === '.webm'
          ? 'webm'
          : extFromName === '.mov'
            ? 'mov'
            : 'mp4'
      cb(null, `hero-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`)
    },
  }),
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true)
    else cb(new Error('invalid_video_type'))
  },
}).single('video')

/** Адмінка: data URL відео → web/public/uploads/hero-*.mp4 */
function persistDataUrlHeroVideo(dataUrl: string): string | null {
  const trimmed = dataUrl.trim()
  const m = /^data:video\/(mp4|webm|quicktime);base64,([\s\S]+)$/i.exec(trimmed)
  if (!m) return null
  let ext = m[1].toLowerCase()
  if (ext === 'quicktime') ext = 'mov'
  const b64 = m[2].replace(/\s/g, '')
  let buf: Buffer
  try {
    buf = Buffer.from(b64, 'base64')
  } catch {
    return null
  }
  if (buf.length < 1024) return null
  if (buf.length > 120 * 1024 * 1024) return null

  ensureUploadDir()
  const name = `hero-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext === 'webm' ? 'webm' : ext === 'mov' ? 'mov' : 'mp4'}`
  const fp = path.join(uploadDir, name)
  try {
    fs.writeFileSync(fp, buf)
  } catch (e) {
    console.error('Hero video write failed:', e)
    return null
  }
  return `/uploads/${name}`
}

function normalizeHomeHeroVideoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const url = value.trim()
  if (!url) return null

  if (url.startsWith('data:video/')) {
    return persistDataUrlHeroVideo(url)
  }

  if (url.length > MAX_VIDEO_URL_LENGTH) return null
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url
  return null
}

function parseStoredHomeHeroVideoUrls(raw: string | null | undefined): string[] {
  if (!raw || !String(raw).trim()) return []
  try {
    const parsed = JSON.parse(String(raw)) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_HOME_HERO_VIDEOS)
  } catch {
    return []
  }
}

function serializeHomeHeroVideoUrls(urls: string[]): string {
  return JSON.stringify(urls.slice(0, MAX_HOME_HERO_VIDEOS))
}

function normalizeHomeHeroVideoUrls(input: unknown): string[] {
  const list = Array.isArray(input) ? input : input != null ? [input] : []
  const out: string[] = []
  for (const item of list) {
    if (out.length >= MAX_HOME_HERO_VIDEOS) break
    const n = normalizeHomeHeroVideoUrl(item)
    if (n && !out.includes(n)) out.push(n)
  }
  return out
}

function effectiveHomeHeroVideoUrls(row: {
  homeHeroVideoUrls?: string | null
  homeHeroVideoUrl?: string | null
}): string[] {
  const fromJson = parseStoredHomeHeroVideoUrls(row.homeHeroVideoUrls)
  if (fromJson.length > 0) return fromJson
  const single = row.homeHeroVideoUrl?.trim()
  if (single) return [single]
  return [DEFAULT_HOME_HERO_VIDEO]
}

function enrichSettingsResponse<T extends Record<string, unknown>>(settings: T) {
  const homeHeroVideoUrls = effectiveHomeHeroVideoUrls(settings as {
    homeHeroVideoUrls?: string | null
    homeHeroVideoUrl?: string | null
  })
  return {
    ...settings,
    homeHeroVideoUrls,
    homeHeroVideoUrl: homeHeroVideoUrls[0] ?? DEFAULT_HOME_HERO_VIDEO,
  }
}

const defaultSettings = {
  id: 1,
  bannerInterval: 5000,
  homeHeroVideoUrl: DEFAULT_HOME_HERO_VIDEO,
  homeHeroVideoUrls: serializeHomeHeroVideoUrls([DEFAULT_HOME_HERO_VIDEO]),
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

/** Адмінка: multipart — файл на диск без base64 (якість 1:1). */
router.post('/home-hero-video/upload', checkAdmin, (req, res) => {
  heroVideoUpload(req, res, (err) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'upload_error'
      const status = msg === 'invalid_video_type' ? 400 : 413
      return res.status(status).json({ error: msg })
    }
    const file = req.file
    if (!file) return res.status(400).json({ error: 'no_file' })
    return res.json({ url: `/uploads/${file.filename}` })
  })
})

// Получить настройки
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.siteSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      settings = await prisma.siteSetting.create({ data: defaultSettings })
    }
    res.json(enrichSettingsResponse(settings as Record<string, unknown>))
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
    if (b.homeHeroVideoUrls !== undefined) {
      const urls = normalizeHomeHeroVideoUrls(b.homeHeroVideoUrls)
      if (urls.length > 0) {
        update.homeHeroVideoUrls = serializeHomeHeroVideoUrls(urls)
        update.homeHeroVideoUrl = urls[0]
      }
    } else if (b.homeHeroVideoUrl !== undefined) {
      const normalized = normalizeHomeHeroVideoUrl(b.homeHeroVideoUrl)
      if (normalized) {
        update.homeHeroVideoUrl = normalized
        update.homeHeroVideoUrls = serializeHomeHeroVideoUrls([normalized])
      }
    }
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
    res.json(enrichSettingsResponse(settings as Record<string, unknown>))
  } catch (error) {
    console.error('Error saving settings:', error)
    res.status(500).json({ error: 'Error saving settings' })
  }
})

export default router
