import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Получить базовый URL API
export function getApiUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  if (typeof window !== 'undefined') {
    // У dev: однакові origin-запити → Next rewrites на Express (і на LAN-телефоні не 127.0.0.1).
    if (process.env.NODE_ENV === 'development') {
      return cleanPath
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (apiBaseUrl) {
      const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
      return `${base}${cleanPath}`
    }
  }
  // SSR або прод без змінної — відносний шлях
  return cleanPath
}

