/** Заголовки Authorization для запитів до API (обране, бонуси тощо). */
export function getBearerAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  if (!token?.trim()) return {}
  return { Authorization: `Bearer ${token.trim()}` }
}
