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
    const backendUrl = `${apiBase}/api/auth/register`
    if (process.env.NODE_ENV !== 'production') {
      console.log('Proxying register request to:', backendUrl)
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут
    
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data
      try {
        const text = await response.text()
        if (!text) {
          throw new Error('Empty response')
        }
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        console.error('Response status:', response.status)
        return NextResponse.json(
          { message: 'Ошибка сервера: неверный формат ответа от бэкенда' },
          { status: 500 }
        )
      }

      if (!response.ok) {
        console.error('Backend error:', response.status, data)
        return NextResponse.json(data, { status: response.status })
      }

      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout to:', backendUrl)
        return NextResponse.json(
          { message: 'Таймаут подключения к серверу. Проверьте, что бэкенд запущен.' },
          { status: 504 }
        )
      }
      
      if (isBackendConnectionError(fetchError)) {
        console.error('Connection error to:', backendUrl, fetchError)
        return NextResponse.json({ message: backendUnreachableMessage(apiBase) }, { status: 503 })
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('Register API error:', error)
    const errorMessage = error.message || 'Ошибка подключения к серверу'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
