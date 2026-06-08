/**
 * Boot splash на головній при F5.
 * На проді увімкнено за замовчуванням (Render інколи не має NEXT_PUBLIC_* у білді).
 * Вимкнути: NEXT_PUBLIC_WATTA_BOOT_SPLASH=0
 */
export function isWattaBootSplashEnabled(): boolean {
  const raw = (process.env.NEXT_PUBLIC_WATTA_BOOT_SPLASH ?? '').trim().toLowerCase()
  if (raw === '0' || raw === 'false' || raw === 'off') return false
  if (raw === '1' || raw === 'true' || raw === 'on') return true
  return process.env.NODE_ENV === 'production'
}

/** Для inline boot script у layout (вшивається в білд). */
export const WATTA_BOOT_SPLASH_BOOT_FLAG = isWattaBootSplashEnabled() ? '1' : '0'
