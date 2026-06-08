import {
  getCachedHeroVideoReachability,
  setCachedHeroVideoReachability,
} from '@/lib/heroVideoReachabilityCache'
import { resolveUploadMediaUrl } from '@/lib/resolveUploadMediaUrl'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

/** Після заміни mp4 у `public/` — змініть, щоб браузер не тримав старий ролик у кеші. */
export const WATTA_HOME_HERO_FALLBACK_CACHE_BUST = 'web-1080p30-crf27-cap1800k-noaudio-faststart-20260603a'

const withHeroFallbackCacheBust = (path: string) =>
  `${path}?${WATTA_HOME_HERO_FALLBACK_CACHE_BUST}`

/** Єдиний запасний ролик — 1920×1080, 30fps H.264 у `public/watta-sushi-2-hero.mp4`. */
export const WATTA_HOME_HERO_VIDEO_PATH = '/watta-sushi-2-hero.mp4' as const

/** Публічний hero mp4 — з cache-bust, як у fallbacks. */
export function normalizePublicHeroMp4Url(url: string): string {
  const trimmed = url.trim()
  const base = trimmed.split('?')[0]
  if (base === WATTA_HOME_HERO_VIDEO_PATH) {
    return withHeroFallbackCacheBust(WATTA_HOME_HERO_VIDEO_PATH)
  }
  return trimmed
}

/** Ролики з вступом «WATTA SUSHI» (~0–8 с) — публічні fallbacks і hero з адмінки. */
export function usesHomeHeroContentStart(url: string): boolean {
  const base = (url.split('#')[0]?.split('?')[0] ?? '').toLowerCase()
  if (!base.endsWith('.mp4')) return false
  return (
    base.includes('watta-sushi-2-hero') ||
    base.includes('watta-home-hero') ||
    /\/uploads\/hero-[^/]+\.mp4$/.test(base)
  )
}

/** URL для `<video src>`: cache-bust + `#t=` на контентний кадр для головного ролика. */
export function resolveHeroVideoPlaybackUrl(url: string): string {
  const normalized = normalizePublicHeroMp4Url(url.trim())
  if (!normalized) return appendHeroVideoStartSec(WATTA_HOME_HERO_VIDEO_FALLBACKS[0])
  const resolved = resolveUploadMediaUrl(normalized) ?? normalized
  if (!usesHomeHeroContentStart(resolved)) return resolved
  return appendHeroVideoStartSec(resolved)
}

/**
 * Головна сторінка (`MenuView`): ocean hero + один HD-запасний mp4.
 */
export const WATTA_HOME_HERO_VIDEO_FALLBACKS = [
  withHeroFallbackCacheBust(WATTA_HOME_HERO_VIDEO_PATH),
] as const

/** @deprecated use buildHomeHeroVideoSources */
export const WATTA_HOME_HERO_VIDEO_SOURCES = WATTA_HOME_HERO_VIDEO_FALLBACKS

/**
 * Повний каталог `/menu` (`FullMenuPageClient`): окремий банерний ролик, далі той самий ланцюг запасних.
 */
export const WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES = WATTA_HOME_HERO_VIDEO_FALLBACKS

/** Preload на головній — перший кадр головного hero (не сторінка `/menu`). */
export const WATTA_HERO_PRIMARY_MP4 = WATTA_HOME_HERO_VIDEO_FALLBACKS[0]

/** Постер hero 1920×1080 (кадр з ролика) — не розтягувати маленький sushi.webp на весь hero. */
export const WATTA_HOME_HERO_POSTER = '/watta-home-hero-poster.webp' as const

/** Телефон: прибираємо SSR shell без display:none — інакше grid hero стрибає по висоті. */
export function retireHomeHeroEntryShell(shell: HTMLElement | null | undefined): void {
  if (!shell) return
  if (isWattaPhoneViewport()) {
    shell.classList.add('watta-home-hero-entry-shell--retired')
    shell.removeAttribute('hidden')
    shell.style.removeProperty('display')
  } else {
    shell.hidden = true
    shell.style.display = 'none'
  }
}

