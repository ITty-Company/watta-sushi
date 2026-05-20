import { NextRequest } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return proxyBackendRequest(request, `/api/products/${id}`, { method: 'GET', timeoutMs: 60_000 })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return proxyBackendRequest(request, `/api/products/${id}`, { method: 'PUT', timeoutMs: 120_000 })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return proxyBackendRequest(request, `/api/products/${id}`, { method: 'DELETE', timeoutMs: 60_000 })
}
