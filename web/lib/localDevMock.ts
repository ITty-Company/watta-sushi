/**
 * Дані та серіалізація під відповіді Express + Prisma (як у production API).
 * Редагуйте контент тут — структуру полів краще не спрощувати.
 */

import { getMiddlewareMockBlogPosts } from '../app/lib/blogFallbackContent'
import { getMiddlewareMockPromotions } from '../app/lib/demoPromotionsFallback'
import { WATTA_INSTAGRAM_URL } from './wattaSiteDefaults'

export const MOCK_PROMO_CODE = 'MOCK10'

const T = '2025-01-15T12:00:00.000Z'

export const mockCategories = [
  { id: 1, slug: 'rolls', name_ru: 'Роллы', name_ua: 'Роли', name_en: 'Rolls', name_nl: 'Rolls', emoji: '🍣', order: 0, isActive: true },
  { id: 2, slug: 'sets', name_ru: 'Сеты', name_ua: 'Сети', name_en: 'Sets', name_nl: 'Sets', emoji: '🍱', order: 1, isActive: true },
  { id: 3, slug: 'drinks', name_ru: 'Напитки', name_ua: 'Напої', name_en: 'Drinks', name_nl: 'Dranken', emoji: '🧃', order: 2, isActive: true },
]

const cat = (id: number) => mockCategories.find((c) => c.id === id)!

export const mockCountry = {
  id: 1,
  name: 'Нідерланди',
  name_ua: 'Нідерланди',
  name_en: 'Netherlands',
  name_nl: 'Nederland',
  flag: '🇳🇱',
  code: 'NL',
  isActive: true,
  createdAt: T,
  updatedAt: T,
}

export const mockCityBase = {
  id: 1,
  name: 'Амстердам',
  name_ua: 'Амстердам',
  name_nl: 'Amsterdam',
  name_en: 'Amsterdam',
  countryId: 1,
  latitude: 52.3676,
  longitude: 4.9041,
  restaurantLatitude: null as number | null,
  restaurantLongitude: null as number | null,
  zoom: 12,
  pricePerKm: 10,
  isActive: true,
  createdAt: T,
  updatedAt: T,
}

/** Полігон для карти доставки (рядок JSON, як у БД). */
const zonePolygonAmsterdamCenter = JSON.stringify([
  { lat: 52.4, lng: 4.85 },
  { lat: 52.4, lng: 4.95 },
  { lat: 52.34, lng: 4.95 },
  { lat: 52.34, lng: 4.85 },
])

const zonePolygonAmsterdamWest = JSON.stringify([
  { lat: 52.42, lng: 4.75 },
  { lat: 52.42, lng: 4.88 },
  { lat: 52.36, lng: 4.88 },
  { lat: 52.36, lng: 4.75 },
])

/** Zuid — стандартний тариф (€/км після вводу адреси в кошику) */
const zonePolygonAmsterdamSouth = JSON.stringify([
  { lat: 52.36, lng: 4.88 },
  { lat: 52.36, lng: 5.02 },
  { lat: 52.3, lng: 5.02 },
  { lat: 52.3, lng: 4.88 },
])

export const mockDeliveryZonesBare = [
  {
    id: 1,
    name: 'Centrum',
    color: '#22c55e',
    cityId: 1,
    coordinates: zonePolygonAmsterdamCenter,
    isFreeDelivery: true,
    flatDeliveryFee: null as number | null,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 2,
    name: 'West',
    color: '#3b82f6',
    cityId: 1,
    coordinates: zonePolygonAmsterdamWest,
    isFreeDelivery: false,
    flatDeliveryFee: 4.5,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 3,
    name: 'Zuid',
    color: '#f59e0b',
    cityId: 1,
    coordinates: zonePolygonAmsterdamSouth,
    isFreeDelivery: false,
    flatDeliveryFee: null as number | null,
    createdAt: T,
    updatedAt: T,
  },
]

