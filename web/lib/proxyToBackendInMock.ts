import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** Express API під час USE_LOCAL_MOCK (меню — мок, акаунт/замовлення — БД). */
export function backendOriginForMockProxy(): string {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://127.0.0.1:5050'
  const trimmed = String(raw).replace(/\/$/, '')
  try {
    const u = new URL(trimmed)
    if (u.hostname === 'localhost') u.hostname = '127.0.0.1'
    return u.origin
  } catch {
    return 'http://127.0.0.1:5050'
  }
}

const AUTH_NEXT_ROUTE_HANDLERS = new Set(['login', 'register', 'verify'])

function authRouteTail(sub: string): string {
  return sub.startsWith('auth/') ? sub.slice('auth/'.length) : sub
}

export function authUsesNextRouteHandler(sub: string): boolean {
  return AUTH_NEXT_ROUTE_HANDLERS.has(authRouteTail(sub))
}

export function subNeedsBackendProxy(sub: string, request: NextRequest): boolean {
  if (sub.startsWith('contact')) return true
  if (sub.startsWith('orders')) return true
  if (sub.startsWith('reviews')) return true
  if (sub.startsWith('notifications')) return true
  if (sub.startsWith('auth/') && !authUsesNextRouteHandler(sub)) return true
  const authHeader = request.headers.get('authorization')?.trim()
  const hasBearer = Boolean(authHeader?.startsWith('Bearer ') && authHeader.length > 'Bearer '.length)
  if (hasBearer && sub.startsWith('favorites')) return true
  return false
}

export async function proxyToBackend(request: NextRequest, sub: string): Promise<NextResponse> {
  const base = backendOriginForMockProxy()
  const target = new URL(`/api/${sub}`, base)
  target.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text()
    if (body.length > 0) {
      init.body = body
    }
  }

  const upstream = await fetch(target.toString(), init)
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  })
}

export function backendProxyUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      message:
        'Backend недоступен. Запустите API: из корня репозитория «npm run local:backend» или «npm run local:all» (порт 5050).',
    },
    { status: 503 },
  )
}
