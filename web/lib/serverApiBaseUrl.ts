import { headers } from 'next/headers'

/** База для server-side fetch до /api/* коли NEXT_PUBLIC_API_URL порожній (dev:mock). */
export function serverApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') === 'https' ? 'https' : 'http'
  return `${proto}://${host}`
}
