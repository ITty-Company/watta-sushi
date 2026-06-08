import { scrollEntireAppToTopPersistent } from '@/lib/menuScroll'
import { MENU_BROWSE_RETURN_KEY } from '@/lib/menuBrowseRestore'
import { applyWattaHomeChromeGlass, syncWattaHtmlRouteClass } from '@/lib/wattaHtmlRouteClass'

/** Скидання головної до каталогу + hero (закрити embed delivery/promo, вкладки HomeClient). */
export const WATTA_CHROME_GO_HOME_EVENT = 'wattaChromeGoHome'

/** @deprecated — те саме, що go home */
export const WATTA_CHROME_CLOSE_HOME_OVERLAY_EVENT = 'wattaChromeCloseHomeOverlay'

/** Після виміру fixed chrome — перерахунок --watta-chrome-categories-band-h (hero під капсулою). */
export const WATTA_CHROME_LAYOUT_SYNC_EVENT = 'wattaChromeLayoutSync'

type HomeResetRouter = {
  refresh?: () => void
}

export type HomepageResetOptions = {
  /** F5 — без router.refresh(), щоб не миготіла «стара» RSC-версія. */
  skipRefresh?: boolean
}

/** Те саме, що клік по логотипу на головній: події + refresh + scroll + glass chrome. */
export function resetHomepageLikeLogoClick(
  router?: HomeResetRouter,
  options?: HomepageResetOptions,
): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(MENU_BROWSE_RETURN_KEY)
    sessionStorage.removeItem('switchToTab')
  } catch {
    /* ignore */
  }

  syncWattaHtmlRouteClass('/')
  document.body?.classList.add('watta-route-home')
  applyWattaHomeChromeGlass()

  window.dispatchEvent(new CustomEvent(WATTA_CHROME_GO_HOME_EVENT))
  window.dispatchEvent(new CustomEvent(WATTA_CHROME_LAYOUT_SYNC_EVENT))

  scrollEntireAppToTopPersistent({ force: true })

  if (!options?.skipRefresh) {
    try {
      router?.refresh?.()
    } catch {
      /* ignore */
    }
  }
}

export function dispatchWattaChromeGoHome(): void {
  resetHomepageLikeLogoClick()
}
