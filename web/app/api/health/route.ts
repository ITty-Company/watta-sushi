import { NextRequest } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

export async function GET(request: NextRequest) {
  return proxyBackendRequest(request, '/health', { method: 'GET', timeoutMs: 20_000 })
}
