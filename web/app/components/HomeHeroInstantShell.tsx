import { HOME_HERO_URLS_CACHE_KEY } from '@/lib/homeHeroVideoClientState'
import {
  appendHeroVideoStartSec,
  buildHomeHeroPrerollBootScript,
  buildHomeHeroPrerollSrcSyncScript,
  WATTA_HERO_PRIMARY_MP4,
} from '@/lib/wattaHeroVideo'

/** SSR hero з <video> — autoplay на контентному кадрі до гідратації React. */
export default function HomeHeroInstantShell() {
  const heroSrc = appendHeroVideoStartSec(WATTA_HERO_PRIMARY_MP4)

  return (
    <div className="watta-home-hero-entry-shell" aria-hidden suppressHydrationWarning>
      <div className="delivery-page-hero-standalone-web welcome-hero-section-web watta-home-hero-as-card-web menu-snap-section-welcome-web menu-welcome-hero-tight-web">
        <div className="welcome-hero-video-fill-web">
          <div
            className="welcome-hero-video-stack-web watta-home-hero-entry-stack-web watta-home-hero-client-stack-web"
            suppressHydrationWarning
          >
            <div className="welcome-hero-media-frame-web">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                id="watta-hero-preroll-video"
                className="welcome-video-native-web watta-home-hero-native-video"
                width={1920}
                height={1080}
                src={heroSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                aria-hidden
                suppressHydrationWarning
              />
            </div>
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: buildHomeHeroPrerollSrcSyncScript(HOME_HERO_URLS_CACHE_KEY),
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: buildHomeHeroPrerollBootScript(),
        }}
      />
    </div>
  )
}
