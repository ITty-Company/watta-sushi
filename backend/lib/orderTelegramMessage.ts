import { getAmsterdamTodayKey } from './deliverySchedule.js'

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function addDaysToDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

function formatScheduleDateLabelRu(dateKey: string): string {
  const today = getAmsterdamTodayKey()
  const tomorrow = addDaysToDateKey(today, 1)
  if (dateKey === today) return 'Сегодня'
  if (dateKey === tomorrow) return 'Завтра'
  const [y, mo, d] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)))
}

function formatSlotDisplay(slot: string | null | undefined): string {
  if (!slot || slot === 'asap') return 'Как можно скорее'
  return slot.replace('-', ' – ')
}

export function paymentMethodLabel(method: string | undefined): string {
  switch (method) {
    case 'CASH':
      return 'Наличные'
    case 'CARD':
      return 'Карта (онлайн)'
    case 'APPLE_PAY':
      return 'Apple Pay'
    case 'GOOGLE_PAY':
      return 'Google Pay'
    case 'IDEAL':
      return 'iDEAL'
    default:
      return method ? String(method) : '—'
  }
}

export function paymentStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'PAID':
      return 'Оплачено'
    case 'PENDING':
      return 'В процессе'
    case 'FAILED':
      return 'Ошибка оплаты'
    case 'UNPAID':
    default:
      return 'Ожидает оплаты'
  }
}

function itemName(item: {
  product?: { name_ru?: string | null } | null
  productNameSnapshot?: string | null
}): string {
  return (
    String(item.product?.name_ru || item.productNameSnapshot || '').trim() || 'Товар'
  )
}

function formatMoney(amount: number): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

function buildCommentBlock(order: {
  fulfillmentType?: string | null
  scheduledForDate?: string | null
  scheduledForSlot?: string | null
  comment?: string | null
}): string {
  const isPickup = String(order.fulfillmentType || '').toUpperCase() === 'PICKUP'
  const raw = String(order.comment || '').trim()
  const hasFulfillmentTag = /^\[(Самовывоз|Доставка|Самовивіз|Pickup|Delivery)\]/i.test(raw)
  const hasScheduleTag = /\[Время доставки|Час доставки|Delivery time/i.test(raw)

  const parts: string[] = []
  if (!hasFulfillmentTag) {
    parts.push(isPickup ? '[Самовывоз]' : '[Доставка]')
  }

  const dateKey = order.scheduledForDate?.trim()
  const slot = order.scheduledForSlot?.trim()
  if (!hasScheduleTag && dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    const dateLabel = formatScheduleDateLabelRu(dateKey)
    const slotLabel = formatSlotDisplay(slot)
    parts.push(`[Время доставки (${dateLabel}): ${slotLabel}]`)
  }

  if (raw) parts.push(raw)
  return parts.length > 0 ? parts.join(' ') : 'Нет'
}

export type OrderTelegramInput = {
  id: number
  customerName?: string | null
  phone?: string | null
  address?: string | null
  fulfillmentType?: string | null
  deliveryFee?: number | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  noCallbackConfirm?: boolean | null
  noDoorbellRing?: boolean | null
  comment?: string | null
  scheduledForDate?: string | null
  scheduledForSlot?: string | null
  totalPrice?: number | null
}

export type OrderTelegramItem = {
  quantity: number
  price: number
  product?: { name_ru?: string | null } | null
  productNameSnapshot?: string | null
}

export function formatOrderTelegramMessage(
  order: OrderTelegramInput,
  items: OrderTelegramItem[],
  options?: { pickupRestaurantAddress?: string | null },
): string {
  const isPickup = String(order.fulfillmentType || '').toUpperCase() === 'PICKUP'

  let addressForMessage = escapeHtml(String(order.address || '—'))
  if (isPickup) {
    const pickup = options?.pickupRestaurantAddress?.trim()
    if (pickup) addressForMessage = escapeHtml(pickup)
  }

  const fulfillmentLine = isPickup
    ? '🥡 <b>Тип получения:</b> Самовывоз (Pickup)'
    : '🚚 <b>Тип получения:</b> Доставка (Delivery)'

  const deliveryFee = Number(order.deliveryFee) || 0
  const deliveryFeeBlock = isPickup
    ? ''
    : deliveryFee > 0
      ? `\n🚛 <b>Стоимость доставки:</b> +${formatMoney(deliveryFee)} ₴`
      : `\n🚛 <b>Стоимость доставки:</b> Бесплатно`

  const addressLabel = isPickup
    ? '📍 <b>Адрес ресторана (самовывоз):</b>'
    : '📍 <b>Адрес доставки:</b>'

  const itemsList = items
    .map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity)
      return `— ${escapeHtml(itemName(item))} x${item.quantity} (${formatMoney(lineTotal)} ₴)`
    })
    .join('\n')

  const yn = (v: boolean | undefined | null) => (v === true ? 'Да' : 'Нет')
  const commentText = escapeHtml(buildCommentBlock(order))

  return `
🍣 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

${fulfillmentLine}${deliveryFeeBlock}
💳 <b>Способ оплаты:</b> ${paymentMethodLabel(order.paymentMethod ?? undefined)}
🏦 <b>Статус оплаты:</b> ${paymentStatusLabel(order.paymentStatus ?? undefined)}
🔕 <b>Не перезванивать (подтвержд.):</b> ${yn(order.noCallbackConfirm)}
🚪 <b>Не звонить в дверь:</b> ${yn(order.noDoorbellRing)}

👤 <b>Клиент:</b> ${escapeHtml(String(order.customerName || '—'))}
📞 <b>Телефон:</b> ${escapeHtml(String(order.phone || '—'))}
${addressLabel}
${addressForMessage}
💬 <b>Комментарий:</b> ${commentText}

🛒 <b>Заказ:</b>
${itemsList || '—'}

💵 <b>ИТОГО: ${formatMoney(Number(order.totalPrice) || 0)} ₴</b>
  `.trim()
}
