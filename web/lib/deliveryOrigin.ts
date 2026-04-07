/**
 * Единая точка відправлення для розрахунку відстані доставки (Distance Matrix / мок).
 * Тариф за км береться з міста в адмінці (`City.pricePerKm`).
 */
export const DEFAULT_DELIVERY_ORIGIN_ADDRESS = 'Amstelveenseweg 192, 1075 XR Amsterdam'

export function getDeliveryOriginAddress(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DELIVERY_ORIGIN_ADDRESS
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim()
  }
  return DEFAULT_DELIVERY_ORIGIN_ADDRESS
}
