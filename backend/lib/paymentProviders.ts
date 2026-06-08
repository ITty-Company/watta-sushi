/** Чи налаштована онлайн-оплата карткою (Stripe Checkout або LiqPay). */
export function hasStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function hasLiqPayConfigured(): boolean {
  return Boolean(
    process.env.LIQPAY_PUBLIC_KEY?.trim() && process.env.LIQPAY_PRIVATE_KEY?.trim(),
  )
}

export function hasCardPaymentCredentials(): boolean {
  return hasStripeConfigured() || hasLiqPayConfigured()
}

/**
 * Чи показувати плитку «Карткою онлайн» у кошику (прапорець у адмінці).
 */
export function isCardOnlinePaymentAvailable(cardOnlineEnabled?: boolean | null): boolean {
  return cardOnlineEnabled !== false
}

/** Чи можна реально відкрити Stripe Checkout / LiqPay для замовлення CARD. */
export function canProcessCardPayment(cardOnlineEnabled?: boolean | null): boolean {
  if (cardOnlineEnabled === false) return false
  return hasCardPaymentCredentials()
}

export function cardPaymentSetupHint(): string | null {
  if (hasCardPaymentCredentials()) return null
  return 'Додайте STRIPE_SECRET_KEY або LIQPAY_PUBLIC_KEY + LIQPAY_PRIVATE_KEY у backend/.env (або змінні Render API).'
}

export function cardOnlinePaymentProvider(): 'stripe' | 'liqpay' | null {
  if (hasStripeConfigured()) return 'stripe'
  if (hasLiqPayConfigured()) return 'liqpay'
  return null
}

/** Публічний URL API для LiqPay server_url (callback). */
export function getPublicApiUrl(): string {
  const explicit =
    process.env.PUBLIC_API_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim()
  return explicit ? explicit.replace(/\/$/, '') : ''
}
