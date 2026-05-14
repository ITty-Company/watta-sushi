'use client'

import { useEffect, useState } from 'react'
import WattaLoadScreen from './WattaLoadScreen'
import { useLanguage } from '../context/LanguageContext'

type HomeBootSplashProps = {
  /** Якщо true — батько просить плавно завершити (заповнюємо до 100%, потім ховаємо). */
  finishing?: boolean
}

/**
 * Білий boot-сплеш над головною. Той самий «крутий» дизайн з прогрес-баром і логотипом,
 * що був раніше; лого побільше, біле тло, бренд-зелений у барі та бігучі білі смужки.
 *
 * Логіка прогресу:
 * — На маунті стартує анімація 0 → 92%.
 * — Коли батько вирішує приховати (`finishing=true`) — добиваємо до 100% і ховаємось.
 */
export default function HomeBootSplash({ finishing = false }: HomeBootSplashProps) {
  const { t } = useLanguage()
  const label = t.siteAria?.loading || 'Завантаження'
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    if (finishing) {
      setProgress(100)
      return
    }
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 92) {
          window.clearInterval(id)
          return 92
        }
        return p + 6
      })
    }, 60)
    return () => window.clearInterval(id)
  }, [finishing])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: finishing
          ? 'wattaHomeBootFadeOut 220ms ease-out forwards'
          : 'wattaHomeBootFadeIn 120ms ease-out',
      }}
    >
      <WattaLoadScreen
        className="watta-home-boot-splash-screen"
        progress={progress}
        label={
          <>
            {label}
            <span className="watta-dot">.</span>
            <span className="watta-dot">.</span>
            <span className="watta-dot">.</span>
          </>
        }
      />

      <style>{`
        @keyframes wattaHomeBootFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wattaHomeBootFadeOut {
          from { opacity: 1; }
          to { opacity: 0; visibility: hidden; }
        }

        /* Логотип компактний */
        .watta-home-boot-splash-screen .watta-load-screen-logo {
          width: min(44vw, 200px) !important;
          max-height: min(32vh, 200px) !important;
        }
        .watta-home-boot-splash-screen .watta-load-screen-stack {
          gap: 18px !important;
          max-width: min(80vw, 320px);
        }

        /* Вузький прогрес-бар */
        .watta-home-boot-splash-screen .watta-loading-bar-background {
          width: min(180px, 70%) !important;
          --watta-bar-outer-h: 22px;
        }
        .watta-home-boot-splash-screen .watta-loading-bar {
          --watta-bar-inner-h: 14px;
        }

        /* Бігучі білі смужки всередині бара (раніше не рухались) */
        .watta-home-boot-splash-screen .watta-white-bars-container {
          animation: wattaHomeBootBarsSlide 1.6s linear infinite;
        }
        @keyframes wattaHomeBootBarsSlide {
          from { transform: translateX(-30px); }
          to   { transform: translateX(30px); }
        }
      `}</style>
    </div>
  )
}
