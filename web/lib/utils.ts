import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Получить базовый URL API
export function getApiUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // У браузері завжди той самий origin — Next rewrites /api та /uploads на Express.
  // NEXT_PUBLIC_API_URL на окремий Render-сервіс часто дає 404; через web origin працює.
  if (typeof window !== 'undefined') {
    return cleanPath
  }

  const apiBaseUrl =
    process.env.BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || ''
  if (apiBaseUrl) {
    const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
    return `${base}${cleanPath}`
  }
  return cleanPath
}

