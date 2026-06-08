type RouterPush = { push: (href: string) => void }
type OpenCartDrawer = () => void

export const WATTA_CART_FOCUS_CHECKOUT_KEY = 'watta-cart-focus-checkout'

/** Сторінка оформлення замовлення (/cart). */
export function openWattaCheckout(router: RouterPush): void {
  if (typeof window !== 'undefined' && window.location.pathname === '/cart') {
    const target = document.getElementById('cart-checkout-contact')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return
  }
  try {
    sessionStorage.setItem(WATTA_CART_FOCUS_CHECKOUT_KEY, '1')
  } catch {
    /* ignore */
  }
  router.push('/cart')
}

/** Відкриває бічний кошик для перегляду позицій. */
export function openWattaCart(
  router: RouterPush,
  openDrawer?: OpenCartDrawer | null,
): void {
  const onCartPage =
    typeof window !== 'undefined' && window.location.pathname === '/cart'
  if (onCartPage) return
  if (openDrawer) {
    openDrawer()
    return
  }
  router.push('/cart')
}
