/** Дзеркало backend/lib/amsterdamDelivery.ts — для підказок у кошику до перевірки адреси. */
export const DELIVERY_MIN_ORDER_UP_TO_KM_EUR = 25

export function defaultMinimumOrderEur(): number {
  return DELIVERY_MIN_ORDER_UP_TO_KM_EUR
}
