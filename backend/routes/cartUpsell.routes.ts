import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { checkAdmin } from '../authMiddleware'
import { cachePublicGet, PUBLIC_CACHE_MENU_SEC } from '../lib/publicApiCache.js'

const router = Router()
const prisma = new PrismaClient()

function parsePositiveFloat(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function isProductVisibleInCity(
  product: { cities?: Array<{ cityId: number }> },
  cityId: number | null,
): boolean {
  if (!cityId) return true
  const cities = product.cities
  if (!Array.isArray(cities) || cities.length === 0) return true
  return cities.some((c) => c.cityId === cityId)
}

function serializeTier(
  tier: {
    id: number
    minOrderTotal: number
    maxOrderTotal: number | null
    discountEur: number
    sortOrder: number
    isActive: boolean
    products: Array<{
      sortOrder: number
      product: Record<string, unknown>
    }>
  },
  cityId: number | null,
) {
  const products = tier.products
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.product.id) - Number(b.product.id))
    .map((row) => row.product)
    .filter((p) => isProductVisibleInCity(p as { cities?: Array<{ cityId: number }> }, cityId))
    .map((p) => {
      const { cities: _c, ...rest } = p as { cities?: unknown }
      return rest
    })

  return {
    id: tier.id,
    minOrderTotal: tier.minOrderTotal,
    maxOrderTotal: tier.maxOrderTotal,
    discountEur: tier.discountEur,
    sortOrder: tier.sortOrder,
    isActive: tier.isActive,
    products,
  }
}

async function loadTiers(includeInactive: boolean, cityId: number | null) {
  const tiers = await prisma.cartUpsellTier.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { minOrderTotal: 'asc' }, { id: 'asc' }],
    include: {
      products: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          product: {
            include: {
              category: true,
              cities: true,
            },
          },
        },
      },
    },
  })

  return tiers.map((tier) =>
    serializeTier(
      {
        ...tier,
        products: tier.products.map((row) => ({
          sortOrder: row.sortOrder,
          product: row.product as unknown as Record<string, unknown>,
        })),
      },
      cityId,
    ),
  )
}

/** Публічний список активних порогів і товарів (для кошика) */
router.get('/', cachePublicGet(PUBLIC_CACHE_MENU_SEC), async (req: Request, res: Response) => {
  try {
    const cityIdRaw = req.query.cityId ? parseInt(String(req.query.cityId), 10) : null
    const cityId =
      cityIdRaw != null && Number.isFinite(cityIdRaw) && cityIdRaw > 0 ? cityIdRaw : null
    const tiers = await loadTiers(false, cityId)
    res.json({ tiers })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error fetching cart upsell tiers' })
  }
})

/** Адмін: усі пороги */
router.get('/all', checkAdmin, async (_req: Request, res: Response) => {
  try {
    const tiers = await loadTiers(true, null)
    res.json(tiers)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error fetching cart upsell tiers' })
  }
})

router.post('/', checkAdmin, async (req: Request, res: Response) => {
  try {
    const minOrderTotal = parsePositiveFloat(req.body?.minOrderTotal)
    const discountEur = parsePositiveFloat(req.body?.discountEur)
    if (minOrderTotal == null || discountEur == null || discountEur <= 0) {
      return res.status(400).json({ error: 'minOrderTotal and discountEur are required' })
    }
    const maxRaw = req.body?.maxOrderTotal
    const maxOrderTotal =
      maxRaw === null || maxRaw === undefined || maxRaw === ''
        ? null
        : parsePositiveFloat(maxRaw)
    if (maxRaw != null && maxRaw !== '' && maxOrderTotal == null) {
      return res.status(400).json({ error: 'Invalid maxOrderTotal' })
    }
    if (maxOrderTotal != null && maxOrderTotal < minOrderTotal) {
      return res.status(400).json({ error: 'maxOrderTotal must be >= minOrderTotal' })
    }

    const productIds = Array.isArray(req.body?.productIds)
      ? req.body.productIds.map((x: unknown) => parseInt(String(x), 10)).filter((n: number) => Number.isFinite(n) && n > 0)
      : []

    const tier = await prisma.cartUpsellTier.create({
      data: {
        minOrderTotal,
        maxOrderTotal,
        discountEur,
        sortOrder: parseInt(String(req.body?.sortOrder ?? 0), 10) || 0,
        isActive: req.body?.isActive !== false,
        products: {
          create: productIds.map((productId: number, index: number) => ({
            productId,
            sortOrder: index,
          })),
        },
      },
    })

    const tiers = await loadTiers(true, null)
    const created = tiers.find((t) => t.id === tier.id)
    res.status(201).json(created ?? tier)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error creating cart upsell tier' })
  }
})

router.put('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10)
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' })
    }

    const existing = await prisma.cartUpsellTier.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const minOrderTotal =
      req.body?.minOrderTotal != null
        ? parsePositiveFloat(req.body.minOrderTotal)
        : existing.minOrderTotal
    const discountEur =
      req.body?.discountEur != null
        ? parsePositiveFloat(req.body.discountEur)
        : existing.discountEur
    if (minOrderTotal == null || discountEur == null || discountEur <= 0) {
      return res.status(400).json({ error: 'Invalid minOrderTotal or discountEur' })
    }

    let maxOrderTotal = existing.maxOrderTotal
    if ('maxOrderTotal' in (req.body ?? {})) {
      const maxRaw = req.body.maxOrderTotal
      maxOrderTotal =
        maxRaw === null || maxRaw === undefined || maxRaw === ''
          ? null
          : parsePositiveFloat(maxRaw)
      if (maxRaw != null && maxRaw !== '' && maxOrderTotal == null) {
        return res.status(400).json({ error: 'Invalid maxOrderTotal' })
      }
    }
    if (maxOrderTotal != null && maxOrderTotal < minOrderTotal) {
      return res.status(400).json({ error: 'maxOrderTotal must be >= minOrderTotal' })
    }

    const productIds = Array.isArray(req.body?.productIds)
      ? req.body.productIds
          .map((x: unknown) => parseInt(String(x), 10))
          .filter((n: number) => Number.isFinite(n) && n > 0)
      : null

    await prisma.$transaction(async (tx) => {
      await tx.cartUpsellTier.update({
        where: { id },
        data: {
          minOrderTotal,
          maxOrderTotal,
          discountEur,
          sortOrder:
            req.body?.sortOrder != null
              ? parseInt(String(req.body.sortOrder), 10) || 0
              : existing.sortOrder,
          isActive: req.body?.isActive !== undefined ? Boolean(req.body.isActive) : existing.isActive,
        },
      })

      if (productIds) {
        await tx.cartUpsellTierProduct.deleteMany({ where: { tierId: id } })
        if (productIds.length > 0) {
          await tx.cartUpsellTierProduct.createMany({
            data: productIds.map((productId: number, index: number) => ({
              tierId: id,
              productId,
              sortOrder: index,
            })),
          })
        }
      }
    })

    const tiers = await loadTiers(true, null)
    const updated = tiers.find((t) => t.id === id)
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error updating cart upsell tier' })
  }
})

router.delete('/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10)
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    await prisma.cartUpsellTier.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error deleting cart upsell tier' })
  }
})

export default router
