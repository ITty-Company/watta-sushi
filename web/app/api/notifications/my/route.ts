import { NextRequest, NextResponse } from 'next/server'
import { proxyBackendRequest } from '@/lib/proxyBackendRequest'

const EMPTY = { items: [], unreadCount: 0 }

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')?.trim()
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const proxied = await proxyBackendRequest(request, '/api/notifications/my', {
    method: 'GET',
    timeoutMs: 15_000,
  })

  if (proxied.status >= 500 || proxied.status === 503 || proxied.status === 502) {
    return NextResponse.json(EMPTY)
  }

  return proxied
}
