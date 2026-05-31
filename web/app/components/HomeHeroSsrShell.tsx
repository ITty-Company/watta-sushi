import {WATTA_HERO_OCEAN_GRADIENT } from '@/lib/wattaHeroVideo'

/** SSR-заглушка hero до гідратації MenuView — постер + висота, без білого поля. */
export default function HomeHeroSsrShell() {
  return (
    <div
      className="watta-home-hero-entry-shell delivery-page-hero-stack delivery-page-hero-stack--video-first"
      aria-hidden
      suppressHydrationWarning
    >
      <div className="delivery-page-hero-standalone-web welcome-hero-section-web watta-home-hero-as-card-web">
        <div className="welcome-hero-video-fill-web">
          <div
            className="welcome-hero-video-stack-web"
            style={{ backgroundColor: WATTA_HERO_OCEAN_GRADIENT }}
          >
            <div
              className="welcome-hero-media-frame-web"
              style={{
                backgroundColor: WATTA_HERO_OCEAN_GRADIENT,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
