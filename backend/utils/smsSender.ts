import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()

let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (!accountSid || !authToken) return null
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

/** E.164 (+31612345678) — формат Twilio для любой страны. */
export function formatPhoneE164(phone: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return null
  return `+${digits}`
}

function twilioConfigured(): boolean {
  return Boolean(
    accountSid && authToken && (fromNumber || messagingServiceSid),
  )
}

/**
 * SMS через Twilio — вход / коды / промо.
 * Номер клиента: международный формат (+31…, +380…, +1…).
 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  const to = formatPhoneE164(phone)
  if (!to) {
    console.error('[SMS] Invalid phone:', phone)
    return false
  }

  console.log(`📨 [SMS] to ${to}: ${message}`)

  const isProd = process.env.NODE_ENV === 'production'
  const sendInDev = process.env.TWILIO_SEND_IN_DEV === '1'

  if (!isProd && !sendInDev) {
    console.log('[SMS] Dev skip (TWILIO_SEND_IN_DEV=1 to send real SMS locally)')
    return true
  }

  if (!twilioConfigured()) {
    console.error(
      '[SMS] Twilio not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID',
    )
    return false
  }

  const client = getTwilioClient()
  if (!client) return false

  try {
    await client.messages.create({
      body: message,
      to,
      ...(messagingServiceSid
        ? { messagingServiceSid }
        : { from: fromNumber! }),
    })
    return true
  } catch (error) {
    console.error('[SMS] Twilio error:', error)
    return false
  }
}
