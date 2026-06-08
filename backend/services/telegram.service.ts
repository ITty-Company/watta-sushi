import fetch from 'node-fetch'
import { PrismaClient } from '@prisma/client'
import { formatOrderTelegramMessage } from '../lib/orderTelegramMessage.js'

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID

const prisma = new PrismaClient()

export const sendTelegramNotification = async (order: any, items: any[]) => {
  if (!TG_TOKEN || !TG_CHAT_ID) return

  let pickupRestaurantAddress: string | null = null
  if (order.fulfillmentType === 'PICKUP') {
    try {
      const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } })
      pickupRestaurantAddress = settings?.restaurantPickupAddress?.trim() || null
    } catch (e) {
      console.error('TG pickup address load:', e)
    }
  }

  const message = formatOrderTelegramMessage(order, items, { pickupRestaurantAddress })

  try {
    const response = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`TG sendMessage failed (${response.status}):`, body)
    }
  } catch (error) {
    console.error('TG Error:', error)
  }
}
