import {
  resetHomeHeroEntryShell,
  retireHomeHeroEntryShell,
  WATTA_HERO_PRIMARY_MP4,
} from '@/lib/wattaHeroVideo'
import { WATTA_HERO_ROLL_BOOT_PRELOAD_SNIPPET } from '@/lib/wattaHeroRollPreload'
import { usesHomeHeroSingleVideoLayer } from '@/lib/wattaTouchViewport'
import { syncWattaProductChromeForPathname } from '@/lib/wattaProductChrome'
import { WATTA_BOOT_SPLASH_BOOT_FLAG } from '@/lib/wattaBootSplashEnabled'

/** Класи на <html> для hero-CSS без :has(.menu-page-web) — працюють одразу після Reload. */
export const WATTA_HTML_ROUTE_CLASSES = {
  home: 'watta-html-home-hero',
  delivery: 'watta-html-delivery-hero',
  about: 'watta-html-about-hero',
  contacts: 'watta-html-contacts-hero',
} as const

const ALL_ROUTE_CLASSES = Object.values(WATTA_HTML_ROUTE_CLASSES)

const BASE_HTML_CLASS = 'watta-light-chrome'

function heroRouteClassForPathname(pathname: string): string | null {
  const p = pathname || '/'
  if (p === '/' || p === '' || p === '/menu' || p === '/delivery') {
    return WATTA_HTML_ROUTE_CLASSES.home
  }
  if (p === '/contacts') return WATTA_HTML_ROUTE_CLASSES.contacts
  return null
}

/** Hero-відео як на головній: `/`, `/menu`, `/delivery`, `/login`, `/register`. */
export function isWattaHomeHeroVideoPathname(pathname: string): boolean {
  const p = pathname || '/'
  return (
    p === '/' ||
    p === '' ||
    p === '/menu' ||
    p === '/delivery'
  )
}

/** SSR layout: класи на <html> з pathname (middleware → x-watta-pathname). */
export function wattaHtmlRouteClassNames(pathname: string): string {
  const hero = heroRouteClassForPathname(pathname)
  return hero ? `${BASE_HTML_CLASS} ${hero}` : BASE_HTML_CLASS
}

export function isWattaHomeHeroPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/' || p === ''
}

/** Головна та повне меню — при вході завжди повна шапка + категорії. */
export function isWattaHomeOrMenuPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/' || p === '' || p === '/menu'
}

export function isWattaAuthPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/login' || p === '/register'
}

/** Сторінка оформлення замовлення `/cart`. */
export function isWattaCartCheckoutPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/cart'
}

/** Публічний профіль `/profile` та вкладені маршрути. */
export function isWattaProfilePathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/profile' || p.startsWith('/profile/')
}

/** Сторінка товару `/product/:id`. */
export function isWattaProductPathname(pathname: string): boolean {
  const p = pathname || '/'
  return /^\/product\/\d+$/.test(p)
}

/** Окрема сторінка сповіщень — без глобальної шапки й категорій. */
export const WATTA_ROUTE_NOTIFICATIONS_CLASS = 'watta-route-notifications'

export function isWattaNotificationsPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/notifications'
}

export function isWattaAdminPathname(pathname: string): boolean {
  const p = pathname || '/'
  return p === '/admin' || p.startsWith('/admin/')
}

