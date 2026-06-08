import { useEffect } from 'react'

/**
 * Scroll-reveal вимкнено: секції з `data-watta-in-view-fade` завжди видимі (CSS).
 * Хук лишається для сумісності з AppClient — без IO, scroll listeners і mutation observers.
 */
export function useScrollReveal(_pathname: string | null = null): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.remove('watta-scroll-reveal-ready')
  }, [_pathname])
}

/** @deprecated Use `useScrollReveal` */
export function usePhoneScrollReveal(): void {
  useScrollReveal()
}
