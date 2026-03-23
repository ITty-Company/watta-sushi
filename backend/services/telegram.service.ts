import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID

const prisma = new PrismaClient()

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function paymentMethodLabel(method: string | undefined): string {
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

function paymentStatusLabel(status: string | undefined): string {
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

export const sendTelegramNotification = async (order: any, items: any[]) => {
  if (!TG_TOKEN || !TG_CHAT_ID) return

  const isPickup = order.fulfillmentType === 'PICKUP'

  let addressForMessage = escapeHtml(order.address || '—')
  if (isPickup) {
    try {
      const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } })
      const pickup = settings?.restaurantPickupAddress?.trim()
      if (pickup) addressForMessage = escapeHtml(pickup)
    } catch (e) {
      console.error('TG pickup address load:', e)
    }
  }

  const fulfillmentLine = isPickup
    ? '🥡 <b>Тип получения:</b> Самовывоз (Pickup)'
    : '🚚 <b>Тип получения:</b> Доставка (Delivery)'

  const deliveryFeeBlock = isPickup
    ? ''
    : order.deliveryFee > 0
      ? `\n🚛 <b>Стоимость доставки:</b> +${order.deliveryFee} ₴`
      : `\n🚛 <b>Стоимость доставки:</b> Бесплатно`

  const addressLabel = isPickup ? '📍 <b>Адрес ресторана (самовывоз):</b>' : '📍 <b>Адрес доставки:</b>'

  const itemsList = items
    .map(
      (i: any) =>
        `— ${escapeHtml(i.product?.name_ru || 'Товар')} x${i.quantity} (${i.price * i.quantity} ₴)`
    )
    .join('\n')

  const yn = (v: boolean | undefined) => (v === true ? 'Да' : 'Нет')
  const prefsBlock = `\n🔕 <b>Не перезванивать (подтвержд.):</b> ${yn(order.noCallbackConfirm)}
🚪 <b>Не звонить в дверь:</b> ${yn(order.noDoorbellRing)}`

  const message = `
🍣 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

${fulfillmentLine}${deliveryFeeBlock}
💳 <b>Способ оплаты:</b> ${paymentMethodLabel(order.paymentMethod)}
🏦 <b>Статус оплаты:</b> ${paymentStatusLabel(order.paymentStatus)}${prefsBlock}

👤 <b>Клиент:</b> ${escapeHtml(order.customerName)}
📞 <b>Телефон:</b> ${escapeHtml(order.phone)}
${addressLabel}
${addressForMessage}
💬 <b>Комментарий:</b> ${order.comment ? escapeHtml(order.comment) : 'Нет'}

🛒 <b>Заказ:</b>
${itemsList}

💵 <b>ИТОГО: ${order.totalPrice} ₴</b>
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })
  } catch (error) {
    console.error('TG Error:', error)
  }
}
