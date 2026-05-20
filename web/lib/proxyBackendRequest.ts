import { NextRequest, NextResponse } from 'next/server'
import {
  backendBaseUrl,
  backendUnreachableMessage,
  isBackendConnectionError,
} from '@/lib/backendBaseUrl'

type ProxyOptions = {
  method?: string
  timeoutMs?: number
}

/**
 * Проксі на Express з довшим таймаутом, ніж rewrite Next (502 на великих PUT товарів).
 */
export async function proxyBackendRequest(
  request: NextRequest,
  backendPath: string,
  options?: ProxyOptions,
): Promise<NextResponse> {
  const apiBase = backendBaseUrl()
  const method = options?.method ?? request.method
  const timeoutMs = options?.timeoutMs ?? 120_000
  const url = `${apiBase}${backendPath.startsWith('/') ? backendPath : `/${backendPath}`}`

  const headers = new Headers()
  const auth = request.headers.get('authorization')
  if (auth) headers.set('authorization', auth)
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      body = undefined
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const text = await response.text()
    const outHeaders = new Headers()
    const resCt = response.headers.get('content-type')
    if (resCt) outHeaders.set('content-type', resCt)

    return new NextResponse(text || '{}', {
      status: response.status,
      headers: outHeaders,
    })
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId)
    const err = fetchError as { name?: string }
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        {
          message:
            'Сервер не ответил вовремя. Сохраните без новых фото в галерее или загрузите фото кнопкой «Добавить» перед сохранением.',
        },
        { status: 504 },
      )
    }
    if (isBackendConnectionError(fetchError)) {
      return NextResponse.json({ message: backendUnreachableMessage(apiBase) }, { status: 503 })
    }
    console.error('proxyBackendRequest', url, fetchError)
    return NextResponse.json({ message: 'Ошибка связи с API' }, { status: 502 })
  }
}
