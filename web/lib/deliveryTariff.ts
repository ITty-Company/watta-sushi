/** Узгоджено з `backend/lib/amsterdamDelivery.ts` → `deliveryFeeSteppedEur` */
export function steppedDeliveryFeeEur(distanceKm: number, stepKm: number, stepEur: number): number {
  const km = Number(distanceKm)
  const sk = Number(stepKm)
  const se = Number(stepEur)
  if (!Number.isFinite(km) || km <= 0) return 0
  if (!Number.isFinite(sk) || sk <= 0 || !Number.isFinite(se) || se < 0) return 0
  return Math.round(Math.ceil(km / sk) * se * 100) / 100
}
