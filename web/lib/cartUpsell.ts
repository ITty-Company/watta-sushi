import { effectiveUnitPrice } from '@/lib/productPricing'

export type CartUpsellTierDto = {
  id: number
  minOrderTotal: number
  maxOrderTotal: number | null
  discountEur: number
  sortOrder: number
  isActive: boolean
  products: Array<Record<string, unknown>>
}

function activeTiersSorted(tiers: CartUpsellTierDto[]): CartUpsellTierDto[] {
  return tiers
    .filter((t) => t.isActive !== false)
    .slice()
    .sort((a, b) => Number(b.minOrderTotal) - Number(a.minOrderTotal))
}

/** Найвищий поріг, якому відповідає сума замовлення (без урахування доставки). */
export function pickActiveCartUpsellTier(
  tiers: CartUpsellTierDto[],
  merchandiseTotal: number,
): CartUpsellTierDto | null {
  const total = Number(merchandiseTotal)
  if (!Number.isFinite(total) || total <= 0) return null

  const active = activeTiersSorted(tiers)

  const inRange = active.filter(
    (t) =>
      total >= Number(t.minOrderTotal) &&
      (t.maxOrderTotal == null ||
        !Number.isFinite(Number(t.maxOrderTotal)) ||
        total <= Number(t.maxOrderTotal)),
  )
  if (inRange.length > 0) return inRange[0]

  // Сума вище верхньої межі всіх діапазонів — застосовуємо найвищий поріг, де min уже досягнуто
  const aboveMin = active.filter((t) => total >= Number(t.minOrderTotal))
  return aboveMin[0] ?? null
}

/**
 * Усі пороги, уже «відкриті» сумою замовлення (кумулятивно: 150 € → і 50–99, і 100–200).
 */
export function pickQualifiedCartUpsellTiers(
  tiers: CartUpsellTierDto[],
  merchandiseTotal: number,
): CartUpsellTierDto[] {
  const total = Number(merchandiseTotal)
  if (!Number.isFinite(total) || total <= 0) return []

  return tiers
    .filter((t) => t.isActive !== false)
    .filter((t) => total >= Number(t.minOrderTotal))
    .slice()
    .sort((a, b) => Number(a.minOrderTotal) - Number(b.minOrderTotal))
}

export type CartUpsellMergedOffer = {
  product: Record<string, unknown>
  /** Найбільша знижка € серед усіх відкритих порогів для цього товару */
  discountEur: number
}

/** Товари з усіх відкритих порогів; при дублі id — залишаємо більшу знижку €. */
export function mergeCartUpsellOffersFromTiers(
  qualifiedTiers: CartUpsellTierDto[],
): CartUpsellMergedOffer[] {
  const byId = new Map<number, CartUpsellMergedOffer>()

  for (const tier of qualifiedTiers) {
    const off = Math.max(0, Number(tier.discountEur) || 0)
    for (const raw of tier.products ?? []) {
      const id = Number((raw as { id?: number }).id)
      if (!Number.isFinite(id) || id <= 0) continue
      const existing = byId.get(id)
      if (!existing || off > existing.discountEur) {
        byId.set(id, { product: raw, discountEur: off })
      }
    }
  }

  return Array.from(byId.values())
}

/** Наступний поріг, якого ще не досягнуто (для підказки в кошику). */
export function findNextCartUpsellTier(
  tiers: CartUpsellTierDto[],
  merchandiseTotal: number,
): CartUpsellTierDto | null {
  const total = Number(merchandiseTotal)
  if (!Number.isFinite(total) || total <= 0) return null
  if (pickActiveCartUpsellTier(tiers, total)) return null

  return tiers
    .filter((t) => t.isActive !== false)
    .filter((t) => total < Number(t.minOrderTotal))
    .sort((a, b) => Number(a.minOrderTotal) - Number(b.minOrderTotal))[0] ?? null
}

export function cartUpsellSaleUnitPrice(
  catalogPrice: number,
  promoDiscountPercent: number | undefined,
  discountEur: number,
): number {
  const unit = effectiveUnitPrice(catalogPrice, promoDiscountPercent)
  const off = Math.max(0, Number(discountEur) || 0)
  return Math.max(0.01, Math.round((unit - off) * 100) / 100)
}

export type CartLinePricing = {
  price: number
  promoDiscountPercent?: number
  /** Фіксована знижка € з upsell — лише якщо товар додали з блоку «Додайте до замовлення» */
  cartUpsellDiscountEur?: number
}

/** Ціна одиниці для підсумку кошика / замовлення */
export function cartLineChargeUnitPrice(line: CartLinePricing): number {
  const unit = effectiveUnitPrice(line.price, line.promoDiscountPercent)
  const off = Math.max(0, Number(line.cartUpsellDiscountEur) || 0)
  if (off <= 0) return unit
  return Math.max(0.01, Math.round((unit - off) * 100) / 100)
}

export function formatTierRangeLabel(
  tier: Pick<CartUpsellTierDto, 'minOrderTotal' | 'maxOrderTotal'>,
): string {
  const min = Number(tier.minOrderTotal)
  const max = tier.maxOrderTotal
  if (max != null && Number.isFinite(Number(max))) {
    return `${min}–${Number(max)} €`
  }
  return `≥ ${min} €`
}
