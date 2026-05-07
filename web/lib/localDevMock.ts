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
  { id: 1, slug: 'rolls', name_ru: 'Роллы', name_ua: 'Роли', name_en: 'Rolls', name_nl: 'Rolls', emoji: '🍣', order: 0, isActive: true, allowRecommendations: true },
  { id: 2, slug: 'sushi', name_ru: 'Суши', name_ua: 'Суші', name_en: 'Sushi', name_nl: 'Sushi', emoji: '🍙', order: 1, isActive: true, allowRecommendations: true },
  { id: 3, slug: 'sets', name_ru: 'Сеты', name_ua: 'Сети', name_en: 'Sets', name_nl: "Menu's", emoji: '🍱', order: 2, isActive: true, allowRecommendations: true },
  { id: 4, slug: 'soups', name_ru: 'Супы', name_ua: 'Супи', name_en: 'Soups', name_nl: 'Soepen', emoji: '🍜', order: 3, isActive: true, allowRecommendations: true },
  { id: 5, slug: 'bowls', name_ru: 'Боулы', name_ua: 'Боули', name_en: 'Bowls', name_nl: 'Bowls', emoji: '🥗', order: 4, isActive: true, allowRecommendations: true },
  { id: 6, slug: 'snacks', name_ru: 'Закуски', name_ua: 'Закуски', name_en: 'Snacks', name_nl: 'Snacks', emoji: '🍤', order: 5, isActive: true, allowRecommendations: true },
  { id: 7, slug: 'drinks', name_ru: 'Напитки', name_ua: 'Напої', name_en: 'Drinks', name_nl: 'Dranken', emoji: '🧃', order: 6, isActive: true, allowRecommendations: true },
  { id: 8, slug: 'sauces', name_ru: 'Соусы', name_ua: 'Соуси', name_en: 'Sauces', name_nl: 'Sauzen', emoji: '🌶️', order: 7, isActive: true, allowRecommendations: true },
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
  /** Додаткові кадри для каруселі (перше = imageUrl, як на бекенді). */
  imageUrls?: string[]
  /** Порожньо = усі міста (як Product без рядків ProductCity у бекенді). */
  cityLinks: CityLink[]
  ingredientIds: number[]
  isHomeHit?: boolean
  isCartRecommend?: boolean
  recommendOrder?: number
  cartRecommendOrder?: number
  promoDiscountPercent?: number
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
    cityLinks: [],
    ingredientIds: [1, 2],
    isHomeHit: true,
    recommendOrder: 0,
    isCartRecommend: true,
    cartRecommendOrder: 1,
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
    cityLinks: [],
    ingredientIds: [2],
  },
  {
    id: 103,
    name_ru: 'Золотой дракон',
    name_ua: 'Золотий дракон',
    name_en: 'Golden Dragon',
    name_nl: 'Gouden draak',
    description_ru: 'Угорь, авокадо, соус унаги, кунжут.',
    description_ua: 'Вугор, авокадо, унагі, кунжут.',
    description_en: 'Eel, avocado, eel sauce, sesame.',
    description_nl: 'Paling, avocado, unagisaus, sesam.',
    price: 245,
    categoryId: 1,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/b8860b/1a1a1a?text=Golden+Dragon',
    imageUrls: [
      'https://placehold.co/800x520/b8860b/1a1a1a?text=Golden+1',
      'https://placehold.co/800x520/d4a574/1a1a1a?text=Golden+2',
      'https://placehold.co/800x520/2d6a4f/fff?text=Golden+3',
    ],
    cityLinks: [],
    ingredientIds: [1],
    isHomeHit: true,
    recommendOrder: 2,
    promoDiscountPercent: 10,
  },
  {
    id: 104,
    name_ru: 'Маки с лососем',
    name_ua: 'Макі з лососем',
    name_en: 'Salmon maki',
    name_nl: 'Zalm maki',
    description_ru: 'Классика: лосось, рис, нори.',
    description_ua: 'Класика: лосось, рис, норі.',
    description_en: 'Classic: salmon, rice, nori.',
    description_nl: 'Klasiek: zalm, rijst, nori.',
    price: 120,
    categoryId: 1,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/f4a261/1a1a1a?text=Maki',
    cityLinks: [],
    ingredientIds: [1, 2],
  },
  {
    id: 105,
    name_ru: 'Спайси тунец',
    name_ua: 'Спайсі тунець',
    name_en: 'Spicy tuna',
    name_nl: 'Pittige tonijn',
    description_ru: 'Тунец, острый майонез, огурец, лук.',
    description_ua: 'Тунець, гострий майонез, огірок.',
    description_en: 'Tuna, spicy mayo, cucumber, spring onion.',
    description_nl: 'Tonijn, pittige mayo, komkommer.',
    price: 195,
    categoryId: 1,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/6b1c1c/fff?text=Spicy',
    cityLinks: [],
    ingredientIds: [2],
  },
  {
    id: 106,
    name_ru: 'Нигири с лососем (2 шт)',
    name_ua: 'Нігірі з лососем (2 шт)',
    name_en: 'Salmon nigiri (2)',
    name_nl: 'Zalm nigiri (2)',
    description_ru: 'Свежий лосось на рисе.',
    description_ua: 'Свіжий лосось на рисі.',
    description_en: 'Fresh salmon on sushi rice.',
    description_nl: 'Verse zalm op sushirijst.',
    price: 55,
    categoryId: 2,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/e76f51/fff?text=Nigiri',
    cityLinks: [],
    ingredientIds: [1, 2],
  },
  {
    id: 107,
    name_ru: 'Сашими микс',
    name_ua: 'Сашимі мікс',
    name_en: 'Sashimi mix',
    name_nl: 'Sashimi mix',
    description_ru: 'Лосось, тунец, сибас — шеф-нарезка.',
    description_ua: 'Лосось, тунець, сіба.',
    description_en: 'Salmon, tuna, sea bass.',
    description_nl: 'Zalm, tonijn, zeebaars.',
    price: 280,
    categoryId: 2,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/7209b7/fff?text=Sashimi',
    cityLinks: [],
    ingredientIds: [1],
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
    categoryId: 3,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/cc8844/ffffff?text=Family+set',
    cityLinks: [],
    ingredientIds: [1, 2],
    isHomeHit: true,
    recommendOrder: 1,
  },
  {
    id: 202,
    name_ru: 'Сет «Запечённый»',
    name_ua: 'Сет «Запечений»',
    name_en: 'Baked set',
    name_nl: 'Gebakken set',
    description_ru: 'Запечённые роллы: лосось, угорь, краб.',
    description_ua: 'Запечені роли з лососем і вугра.',
    description_en: 'Baked rolls with salmon, eel, crab.',
    description_nl: 'Gegrilde rolls met zalm en paling.',
    price: 650,
    categoryId: 3,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/9c6644/fff?text=Hot+set',
    cityLinks: [],
    ingredientIds: [1],
  },
  {
    id: 301,
    name_ru: 'Мисо суп',
    name_ua: 'Місо суп',
    name_en: 'Miso soup',
    name_nl: 'Misosoep',
    description_ru: 'Тофу, вакаме, бульон мисо.',
    description_ua: 'Тофу, вакаме, місо.',
    description_en: 'Tofu, wakame, miso broth.',
    description_nl: 'Tofu, wakame, miso.',
    price: 85,
    categoryId: 4,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/6f4e37/fff?text=Miso',
    cityLinks: [],
    ingredientIds: [2],
  },
  {
    id: 302,
    name_ru: 'Том ям с креветками',
    name_ua: 'Том ям з креветками',
    name_en: 'Tom yum',
    name_nl: 'Tom yam',
    description_ru: 'Острый бульон, креветки, кокос, лемонграсс.',
    description_ua: 'Гострий бульйон, креветки, кокос.',
    description_en: 'Spicy soup with prawns and lemongrass.',
    description_nl: 'Pittige soep met gamba’s.',
    price: 265,
    categoryId: 4,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/c1121f/fff?text=Tom+Yam',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 401,
    name_ru: 'Поке с лососем',
    name_ua: 'Поке з лососем',
    name_en: 'Salmon poké',
    name_nl: 'Zalm poké',
    description_ru: 'Рис, лосось, эдамаме, авокадо, соус поке.',
    description_ua: 'Рис, лосось, едамаме, авокадо.',
    description_en: 'Rice, salmon, edamame, avocado, poké sauce.',
    description_nl: 'Rijst, zalm, edamame, pokésaus.',
    price: 225,
    categoryId: 5,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/2a9d8f/fff?text=Poké',
    cityLinks: [],
    ingredientIds: [1, 2],
    isCartRecommend: true,
    cartRecommendOrder: 0,
  },
  {
    id: 402,
    name_ru: 'Боул терияки',
    name_ua: 'Боул теріякі',
    name_en: 'Teriyaki bowl',
    name_nl: 'Teriyaki bowl',
    description_ru: 'Рис, курица, кукуруза, кунжут, терияки.',
    description_ua: 'Рис, курка, кукурудза, кунжут.',
    description_en: 'Rice, chicken, corn, sesame, teriyaki.',
    description_nl: 'Rijst, kip, maïs, teriyaki.',
    price: 195,
    categoryId: 5,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/7f5539/fff?text=Bowl',
    cityLinks: [],
    ingredientIds: [2],
  },
  {
    id: 501,
    name_ru: 'Креветки темпура (6 шт)',
    name_ua: 'Креветки темпура (6 шт)',
    name_en: 'Tempura prawns (6)',
    name_nl: 'Tempura (6)',
    description_ru: 'С соусом для дипа.',
    description_ua: 'З соусом для вмочування.',
    description_en: 'With dipping sauce.',
    description_nl: 'Met dipsaus.',
    price: 195,
    categoryId: 6,
    isPopular: true,
    imageUrl: 'https://placehold.co/800x520/f4a261/1a1a1a?text=Tempura',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 502,
    name_ru: 'Эдамаме',
    name_ua: 'Едамаме',
    name_en: 'Edamame',
    name_nl: 'Edamame',
    description_ru: 'Тёплые бобы с солью.',
    description_ua: 'Тепла квасоля з сіллю.',
    description_en: 'Warm with sea salt.',
    description_nl: 'Warm met zeezout.',
    price: 95,
    categoryId: 6,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/95d5b2/1a1a1a?text=Edamame',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 601,
    name_ru: 'Coca-Cola 0.5 л',
    name_ua: 'Coca-Cola 0.5 л',
    name_en: 'Coca-Cola 0.5L',
    name_nl: 'Coca-Cola 0,5L',
    description_ru: 'Охлаждённая.',
    description_ua: 'Охолоджена.',
    description_en: 'Chilled.',
    description_nl: 'Gekoeld.',
    price: 40,
    categoryId: 7,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/e41f25/fff?text=Cola',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 602,
    name_ru: 'Сок Rich апельсин 1л',
    name_ua: 'Сік Rich апельсин 1л',
    name_en: 'Orange juice 1L',
    name_nl: 'Sinaasappel 1L',
    description_ru: 'Нектар.',
    description_ua: 'Нектар.',
    description_en: 'Fruit nectar.',
    description_nl: 'Nectar.',
    price: 48,
    categoryId: 7,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/f77f00/fff?text=Juice',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 701,
    name_ru: 'Соевый соус 40 мл',
    name_ua: 'Соєвий соус 40 мл',
    name_en: 'Soy sauce 40ml',
    name_nl: 'Sojasaus 40ml',
    description_ru: 'Классика к суши.',
    description_ua: 'Класика до суші.',
    description_en: 'Classic for sushi.',
    description_nl: 'Klassiek.',
    price: 15,
    categoryId: 8,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/1a1a1a/fff?text=Soy',
    cityLinks: [],
    ingredientIds: [],
  },
  {
    id: 702,
    name_ru: 'Ореховый соус',
    name_ua: 'Горіховий соус',
    name_en: 'Nut sauce',
    name_nl: 'Notensaus',
    description_ru: 'К чуке и сладким роллам.',
    description_ua: 'До чуки.',
    description_en: 'For chuka and sweet rolls.',
    description_nl: 'Voor chuka.',
    price: 32,
    categoryId: 8,
    isPopular: false,
    imageUrl: 'https://placehold.co/800x520/f9c74f/1a1a1a?text=Nut',
    cityLinks: [],
    ingredientIds: [],
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
    imageUrls: def.imageUrls?.length ? def.imageUrls : [],
    isPopular: def.isPopular,
    isHomeHit: def.isHomeHit ?? false,
    isCartRecommend: def.isCartRecommend ?? false,
    recommendOrder: def.recommendOrder ?? 0,
    cartRecommendOrder: def.cartRecommendOrder ?? 0,
    promoDiscountPercent: def.promoDiscountPercent ?? 0,
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

/** Як Prisma-бекенд: товар з порожнім `cities` — видимий у всіх містах. */
export function listProducts(cityId: number | null): typeof allSerializedProducts {
  if (cityId == null || Number.isNaN(cityId) || cityId <= 0) return allSerializedProducts
  return allSerializedProducts.filter((p) => {
    if (!p.cities || p.cities.length === 0) return true
    return p.cities.some((pc) => pc.cityId === cityId)
  })
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
  const withFlag = allSerializedProducts.filter(
    (p) => p.isCartRecommend === true && p.category?.allowRecommendations !== false,
  )
  const base =
    withFlag.length > 0
      ? [...withFlag].sort(
          (a, b) =>
            (a.cartRecommendOrder ?? 0) - (b.cartRecommendOrder ?? 0) ||
            (a.recommendOrder ?? 0) - (b.recommendOrder ?? 0) ||
            a.id - b.id,
        )
      : [...allSerializedProducts]
          .filter((p) => p.isPopular)
          .sort((a, b) => a.id - b.id)
  return base.slice(0, 12).map((p) => {
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
