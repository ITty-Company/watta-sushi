/** Акційна ціна за одиницю (округлення до 2 знаків). */

export function clampPromoPercent(raw: unknown): number {
  const n = Math.round(Number(raw))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(100, n)
}

export function effectiveUnitPrice(price: number, promoDiscountPercent?: number | null): number {
  const p = clampPromoPercent(promoDiscountPercent)
  if (p <= 0) return price
  return Math.round(price * (100 - p) * 100) / 10000
}
