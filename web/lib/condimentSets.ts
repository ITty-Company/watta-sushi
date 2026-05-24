/** Безкоштовних наборів (соєвий соус + wasabi + імбир) на замовлення. */
export const FREE_CONDIMENT_SETS = 5

/** Доплата за кожен набір понад безкоштовний ліміт, € */
export const EXTRA_CONDIMENT_SET_PRICE_EUR = 1.5

export function defaultCondimentSetsForParty(persons: number): number {
  const p = Number.isFinite(persons) ? Math.min(99, Math.max(1, persons)) : 1
  return Math.min(p, FREE_CONDIMENT_SETS)
}

export function extraCondimentSetsCount(totalSets: number): number {
  const n = Number.isFinite(totalSets) ? Math.max(0, Math.min(99, totalSets)) : 0
  return Math.max(0, n - FREE_CONDIMENT_SETS)
}

export function condimentSetsExtraFeeEur(totalSets: number): number {
  return Math.round(extraCondimentSetsCount(totalSets) * EXTRA_CONDIMENT_SET_PRICE_EUR * 100) / 100
}
