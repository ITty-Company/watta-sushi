/** Заказ ще в роботі (не завершений і не скасований). */
export function isActiveOrderStatus(status: string): boolean {
  const s = String(status || '').toUpperCase()
  return s !== 'CANCELLED' && s !== 'COMPLETED' && s !== 'DELIVERED'
}

/** Чек доступний для будь-якого замовлення — на сторінці видно статус оплати. */
export function canShowOrderReceipt(_paymentStatus?: string, _paymentMethod?: string): boolean {
  return true
}