/** Критичні стилі головної в <head> — як /delivery (прозорий chrome, відео під капсулою). */
export const WATTA_HOME_HERO_CRITICAL_CSS = `
.delivery-page-hero-stack .welcome-hero-video-stack-web,
.menu-page-web.watta-site-hero-page-web .welcome-hero-video-stack-web{
  position:relative;width:100%;aspect-ratio:16/9;min-height:min(240px,52vw,48vh);overflow:hidden;
}
html.watta-html-home-hero{
  --watta-chrome-header-measured-h:76px;
  --watta-chrome-categories-band-h:86px;
  --watta-sticky-chrome-measured-h:162px;
  --delivery-hero-video-offset:clamp(24px,2.8vh,40px);
  --watta-home-hero-media-scale-x:1;
  --watta-home-hero-media-scale-y:1;
  --watta-home-hero-media-pos-y:50%;
  --watta-hero-ocean-bg:transparent;
}
html.watta-html-home-hero:not([data-watta-hero-content-ready='1']) #watta-hero-preroll-video,
html.watta-html-home-hero:not([data-watta-hero-content-ready='1']) .watta-home-hero-video-slot-web .watta-home-hero-native-video{
  opacity:0!important;visibility:hidden!important;
}
html.watta-html-home-hero:not([data-watta-preroll-retired='1']) .watta-home-hero-video-slot-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web) .welcome-hero-media-frame-web>.watta-home-hero-native-video{
  opacity:0!important;visibility:hidden!important;pointer-events:none!important;
}
html.watta-html-home-hero body,
html.watta-html-home-hero .delivery-page-home-flow,
html.watta-html-home-hero .delivery-page-intro-web--video,
html.watta-html-home-hero .delivery-page-hero-stack,
html.watta-html-home-hero .welcome-hero-section-web.watta-home-hero-as-card-web{
  background:transparent!important;background-color:transparent!important;
}
html.watta-html-home-hero .watta-sticky-chrome-portal,
html.watta-html-home-hero .watta-sticky-chrome-portal.watta-full-menu-sticky-chrome,
html.watta-html-home-hero .watta-sticky-chrome-portal .watta-chrome-categories-row-web,
html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-wrapper-web{
  background:transparent!important;background-color:transparent!important;box-shadow:none!important;
}
html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-web{
  display:flex!important;width:fit-content!important;max-width:min(calc(100vw - 36px),36rem)!important;
  margin-left:auto!important;margin-right:auto!important;border-radius:9999px!important;
  background:#fff!important;
  background-color:#fff!important;
  border:.5px solid rgba(20,81,66,.07)!important;box-shadow:0 6px 22px rgba(20,81,66,.09),inset 0 1px 0 rgba(255,255,255,.88)!important;
  backdrop-filter:none;-webkit-backdrop-filter:none;
}
html.watta-html-home-hero .delivery-page-intro-web--video{
  margin-top:0!important;
  position:relative;z-index:2;
}
html.watta-html-home-hero .welcome-hero-media-frame-web{
  transform:none!important;
  transform-origin:center center;
  background-size:cover!important;
  background-position:center var(--watta-home-hero-media-pos-y)!important;
}
html.watta-html-home-hero .welcome-hero-media-frame-web>.watta-home-hero-native-video,
html.watta-html-home-hero #watta-hero-preroll-video{
  transform:scale(var(--watta-home-hero-media-scale-x,1.17),var(--watta-home-hero-media-scale-y,1.05))!important;
  transform-origin:center center;
  object-position:center var(--watta-home-hero-media-pos-y,59%)!important;
}
html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
  position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;
  border-radius:clamp(14px,2.4vw,26px);
  background-color:transparent;
  background-image:none;
}
html.watta-html-home-hero .watta-home-hero-video-slot-web,
html.watta-html-home-hero .delivery-page-hero-stack--video-first{
  min-height:min(240px,52vw,48vh);
  background-color:transparent;
}
html.watta-html-home-hero .watta-home-hero-entry-shell{
  margin-top:0;
  padding:var(--watta-home-mobile-below-cats-gap,10px) clamp(18px,4.5vw,32px) clamp(10px,1.5vh,22px);
  box-sizing:border-box;
}
@media(max-width:767px){
  html.watta-html-home-hero{
    --watta-home-categories-phone-side-gap:clamp(14px,3.8vw,22px);
    --watta-home-mobile-below-cats-gap:clamp(24px,3.2vh,36px);
    --watta-home-hero-media-pos-y:66%;
    --watta-home-hero-phone-stack-h:min(72vh,max(240px,calc((100vw - 2 * var(--watta-home-categories-phone-side-gap,18px)) * 9 / 16)));
    --watta-home-hero-ssr-reserve-h:calc(var(--watta-home-mobile-below-cats-gap,18px) + clamp(10px,1.5vh,22px) + var(--watta-home-hero-phone-stack-h));
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell{display:none!important;}
  html.watta-html-home-hero #watta-hero-preroll-video{display:none!important;}
  html.watta-html-home-hero .watta-home-hero-video-slot-web{position:relative;min-height:var(--watta-home-hero-ssr-reserve-h);}
  html.watta-html-home-hero .menu-page-web.watta-site-hero-page-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web) .welcome-hero-video-stack-web.watta-home-hero-client-stack-web{
    background-color:#0a1210;background-image:url('/watta-home-hero-poster.webp');background-size:cover;background-position:center var(--watta-home-hero-media-pos-y,66%);
    aspect-ratio:16/9;width:100%;min-height:var(--watta-home-hero-phone-stack-h,min(240px,52vw));
  }
  html.watta-html-home-hero:not([data-watta-hero-content-ready='1']) .watta-home-hero-video-slot-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web) .welcome-hero-media-frame-web>.watta-home-hero-native-video,
  html.watta-html-home-hero .watta-home-hero-video-slot-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web) .welcome-hero-media-frame-web>.watta-home-hero-native-video{
    opacity:1!important;visibility:visible!important;transform:none!important;
  }
  html.watta-html-home-hero .welcome-hero-media-frame-web>.watta-home-hero-native-video,html.watta-html-home-hero #watta-hero-preroll-video{transform:none!important;}
  html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-web{
    width:calc(100vw - 2 * var(--watta-home-categories-phone-side-gap,clamp(26px,6.5vw,34px)))!important;
    max-width:min(calc(100vw - 2 * var(--watta-home-categories-phone-side-gap,clamp(26px,6.5vw,34px))),27.5rem)!important;
    margin-inline:auto!important;
  }
}
@media(min-width:768px){
  html.watta-html-home-hero{
    --watta-chrome-header-measured-h:86px;
    --watta-chrome-categories-band-h:48px;
    --watta-sticky-chrome-measured-h:134px;
    --watta-home-hero-side-gap:clamp(24px,4vw,48px);
    --watta-home-hero-tablet-side-gap:var(--watta-home-hero-side-gap);
    --watta-home-hero-video-max-w:min(calc(100vw - 2 * var(--watta-home-hero-side-gap)),1280px);
    --watta-home-hero-below-cats-gap:clamp(20px,2.5vh,36px);
    --watta-home-hero-video-grow-down:clamp(44px,5vh,72px);
    --watta-home-hero-media-pos-y:50%;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell{display:none!important;}
  html.watta-html-home-hero .watta-home-hero-entry-shell{
    margin-top:var(--watta-home-hero-below-cats-gap,clamp(20px,2.35vh,34px));
    padding:clamp(8px,1vh,14px) clamp(16px,3.5vw,32px) clamp(10px,1.15vh,16px);
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
    aspect-ratio:16/9;max-width:min(100%,calc((100svh - 180px) * 16 / 9));margin-left:auto;margin-right:auto;
  }
  html.watta-html-home-hero .delivery-page-intro-web--video{
    margin-top:0!important;
  }
  html.watta-html-home-hero .watta-home-hero-video-slot-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web) .welcome-hero-media-frame-web>.watta-home-hero-native-video{
    opacity:1!important;visibility:visible!important;pointer-events:none!important;
  }
  html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-web{
    width:100%!important;max-width:min(calc(100vw - 44px),46rem)!important;
  }
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web{
    margin-top:var(--watta-home-hero-below-cats-gap,clamp(20px,2.35vh,34px))!important;
    padding-top:clamp(20px,2.2vh,28px)!important;
  }
}
@media(min-width:768px) and (max-width:1024px){
  html.watta-html-home-hero{
    --watta-home-hero-below-cats-gap:clamp(22px,2.65vh,40px);
    --watta-home-hero-media-pos-y:50%;
    --watta-home-categories-tablet-side-gap:clamp(38px,7vw,58px);
  }
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web,
  html.watta-html-home-hero .menu-page-web.watta-site-hero-page-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web){
    width:calc(100% - 2 * var(--watta-home-hero-tablet-side-gap,clamp(28px,5vw,48px)))!important;
    max-width:calc(100vw - 2 * var(--watta-home-hero-tablet-side-gap,clamp(28px,5vw,48px)))!important;
    margin-inline:auto!important;padding-left:0!important;padding-right:0!important;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell{
    width:calc(100% - 2 * var(--watta-home-hero-tablet-side-gap,clamp(28px,5vw,48px)));max-width:calc(100vw - 2 * var(--watta-home-hero-tablet-side-gap,clamp(28px,5vw,48px)));
    margin-inline:auto;padding-left:0;padding-right:0;
  }
}
@media(min-width:768px) and (max-width:1279px){
  html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-web{
    width:calc(100vw - 2 * var(--watta-home-categories-tablet-side-gap,clamp(38px,7vw,58px)))!important;
    max-width:min(calc(100vw - 2 * var(--watta-home-categories-tablet-side-gap,clamp(38px,7vw,58px))),44rem)!important;
    margin-inline:auto!important;
  }
}
@media(min-width:1025px){
  html.watta-html-home-hero{
    --watta-chrome-header-measured-h:90px;
    --watta-chrome-categories-band-h:68px;
    --watta-sticky-chrome-measured-h:158px;
    --watta-home-hero-inline-pad:0px;
    --watta-home-hero-video-max-w:min(calc(100vw - 48px),1240px);
    --watta-home-hero-below-cats-gap:clamp(24px,2.75vh,44px);
    --watta-home-hero-card-pad-t:0px;
    --watta-home-hero-card-pad-b:clamp(12px,1.4vh,20px);
    --watta-home-hero-video-grow-down:clamp(44px,5vh,72px);
    --watta-home-hero-viewport-h:max(220px,calc(100svh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - var(--watta-sticky-chrome-measured-h,158px) - var(--watta-home-hero-below-cats-gap,24px) - var(--watta-home-hero-card-pad-t,0px) - var(--watta-home-hero-card-pad-b,20px) - 8px + var(--watta-home-hero-video-grow-down,0px)));
    --delivery-hero-video-offset:clamp(28px,3.2vh,48px);
    --watta-home-hero-media-pos-y:50%;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
    aspect-ratio:auto;height:var(--watta-home-hero-viewport-h);max-height:var(--watta-home-hero-viewport-h);max-width:100%;margin-left:auto;margin-right:auto;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell,
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web,
  html.watta-html-home-hero .menu-page-web.watta-site-hero-page-web .welcome-hero-section-web.watta-home-hero-as-card-web:not(.delivery-page-hero-embed-web){
    width:var(--watta-home-hero-video-max-w,min(calc(100vw - 2 * var(--watta-home-hero-side-gap,24px)),1280px))!important;max-width:var(--watta-home-hero-video-max-w,min(calc(100vw - 2 * var(--watta-home-hero-side-gap,24px)),1280px))!important;
    margin-inline:auto!important;padding-left:0!important;padding-right:0!important;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell{
    margin-top:var(--watta-home-hero-below-cats-gap,24px);padding-top:var(--watta-home-hero-card-pad-t,0px);padding-bottom:var(--watta-home-hero-card-pad-b,100px);
  }
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web{
    margin-top:var(--watta-home-hero-below-cats-gap,24px)!important;
    padding-top:var(--watta-home-hero-card-pad-t,0px)!important;
    padding-bottom:var(--watta-home-hero-card-pad-b,100px)!important;
    margin-bottom:0!important;
  }
}
@media(min-width:1025px) and (max-width:1279px){
  html.watta-html-home-hero{
    --watta-home-hero-inline-pad:0px;
    --watta-home-categories-tablet-side-gap:clamp(34px,5vw,52px);
  }
}
@media(min-width:1280px){
  html.watta-html-home-hero{
    --watta-home-hero-inline-pad:0px;
    --watta-home-hero-media-pos-y:50%;
  }
}
html[data-watta-skip-splash="1"] .watta-boot-splash-viewport{display:none!important;visibility:hidden!important;}
html[data-watta-skip-splash="1"] body{overflow:auto!important;}
html[data-watta-boot-splash-pending="1"] body{overflow:hidden!important;}
html[data-watta-boot-splash-pending="1"] .watta-boot-splash-viewport--static{display:grid!important;}
html:not([data-watta-boot-splash-pending="1"]) .watta-boot-splash-viewport--static{display:none!important;visibility:hidden!important;pointer-events:none!important;}
.watta-boot-splash-viewport{display:none;position:fixed;inset:0;z-index:10049;place-items:center;background:#fff;padding:calc(20px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px));--watta-boot-splash-fill-ms:0.85s;}
.watta-boot-splash-viewport .watta-load-screen-root--boot-splash{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;max-width:min(92vw,360px);min-height:0;padding:0;background:transparent;}
.watta-boot-splash-viewport .watta-load-screen-stack{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:min(92vw,360px);}
.watta-boot-splash-viewport .watta-load-screen-logo-wrap{width:min(64vw,240px);height:min(36vh,220px);min-height:0;display:flex;align-items:center;justify-content:center;}
.watta-boot-splash-viewport .watta-load-screen-logo{width:min(64vw,240px);max-height:min(36vh,220px);object-fit:contain;}
.watta-boot-splash-viewport .watta-loading-text{color:#004d2c;font-size:12pt;font-weight:600;min-height:1.35em;text-align:center;white-space:nowrap;}
.watta-boot-splash-viewport .watta-loading-bar-background{width:168px;max-width:100%;height:24px;padding:4px;box-sizing:border-box;background-color:#e4ebe7;border-radius:12px;display:flex;align-items:center;}
.watta-boot-splash-viewport .watta-loading-bar--boot-splash-css{width:100%!important;height:16px;transform:scaleX(0);transform-origin:left center;background:linear-gradient(0deg,#004d2c 0%,#1a7a5c 55%,#2d9d73 100%)!important;border-radius:8px;animation:wattaBootSplashBarFillCritical var(--watta-boot-splash-fill-ms,0.9s) linear forwards!important;}
@keyframes wattaBootSplashBarFillCritical{from{transform:scaleX(0)}to{transform:scaleX(1)}}
html.watta-html-home-hero .watta-sticky-chrome-flow-anchor--header-only{
  min-height:var(--watta-sticky-chrome-measured-h,168px);
}
@media(min-width:768px){
  html.watta-html-home-hero .watta-sticky-chrome-flow-anchor--header-only{
    min-height:calc(var(--watta-sticky-chrome-measured-h,134px) + env(safe-area-inset-top,0px))!important;
  }
}
/* F5: не миготіти вступом/хітами, поки скрол не на hero (boot script → data-watta-scroll-ready). */
html.watta-html-home-hero:not([data-watta-scroll-ready='1']) body.watta-route-home #home-after-hero-intro,
html.watta-html-home-hero:not([data-watta-scroll-ready='1']) body.watta-route-home #menu-cinematic-block,
html.watta-html-home-hero:not([data-watta-scroll-ready='1']) body.watta-route-home #home-menu-catalog{
  visibility:hidden!important;
  pointer-events:none!important;
}
`

