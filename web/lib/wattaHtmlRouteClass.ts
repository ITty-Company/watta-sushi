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
  if (p === '/' || p === '') return WATTA_HTML_ROUTE_CLASSES.home
  if (p === '/delivery') return WATTA_HTML_ROUTE_CLASSES.delivery
  if (p === '/about' || p.startsWith('/about/')) return WATTA_HTML_ROUTE_CLASSES.about
  if (p === '/contacts') return WATTA_HTML_ROUTE_CLASSES.contacts
  return null
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

/** Критичні стилі головної в <head> — як /delivery (прозорий chrome, відео під капсулою). */
export const WATTA_HOME_HERO_CRITICAL_CSS = `
html.watta-html-home-hero{
  --watta-chrome-header-measured-h:76px;
  --watta-chrome-categories-band-h:92px;
  --watta-sticky-chrome-measured-h:168px;
  --delivery-hero-video-offset:clamp(24px,2.8vh,40px);
  --watta-home-hero-media-scale-x:1.08;
  --watta-home-hero-media-scale-y:1.05;
  --watta-home-hero-media-pos-y:46%;
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
  display:flex!important;width:fit-content!important;max-width:min(calc(100vw - 28px),40rem)!important;
  margin-left:auto!important;margin-right:auto!important;border-radius:9999px!important;
  background:linear-gradient(165deg,rgba(255,255,255,.82) 0%,rgba(255,255,255,.68) 48%,rgba(255,255,255,.74) 100%)!important;
  border:none!important;box-shadow:0 6px 22px rgba(20,81,66,.09),inset 0 1px 0 rgba(255,255,255,.88)!important;
  backdrop-filter:blur(18px) saturate(1.14);-webkit-backdrop-filter:blur(18px) saturate(1.14);
}
html.watta-html-home-hero .delivery-page-intro-web--video{
  margin-top:0!important;
  position:relative;z-index:2;
}
html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-media-frame-web,
html.watta-html-home-hero .welcome-hero-media-frame-web{
  transform:scale(var(--watta-home-hero-media-scale-x),var(--watta-home-hero-media-scale-y));
  transform-origin:center center;
  background-size:cover!important;
  background-position:center var(--watta-home-hero-media-pos-y)!important;
}
html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
  position:relative;width:100%;aspect-ratio:16/8.35;overflow:hidden;
  border-radius:clamp(14px,2.4vw,26px);
}
html.watta-html-home-hero .watta-home-hero-entry-shell{
  margin-top:0;
  padding:var(--watta-home-mobile-below-cats-gap,10px) clamp(18px,4.5vw,32px) clamp(10px,1.5vh,22px);
  box-sizing:border-box;
}
@media(min-width:768px){
  html.watta-html-home-hero{
    --watta-chrome-header-measured-h:86px;
    --watta-chrome-categories-band-h:48px;
    --watta-sticky-chrome-measured-h:134px;
    --watta-home-hero-below-cats-gap:clamp(20px,2.35vh,34px);
    --watta-home-hero-media-scale-x:1.1;
    --watta-home-hero-media-scale-y:1.07;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell{
    margin-top:var(--watta-home-hero-below-cats-gap,clamp(20px,2.35vh,34px));
    padding:clamp(8px,1vh,14px) clamp(6px,1.2vw,14px) clamp(10px,1.15vh,16px);
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
    aspect-ratio:16/7.75;
  }
  html.watta-html-home-hero .delivery-page-intro-web--video{
    margin-top:0!important;
  }
  html.watta-html-home-hero .watta-sticky-chrome-portal .categories-panel-web{
    width:100%!important;max-width:min(calc(100vw - 44px),46rem)!important;
  }
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web{
    margin-top:var(--watta-home-hero-below-cats-gap,clamp(20px,2.35vh,34px))!important;
    padding-top:clamp(8px,1vh,14px)!important;
  }
}
@media(min-width:1025px){
  html.watta-html-home-hero{
    --watta-chrome-header-measured-h:90px;
    --watta-chrome-categories-band-h:46px;
    --watta-sticky-chrome-measured-h:136px;
    --watta-home-hero-below-cats-gap:clamp(26px,2.85vh,44px);
    --delivery-hero-video-offset:clamp(28px,3.2vh,48px);
    --watta-home-hero-media-scale-x:1.12;
    --watta-home-hero-media-scale-y:1.09;
  }
  html.watta-html-home-hero .watta-home-hero-entry-shell .welcome-hero-video-stack-web{
    aspect-ratio:16/7.55;
  }
  html.watta-html-home-hero .delivery-page-hero-stack--video-first>.delivery-page-hero-standalone-web.watta-home-hero-as-card-web{
    margin-top:var(--watta-home-hero-below-cats-gap,clamp(26px,2.85vh,44px))!important;
    padding-top:clamp(10px,1.15vh,16px)!important;
  }
}
html[data-watta-skip-splash="1"] .watta-boot-splash-overlay{display:none!important;visibility:hidden!important;}
html[data-watta-skip-splash="1"] body{overflow:auto!important;}
html.watta-html-home-hero .watta-sticky-chrome-flow-anchor--header-only{
  min-height:var(--watta-sticky-chrome-measured-h,168px);
}
@media(min-width:768px){
  html.watta-html-home-hero .watta-sticky-chrome-flow-anchor--header-only{
    min-height:var(--watta-chrome-header-measured-h,86px);
  }
}
`

