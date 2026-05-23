/** Чи налаштована онлайн-оплата карткою (Stripe Checkout або LiqPay). */
export function hasStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function hasLiqPayConfigured(): boolean {
  return Boolean(
    process.env.LIQPAY_PUBLIC_KEY?.trim() && process.env.LIQPAY_PRIVATE_KEY?.trim(),
  )
}

export function isCardOnlinePaymentAvailable(): boolean {
  return hasStripeConfigured() || hasLiqPayConfigured()
}

export function cardOnlinePaymentProvider(): 'stripe' | 'liqpay' | null {
  if (hasStripeConfigured()) return 'stripe'
  if (hasLiqPayConfigured()) return 'liqpay'
  return null
}