/** Після Reload: лише перерахунок layout chrome (без inline style на DOM — інакше hydration mismatch). */
export function applyWattaHomeChromeGlass(): void {
  if (typeof document === 'undefined') return
  if (!isWattaHomeHeroVideoPathname(window.location.pathname || '/')) return
  try {
    window.dispatchEvent(new CustomEvent('wattaChromeLayoutSync'))
  } catch {
    /* ignore */
  }
}

/** Скинути handoff hero після SPA-навігації — інакше білий провал (preroll прихований, client hero теж). */
function resetHomeHeroHandoffDom(): void {
  resetHomeHeroEntryShell(
    document.querySelector('.watta-home-hero-entry-shell') as HTMLElement | null,
  )
}

export function syncWattaHtmlRouteClass(pathname: string): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body
  root.classList.remove(...ALL_ROUTE_CLASSES, WATTA_ROUTE_NOTIFICATIONS_CLASS)
  body?.classList.remove('watta-route-home', 'watta-auth-route')
  const hero = heroRouteClassForPathname(pathname)
  if (hero) root.classList.add(hero)
  /**
   * Hero-сторінки: in-flow hero з постером одразу (без білої смуги).
   * Головна `/` на телефоні: один клієнтський шар (без SSR preroll handoff).
   */
  if (isWattaHomeHeroVideoPathname(pathname)) {
    try {
      root.setAttribute('data-watta-client-hero', '1')
      if (isWattaHomeHeroPathname(pathname)) {
        if (usesHomeHeroSingleVideoLayer()) {
          root.setAttribute('data-watta-preroll-retired', '1')
          retireHomeHeroEntryShell(
            document.querySelector('.watta-home-hero-entry-shell') as HTMLElement | null,
          )
        } else {
          root.removeAttribute('data-watta-preroll-retired')
          root.removeAttribute('data-watta-hero-content-ready')
          resetHomeHeroHandoffDom()
        }
      } else {
        root.setAttribute('data-watta-preroll-retired', '1')
      }
    } catch {
      /* ignore */
    }
  } else {
    try {
      root.removeAttribute('data-watta-client-hero')
      root.removeAttribute('data-watta-preroll-retired')
    } catch {
      /* ignore */
    }
  }
  if (isWattaHomeHeroPathname(pathname)) {
    body?.classList.add('watta-route-home')
  }
  if (isWattaAuthPathname(pathname)) {
    body?.classList.add('watta-auth-route')
  }
  if (isWattaNotificationsPathname(pathname)) {
    root.classList.add(WATTA_ROUTE_NOTIFICATIONS_CLASS)
    try {
      root.dataset.wattaChromeCompact = 'true'
    } catch {
      /* ignore */
    }
  }
  syncWattaProductChromeForPathname(pathname)
  if (isWattaHomeHeroVideoPathname(pathname)) {
    const ww = window.innerWidth || 0
    const hh = ww >= 1025 ? '90px' : ww >= 768 ? '86px' : '76px'
    const cb = ww >= 1025 ? '46px' : ww >= 768 ? '48px' : '86px'
    const tot = ww >= 1025 ? '136px' : ww >= 768 ? '134px' : '162px'
    root.style.setProperty('--watta-chrome-header-measured-h', hh)
    root.style.setProperty('--watta-chrome-categories-band-h', cb)
    root.style.setProperty('--watta-sticky-chrome-measured-h', tot)
    queueMicrotask(() => applyWattaHomeChromeGlass())
  }
}

