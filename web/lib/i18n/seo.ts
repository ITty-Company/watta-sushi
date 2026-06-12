import type { Metadata } from 'next'
import type { WattaLanguage } from './language'
import { wattaToOgLocale } from './language'
import { getPublicSiteUrl } from '@/lib/siteUrl'

const BRAND = 'Watta Sushi'

type PageKey =
  | 'home'
  | 'about'
  | 'teamGallery'
  | 'contacts'
  | 'delivery'
  | 'privacy'
  | 'offer'
  | 'blog'
  | 'reviews'
  | 'promotions'
  | 'login'
  | 'register'
  | 'cart'
  | 'favorites'
  | 'menu'
  | 'notifications'

/** Локалізовані title (без шаблону) і description для generateMetadata */
const SEO: Record<
  WattaLanguage,
  Record<
    PageKey,
    {
      title: string
      description: string
    }
  >
> = {
  uk: {
    home: {
      title: `${BRAND} | Доставка суші та ролів`,
      description:
        'Суші та роли з доставкою: свіжі інгредієнти, швидка доставка та зручне замовлення онлайн.',
    },
    about: {
      title: 'Про нас',
      description: 'Команда Watta Sushi: кухня, філософія та історія бренду.',
    },
    teamGallery: {
      title: 'Галерея команди',
      description: 'Фото команди Watta Sushi — усі портрети з адмін-панелі.',
    },
    contacts: {
      title: 'Контакти',
      description: 'Телефон, email, адреса кухні, месенджери та форма зворотного зв’язку.',
    },
    delivery: {
      title: 'Доставка',
      description: 'Зони доставки, умови, мінімальне замовлення та перевірка за поштовим індексом.',
    },
    privacy: {
      title: 'Політика конфіденційності',
      description: 'Як ми збираємо, використовуємо та захищаємо ваші персональні дані.',
    },
    offer: {
      title: 'Публічний договір',
      description: 'Умови замовлення, оплати, доставки та користування сайтом Watta Sushi.',
    },
    blog: {
      title: 'Блог і рецепти шефа',
      description: 'Корисні статті про суші, нотатки кухні та поради від Watta Sushi.',
    },
    reviews: {
      title: 'Відгуки клієнтів',
      description: 'Відгуки про доставку, смак страв і сервіс Watta Sushi.',
    },
    promotions: {
      title: 'Акції та новини',
      description: 'Акції, спеціальні пропозиції та оновлення від Watta Sushi.',
    },
    login: {
      title: 'Вхід',
      description: 'Увійдіть до акаунта — історія замовлень, бонуси та зручні повтори.',
    },
    register: {
      title: 'Реєстрація',
      description: 'Створіть акаунт Watta Sushi для швидшого оформлення та персональних пропозицій.',
    },
    cart: {
      title: 'Кошик',
      description: 'Ваше замовлення: перевірка позицій і оформлення.',
    },
    favorites: {
      title: 'Обране',
      description: 'Збережені страви для швидкого замовлення.',
    },
    menu: {
      title: 'Меню',
      description: 'Роли, суші, сети та інші категорії Watta Sushi — повний каталог на одній сторінці.',
    },
    notifications: {
      title: 'Сповіщення',
      description: 'Важливі оновлення та повідомлення з вашого акаунта.',
    },
  },
  ru: {
    home: {
      title: `${BRAND} | Доставка суши и роллов`,
      description:
        'Суши и роллы с доставкой: свежие ингредиенты, быстрая доставка и удобный заказ онлайн.',
    },
    about: {
      title: 'О нас',
      description: 'Команда Watta Sushi: кухня, философия и история бренда.',
    },
    teamGallery: {
      title: 'Галерея команды',
      description: 'Фото команды Watta Sushi — все портреты из админ-панели.',
    },
    contacts: {
      title: 'Контакты',
      description: 'Телефон, email, адрес кухни, мессенджеры и форма обратной связи.',
    },
    delivery: {
      title: 'Доставка',
      description: 'Зоны доставки, условия, минимальный заказ и проверка по почтовому индексу.',
    },
    privacy: {
      title: 'Политика конфиденциальности',
      description: 'Как мы собираем, используем и защищаем ваши персональные данные.',
    },
    offer: {
      title: 'Публичный договор',
      description: 'Условия заказа, оплаты, доставки и использования сайта Watta Sushi.',
    },
    blog: {
      title: 'Блог и рецепты шефа',
      description: 'Полезные статьи о суши, заметки с кухни и советы от Watta Sushi.',
    },
    reviews: {
      title: 'Отзывы клиентов',
      description: 'Отзывы о доставке, вкусе блюд и сервисе Watta Sushi.',
    },
    promotions: {
      title: 'Акции и новости',
      description: 'Акции, спецпредложения и новости от Watta Sushi.',
    },
    login: {
      title: 'Вход',
      description: 'Войдите в аккаунт — история заказов, бонусы и удобные повторы.',
    },
    register: {
      title: 'Регистрация',
      description: 'Создайте аккаунт Watta Sushi для быстрого оформления и персональных предложений.',
    },
    cart: {
      title: 'Корзина',
      description: 'Ваш заказ: проверка позиций и оформление.',
    },
    favorites: {
      title: 'Избранное',
      description: 'Сохранённые блюда для быстрого заказа.',
    },
    menu: {
      title: 'Меню',
      description: 'Роллы, суши, сеты и другие категории Watta Sushi — весь каталог на одной странице.',
    },
    notifications: {
      title: 'Уведомления',
      description: 'Важные обновления и сообщения от вашего аккаунта.',
    },
  },
  en: {
    home: {
      title: `${BRAND} | Sushi & rolls delivery`,
      description:
        'Sushi and rolls delivered to your door: fresh ingredients, fast delivery, and easy online ordering.',
    },
    about: {
      title: 'About us',
      description: 'The Watta Sushi team: our kitchen, philosophy, and brand story.',
    },
    teamGallery: {
      title: 'Team gallery',
      description: 'Watta Sushi team photos — every portrait from the admin panel.',
    },
    contacts: {
      title: 'Contacts',
      description: 'Phone, email, kitchen address, messengers, and contact form.',
    },
    delivery: {
      title: 'Delivery',
      description: 'Delivery areas, terms, minimum order, and postal code check.',
    },
    privacy: {
      title: 'Privacy policy',
      description: 'How we collect, use, and protect your personal data.',
    },
    offer: {
      title: 'Public agreement',
      description: 'Terms for ordering, payment, delivery, and using the Watta Sushi website.',
    },
    blog: {
      title: "Chef's blog & recipes",
      description: 'Sushi tips, kitchen notes, and ideas from the Watta Sushi team.',
    },
    reviews: {
      title: 'Customer reviews',
      description: 'Reviews of delivery, taste, and service at Watta Sushi.',
    },
    promotions: {
      title: 'News & offers',
      description: 'Promotions, special offers, and news from Watta Sushi.',
    },
    login: {
      title: 'Log in',
      description: 'Sign in to your account—order history, rewards, and quick reorders.',
    },
    register: {
      title: 'Sign up',
      description: 'Create a Watta Sushi account for faster checkout and personal offers.',
    },
    cart: {
      title: 'Cart',
      description: 'Your order: review items and check out.',
    },
    favorites: {
      title: 'Favourites',
      description: 'Saved dishes for quick ordering.',
    },
    menu: {
      title: 'Menu',
      description: 'Rolls, sushi, sets, and more — the full Watta Sushi catalog in one place.',
    },
    notifications: {
      title: 'Notifications',
      description: 'Updates and messages from your account.',
    },
  },
  nl: {
    home: {
      title: `${BRAND} | Sushi & rollen bezorgen`,
      description:
        'Sushi en rollen thuis: verse ingrediënten, snelle bezorging en eenvoudig online bestellen.',
    },
    about: {
      title: 'Over ons',
      description: 'Team Watta Sushi: keuken, filosofie en het merkverhaal.',
    },
    teamGallery: {
      title: 'Teamgalerij',
      description: 'Teamfoto’s van Watta Sushi — alle portretten uit het adminpaneel.',
    },
    contacts: {
      title: 'Contact',
      description: 'Telefoon, e-mail, keukenadres, apps en contactformulier.',
    },
    delivery: {
      title: 'Bezorging',
      description: 'Bezorgzones, voorwaarden, minimum en postcodecheck.',
    },
    privacy: {
      title: 'Privacybeleid',
      description: 'Hoe wij persoonsgegevens verzamelen, gebruiken en beschermen.',
    },
    offer: {
      title: 'Publieke offerte',
      description: 'Voorwaarden voor bestellen, betalen, bezorgen en gebruik van de Watta Sushi-site.',
    },
    blog: {
      title: "Blog en chef's recepten",
      description: "Tips rond sushi, notities van de keuken en ideeën van Watta Sushi.",
    },
    reviews: {
      title: 'Beoordelingen',
      description: 'Beoordelingen over bezorging, smaak en service bij Watta Sushi.',
    },
    promotions: {
      title: 'Aanbiedingen & nieuws',
      description: "Acties, speciale voorwaarden en nieuws van Watta Sushi.",
    },
    login: {
      title: 'Inloggen',
      description: "Log in op je account: bestelgeschiedenis, bonussen en opnieuw bestellen.",
    },
    register: {
      title: 'Registreren',
      description: 'Maak een Watta Sushi-account voor snellere checkout en persoonlijke deals.',
    },
    cart: {
      title: 'Winkelwagen',
      description: "Je bestelling: items controleren en afrekenen.",
    },
    favorites: {
      title: 'Favorieten',
      description: 'Opgeslagen gerechten om snel te bestellen.',
    },
    menu: {
      title: 'Menu',
      description: "Rollen, sushi, menu's en meer — de volledige Watta Sushi-catalogus op één plek.",
    },
    notifications: {
      title: 'Meldingen',
      description: "Updates en berichten van je account.",
    },
  },
}

