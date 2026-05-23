/** Телефон: фіксована висота вікна — не стискається від клавіатури / dvh. */
const MOBILE_MAX_PX = 767

export function lockMobileViewportHeight(): void {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const w = window.innerWidth
  if (w > MOBILE_MAX_PX) {
    root.style.removeProperty('--watta-vh-locked')
    root.style.removeProperty('--watta-app-height')
    return
  }
  const h = window.innerHeight
  root.style.setProperty('--watta-vh-locked', `${h * 0.01}px`)
  root.style.setProperty('--watta-app-height', `${h}px`)
}

export function bindMobileViewportHeightLock(): () => void {
  if (typeof window === 'undefined') return () => {}
  lockMobileViewportHeight()
  const onOrientation = () => {
    window.setTimeout(lockMobileViewportHeight, 120)
  }
  window.addEventListener('orientationchange', onOrientation)
  return () => window.removeEventListener('orientationchange', onOrientation)
}

/** Синхронно до React — стабільний viewport з першого кадру на телефоні. */
export const WATTA_MOBILE_VH_LOCK_BOOT_SCRIPT = `(function(){try{var M=767;function lock(){var w=window.innerWidth||0,r=document.documentElement;if(w>M){r.style.removeProperty('--watta-vh-locked');r.style.removeProperty('--watta-app-height');return;}var ih=window.innerHeight||0;r.style.setProperty('--watta-vh-locked',(ih*0.01)+'px');r.style.setProperty('--watta-app-height',ih+'px');}lock();window.addEventListener('orientationchange',function(){setTimeout(lock,120);});}catch(e){}})();`