/** Синхронний скрипт у layout — до React, щоб Reload одразу мав правильний chrome/hero. */
export const WATTA_HTML_ROUTE_BOOT_SCRIPT = `(function(){try{var HOME='/';function isHome(p){return p===HOME||p===''}function isHomeHeroVideo(p){return p==='/'||p===''||p==='/menu'||p==='/delivery'}function isAuth(p){return p==='/login'||p==='/register'}function isAdmin(p){return p==='/admin'||p.indexOf('/admin/')===0}function isProduct(p){return /^\\/product\\/\\d+$/.test(p)}function setRouteClass(p){var h=document.documentElement,b=document.body,c=['watta-html-home-hero','watta-html-delivery-hero','watta-html-about-hero','watta-html-contacts-hero'];for(var i=0;i<c.length;i++)h.classList.remove(c[i]);h.classList.remove('watta-route-notifications');if(b){b.classList.remove('watta-route-home');b.classList.remove('watta-auth-route');if(isAuth(p))b.classList.add('watta-auth-route');}if(p==='/notifications'){h.classList.add('watta-route-notifications');try{h.dataset.wattaChromeCompact='true';}catch(e){}}if(isProduct(p)){h.classList.add('watta-route-product');try{delete h.dataset.wattaProductHeaderExpanded;h.dataset.wattaChromeCompact='true';}catch(e){}}else{h.classList.remove('watta-route-product');try{delete h.dataset.wattaProductHeaderExpanded;}catch(e){}}if(isHomeHeroVideo(p)){h.classList.add('watta-html-home-hero');if(isHome(p)){if(b)b.classList.add('watta-route-home');}var ww=window.innerWidth||0;var hh=ww>=1025?'90px':ww>=768?'86px':'76px';var cb=ww>=1025?'46px':ww>=768?'48px':'86px';var tot=ww>=1025?'136px':ww>=768?'134px':'162px';h.style.setProperty('--watta-chrome-header-measured-h',hh);h.style.setProperty('--watta-chrome-categories-band-h',cb);h.style.setProperty('--watta-sticky-chrome-measured-h',tot);}else if(p==='/contacts')h.classList.add('watta-html-contacts-hero');if(isHomeHeroVideo(p)){try{h.setAttribute('data-watta-client-hero','1');if(isHome(p)){h.setAttribute('data-watta-preroll-retired','1');h.setAttribute('data-watta-client-hero','1');}else h.setAttribute('data-watta-preroll-retired','1');}catch(e){}}else{try{h.removeAttribute('data-watta-client-hero');h.removeAttribute('data-watta-preroll-retired');}catch(e){}}}${WATTA_HERO_ROLL_BOOT_PRELOAD_SNIPPET}function applyHomeChrome(){var p=location.pathname||'/';if(!isHomeHeroVideo(p))return;try{window.dispatchEvent(new CustomEvent('wattaChromeLayoutSync'));}catch(e){}}function primeHomeHeroVideos(){var hp=location.pathname||'/';if(hp!=='/'&&hp!=='')return;var h=document.documentElement;var START=8.6;function primeOne(v){try{v.defaultMuted=true;v.muted=true;v.volume=0;v.autoplay=true;v.loop=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('autoplay','');v.setAttribute('loop','');var t=START;try{var d=v.duration;if(isFinite(d)&&d>0&&d<=START+0.25)t=0;}catch(e){}if(v.readyState>=1&&v.currentTime<t-0.05){try{v.currentTime=t;}catch(e2){}}if(v.currentTime>=t-0.08){try{h.setAttribute('data-watta-hero-content-ready','1');}catch(e4){}}var r=v.play();if(r&&r.then)r.then(function(){try{h.setAttribute('data-watta-hero-content-ready','1');}catch(e5){}}).catch(function(){});else if(r&&r.catch)r.catch(function(){});try{h.setAttribute('data-watta-preroll-retired','1');h.setAttribute('data-watta-client-hero','1');}catch(e6){}}catch(e7){}}var pr=document.getElementById('watta-hero-preroll-video');if(pr)primeOne(pr);var list=document.querySelectorAll('.watta-home-hero-video-slot-web .watta-home-hero-native-video');for(var i=0;i<list.length;i++)primeOne(list[i]);}function markScrollReady(){try{document.documentElement.setAttribute('data-watta-scroll-ready','1');}catch(e){}}function clearScrollReady(){try{document.documentElement.removeAttribute('data-watta-scroll-ready');}catch(e){}}function readMaxScrollY(){var y=window.scrollY||0;var dy=document.documentElement.scrollTop||0;var by=document.body.scrollTop||0;return Math.max(y,dy,by);}var userScrolledHome=false;function markUserScrolledHome(){if(userScrolledHome)return;userScrolledHome=true;markScrollReady();}function bindUserScrollGuard(){window.addEventListener('wheel',markUserScrolledHome,{passive:true});window.addEventListener('touchmove',markUserScrolledHome,{passive:true});window.addEventListener('keydown',function(e){var k=e&&e.key;if(k==='ArrowDown'||k==='ArrowUp'||k==='PageDown'||k==='PageUp'||k==='Home'||k==='End'||k===' '||k==='Spacebar')markUserScrolledHome();},{passive:true});}function scrollHomeTop(){if(userScrolledHome){markScrollReady();return;}try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(e){}try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;var cs=document.querySelectorAll('.content-web');for(var i=0;i<cs.length;i++)cs[i].scrollTop=0;if(readMaxScrollY()<=2)markScrollReady();}catch(e2){}}function scheduleScrollHomeTop(){if(userScrolledHome){markScrollReady();return;}clearScrollReady();scrollHomeTop();requestAnimationFrame(scrollHomeTop);var sd=[0,48,160,400,720,1200,2000];for(var si=0;si<sd.length;si++){(function(ms){setTimeout(scrollHomeTop,ms);})(sd[si]);}setTimeout(markScrollReady,2400);}var homeScrollLoadBound=false;function bindScrollHomeTop(){bindUserScrollGuard();scheduleScrollHomeTop();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleScrollHomeTop);if(!homeScrollLoadBound){homeScrollLoadBound=true;window.addEventListener('load',scheduleScrollHomeTop);}}var n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];var rel=n&&n.type==='reload'||(performance.navigation&&performance.navigation.type===1);var p=location.pathname||'/';var boot='${WATTA_BOOT_SPLASH_BOOT_FLAG}';if(rel){try{sessionStorage.removeItem('watta_menu_browse_return_v1');}catch(e){}if(!isAuth(p)&&!isAdmin(p)&&!isHome(p)){try{sessionStorage.setItem('watta_boot_splash_reload','1');}catch(e){}location.replace(HOME);return;}}var splashRel=false;try{splashRel=sessionStorage.getItem('watta_boot_splash_reload')==='1';}catch(e){}if(boot==='1'&&isHome(p)&&(rel||splashRel)){if(splashRel){try{sessionStorage.removeItem('watta_boot_splash_reload');}catch(e){}}try{sessionStorage.removeItem('watta_boot_splash_done');document.documentElement.removeAttribute('data-watta-skip-splash');document.documentElement.setAttribute('data-watta-boot-splash-pending','1');document.documentElement.style.setProperty('--watta-boot-splash-fill-ms','0.85s');setTimeout(function(){try{document.documentElement.removeAttribute('data-watta-boot-splash-pending');document.documentElement.removeAttribute('data-watta-boot-splash');if(document.body)document.body.style.overflow='';window.dispatchEvent(new CustomEvent('watta:boot-splash-ended'));}catch(e2){}},3200);}catch(e){}}else{try{if(splashRel){try{sessionStorage.removeItem('watta_boot_splash_reload');}catch(e4){}}document.documentElement.setAttribute('data-watta-skip-splash','1');document.documentElement.removeAttribute('data-watta-boot-splash-pending');document.documentElement.removeAttribute('data-watta-boot-splash');if(document.body)document.body.style.overflow='';}catch(e){}}setRouteClass(p);if(isHome(p)){primeHomeRollImages();bindScrollHomeTop();setTimeout(primeHomeRollImages,0);setTimeout(primeHomeRollImages,80);setTimeout(primeHomeRollImages,240);}if(isHomeHeroVideo(p)&&!isHome(p)){try{fetch('${WATTA_HERO_PRIMARY_MP4}',{method:'GET',headers:{'Range':'bytes=0-524287'},credentials:'same-origin'}).catch(function(){});try{var hr=sessionStorage.getItem('watta_home_hero_urls_v2');if(hr){var ha=JSON.parse(hr);if(ha&&ha[0])fetch(ha[0],{method:'GET',headers:{'Range':'bytes=0-524287'},credentials:'same-origin'}).catch(function(){});}}catch(eh){}}catch(e){}applyHomeChrome();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',primeHomeHeroVideos);else primeHomeHeroVideos();requestAnimationFrame(primeHomeHeroVideos);setTimeout(primeHomeHeroVideos,0);setTimeout(primeHomeHeroVideos,40);setTimeout(primeHomeHeroVideos,120);setTimeout(primeHomeHeroVideos,400);setTimeout(primeHomeHeroVideos,1000);window.addEventListener('pageshow',function(){var pp=location.pathname||'/';setRouteClass(pp);if(isHomeHeroVideo(pp)){applyHomeChrome();primeHomeHeroVideos();}if(isHome(pp)){primeHomeRollImages();bindScrollHomeTop();}});requestAnimationFrame(function(){if(isHomeHeroVideo(location.pathname||'/'))applyHomeChrome();});}catch(e){}})();`
