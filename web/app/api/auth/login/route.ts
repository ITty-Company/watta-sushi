import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Проверка доступности переменной окружения
if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ NEXT_PUBLIC_API_URL не установлен в production!')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = `${API_BASE_URL}/api/auth/login`
    
    console.log('Proxying login request to:', backendUrl)
    console.log('API_BASE_URL:', API_BASE_URL)
    
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
      } catch (parseError: any) {
        console.error('Failed to parse response:', parseError)
        console.error('Response status:', response.status)
        console.error('Response statusText:', response.statusText)
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
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message.includes('fetch failed')) {
        console.error('Connection refused to:', backendUrl)
        return NextResponse.json(
          { message: 'Не удалось подключиться к серверу. Проверьте URL бэкенда.' },
          { status: 503 }
        )
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('Login API error:', error)
    const errorMessage = error.message || 'Ошибка подключения к серверу'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
