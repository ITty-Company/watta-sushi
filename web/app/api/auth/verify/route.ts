import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5050'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = `${API_BASE_URL}/api/auth/verify`

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
          { status: 500 }
        )
      }

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status })
      }

      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      const err = fetchError as { name?: string; code?: string; message?: string }
      if (err.name === 'AbortError') {
        return NextResponse.json({ message: 'Таймаут подключения к серверу.' }, { status: 504 })
      }
      if (err.code === 'ECONNREFUSED' || String(err.message || '').includes('fetch failed')) {
        return NextResponse.json({ message: 'Не удалось подключиться к серверу.' }, { status: 503 })
      }
      throw fetchError
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ошибка сервера'
    return NextResponse.json({ message }, { status: 500 })
  }
}
