import { NextRequest, NextResponse } from 'next/server'
import { backendBaseUrl } from '@/lib/backendBaseUrl'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const response = await fetch(`${backendBaseUrl()}/api/auth/login/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
