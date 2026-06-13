export const WATTA_CHECKOUT_SUCCESS_LINE_COUNT_KEY = 'watta-checkout-success-line-count'

export function stashCheckoutSuccessLineCount(count: number): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      WATTA_CHECKOUT_SUCCESS_LINE_COUNT_KEY,
      String(Math.max(1, Math.floor(count))),
    )
  } catch {
    /* private mode */
  }
}

export function consumeCheckoutSuccessLineCount(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(WATTA_CHECKOUT_SUCCESS_LINE_COUNT_KEY)
    sessionStorage.removeItem(WATTA_CHECKOUT_SUCCESS_LINE_COUNT_KEY)
    const n = parseInt(raw ?? '', 10)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}
