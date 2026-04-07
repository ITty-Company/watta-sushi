import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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
  productsForFavoriteList,
} from './lib/localDevMock'

const FAV_COOKIE = 'local_mock_fav_ids'

function parseFavCookie(req: NextRequest): Set<number> {
  const raw = req.cookies.get(FAV_COOKIE)?.value
  if (!raw) return new Set()
  try {
    const arr = JSON.parse(decodeURIComponent(raw))
    return new Set((Array.isArray(arr) ? arr : []).map(Number).filter(Number.isFinite))
  } catch {
    return new Set()
  }
}

function favCookieHeader(ids: Set<number>): string {
  const payload = encodeURIComponent(JSON.stringify(Array.from(ids).sort((a, b) => a - b)))
  return `${FAV_COOKIE}=${payload}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
}

/**
 * Відповіді збігаються з Express-роутами (Prisma JSON), див. backend/routes/*.routes.ts
 */
export async function middleware(request: NextRequest) {
  if (process.env.USE_LOCAL_MOCK !== '1') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const method = request.method
  const sub = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '') || ''

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
      let body: { cityId?: number; postalCode?: string } = {}
      try {
        body = await request.json()
      } catch {
        /* empty */
      }
      const cityId = Number(body.cityId)
      const postal = String(body.postalCode ?? '').trim()
      if (!cityId || !postal) {
        return NextResponse.json({ status: 'bad_request' }, { status: 400 })
      }
      return NextResponse.json({
        status: postal.length >= 3 ? 'inside' : 'geocode_failed',
        lat: 50.45,
        lng: 30.52,
        placeLabel: 'Mock (local dev)',
        zoneName: 'Центр',
        zoneId: 1,
        zoneIsFreeDelivery: true,
        zoneFlatDeliveryFee: null,
        pricePerKm: 10,
        defaultDeliveryFee: 50,
        freeDeliveryThreshold: 1000,
        estimatedDeliveryFee: postal.length >= 3 ? 0 : null,
        distanceKm: postal.length >= 3 ? 2.5 : null,
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

    if (sub === 'favorites/toggle') {
      const userId = Number(request.headers.get('x-user-id'))
      if (!userId) {
        return NextResponse.json({ message: 'Нужна авторизация' }, { status: 401 })
      }
      let body: { productId?: number } = {}
      try {
        body = await request.json()
      } catch {
        /* empty */
      }
      const productId = Number(body.productId)
      if (!productId) {
        return NextResponse.json({ message: 'Invalid product' }, { status: 400 })
      }
      const set = parseFavCookie(request)
      let added: boolean
      if (set.has(productId)) {
        set.delete(productId)
        added = false
      } else {
        set.add(productId)
        added = true
      }
      const res = NextResponse.json({ added })
      res.headers.append('Set-Cookie', favCookieHeader(set))
      return res
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
    case 'favorites': {
      const userId = Number(request.headers.get('x-user-id'))
      if (!userId) return NextResponse.json([])
      return NextResponse.json(Array.from(parseFavCookie(request)))
    }
    case 'favorites/list': {
      const userId = Number(request.headers.get('x-user-id'))
      if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json(productsForFavoriteList(Array.from(parseFavCookie(request))))
    }
    case 'promotions':
      return NextResponse.json(mockPromotions)
    case 'team':
      return NextResponse.json(mockTeam)
    case 'ingredients':
      return NextResponse.json(mockIngredients)
    case 'promo':
      return NextResponse.json([])
    case 'orders/bonus': {
      if (!request.headers.get('authorization')) {
        return NextResponse.json({ message: 'Нет токена авторизации' }, { status: 401 })
      }
      return NextResponse.json({ bonusBalance: 0 })
    }
    case 'orders/my': {
      if (!request.headers.get('authorization')) {
        return NextResponse.json({ message: 'Нет токена авторизации' }, { status: 401 })
      }
      return NextResponse.json([])
    }
    case 'orders/stats': {
      if (!request.headers.get('authorization')) {
        return NextResponse.json({ message: 'Нет токена авторизации' }, { status: 401 })
      }
      return NextResponse.json({
        totalOrders: 0,
        revenueCompleted: 0,
        paymentPaidCount: 0,
        byStatus: {
          PENDING: 0,
          COOKING: 0,
          DELIVERING: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        },
        rawStatusCounts: {},
      })
    }
    case 'orders':
      return NextResponse.json([])
    default:
      return NextResponse.json([])
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
