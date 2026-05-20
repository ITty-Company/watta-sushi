import type { WattaLanguage } from '@/lib/i18n/language'

const MESSAGES: Record<string, Record<WattaLanguage, string>> = {
  PENDING: {
    uk: 'Замовлення №{{id}} прийнято',
    ru: 'Заказ №{{id}} принят',
    en: 'Order #{{id}} received',
    nl: 'Bestelling #{{id}} ontvangen',
  },
  CONFIRMED: {
    uk: 'Замовлення №{{id}} підтверджено',
    ru: 'Заказ №{{id}} подтверждён',
    en: 'Order #{{id}} confirmed',
    nl: 'Bestelling #{{id}} bevestigd',
  },
  COOKING: {
    uk: 'Готуємо замовлення №{{id}}',
    ru: 'Готовим заказ №{{id}}',
    en: 'Preparing order #{{id}}',
    nl: 'Bestelling #{{id}} wordt bereid',
  },
  DELIVERING: {
    uk: 'Замовлення №{{id}} уже доставляється',
    ru: 'Заказ №{{id}} уже доставляется',
    en: 'Order #{{id}} is on the way',
    nl: 'Bestelling #{{id}} is onderweg',
  },
  DELIVERED: {
    uk: 'Замовлення №{{id}} доставлено',
    ru: 'Заказ №{{id}} доставлен',
    en: 'Order #{{id}} delivered',
    nl: 'Bestelling #{{id}} bezorgd',
  },
  COMPLETED: {
    uk: 'Замовлення №{{id}} виконано',
    ru: 'Заказ №{{id}} выполнен',
    en: 'Order #{{id}} completed',
    nl: 'Bestelling #{{id}} voltooid',
  },
  CANCELLED: {
    uk: 'Замовлення №{{id}} скасовано',
    ru: 'Заказ №{{id}} отменён',
    en: 'Order #{{id}} cancelled',
    nl: 'Bestelling #{{id}} geannuleerd',
  },
}

export function getOrderStatusToastMessage(
  status: string,
  orderId: number,
  lang: WattaLanguage,
): string {
  const row = MESSAGES[status] ?? MESSAGES.PENDING
  const tpl = row[lang] ?? row.uk
  return tpl.replace('{{id}}', String(orderId))
}
