import { NextRequest } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

export async function POST(request: NextRequest) {
  return proxyBackendRequest(request, '/api/products', { method: 'POST', timeoutMs: 120_000 })
}
