/**
 * Centralized pricing engine for Watta Sushi orders.
 *
 * Design decisions:
 * - All intermediate calculations are performed in INTEGER CENTS (EUR × 100)
 *   to eliminate IEEE 754 floating-point accumulation errors.
 *   Example: 0.1 + 0.2 = 0.30000000000000004 in floats, but 10 + 20 = 30 in cents.
 * - All inputs that affect price come from the DATABASE, never from the client.
 * - Conversion back to EUR happens only at storage boundaries (Prisma writes, Stripe amounts).
 *
 * Public API surface:
 *   eurToCents()               — EUR → integer cents
 *   centsToEur()               — cents → EUR (for storage/display)
 *   effectiveUnitPriceCents()  — DB price after promo discount → cents
 *   buildPricingLine()         — validated order line with DB-authoritative price
 *   lineSubtotalCents()        — sum of all lines
 *   applyFreeDeliveryThreshold() — zero out delivery if subtotal qualifies
 *   capBonusDiscount()         — cap bonus at order total to prevent over-deduction
 *   calculateFinalTotalCents() — subtotal + delivery − bonus (min 0)
 *
 * NEVER import or use these functions client-side. They are server-only.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum allowed quantity per line item. Protects against DoS via huge quantities. */
export const MAX_ITEM_QUANTITY = 99

// ---------------------------------------------------------------------------
// Money helpers — the boundary between EUR and cents
// ---------------------------------------------------------------------------

/**
 * Convert EUR (floating-point) to integer cents using half-up rounding.
 *
 * Examples:
 *   eurToCents(10.455) → 1046   (rounded up from 104.5)
 *   eurToCents(10.994) → 1099
 *   eurToCents(10.995) → 1100
 */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100)
}

/**
 * Convert integer cents to EUR.
 * Result is an exact division — no rounding needed if input is already an integer.
 *
 * Examples:
 *   centsToEur(1046) → 10.46
 *   centsToEur(100)  → 1.00
 */
export function centsToEur(cents: number): number {
  return cents / 100
}

// ---------------------------------------------------------------------------
// Product line pricing
// ---------------------------------------------------------------------------

/**
 * Computes the effective unit price in INTEGER CENTS after applying a promo discount.
 *
 * All inputs MUST come from the database (Prisma) — never from the client request.
 *
 * Mathematical equivalence:
 *   discountedCents = round(dbPriceEur × (100 − p))
 *   Because: dbPriceEur × (100 − p) = dbPriceEur × (1 − p/100) × 100 = discountedPriceEur × 100
 *
 * @param dbPriceEur     Product.price from Prisma (EUR float)
 * @param dbPromoPercent Product.promoDiscountPercent from Prisma (integer 0–100)
 */
export function effectiveUnitPriceCents(dbPriceEur: number, dbPromoPercent: number): number {
  const p = Math.min(100, Math.max(0, Math.round(Number(dbPromoPercent) || 0)))
  if (p <= 0) return Math.round(dbPriceEur * 100)
  // Multiply by (100 - p) instead of (1 - p/100) to stay in the integer domain as long as possible
  return Math.round(dbPriceEur * (100 - p))
}

// ---------------------------------------------------------------------------
// Pricing line type
// ---------------------------------------------------------------------------

export interface PricingLine {
  productId: number
  /** Quantity, clamped to [1, MAX_ITEM_QUANTITY] */
  quantity: number
  /** Unit price in integer cents — server-calculated from DB, immutable */
  unitPriceCents: number
  /** Unit price in EUR — derived from unitPriceCents, used for DB writes */
  unitPriceEur: number
}

/**
 * Builds a validated, DB-priced PricingLine.
 *
 * Quantity is clamped to [1, MAX_ITEM_QUANTITY] regardless of what the client sent.
 * If the same productId appears multiple times in the cart, caller should sum quantities first.
 *
 * @param productId     Validated product ID (positive integer)
 * @param rawQuantity   Client-supplied quantity (will be clamped)
 * @param dbPriceEur    Product.price from Prisma
 * @param dbPromoPercent Product.promoDiscountPercent from Prisma
 */
export function buildPricingLine(
  productId: number,
  rawQuantity: number,
  dbPriceEur: number,
  dbPromoPercent: number,
): PricingLine {
  const quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(Number(rawQuantity) || 1)))
  const unitPriceCents = effectiveUnitPriceCents(dbPriceEur, dbPromoPercent)
  return {
    productId,
    quantity,
    unitPriceCents,
    unitPriceEur: centsToEur(unitPriceCents),
  }
}

// ---------------------------------------------------------------------------
// Aggregate calculations
// ---------------------------------------------------------------------------

/**
 * Sums all line totals (unitPriceCents × quantity) in integer cents.
 *
 * This is the "merchandise subtotal" — the cost of all items before delivery or bonuses.
 * It is ALWAYS computed from DB-authoritative prices, never from client data.
 */
export function lineSubtotalCents(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
}

/**
 * Applies the free-delivery threshold rule (server-side enforcement).
 *
 * If the merchandise subtotal (in cents) meets or exceeds the threshold,
 * the delivery fee is zeroed out. The threshold comes from SiteSetting (DB).
 *
 * Client cannot bypass this: even if a forged token claims fee=0 on a small order,
 * the opposite protection (correct fee assignment) is handled by verifyDeliveryQuote.
 *
 * @param deliveryCents   Delivery fee in cents (from token or zone lookup)
 * @param subtotalCents   Merchandise subtotal in cents (server-calculated)
 * @param thresholdEur    SiteSetting.freeDeliveryThreshold (EUR, from DB)
 */
export function applyFreeDeliveryThreshold(
  deliveryCents: number,
  subtotalCents: number,
  thresholdEur: number,
): number {
  if (!Number.isFinite(thresholdEur) || thresholdEur <= 0) return deliveryCents
  const thresholdCents = eurToCents(thresholdEur)
  return subtotalCents >= thresholdCents ? 0 : deliveryCents
}

/**
 * Caps the bonus discount so it never exceeds the pre-discount order total.
 *
 * Without this cap, a user could request to use more bonus than the order is worth,
 * causing the server to over-deduct from their balance (balance goes to zero unnecessarily).
 *
 * The actual surplus prevention is: if cap applies, user keeps the excess bonus balance.
 * The final total will be Math.max(0, ...) in calculateFinalTotalCents anyway.
 *
 * @param requestedBonusEur   How many EUR in bonus the user wants to apply (from request)
 * @param preBonusTotalCents  lineSubtotal + delivery, in cents
 * @returns Capped bonus in CENTS (always <= preBonusTotalCents)
 */
export function capBonusDiscount(requestedBonusEur: number, preBonusTotalCents: number): number {
  const requestedCents = eurToCents(Math.max(0, Number(requestedBonusEur) || 0))
  return Math.min(requestedCents, preBonusTotalCents)
}

/**
 * Computes the final order total in cents after all discounts.
 *
 * Result is guaranteed to be >= 0 (cannot go negative regardless of inputs).
 */
export function calculateFinalTotalCents(
  subtotalCents: number,
  deliveryCents: number,
  bonusDiscountCents: number,
): number {
  return Math.max(0, subtotalCents + deliveryCents - bonusDiscountCents)
}