/** Клієнт: примусово скляна капсула + нахльост hero (страховка після Reload). */
export function applyWattaHomeChromeGlass(): void {
  if (typeof document === 'undefined') return
  if (!isWattaHomeHeroPathname(window.location.pathname || '/')) return

  const root = document.documentElement
  const glass =
    'linear-gradient(165deg,rgba(255,255,255,.52) 0%,rgba(255,255,255,.42) 50%,rgba(255,255,255,.48) 100%)'

  const portal = document.querySelector('body .watta-sticky-chrome-portal')
  portal?.style.setProperty('background', 'transparent', 'important')

  const row = document.querySelector(
    'body .watta-sticky-chrome-portal .watta-chrome-categories-row-web',
  )
  row?.style.setProperty('background', 'transparent', 'important')

  const wrap = document.querySelector(
    'body .watta-sticky-chrome-portal .categories-panel-wrapper-web',
  )
  wrap?.style.setProperty('background', 'transparent', 'important')

  const panel = document.querySelector('body .watta-sticky-chrome-portal .categories-panel-web')
  if (panel instanceof HTMLElement) {
    panel.style.setProperty('background', glass, 'important')
    panel.style.setProperty('backdrop-filter', 'blur(18px) saturate(1.14)', 'important')
    panel.style.setProperty('-webkit-backdrop-filter', 'blur(18px) saturate(1.14)', 'important')
    panel.style.setProperty('border-radius', '9999px', 'important')
    panel.style.setProperty(
      'box-shadow',
      '0 6px 22px rgba(20,81,66,.09), inset 0 1px 0 rgba(255,255,255,.88)',
      'important',
    )
  }

  const intro = document.querySelector('.delivery-page-intro-web--video')
  if (intro instanceof HTMLElement) {
    intro.style.setProperty('margin-top', '0', 'important')
    intro.style.setProperty('background', 'transparent', 'important')
  }
}

export function syncWattaHtmlRouteClass(pathname: string): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body
  root.classList.remove(...ALL_ROUTE_CLASSES)
  body?.classList.remove('watta-route-home')
  const hero = heroRouteClassForPathname(pathname)
  if (hero) root.classList.add(hero)
  if (isWattaHomeHeroPathname(pathname)) {
    body?.classList.add('watta-route-home')
  }
}

