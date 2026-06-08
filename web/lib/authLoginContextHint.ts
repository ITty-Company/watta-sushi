/** Короткий контекст «навіщо логін» за return URL (кошик, профіль, …). */
export function getAuthLoginContextHint(
  returnUrl: string,
  hints: {
    cart: string
    profile: string
    favorites: string
    notifications: string
  },
): string | null {
  const path = (returnUrl.split('?')[0] || '/').trim()
  if (path === '/cart') return hints.cart
  if (path === '/profile' || path.startsWith('/profile/')) return hints.profile
  if (path === '/favorites') return hints.favorites
  if (path === '/notifications') return hints.notifications
  return null
}
