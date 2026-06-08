import { WATTA_HERO_ROLL_IMAGES } from '@/lib/wattaSushiRolls'
import { preloadImageUrls } from '@/lib/preloadImages'

/** Усі URL hero-ролів для `<link rel="preload">` і раннього прогріву кешу. */
export const WATTA_HERO_ROLL_IMAGE_URLS: readonly string[] = WATTA_HERO_ROLL_IMAGES.map(
  (roll) => roll.imageUrl,
)

/** Скільки перших ролів тягнемо з fetchPriority=high у `<head>`. */
export const WATTA_HERO_ROLL_HEAD_PRELOAD_COUNT = 6

let rollPreloadStarted = false

export function preloadHeroRollImageUrls(): void {
  if (rollPreloadStarted) return
  rollPreloadStarted = true
  // Перші 6 ролів уже йдуть `<link rel="preload">` (high) з <head> — тут не дублюємо high-пріоритет,
  // інакше 16 fetchPriority=high картинок конкурують з LCP головної. Решту 54 гріємо на low,
  // щоб після F5 вони лишались у кеші, але не блокували перший рендер.
  preloadImageUrls(WATTA_HERO_ROLL_IMAGE_URLS, { limit: 54, highPriorityCount: 6 })
}

/** JSON для inline boot script (до React / до гідратації). */
export const WATTA_HERO_ROLL_URLS_BOOT_JSON = JSON.stringify(WATTA_HERO_ROLL_IMAGE_URLS)

/** Фрагмент boot script: прогрів перших roll webp на головній `/`. */
export const WATTA_HERO_ROLL_BOOT_PRELOAD_SNIPPET = `
function primeHomeRollImages(){
  var u=${WATTA_HERO_ROLL_URLS_BOOT_JSON};
  var n=Math.min(u.length,6);
  for(var i=0;i<n;i++){
    try{
      var im=new Image();
      im.decoding='async';
      if('fetchPriority' in im)im.fetchPriority=i<4?'high':'low';
      im.src=u[i];
    }catch(e){}
  }
}`