export function resetHomeHeroEntryShell(shell: HTMLElement | null | undefined): void {
  if (!shell) return
  shell.classList.remove('watta-home-hero-entry-shell--retired')
  shell.hidden = false
  shell.style.removeProperty('display')
  shell.style.removeProperty('visibility')
  shell.style.removeProperty('opacity')
}

/** Після збереження hero-відео в адмінці — оновити MenuView без reload */
export const WATTA_HOME_HERO_VIDEO_UPDATED_EVENT = 'watta:home-hero-video-updated' as const

function dedupeAdminUrls(adminUrls?: readonly string[] | null): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of adminUrls ?? []) {
    const u = normalizePublicHeroMp4Url(raw.trim())
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

/**
 * Плейлист головної:
 * 1) URL з адмінки (файл 1:1 через multipart, без перекодування)
 * 2) запасні mp4 з `public/` — лише якщо адмінського немає або onError
 */
/** Локальні /uploads з адмінки — на проді без диска часто 404; клієнт може відфільтрувати після probe. */
export function isAdminUploadHeroPath(url: string): boolean {
  return url.trim().startsWith('/uploads/')
}

export function buildHomeHeroPlaylist(adminUrls?: readonly string[] | null): readonly string[] {
  const admin = dedupeAdminUrls(adminUrls)
  const seen = new Set<string>()
  const out: string[] = []

  /** Спочатку ролики з адмінки (1 → 2 → …), потім запасний mp4 з public/. */
  for (const u of admin) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }

  for (const fb of WATTA_HOME_HERO_VIDEO_FALLBACKS) {
    if (seen.has(fb)) continue
    seen.add(fb)
    out.push(fb)
  }

  return out.length > 0 ? out : WATTA_HOME_HERO_VIDEO_FALLBACKS
}

/** Завжди з першого ролика плейлиста (адмінка → fallback). */
export function findHomeHeroFastStartIndex(_playlist: readonly string[]): number {
  return 0
}

/** HEAD/GET — чи відповідає mp4 (не HTML 404 від проксі). */
export async function probeHeroVideoUrl(url: string, signal?: AbortSignal): Promise<boolean> {
  const cached = getCachedHeroVideoReachability(url)
  if (cached !== undefined) return cached

  const src = resolveUploadMediaUrl(url.trim()) ?? url.trim()
  if (!src || src.startsWith('blob:')) return true
  try {
    const res = await fetch(src, {
      method: 'GET',
      headers: { Range: 'bytes=0-1' },
      cache: 'default',
      signal,
    })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('text/html')) return false
    const ok = ct.startsWith('video/') || ct.includes('octet-stream') || res.status === 206
    setCachedHeroVideoReachability(url, ok)
    return ok
  } catch {
    setCachedHeroVideoReachability(url, false)
    return false
  }
}

/** Залишає лише URL, з яких реально можна зчитати відео; якщо всі мертві — лише fallbacks. */
export async function filterReachableHeroUrls(
  urls: readonly string[],
  signal?: AbortSignal,
): Promise<string[]> {
  const admin = dedupeAdminUrls(urls)
  const reachable: string[] = []
  for (const u of admin) {
    if (!isAdminUploadHeroPath(u)) {
      reachable.push(u)
      continue
    }
    if (await probeHeroVideoUrl(u, signal)) reachable.push(u)
  }
  if (reachable.length > 0) return reachable
  return []
}

/** Перший src для <video> / preload — завжди оригінал з адмінки, якщо є. */
export function getPrimaryHomeHeroVideoSrc(adminUrls?: readonly string[] | null): string {
  return buildHomeHeroPlaylist(adminUrls)[0] ?? WATTA_HERO_PRIMARY_MP4
}

/** Той самий ланцюг, що й плейлист (запасні вже на початку). */
export function buildHomeHeroVideoSources(adminUrls?: readonly string[] | null): readonly string[] {
  return buildHomeHeroPlaylist(adminUrls)
}

/** @deprecated — один URL; використовуйте buildHomeHeroVideoSources */
export function buildHomeHeroVideoSourcesFromSingle(adminUrl?: string | null): readonly string[] {
  const one = (adminUrl || '').trim()
  return buildHomeHeroVideoSources(one ? [one] : null)
}

