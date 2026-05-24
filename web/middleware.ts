import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  authUsesNextRouteHandler,
  backendProxyUnavailableResponse,
  proxyToBackend,
  subNeedsBackendProxy,
} from './lib/proxyToBackendInMock'
import {
  MOCK_PROMO_CODE,
  deliveryZonesForCity,
  getCitiesForMenu,
  getCountriesPublic,
  getProductById,
  listProducts,
  listRecommendations,
  mockBanners,
  mockBlogPosts,
  mockCategories,
  mockIngredients,
  mockPromotions,
  mockSiteSettings,
  mockTeam,
} from './lib/localDevMock'

/**
 * Відповіді збігаються з Express-роутами (Prisma JSON), див. backend/routes/*.routes.ts
 */
function nextWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-watta-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    return nextWithPathname(request)
  }

  if (process.env.USE_LOCAL_MOCK !== '1') {
    return nextWithPathname(request)
  }

  const method = request.method
  const sub = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '') || ''

  if (pathname.startsWith('/api/auth/')) {
    if (authUsesNextRouteHandler(sub)) {
      return NextResponse.next()
    }
    try {
      return await proxyToBackend(request, sub)
    } catch {
      return backendProxyUnavailableResponse()
    }
  }

  if (subNeedsBackendProxy(sub, request)) {
    try {
      const proxied = await proxyToBackend(request, sub)
      if (
        proxied.status >= 500 &&
        request.method === 'GET' &&
        sub === 'contact/inquiries'
      ) {
        return NextResponse.json({ items: [], totalCount: 0, unreadCount: 0 })
      }
      return proxied
    } catch {
      if (request.method === 'GET' && sub === 'contact/inquiries') {
        return NextResponse.json({ items: [], totalCount: 0, unreadCount: 0 })
      }
      return backendProxyUnavailableResponse()
    }
  }

  if (method === 'POST') {
    if (sub === 'promo/check') {
      let body: { code?: string } = {}
      try {
        body = await request.json()
      } catch {
        /* empty */
      }
      if (!body?.code) {
        return NextResponse.json({ message: 'Введите код' }, { status: 400 })
      }
      if (String(body.code).toUpperCase() === MOCK_PROMO_CODE) {
        return NextResponse.json({
          success: true,
          discount: 10,
          code: MOCK_PROMO_CODE,
          isFixed: false,
        })
      }
      return NextResponse.json({ message: 'Промокод не найден или неактивен' }, { status: 404 })
    }

    if (sub === 'delivery/check') {
      let body: { cityId?: number; postalCode?: string; locationQuery?: string } = {}
      try {
        body = await request.json()
      } catch {
        /* empty */
      }
      const cityId = Number(body.cityId)
      const raw = String(body.locationQuery ?? body.postalCode ?? '').trim()
      if (!cityId || raw.length < 3) {
        return NextResponse.json({ status: 'bad_request' }, { status: 400 })
      }
      const normalized = raw.replace(/\s+/g, '').toUpperCase()
      const looksAmsterdam =
        /\bAMSTERDAM\b/i.test(raw) ||
        /^10\d{2}[A-Z]{2}$/.test(normalized) ||
        /^110\d[A-Z]{2}$/.test(normalized)
      const status =
        raw.length < 3 ? 'geocode_failed' : looksAmsterdam ? 'nl_tariff_ok' : 'outside_amsterdam'
      return NextResponse.json({
        status,
        lat: looksAmsterdam ? 52.37 : 51.7,
        lng: looksAmsterdam ? 4.9 : 5.7,
        placeLabel: looksAmsterdam ? 'Mock Amsterdam (local dev)' : raw,
        zoneName: looksAmsterdam ? 'Центр' : undefined,
        zoneId: looksAmsterdam ? 1 : undefined,
        zoneIsFreeDelivery: looksAmsterdam ? true : undefined,
        zoneFlatDeliveryFee: null,
        pricePerKm: 0.5,
        defaultDeliveryFee: 0,
        freeDeliveryThreshold: 1000,
        deliveryTariffStepKm: 3,
        deliveryTariffStepEur: 1.5,
        estimatedDeliveryFee: status === 'nl_tariff_ok' ? 1.5 : null,
        distanceKm: status === 'nl_tariff_ok' ? 2.5 : null,
        routeDurationMinutes: status === 'nl_tariff_ok' ? 18 : null,
        minimumOrderEur: status === 'nl_tariff_ok' ? 25 : null,
      })
    }

    if (sub === 'contact') {
      let body: { website?: string; name?: string; email?: string; message?: string } = {}
      try {
        body = await request.json()
      } catch {
        /* empty */
      }
      if (String(body.website || '').trim()) {
        return NextResponse.json({ ok: true })
      }
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim()
      const message = String(body.message || '').trim()
      if (name.length < 2 || name.length > 120) {
        return NextResponse.json({ error: 'bad_name' }, { status: 400 })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
        return NextResponse.json({ error: 'bad_email' }, { status: 400 })
      }
      if (message.length < 10 || message.length > 4000) {
        return NextResponse.json({ error: 'bad_message' }, { status: 400 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'mock_mode_no_backend' }, { status: 503 })
  }

  if (method !== 'GET') {
    return NextResponse.next()
  }

  if (sub === 'blog') {
    const posts = mockBlogPosts.filter((p) => p.isPublished)
    return NextResponse.json(posts)
  }

  if (sub.startsWith('blog/')) {
    const slug = sub.slice('blog/'.length)
    if (slug === 'all') {
      return NextResponse.json([])
    }
    const post = mockBlogPosts.find((p) => p.slug === slug && p.isPublished)
    if (!post) {
      return NextResponse.json({ message: 'Статья не найдена' }, { status: 404 })
    }
    return NextResponse.json(post)
  }

  const dzMatch = sub.match(/^delivery-zones\/city\/(\d+)$/)
  if (dzMatch) {
    const cityId = Number(dzMatch[1])
    return NextResponse.json(deliveryZonesForCity(cityId))
  }

  if (sub === 'products/categories') {
    return NextResponse.json(mockCategories)
  }

  if (sub === 'products/recommendations') {
    return NextResponse.json(listRecommendations())
  }

  const productMatch = sub.match(/^products\/(\d+)$/)
  if (productMatch) {
    const id = Number(productMatch[1])
    const p = getProductById(id)
    if (p) return NextResponse.json(p)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (sub.startsWith('products/')) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  if (sub === 'products') {
    const cid = request.nextUrl.searchParams.get('cityId')
    const parsed = cid != null && cid !== '' ? parseInt(cid, 10) : NaN
    return NextResponse.json(listProducts(Number.isFinite(parsed) ? parsed : null))
  }

  const promoMatch = sub.match(/^promotions\/(\d+)$/)
  if (promoMatch) {
    const id = Number(promoMatch[1])
    const p = mockPromotions.find((x) => x.id === id)
    if (p) return NextResponse.json(p)
    return NextResponse.json({ error: 'News not found' }, { status: 404 })
  }

  switch (sub) {
    case 'countries':
      return NextResponse.json(getCountriesPublic())
    case 'cities':
      return NextResponse.json(getCitiesForMenu())
    case 'settings':
      return NextResponse.json(mockSiteSettings)
    case 'banners':
      return NextResponse.json(mockBanners)
    case 'promotions':
      return NextResponse.json(mockPromotions)
    case 'team':
      return NextResponse.json(mockTeam)
    case 'ingredients':
      return NextResponse.json(mockIngredients)
    case 'promo':
      return NextResponse.json([])
    case 'orders/stats': {
      if (!request.headers.get('authorization')) {
        return NextResponse.json({ message: 'Нет токена авторизации' }, { status: 401 })
      }
      return NextResponse.json({
        totalOrders: 0,
        revenueCompleted: 0,
        paymentPaidCount: 0,
        todayOrders: 0,
        todayRevenue: 0,
        byStatus: {
          PENDING: 0,
          CONFIRMED: 0,
          COOKING: 0,
          DELIVERING: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        },
        rawStatusCounts: {},
        dailySeries14: [],
      })
    }
    case 'contact/inquiries':
      if (!request.headers.get('authorization')) {
        return NextResponse.json({ message: 'Нет токена авторизации' }, { status: 401 })
      }
      return NextResponse.json({ items: [], totalCount: 0, unreadCount: 0 })
    default:
      return NextResponse.json([])
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    /* document-запити: x-watta-pathname для SSR-класу на <html> (Reload головної) */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|woff2?|css|js|map)$).*)',
  ],
}
