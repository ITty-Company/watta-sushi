import { NextRequest, NextResponse } from 'next/server'
import { backendBaseUrl, backendUnreachableMessage, isBackendConnectionError } from '@/lib/backendBaseUrl'

/** Multipart upload — проксі з довшим таймаутом (великі фото). */
export async function POST(request: NextRequest) {
  const apiBase = backendBaseUrl()
  const url = `${apiBase}/api/products/upload-image`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const auth = request.headers.get('authorization')
    const contentType = request.headers.get('content-type')
    const body = await request.arrayBuffer()
    const headers = new Headers()
    if (auth) headers.set('authorization', auth)
    if (contentType) headers.set('content-type', contentType)

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
      return NextResponse.json({ message: 'Таймаут загрузки фото' }, { status: 504 })
    }
    if (isBackendConnectionError(fetchError)) {
      return NextResponse.json({ message: backendUnreachableMessage(apiBase) }, { status: 503 })
    }
    return NextResponse.json({ message: 'Ошибка загрузки фото' }, { status: 502 })
  }
}
