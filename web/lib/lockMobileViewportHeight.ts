/** Телефон і планшет: стабільна висота вікна — без білої смуги знизу при скролі / dvh. */
const VIEWPORT_LOCK_MAX_PX = 1366
/** Перезамок лише при зміні ширини (поворот) — не при хованні адресного рядка Safari. */
const VIEWPORT_LOCK_WIDTH_DELTA_PX = 40

let lockedViewportWidth = 0

function applyViewportHeightLock(h: number): void {
  const root = document.documentElement
  root.style.setProperty('--watta-vh-locked', `${h * 0.01}px`)
  root.style.setProperty('--watta-app-height', `${h}px`)
}

function clearViewportHeightLock(): void {
  lockedViewportWidth = 0
  const root = document.documentElement
  root.style.removeProperty('--watta-vh-locked')
  root.style.removeProperty('--watta-app-height')
}

export function lockMobileViewportHeight(force = false): void {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  if (w > VIEWPORT_LOCK_MAX_PX) {
    clearViewportHeightLock()
    return
  }
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight)
  const widthChanged =
    lockedViewportWidth === 0 || Math.abs(w - lockedViewportWidth) >= VIEWPORT_LOCK_WIDTH_DELTA_PX
  if (!force && lockedViewportWidth > 0 && !widthChanged) return
  lockedViewportWidth = w
  applyViewportHeightLock(h)
}

export function bindMobileViewportHeightLock(): () => void {
  if (typeof window === 'undefined') return () => {}
  const debouncedLock = (force = false) => {
    window.setTimeout(() => lockMobileViewportHeight(force), 80)
  }
  lockMobileViewportHeight(true)
  const onOrientation = () => debouncedLock(true)
  const onResize = () => debouncedLock(false)
  window.addEventListener('orientationchange', onOrientation)
  window.addEventListener('resize', onResize, { passive: true })
  // Не слухати visualViewport.resize/scroll — при скролі Safari ховає адресний рядок,
  // перерахунок --watta-app-height дає стрибок/«тряску» всього layout.
  return () => {
    window.removeEventListener('orientationchange', onOrientation)
    window.removeEventListener('resize', onResize)
  }
}

/** Синхронно до React — стабільний viewport з першого кадру. */
export const WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT = `(function(){try{var M=${VIEWPORT_LOCK_MAX_PX},W=${VIEWPORT_LOCK_WIDTH_DELTA_PX},lw=0;function lock(f){var w=window.innerWidth||0,r=document.documentElement;if(w>M){lw=0;r.style.removeProperty('--watta-vh-locked');r.style.removeProperty('--watta-app-height');return;}var vv=window.visualViewport;var ih=Math.round((vv&&vv.height)||window.innerHeight||0);var wc=lw===0||Math.abs(w-lw)>=W;if(!f&&lw>0&&!wc)return;lw=w;r.style.setProperty('--watta-vh-locked',(ih*0.01)+'px');r.style.setProperty('--watta-app-height',ih+'px');}lock(1);window.addEventListener('orientationchange',function(){setTimeout(function(){lock(1);},120);});window.addEventListener('resize',function(){setTimeout(function(){lock(0);},80);});}catch(e){}})();`
