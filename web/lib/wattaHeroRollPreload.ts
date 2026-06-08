import { WATTA_HERO_ROLL_IMAGES, WATTA_HERO_ROLL_TOP_ROW_COUNT } from '@/lib/wattaSushiRolls'
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
  // Перші 6 ролів уже йдуть `<link rel="preload">` (high) з <head>. Решту верхнього ряду (до 16)
  // гріємо на low — нижній ряд підвантажиться при скролі/анімації, без ~4 MB зайвого egress.
  preloadImageUrls(WATTA_HERO_ROLL_IMAGE_URLS, {
    limit: WATTA_HERO_ROLL_TOP_ROW_COUNT,
    highPriorityCount: 6,
  })
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
