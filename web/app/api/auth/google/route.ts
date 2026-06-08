import { NextRequest, NextResponse } from 'next/server'
import {
  backendBaseUrl,
  backendUnreachableMessage,
  isBackendConnectionError,
} from '@/lib/backendBaseUrl'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiBase = backendBaseUrl()
    const backendUrl = `${apiBase}/api/auth/google`

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
      let data: Record<string, unknown>
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        return NextResponse.json(
          { message: 'Неверный формат ответа сервера' },
          { status: 500 },
        )
      }

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status })
      }

      const token = typeof data.token === 'string' ? data.token : null
      if (token) {
        const res = NextResponse.json(data)
        res.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
        res.cookies.set('is_logged_in', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
        return res
      }

      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      const err = fetchError as { name?: string }
      if (err.name === 'AbortError') {
        return NextResponse.json({ message: 'Таймаут подключения к серверу.' }, { status: 504 })
      }
      if (isBackendConnectionError(fetchError)) {
        return NextResponse.json({ message: backendUnreachableMessage(apiBase) }, { status: 503 })
      }
      throw fetchError
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка сервера'
    return NextResponse.json({ message }, { status: 500 })
  }
}