/** Подія після зняття сплешу: MenuView / hero resume play одразу */
export const WATTA_BOOT_SPLASH_ENDED_EVENT = 'watta:boot-splash-ended' as const

/**
 * Старт loop головного hero (с): пропускаємо вступ з «WATTA SUSHI» на воді (~0–8 с),
 * одразу показуємо основну 3D-сцену (кіоск-ролл).
 */
export const WATTA_HERO_VIDEO_START_SEC = 8.6

/** Старт seek з урахуванням тривалості (короткі ролики — з 0). */
export function resolveHeroVideoStartSec(
  video: HTMLVideoElement,
  fallback = WATTA_HERO_VIDEO_START_SEC,
): number {
  const dur = video.duration
  if (!Number.isFinite(dur) || dur <= 0) return fallback
  if (dur <= fallback + 0.25) return Math.max(0, Math.min(0.05, dur - 0.1))
  return fallback
}

/**
 * Media Fragment `#t=` для <video src>.
 * У Safari вкладка «Сеть → Предпросмотр» часто показує помилку при `#t=` — seek робимо в JS (`seekHeroVideoToStartSec`).
 */
export function appendHeroVideoStartSec(url: string, startSec = WATTA_HERO_VIDEO_START_SEC): string {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return trimmed
  if (!usesHomeHeroContentStart(trimmed)) return trimmed
  if (trimmed.includes('#t=')) return trimmed
  return `${trimmed}#t=${startSec}`
}

/** Чи вже на видимому стартовому кадрі (після metadata). */
export function isHeroVideoAtStartSec(
  video: HTMLVideoElement,
  startSec = WATTA_HERO_VIDEO_START_SEC,
): boolean {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) return false
  return video.currentTime >= startSec - 0.08
}

/** Перший кадр для показу hero — лише після seek на контентний таймкод (не вступ з логотипом). */
export function isHeroVideoFrameReady(
  video: HTMLVideoElement,
  startSec = WATTA_HERO_VIDEO_START_SEC,
): boolean {
  if (!isHeroVideoAtStartSec(video, startSec)) return false
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused
}

/** Перед preroll boot: той самий URL, що в session (адмінка), щоб не миготіли два ролики. */
export function buildHomeHeroPrerollSrcSyncScript(
  cacheKey = 'watta_home_hero_urls_v2',
  startSec = WATTA_HERO_VIDEO_START_SEC,
): string {
  const key = JSON.stringify(cacheKey)
  const s = String(startSec)
  return `(function(){try{var raw=sessionStorage.getItem(${key});if(!raw)return;var list=JSON.parse(raw);var u=list&&list[0];if(typeof u!=='string'||!u.trim())return;var base=u.split('#')[0].split('?')[0].toLowerCase();if(!/watta-sushi-2-hero|watta-home-hero|\\/uploads\\/hero-[^/]+\\.mp4$/.test(base))return;var v=document.getElementById('watta-hero-preroll-video');if(!v)return;var src=u.indexOf('#t=')>=0?u:u+'#t=${s}';var cur=v.getAttribute('src')||'';if(cur!==src)v.src=src;}catch(e){}})();`
}

