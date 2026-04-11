/**
 * Єдине джерело секрету JWT. У production без змінної — процес має падати на старті (server.js).
 */
export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim()
  if (s) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production')
  }
  console.warn(
    '⚠️  JWT_SECRET не задано — використовується dev fallback. Обов’язково задайте JWT_SECRET у production.',
  )
  return 'dev-only-insecure-jwt-secret-do-not-use-in-production'
}
