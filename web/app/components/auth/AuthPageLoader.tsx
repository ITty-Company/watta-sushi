'use client'

import AuthScreen from './AuthScreen'

export function AuthPageLoader({ mode }: { mode: 'login' | 'register' }) {
  return <AuthScreen variant="page" initialRegister={mode === 'register'} />
}
