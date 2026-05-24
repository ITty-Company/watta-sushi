import { normalizeInternalPath } from '@/lib/instantNav'

type ChunkLoader = () => Promise<unknown>

/** Ключові клієнтські чанки сторінок — підвантажуємо до кліку, щоб перехід не чекав parse/eval. */
const CHUNK_BY_PATH: Record<string, ChunkLoader> = {
  '/menu': () => import('@/app/components/FullMenuPageClient'),
  '/delivery': () => import('@/app/components/DeliveryView'),
  '/about': () => import('@/app/components/AboutPageView'),
  '/about/gallery': () => import('@/app/about/gallery/TeamGalleryPageClient'),
  '/contacts': () => import('@/app/components/ContactsView'),
  '/reviews': () => import('@/app/reviews/ReviewsPageClient'),
  '/cart': () => import('@/app/components/CartView'),
  '/profile': () => import('@/app/components/ProfileView'),
  '/favorites': () => import('@/app/components/FavoritesPageClient'),
  '/promotions': () => import('@/app/components/PromotionsView'),
  '/notifications': () =>
    import('@/app/components/NotificationsView').then((m) => ({
      default: m.NotificationsView,
    })),
  '/blog': () => import('@/app/blog/BlogIndexClient'),
  '/privacy': () => import('@/app/components/PrivacyPolicyView'),
  '/admin': () => import('@/app/components/AdminView'),
  '/login': () => import('@/app/components/auth/AuthScreen'),
  '/register': () => import('@/app/components/auth/AuthScreen'),
}

const PRIORITY_PATHS = [
  '/menu',
  '/delivery',
  '/cart',
  '/promotions',
  '/about',
  '/contacts',
  '/favorites',
  '/profile',
] as const

const prefetchedChunks = new Set<string>()

function loadChunk(path: string, loader: ChunkLoader): void {
  if (prefetchedChunks.has(path)) return
  prefetchedChunks.add(path)
  void loader().catch(() => {
    prefetchedChunks.delete(path)
  })
}

function prefetchPathPattern(path: string): void {
  if (path.startsWith('/product/')) {
    loadChunk('/product/:id', () => import('@/app/components/ProductView'))
    return
  }
  if (path.startsWith('/menu/category/')) {
    loadChunk('/menu/category/:slug', () =>
      import('@/app/menu/category/[slug]/CategoryMenuClient'),
    )
    return
  }
  if (path.startsWith('/promotions/') && path !== '/promotions') {
    loadChunk('/promotions/:id', () => import('@/app/components/PromotionsDetailView'))
  }
}

/** Підвантажити JS-чанк для внутрішнього маршруту (паралельно до router.prefetch RSC). */
export function prefetchRouteChunk(href: string): void {
  const path = normalizeInternalPath(href)
  if (!path) return

  const loader = CHUNK_BY_PATH[path]
  if (loader) {
    loadChunk(path, loader)
    return
  }
  prefetchPathPattern(path)
}

/** Спочатку найчастіші маршрути, решту — idle, щоб не забити мережу на старті. */
export function prefetchPriorityRouteChunks(): void {
  for (const path of PRIORITY_PATHS) {
    const loader = CHUNK_BY_PATH[path]
    if (loader) loadChunk(path, loader)
  }
}

export function prefetchAllRouteChunks(): void {
  for (const [path, loader] of Object.entries(CHUNK_BY_PATH)) {
    loadChunk(path, loader)
  }
  loadChunk('/product/:id', () => import('@/app/components/ProductView'))
  loadChunk('/menu/category/:slug', () =>
    import('@/app/menu/category/[slug]/CategoryMenuClient'),
  )
  loadChunk('/promotions/:id', () => import('@/app/components/PromotionsDetailView'))
}

let idlePrefetchScheduled = false

export function scheduleIdleRouteChunkPrefetch(): void {
  if (typeof window === 'undefined' || idlePrefetchScheduled) return
  idlePrefetchScheduled = true

  const runRest = () => {
    for (const [path, loader] of Object.entries(CHUNK_BY_PATH)) {
      if ((PRIORITY_PATHS as readonly string[]).includes(path)) continue
      loadChunk(path, loader)
    }
    loadChunk('/product/:id', () => import('@/app/components/ProductView'))
    loadChunk('/menu/category/:slug', () =>
      import('@/app/menu/category/[slug]/CategoryMenuClient'),
    )
    loadChunk('/promotions/:id', () => import('@/app/components/PromotionsDetailView'))
  }

  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  }
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(runRest, { timeout: 600 })
  } else {
    window.setTimeout(runRest, 200)
  }
}
