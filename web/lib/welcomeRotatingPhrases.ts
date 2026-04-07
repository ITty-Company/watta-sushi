/** Коди мов сайту (узгоджено з LanguageContext). */
type SiteLang = 'uk' | 'en' | 'ru' | 'nl'

/** Фрази «ласкаво просимо» кожною мовою сайту — показуються по черзі на hero. */
export const ROTATING_WELCOME: readonly { lang: SiteLang; text: string }[] = [
  { lang: 'uk', text: 'Ласкаво просимо' },
  { lang: 'ru', text: 'Добро пожаловать' },
  { lang: 'en', text: 'Welcome' },
  { lang: 'nl', text: 'Welkom' },
] as const