const blogNotFound: Record<WattaLanguage, string> = {
  uk: 'Статтю не знайдено',
  ru: 'Статья не найдена',
  en: 'Article not found',
  nl: 'Artikel niet gevonden',
}

export function getPageSeo(lang: WattaLanguage, key: PageKey) {
  return SEO[lang][key]
}

export function getBlogNotFoundTitle(lang: WattaLanguage) {
  return blogNotFound[lang]
}

/**
 * Корневі metadata (title template + default OG). Для child routes задавайте `title: { absolute: ... }` або вузький `title` без дубля бренда.
 */
export function buildRootMetadata(lang: WattaLanguage): Metadata {
  const home = SEO[lang].home
  const siteUrl = getPublicSiteUrl()
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: home.title,
      template: `%s | ${BRAND}`,
    },
    description: home.description,
    authors: [{ name: `${BRAND} Team` }],
    openGraph: {
      type: 'website',
      siteName: BRAND,
      ...(siteUrl ? { url: siteUrl } : {}),
      title: home.title,
      description: home.description,
      locale: wattaToOgLocale(lang),
      images: [
        {
          url: '/watta-sushi.jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

export function buildSubpageMetadata(lang: WattaLanguage, key: PageKey): Metadata {
  const p = getPageSeo(lang, key)
  /** Головна: повний title вже з брендом — без подвійного template з layout. */
  const title: Metadata['title'] = key === 'home' ? { absolute: p.title } : p.title
  return {
    title,
    description: p.description,
    openGraph: {
      title: key === 'home' ? p.title : `${p.title} | ${BRAND}`,
      description: p.description,
      locale: wattaToOgLocale(lang),
    },
  }
}

export function getJsonLdDescription(lang: WattaLanguage): string {
  return SEO[lang].home.description
}
