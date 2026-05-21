import { NextRequest } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

/** Меню на головній — без GET Next повертає 405 і rewrites не спрацьовують. */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.search
  return proxyBackendRequest(request, `/api/products${search}`, { method: 'GET', timeoutMs: 60_000 })
}

export async function POST(request: NextRequest) {
  return proxyBackendRequest(request, '/api/products', { method: 'POST', timeoutMs: 180_000 })
}
