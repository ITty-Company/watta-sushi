export const WATTA_BLOG_UPDATED_EVENT = 'blogUpdated'
export const WATTA_PUBLIC_BLOG_NAV_CACHE_KEY = 'watta_public_blog_nav_v1'

/** Чи є хоча б одна опублікована стаття для показу в меню та на /blog */
export async function fetchPublicBlogAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/blog', { cache: 'no-store' })
    if (!res.ok) return false
    const data: unknown = await res.json()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

export function readPublicBlogNavCache(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(WATTA_PUBLIC_BLOG_NAV_CACHE_KEY)
    if (raw === '1') return true
    if (raw === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

export function writePublicBlogNavCache(available: boolean): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(WATTA_PUBLIC_BLOG_NAV_CACHE_KEY, available ? '1' : '0')
  } catch {
    /* ignore */
  }
}
