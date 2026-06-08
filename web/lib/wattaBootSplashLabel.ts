/** Стабільний текст сплешу з <html lang> — без стрибка після гідратації LanguageContext. */
export function bootSplashLoadingLabel(htmlLang: string): string {
  const base = (htmlLang || 'en').split('-')[0]?.toLowerCase() ?? 'en'
  switch (base) {
    case 'uk':
      return 'Завантаження'
    case 'de':
    case 'nl':
      return 'Laden'
    case 'ru':
      return 'Загрузка'
    case 'pl':
      return 'Ładowanie'
    case 'fr':
      return 'Chargement'
    default:
      return 'Loading'
  }
}