/** Синхронний скрипт у layout — до React, щоб Reload одразу мав правильний chrome/hero. */
export const WATTA_HTML_ROUTE_BOOT_SCRIPT = `(function(){try{var HOME='/';function isHome(p){return p===HOME||p===''}function setRouteClass(p){var h=document.documentElement,b=document.body,c=['watta-html-home-hero','watta-html-delivery-hero','watta-html-about-hero','watta-html-contacts-hero'];for(var i=0;i<c.length;i++)h.classList.remove(c[i]);if(b)b.classList.remove('watta-route-home');if(isHome(p)){h.classList.add('watta-html-home-hero');if(b)b.classList.add('watta-route-home');var ww=window.innerWidth||0;var hh=ww>=1025?'90px':ww>=768?'86px':'76px';var cb=ww>=1025?'46px':ww>=768?'48px':'92px';var tot=ww>=1025?'136px':ww>=768?'134px':'168px';h.style.setProperty('--watta-chrome-header-measured-h',hh);h.style.setProperty('--watta-chrome-categories-band-h',cb);h.style.setProperty('--watta-sticky-chrome-measured-h',tot);}else if(p==='/delivery')h.classList.add('watta-html-delivery-hero');else if(p==='/about'||p.indexOf('/about/')===0)h.classList.add('watta-html-about-hero');else if(p==='/contacts')h.classList.add('watta-html-contacts-hero');}function applyHomeChrome(){var p=location.pathname||'/';if(!isHome(p))return;var h=document.documentElement,cs=getComputedStyle(h);var mh=(cs.getPropertyValue('--watta-sticky-chrome-measured-h')||'168px').trim();var hh=(cs.getPropertyValue('--watta-chrome-header-measured-h')||'76px').trim();var glass='linear-gradient(165deg,rgba(255,255,255,.52) 0%,rgba(255,255,255,.42) 50%,rgba(255,255,255,.48) 100%)';var portal=document.querySelector('.watta-sticky-chrome-portal');if(portal){portal.style.setProperty('background','transparent','important');portal.style.setProperty('background-color','transparent','important');}var row=document.querySelector('.watta-sticky-chrome-portal .watta-chrome-categories-row-web');if(row){row.style.setProperty('background','transparent','important');}var wrap=document.querySelector('.watta-sticky-chrome-portal .categories-panel-wrapper-web');if(wrap){wrap.style.setProperty('background','transparent','important');}var panel=document.querySelector('.watta-sticky-chrome-portal .categories-panel-web');if(panel){panel.style.setProperty('background',glass,'important');panel.style.setProperty('backdrop-filter','blur(18px) saturate(1.14)','important');panel.style.setProperty('-webkit-backdrop-filter','blur(18px) saturate(1.14)','important');panel.style.setProperty('border-radius','9999px','important');panel.style.setProperty('box-shadow','0 6px 22px rgba(20,81,66,.09), inset 0 1px 0 rgba(255,255,255,.88)','important');}var intro=document.querySelector('.delivery-page-intro-web--video');if(intro){intro.style.setProperty('margin-top','0','important');intro.style.setProperty('background','transparent','important');}try{window.dispatchEvent(new CustomEvent('wattaChromeLayoutSync'));}catch(e){}}var n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];var rel=n&&n.type==='reload'||(performance.navigation&&performance.navigation.type===1);if(rel){try{sessionStorage.removeItem('watta_menu_browse_return_v1')}catch(e){}}var p=location.pathname||'/';try{if(sessionStorage.getItem('watta_boot_splash_done')==='1')document.documentElement.setAttribute('data-watta-skip-splash','1');}catch(e){}if(rel&&isHome(p)){document.documentElement.setAttribute('data-watta-skip-splash','1');}setRouteClass(p);if(isHome(p))applyHomeChrome();window.addEventListener('pageshow',function(){var pp=location.pathname||'/';setRouteClass(pp);if(isHome(pp))applyHomeChrome();});requestAnimationFrame(function(){if(isHome(location.pathname||'/'))applyHomeChrome();});}}catch(e){}})();`