/** Inline-скрипт SSR preroll: seek на контент до play, без спалаху вступу. */
export function buildHomeHeroPrerollBootScript(
  startSec = WATTA_HERO_VIDEO_START_SEC,
): string {
  const s = String(startSec)
  return `(function(){var START=${s};var v=document.getElementById('watta-hero-preroll-video');if(!v)return;var h=document.documentElement;var revealed=false;function effStart(){try{var d=v.duration;if(isFinite(d)&&d>0&&d<=START+0.25)return 0;}catch(e){}return START;}function atContent(){var t=effStart();return v.currentTime>=t-0.08;}function reveal(){if(revealed)return;revealed=true;try{h.setAttribute('data-watta-hero-content-ready','1');}catch(e){}}function seekContent(){try{if(v.readyState<1)return;var t=effStart();if(!atContent())v.currentTime=t;}catch(e){}}function play(){try{v.muted=true;v.volume=0;v.loop=true;v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('loop','');if(atContent())reveal();var r=v.play();if(r&&r.catch)r.catch(function(){});}catch(e){}}function boot(){seekContent();play();}v.addEventListener('loadedmetadata',function(){seekContent();},{passive:true});v.addEventListener('seeked',function(){if(atContent())reveal();},{passive:true});v.addEventListener('playing',function(){if(atContent())reveal();},{passive:true});v.addEventListener('pause',function(){if(document.visibilityState!=='visible')return;boot();},{passive:true});v.addEventListener('ended',function(){try{v.currentTime=effStart();}catch(e){}boot();},{passive:true});boot();requestAnimationFrame(boot);setTimeout(boot,0);setTimeout(boot,32);setTimeout(boot,120);setTimeout(function(){seekContent();reveal();},500);})();`
}

/** Після seek на startSec — кадр готовий до показу (без data-* — видимість через `.watta-hero-video--ready`). */
export function markHeroVideoAtStartSec(
  video: HTMLVideoElement,
  startSec = WATTA_HERO_VIDEO_START_SEC,
): boolean {
  return isHeroVideoAtStartSec(video, startSec)
}

export function seekHeroVideoToStartSec(
  video: HTMLVideoElement,
  startSec = WATTA_HERO_VIDEO_START_SEC,
): void {
  const applySeek = () => {
    try {
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return
      const target = resolveHeroVideoStartSec(video, startSec)
      if (isHeroVideoAtStartSec(video, target)) return
      const onSeeked = () => {
        markHeroVideoAtStartSec(video, target)
        if (typeof document !== 'undefined') {
          try {
            document.documentElement.setAttribute('data-watta-hero-content-ready', '1')
          } catch {
            /* ignore */
          }
        }
      }
      video.addEventListener('seeked', onSeeked, { once: true })
      video.currentTime = target
    } catch {
      /* ignore — seek до canplay інколи кидає на Safari */
    }
  }
  applySeek()
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    video.addEventListener('loadedmetadata', applySeek, { once: true })
  }
}

/**
 * Loop: seek на startSec лише при «перемотці» назад (native loop → t≈0), не на кожному timeupdate.
 */
export function bindHeroVideoLoopClamp(
  video: HTMLVideoElement,
  options?: { enabled?: boolean; startSec?: number },
): () => void {
  const enabled = options?.enabled !== false
  const startSec = options?.startSec ?? WATTA_HERO_VIDEO_START_SEC
  if (!enabled) return () => {}

  let lastMediaTime = 0
  let loopClampLock = false

  const onTimeUpdate = () => {
    if (loopClampLock || video.seeking) return
    const t = video.currentTime
    const wrapped = lastMediaTime > 0.5 && t + 0.35 < lastMediaTime
    lastMediaTime = t

    /* Seek лише при native loop (t≈0), не під час звичайного autoplay з 0s. */
    if (!wrapped) return

    if (isHeroVideoAtStartSec(video, startSec)) return

    loopClampLock = true
    const unlock = () => {
      loopClampLock = false
    }
    video.addEventListener('seeked', unlock, { once: true })
    video.addEventListener('error', unlock, { once: true })
    seekHeroVideoToStartSec(video, startSec)
  }

  video.addEventListener('timeupdate', onTimeUpdate)
  return () => video.removeEventListener('timeupdate', onTimeUpdate)
}

/** Перший кадр hero готовий (loadeddata / playing) — сплеш можна прибрати */
export const WATTA_HERO_VIDEO_READY_EVENT = 'watta:hero-video-ready' as const

/** Фон hero до першого кадру mp4 (темний, без «синьої» заглушки) */
export const WATTA_HERO_OCEAN_GRADIENT = '#0a1210'

/** @deprecated синій градієнт — лишено для рідких fallback-екранів */
export const WATTA_HERO_OCEAN_GRADIENT_LEGACY =
  'radial-gradient(120% 90% at 50% 28%, #6ec4dc 0%, #3f94ae 38%, #2a6f82 72%, #1e5566 100%)'
