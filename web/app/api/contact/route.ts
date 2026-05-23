import { NextRequest, NextResponse } from 'next/server'
import {
  backendBaseUrl,
  backendUnreachableMessage,
  isBackendConnectionError,
} from '@/lib/backendBaseUrl'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }

  const apiBase = backendBaseUrl()
  const backendUrl = `${apiBase}/api/contact`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const text = await response.text()
    let data: Record<string, unknown> = {}
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>
      } catch {
        return NextResponse.json({ error: 'bad_backend_response' }, { status: 502 })
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId)

    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      return NextResponse.json({ error: 'timeout' }, { status: 504 })
    }

    if (isBackendConnectionError(fetchError)) {
      return NextResponse.json(
        { error: 'backend_unreachable', message: backendUnreachableMessage(apiBase) },
        { status: 503 },
      )
    }

    console.error('[api/contact] proxy error', fetchError)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
