import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Proxying login request to:', `${API_BASE_URL}/api/auth/login`)
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('Failed to parse response:', parseError)
      return NextResponse.json(
        { message: 'Ошибка сервера: неверный формат ответа' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      console.error('Backend error:', response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Login API error:', error)
    const errorMessage = error.message || 'Ошибка подключения к серверу'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
