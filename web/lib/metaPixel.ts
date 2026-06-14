  declare global {
    interface Window {
      fbq?: (action: 'track' | 'init', event: string, params?: Record<string, unknown>) => void
    }
  }

  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

  function track(event: string, params?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return
    if (!PIXEL_ID || typeof window.fbq !== 'function') return
    window.fbq('track', event, params)
  }

  export function trackPageView(): void {
    track('PageView')
  }

  export function trackViewContent(id: number, name: string, price: number): void {
    track('ViewContent', {
      content_ids: [String(id)],
      content_name: name,
      value: price,
      currency: 'EUR',
      content_type: 'product',
    })
  }

  export function trackAddToCart(id: number, name: string, price: number): void {
    track('AddToCart', {
      content_ids: [String(id)],
      content_name: name,
      value: price,
      currency: 'EUR',
      content_type: 'product',
    })
  }

  export function trackInitiateCheckout(numItems: number, value: number, contentIds: string[]): void {
    track('InitiateCheckout', {
      num_items: numItems,
      value,
      currency: 'EUR',
      content_ids: contentIds,
    })
  }

  export function trackPurchase(
    orderId: string,
    value: number,
    numItems: number,
    contentIds: string[],
  ): void {
    track('Purchase', {
      order_id: orderId,
      value,
      currency: 'EUR',
      num_items: numItems,
      content_ids: contentIds,
      content_type: 'product',
    })
  }

  // ── Purchase payload stash: survives redirects to payment gateways (Stripe / LiqPay) ──

  const PURCHASE_STASH_KEY = 'watta_pixel_purchase'

  export interface PixelPurchaseStash {
    orderId: string
    value: number
    numItems: number
    contentIds: string[]
  }

  export function stashPixelPurchase(payload: PixelPurchaseStash): void {
    try {
      sessionStorage.setItem(PURCHASE_STASH_KEY, JSON.stringify(payload))
    } catch {
      /* sessionStorage blocked in private browsing */
    }
  }

  export function consumePixelPurchase(): PixelPurchaseStash | null {
    try {
      const raw = sessionStorage.getItem(PURCHASE_STASH_KEY)
      if (!raw) return null
      sessionStorage.removeItem(PURCHASE_STASH_KEY)
      return JSON.parse(raw) as PixelPurchaseStash
    } catch {
      return null
    }
  }
