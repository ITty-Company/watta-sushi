/** Телефон і планшет: стабільна висота вікна — без білої смуги знизу при скролі / dvh. */
const VIEWPORT_LOCK_MAX_PX = 1366

export function lockMobileViewportHeight(): void {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const w = window.innerWidth
  if (w > VIEWPORT_LOCK_MAX_PX) {
    root.style.removeProperty('--watta-vh-locked')
    root.style.removeProperty('--watta-app-height')
    return
  }
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight)
  root.style.setProperty('--watta-vh-locked', `${h * 0.01}px`)
  root.style.setProperty('--watta-app-height', `${h}px`)
}

export function bindMobileViewportHeightLock(): () => void {
  if (typeof window === 'undefined') return () => {}
  const debouncedLock = () => {
    window.setTimeout(lockMobileViewportHeight, 80)
  }
  lockMobileViewportHeight()
  window.addEventListener('orientationchange', debouncedLock)
  window.addEventListener('resize', debouncedLock, { passive: true })
  const vv = window.visualViewport
  vv?.addEventListener('resize', debouncedLock)
  // Не слухати visualViewport.scroll — при звичайному скролі сторінки це перераховує
  // --watta-app-height і дає стрибок/«дёргание» вгору (особливо Safari на телефоні).
  return () => {
    window.removeEventListener('orientationchange', debouncedLock)
    window.removeEventListener('resize', debouncedLock)
    vv?.removeEventListener('resize', debouncedLock)
  }
}

/** Синхронно до React — стабільний viewport з першого кадру. */
export const WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT = `(function(){try{var M=${VIEWPORT_LOCK_MAX_PX};function lock(){var w=window.innerWidth||0,r=document.documentElement;if(w>M){r.style.removeProperty('--watta-vh-locked');r.style.removeProperty('--watta-app-height');return;}var vv=window.visualViewport;var ih=Math.round((vv&&vv.height)||window.innerHeight||0);r.style.setProperty('--watta-vh-locked',(ih*0.01)+'px');r.style.setProperty('--watta-app-height',ih+'px');}lock();window.addEventListener('orientationchange',function(){setTimeout(lock,120);});window.addEventListener('resize',function(){setTimeout(lock,80);});var vv=window.visualViewport;if(vv){vv.addEventListener('resize',function(){setTimeout(lock,80);});}}catch(e){}})();`
