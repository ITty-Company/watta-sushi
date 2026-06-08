'use client'

import { useEffect } from 'react'

/**
 * Реєстрація service worker'а (/sw.js) для офлайн-кешу app-shell.
 *
 * Тільки в production: у dev Next.js віддає не-хешовану статику й HMR,
 * кеш SW лише заважав би гарячому перезавантаженню.
 *
 * Реєстрацію відкладаємо до 'load' + requestIdleCallback, щоб не змагатися
 * за мережу з першим корисним кадром (hero / шрифти / каталог).
 */
/**
 * Прибирає «зомбі» service worker'а: якщо SW лишився з попереднього
 * production-білда, у dev він і далі перехоплює `/_next/static/` стратегією
 * cacheFirst і віддає СТАРІ (нехешовані) dev-чанки. Результат — оболонка
 * рендериться, а контент (MenuView) лишається порожнім, БЕЗ помилок у консолі,
 * і «Clear site data» в iOS Safari не завжди знімає сам SW. Тому в dev активно
 * розреєстровуємо всі SW та чистимо їхні кеші.
 */
function purgeServiceWorkers() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  // Знімаємо будь-які SW і чистимо їхні кеші. БЕЗ авто-reload: перезавантаження
  // звідси (чи з самого SW) створює петлю. Сторінка оживе на наступному ручному
  // оновленні, коли SW уже не контролює навігацію.
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((reg) => void reg.unregister()))
    .catch(() => {})
  if (typeof caches !== 'undefined') {
    caches
      .keys()
      .then((keys) => keys.filter((k) => k.startsWith('watta-')).map((k) => caches.delete(k)))
      .catch(() => {})
  }
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      purgeServiceWorkers()
      return
    }
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => {
          // Нова версія SW готова — активуємо одразу, без очікування закриття вкладок.
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing
            if (!installing) return
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                reg.waiting?.postMessage('SKIP_WAITING')
              }
            })
          })
        },
        () => {
          /* реєстрація не критична — мовчки ігноруємо */
        },
      )
    }

    const onLoad = () => {
      type IdleWindow = Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
      }
      const w = window as IdleWindow
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(register, { timeout: 3000 })
      } else {
        window.setTimeout(register, 1200)
      }
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad, { once: true })
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  return null
}
