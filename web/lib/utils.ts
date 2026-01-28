import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Получить базовый URL API
export function getApiUrl(path: string = ''): string {
  // В браузере используем переменную окружения или относительный путь
  if (typeof window !== 'undefined') {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (apiBaseUrl) {
      // Убираем trailing slash если есть
      const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
      // Убираем leading slash из path если есть
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      return `${base}${cleanPath}`
    }
  }
  // Для серверного рендеринга или если переменная не установлена, используем относительный путь
  return path.startsWith('/') ? path : `/${path}`
}