export function deliveryZonesForCity(cityId: number) {
  return mockDeliveryZonesBare
    .filter((z) => z.cityId === cityId)
    .map((z) => ({
      ...z,
      city: {
        ...mockCityBase,
        id: cityId,
        country: mockCountry,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

/** GET /api/countries — міста без deliveryZones (як у country.routes). */
export function getCountriesPublic() {
  return [
    {
      ...mockCountry,
      cities: [{ ...mockCityBase }],
    },
  ]
}

/** GET /api/cities — include country + deliveryZones (як у city.routes). */
export function getCitiesForMenu() {
  return [
    {
      ...mockCityBase,
      country: mockCountry,
      deliveryZones: mockDeliveryZonesBare.filter((z) => z.cityId === mockCityBase.id),
    },
  ]
}

export const mockIngredients = [
  {
    id: 1,
    name_ru: 'Лосось',
    name_ua: 'Лосось',
    name_en: 'Salmon',
    name_nl: 'Zalm',
    imageUrl: 'https://placehold.co/160x160/145142/ffffff?text=Salmon',
  },
  {
    id: 2,
    name_ru: 'Рис',
    name_ua: 'Рис',
    name_en: 'Rice',
    name_nl: 'Rijst',
    imageUrl: 'https://placehold.co/160x160/ccc/333?text=Rice',
  },
]

type CityLink = { pcId: number; cityId: number }

const productDefs: Array<{
  id: number
  name_ru: string
  name_ua: string
  name_en: string
  name_nl: string
  description_ru: string
  description_ua: string
  description_en: string
  description_nl: string
  price: number
  categoryId: number
  isPopular: boolean
  imageUrl: string
  cityLinks: CityLink[]
  ingredientIds: number[]
}> = [
  {
    id: 101,
    name_ru: 'Филадельфия',
    name_ua: 'Філадельфія',
    name_en: 'Philadelphia',
    name_nl: 'Philadelphia',
    description_ru: 'Лосось, сыр «Филадельфия», огурец, рис, нори.',
    description_ua: 'Лосось, сир «Філадельфія», огірок, рис, норі.',
    description_en: 'Salmon, cream cheese, cucumber, rice, nori.',
    description_nl: 'Zalm, roomkaas, komkommer, rijst, nori.',
    price: 189,
    categoryId: 1,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/145142/ffffff?text=Philadelphia',
    cityLinks: [{ pcId: 501, cityId: 1 }],
    ingredientIds: [1, 2],
  },
  {
    id: 102,
    name_ru: 'Калифорния',
    name_ua: 'Каліфорнія',
    name_en: 'California',
    name_nl: 'California',
    description_ru: 'Краб, авокадо, огурец, рис, нори, кунжут.',
    description_ua: 'Краб, авокадо, огірок, рис, норі, кунжут.',
    description_en: 'Crab, avocado, cucumber, rice, nori, sesame.',
    description_nl: 'Krab, avocado, komkommer, rijst, nori, sesam.',
    price: 165,
    categoryId: 1,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/1a6b58/ffffff?text=California',
    cityLinks: [{ pcId: 502, cityId: 1 }],
    ingredientIds: [2],
  },
  {
    id: 201,
    name_ru: 'Сет «Семейный»',
    name_ua: 'Сет «Родинний»',
    name_en: 'Family set',
    name_nl: 'Familie set',
    description_ru: '32 шт. — хитовые роллы для компании.',
    description_ua: '32 шт. — хітові роли для компанії.',
    description_en: '32 pcs — bestseller rolls for a group.',
    description_nl: '32 st. — populaire rolls voor een groep.',
    price: 899,
    categoryId: 2,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/cc8844/ffffff?text=Family+set',
    cityLinks: [{ pcId: 503, cityId: 1 }],
    ingredientIds: [1, 2],
  },
]

function serializeProduct(def: (typeof productDefs)[number]) {
  const category = cat(def.categoryId)
  const ingredients = def.ingredientIds
    .map((iid) => mockIngredients.find((i) => i.id === iid))
    .filter(Boolean) as typeof mockIngredients

  return {
    id: def.id,
    name_ru: def.name_ru,
    name_ua: def.name_ua,
    name_en: def.name_en,
    name_nl: def.name_nl,
    description_ru: def.description_ru,
    description_ua: def.description_ua,
    description_en: def.description_en,
    description_nl: def.description_nl,
    price: def.price,
    imageUrl: def.imageUrl,
    isPopular: def.isPopular,
    categoryId: def.categoryId,
    category,
    cities: def.cityLinks.map((link) => ({
      id: link.pcId,
      productId: def.id,
      cityId: link.cityId,
      city: { ...mockCityBase, id: link.cityId },
    })),
    ingredients,
  }
}

const allSerializedProducts = productDefs.map(serializeProduct)

export function listProducts(cityId: number | null): typeof allSerializedProducts {
  if (cityId == null || Number.isNaN(cityId)) return allSerializedProducts
  return allSerializedProducts.filter((p) => p.cities.some((pc) => pc.cityId === cityId))
}

export function getProductById(id: number) {
  return allSerializedProducts.find((p) => p.id === id) ?? null
}

/** Як у favorite.routes list — product + category, без cities/ingredients. */
export function productsForFavoriteList(productIds: number[]) {
  return productIds
    .map((id) => {
      const full = getProductById(id)
      if (!full) return null
      const { cities: _c, ingredients: _i, ...rest } = full
      return rest
    })
    .filter(Boolean)
}

export function listRecommendations() {
  return allSerializedProducts.slice(0, 4).map((p) => {
    const { cities: _c, ingredients: _i, ...rest } = p
    return { ...rest, category: p.category }
  })
}

export const mockSiteSettings = {
  id: 1,
  bannerInterval: 5000,
  telegramUrl: 'https://t.me/watta_sushi_mock',
  whatsappUrl: 'https://wa.me/380000000000',
  instagramUrl: WATTA_INSTAGRAM_URL,
  restaurantPickupAddress: 'Amstelveenseweg 192, 1075 XR Amsterdam (mock, самовивіз)',
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
}

export const mockBanners = [
  {
    id: 1,
    title_ru: 'Watta Sushi',
    title_ua: 'Watta Sushi',
    title_en: 'Watta Sushi',
    title_nl: 'Watta Sushi',
    imageUrl: 'https://placehold.co/1600x520/145142/ffffff?text=Banner+1',
    focalX: 50,
    focalY: 50,
    order: 0,
    isActive: true,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 2,
    title_ru: 'Локальний mock — web/lib/localDevMock.ts',
    title_ua: 'Локальний mock',
    title_en: 'Local mock data',
    title_nl: 'Lokale mock',
    imageUrl: 'https://placehold.co/1600x520/1a6b58/ffffff?text=USE_LOCAL_MOCK',
    focalX: 50,
    focalY: 50,
    order: 1,
    isActive: true,
    createdAt: T,
    updatedAt: T,
  },
]

export const mockPromotions = [
  {
    id: 1,
    title: 'Відкриття сезону',
    description: 'Короткий опис акції для списку новин.',
    content: 'Повний текст новини так само, як у таблиці Promo (поле content). Можна змінити в localDevMock.ts.',
    imageUrl: 'https://placehold.co/900x560/145142/ffffff?text=Promo',
    galleryUrls: ['https://placehold.co/900x560/145142/ffffff?text=Promo'],
    productOffers: [] as { productId: number; discountPercent: number }[],
    isHit: true,
    createdAt: T,
    updatedAt: T,
  },
]

export const mockTeam = [
  {
    id: 1,
    name_ru: 'Олександр Петренко',
    name_ua: 'Олександр Петренко',
    name_en: 'Oleksandr Petrenko',
    name_nl: 'Oleksandr Petrenko',
    position_ru: 'Шеф-кухар',
    position_ua: 'Шеф-кухар',
    position_en: 'Head chef',
    position_nl: 'Hoofdchef',
    imageUrl: 'https://placehold.co/480x480/e2e8f0/334155?text=Chef',
    bio_ru: '15 років досвіду в японській кухні (mock).',
    bio_ua: '15 років досвіду в японській кухні (mock).',
    bio_en: '15 years in Japanese cuisine (mock).',
    bio_nl: '15 jaar ervaring (mock).',
    order: 0,
    isActive: true,
    createdAt: T,
    updatedAt: T,
  },
]

export const mockBlogPosts = getMiddlewareMockBlogPosts()
