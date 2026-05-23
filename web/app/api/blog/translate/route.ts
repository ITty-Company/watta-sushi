import { NextRequest, NextResponse } from 'next/server'
import { backendBaseUrl, backendUnreachableMessage, isBackendConnectionError } from '@/lib/backendBaseUrl'

/** Автопереклад статті блогу (UK → RU, EN, NL). */
export async function POST(request: NextRequest) {
  const apiBase = backendBaseUrl()
  const url = `${apiBase}/api/blog/translate`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180_000)

  try {
    const auth = request.headers.get('authorization')
    const body = await request.text()
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (auth) headers.set('authorization', auth)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const text = await response.text()
    return new NextResponse(text || '{}', {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
    })
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId)
    const err = fetchError as { name?: string }
    if (err?.name === 'AbortError') {
      return NextResponse.json({ message: 'Таймаут перекладу' }, { status: 504 })
    }
    if (isBackendConnectionError(fetchError)) {
      return NextResponse.json({ message: backendUnreachableMessage(apiBase) }, { status: 503 })
    }
    return NextResponse.json({ message: 'Помилка перекладу' }, { status: 502 })
  }
}
