import { NextRequest } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

export async function POST(request: NextRequest) {
  return proxyBackendRequest(request, '/api/auth/reset-password', {
    method: 'POST',
    timeoutMs: 15_000,
  })
}
