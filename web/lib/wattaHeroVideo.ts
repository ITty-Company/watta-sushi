/**
 * Головна сторінка (`MenuView`): основний ocean hero + запасні mp4.
 */
export const WATTA_HOME_HERO_VIDEO_SOURCES = [
  '/watta-sushi-2-hero.mp4',
  '/hero-untitled-design.mp4',
  '/welcome.mp4',
] as const

/**
 * Повний каталог `/menu` (`FullMenuPageClient`): окремий банерний ролик, далі той самий ланцюг запасних.
 */
export const WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES = [
  '/watta-sushi-2-hero.mp4',
  '/hero-untitled-design.mp4',
  '/welcome.mp4',
] as const

/** Preload на головній — перший кадр головного hero (не сторінка `/menu`). */
export const WATTA_HERO_PRIMARY_MP4 = WATTA_HOME_HERO_VIDEO_SOURCES[0]

/** Подія після зняття сплешу: MenuView / hero resume play одразу */
export const WATTA_BOOT_SPLASH_ENDED_EVENT = 'watta:boot-splash-ended' as const
