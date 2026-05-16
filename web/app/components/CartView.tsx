'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getDeliveryOriginAddress } from '@/lib/deliveryOrigin'
import {
  ArrowLeft,
  MapPin,
  Truck,
  Store,
  Minus,
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import LogoBackground from './LogoBackground'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import type { WattaLanguage } from '@/lib/i18n/language'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import {
  buildAmsterdamSlots,
  type DeliveryDay,
} from '@/lib/deliverySlotsAmsterdam'
import toast from 'react-hot-toast'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { getApiUrl } from '@/lib/utils'
import { cityIdPreferAmsterdam } from '@/lib/wattaPreferredDefaultCity'
import {
  getExplicitSavedCityId,
  readCityIdForProductApi,
} from '@/lib/wattaSiteLocalePrefs'
import {
  CHECKOUT_PHONE_INPUT_MAX_LEN,
  isValidCheckoutPhone,
  sanitizeCheckoutPhoneInput,
} from '@/lib/checkoutPhone'
import { effectiveUnitPrice, clampPromoPercent } from '@/lib/productPricing'
import {
  readWattaDeliveryZoneSelection,
  type WattaDeliveryZoneSelection,
} from '@/lib/wattaDeliveryZoneSelection'
import { WattaMenuProductCard } from './WattaMenuProductCard'

const CART_CHECKOUT_FORM_ID = 'watta-cart-checkout-form'

const CHECKOUT_INPUT_CLASS =
  'w-full min-w-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-[13px] leading-snug text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-[#145142]/40 focus:ring-2 focus:ring-[#145142]/15 sm:px-3 sm:py-2.5 sm:text-[15px] sm:focus:ring-[#145142]/20'
const CHECKOUT_CARD_CLASS =
  'watta-cart-card rounded-xl border border-[#145142]/10 bg-white/95 p-3 shadow-[0_1px_3px_rgba(20,81,66,0.06)] sm:rounded-2xl sm:p-5'
const CHECKOUT_SECTION_TITLE_CLASS =
  'text-[15px] font-bold tracking-tight text-[#145142] sm:text-lg'
const CHECKOUT_FIELD_LABEL_CLASS =
  'mb-1 block text-[11px] font-semibold text-[#145142]/80 sm:text-xs'
/** Під'їзд / поверх / кв.: лише цифри, до 1000 символів кожне */
const DIGIT_ADDR_MAX = 4
const STREET_MAX = 100
const BUILDING_BLOCK_MAX = 4
const COMMENT_MAX = 500

interface CheckoutSiteSettings {
  freeDeliveryThreshold: number
  deliveryFee: number
  restaurantPickupAddress: string
}

const defaultCheckoutSettings: CheckoutSiteSettings = {
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
  restaurantPickupAddress: '',
}

// --- ТИПЫ ДАННЫХ ---
interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  emoji: string
  imageUrl?: string
  quantity?: number
  isTop?: boolean
  promoDiscountPercent?: number
  /** Стабільний ключ рядка в кошику (кожна «+» — окремий рядок) */
  cartLineId?: string
}

function newCartLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function normalizeCartLines(raw: unknown): MenuItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry, index) => {
    const item = entry as MenuItem
    return {
      ...item,
      cartLineId:
        typeof item.cartLineId === 'string' && item.cartLineId.length > 0
          ? item.cartLineId
          : `legacy-${item.id}-${index}`,
    }
  })
}

const UPSELL_THRESHOLD = 300
const UPSELL_DISCOUNT_PERCENT = 15

interface CityOption {
  id: number
  name: string
  name_ua?: string | null
  name_en?: string | null
  name_nl?: string | null
  pricePerKm?: number | null
}

function cityDisplayName(language: string, row: Record<string, unknown>): string {
  return (
    getLocalizedField(row, 'name', language as WattaLanguage) ||
    String(row.name ?? row.name_ru ?? '').trim()
  )
}

// Пропсы для навигации
interface CartViewProps {
  onBack: () => void
  onOpenProfile: () => void
  onOpenFavorites: () => void
  onOpenPhone: () => void
  onOpenNotifications: () => void
  onMenuClick: () => void
}

export default function CartView({ 
  onBack, 
  onOpenProfile, 
  onOpenFavorites, 
  onOpenPhone, 
  onOpenNotifications, 
  onMenuClick 
}: CartViewProps) {
  const { t, language, getLocalized } = useLanguage()
  const pd = t.productDetail
  const cs = t.cartSection
  const a = t.siteAria
  const recScrollRef = useRef<HTMLDivElement>(null)

  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [recommendations, setRecommendations] = useState<MenuItem[]>([])
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false)
  const [isBypassingUpsell, setIsBypassingUpsell] = useState(false)
  
  // Состояния для оформления
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '', 
    address: '', 
    comment: '', 
    needChangeFrom: '',
    entrance: '',
    floor: '',
    apartment: '',
    intercom: '',
    buildingBlock: '',
    persons: 1,
    sticks: 0,
    noCallbackConfirm: false,
    noDoorbellRing: false,
  })

  //---Оплата---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [deliveryDay, setDeliveryDay] = useState<DeliveryDay>('today')
  const [deliverySlot, setDeliverySlot] = useState('asap')
  // --- ЛОГИКА ПРОМОКОДОВ ---
  // Добавляем эти переменные, чтобы не было ошибок в return
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSiteSettings>(defaultCheckoutSettings)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [useBonuses, setUseBonuses] = useState(false)
  const [mapZoneSelection, setMapZoneSelection] = useState<WattaDeliveryZoneSelection | null>(null)

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setCheckoutSettings({
          freeDeliveryThreshold: Number(data.freeDeliveryThreshold) || defaultCheckoutSettings.freeDeliveryThreshold,
          deliveryFee: Number(data.deliveryFee) || defaultCheckoutSettings.deliveryFee,
          restaurantPickupAddress: String(data.restaurantPickupAddress ?? '').trim(),
        })
      })
      .catch(() => {})
  }, [])

  const syncCartFromStorage = useCallback(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(normalizeCartLines(cart))
    } catch {
      setCartItems([])
    }
  }, [])

  useEffect(() => {
    syncCartFromStorage()
    window.addEventListener('storage', syncCartFromStorage)
    window.addEventListener('cartUpdated', syncCartFromStorage)
    return () => {
      window.removeEventListener('storage', syncCartFromStorage)
      window.removeEventListener('cartUpdated', syncCartFromStorage)
    }
  }, [syncCartFromStorage])

  const scrollRecRail = useCallback((dir: -1 | 1) => {
    const el = recScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(300, el.clientWidth * 0.8), behavior: 'smooth' })
  }, [])

  const prefillFromUser = useCallback(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    const savedUser = localStorage.getItem('currentUser')
    if (!savedUser) return
    try {
      const user = JSON.parse(savedUser)
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
      }))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    prefillFromUser()
    window.addEventListener('userChanged', prefillFromUser)
    return () => window.removeEventListener('userChanged', prefillFromUser)
  }, [prefillFromUser])

  useEffect(() => {
    const loadRecs = () => {
      const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
      const q = new URLSearchParams({ limit: '20' })
      if (cityId != null && cityId > 0) q.set('cityId', String(cityId))
      fetch(getApiUrl(`/api/products/recommendations?${q.toString()}`))
        .then((res) => res.json())
        .then((data) => {
          const list: MenuItem[] = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => {
            const cat = p.category as Record<string, unknown> | undefined
            return {
              id: Number(p.id),
              name: getLocalized(p as never, 'name'),
              description: getLocalized(p as never, 'description') || '',
              price: Number(p.price),
              category:
                getMenuCategoryDisplayName((cat || {}) as Record<string, unknown>, language, t.categories) || '',
              emoji: '🍱',
              imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
              isTop: p.isPopular === true,
              promoDiscountPercent:
                typeof p.promoDiscountPercent === 'number' ? p.promoDiscountPercent : Number(p.promoDiscountPercent) || 0,
            }
          })
          setRecommendations(list)
        })
        .catch(() => setRecommendations([]))
    }
    loadRecs()
    if (typeof window === 'undefined') return undefined
    window.addEventListener('cityChanged', loadRecs)
    return () => window.removeEventListener('cityChanged', loadRecs)
  }, [getLocalized, language, t.categories])

  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data: unknown) => {
        const rows = Array.isArray(data) ? data : []
        const loadedCities = rows
          .map((raw) => {
            const row = raw as Record<string, unknown>
            const label = cityDisplayName(language, row)
            return {
              id: Number(row.id),
              name: label,
              name_ua: row.name_ua as string | null | undefined,
              name_en: row.name_en as string | null | undefined,
              name_nl: row.name_nl as string | null | undefined,
              pricePerKm: Number(row.pricePerKm ?? 10),
            }
          })
          .filter((city) => Boolean(city.name))

        if (loadedCities.length === 0) return

        const explicitId =
          typeof window !== 'undefined' ? getExplicitSavedCityId() : null
        const amsId = cityIdPreferAmsterdam(loadedCities)
        const preferred =
          (explicitId != null ? loadedCities.find((c) => c.id === explicitId) : null) ??
          (amsId != null ? loadedCities.find((c) => c.id === amsId) : null) ??
          loadedCities[0]

        setCities(loadedCities)
        setSelectedCity(preferred.name)
      })
      .catch(() => {})
  }, [language])

  useEffect(() => {
    const sync = () => setMapZoneSelection(readWattaDeliveryZoneSelection())
    sync()
    window.addEventListener('wattaDeliveryZoneUpdated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('wattaDeliveryZoneUpdated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (cities.length === 0 || typeof window === 'undefined') return
    const cityId = readCityIdForProductApi()
    if (cityId == null) return
    const found = cities.find((c) => c.id === cityId)
    if (found) {
      setSelectedCity((prev) => (prev === found.name ? prev : found.name))
    }
  }, [cities, mapZoneSelection])

  const loadBonusBalance = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setBonusBalance(0)
      return
    }
    fetch('/api/orders/bonus', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setBonusBalance(Number(data?.bonusBalance ?? 0))
      })
      .catch(() => setBonusBalance(0))
  }, [])

  useEffect(() => {
    loadBonusBalance()
    const onUser = () => loadBonusBalance()
    window.addEventListener('userChanged', onUser)
    return () => window.removeEventListener('userChanged', onUser)
  }, [loadBonusBalance])

  // --- ВЫЧИСЛЕНИЯ ---
  const uniqueItems = useMemo(
    () =>
      Array.from(new Set(cartItems.map((i) => i.id))).map((id) => {
        const item = cartItems.find((i) => i.id === id)!
        const count = cartItems.filter((i) => i.id === id).length
        return { ...item, quantity: count }
      }),
    [cartItems],
  )

  const filteredRecommendations = recommendations
    .filter(rec => !cartItems.some(cartItem => cartItem.id === rec.id))
    .slice(0, 10)

  const upsellCandidates = useMemo(() => {
    const byCategory = recommendations.filter((item) => {
      const category = item.category.toLowerCase()
      return (
        category.includes('нап') ||
        category.includes('drink') ||
        category.includes('соус') ||
        category.includes('sauce') ||
        category.includes('рол')
      )
    })
    const source = byCategory.length > 0 ? byCategory : filteredRecommendations
    return source.filter(item => !cartItems.some(cartItem => cartItem.id === item.id)).slice(0, 3)
  }, [recommendations, filteredRecommendations, cartItems])

  const mockUpsellItems: MenuItem[] = useMemo(() => ([
    {
      id: -101,
      name: 'Кола 0.5',
      description: 'Освежающий напиток',
      price: 65,
      category: 'Напитки',
      emoji: '🥤',
    },
    {
      id: -102,
      name: 'Спайси соус',
      description: 'Идеально к роллам',
      price: 35,
      category: 'Соусы',
      emoji: '🧴',
    },
    {
      id: -103,
      name: 'Мини-ролл с лососем',
      description: 'Легкий перекус со скидкой',
      price: 119,
      category: 'Роллы',
      emoji: '🍣',
    },
  ]), [])

  // --- РАСЧЕТ ЦЕНЫ (ВОТ ЭТО ВАЖНО ДЛЯ ОШИБОК) ---
  const basePrice = cartItems.reduce(
    (sum, item) => sum + effectiveUnitPrice(item.price, item.promoDiscountPercent),
    0
  )
  const discountAmount = appliedPromo ? Math.round((basePrice * appliedPromo.discount) / 100) : 0
  const finalPrice = basePrice - discountAmount
  const { restaurantPickupAddress } = checkoutSettings
  const selectedCityInfo = useMemo(
    () => cities.find((city) => city.name === selectedCity) ?? null,
    [cities, selectedCity]
  )
  const selectedCityPricePerKm = Number(selectedCityInfo?.pricePerKm ?? 10)

  const zoneMatchesCartCity = Boolean(
    mapZoneSelection &&
      selectedCityInfo &&
      String(mapZoneSelection.cityId) === String(selectedCityInfo.id),
  )

  const deliveryPrice = useMemo(() => {
    if (fulfillment === 'pickup') return 0

    const zone = mapZoneSelection
    const cityMatches =
      zone && selectedCityInfo && String(zone.cityId) === String(selectedCityInfo.id)

    if (cityMatches) {
      if (zone.feeMode === 'free') {
        return finalPrice >= checkoutSettings.freeDeliveryThreshold ? 0 : checkoutSettings.deliveryFee
      }
      if (zone.feeMode === 'flat') {
        return Math.max(0, zone.flatAmount ?? 0)
      }
      if (zone.feeMode === 'standard') {
        if (distanceKm != null) {
          return Math.round(distanceKm * selectedCityPricePerKm * 100) / 100
        }
        return 0
      }
    }

    if (distanceKm == null) return 0
    return Math.round(distanceKm * selectedCityPricePerKm * 100) / 100
  }, [
    fulfillment,
    mapZoneSelection,
    selectedCityInfo,
    finalPrice,
    checkoutSettings.freeDeliveryThreshold,
    checkoutSettings.deliveryFee,
    distanceKm,
    selectedCityPricePerKm,
  ])
  const subtotalWithDelivery = finalPrice + deliveryPrice
  const appliedBonuses = useBonuses ? Math.min(bonusBalance, subtotalWithDelivery) : 0
  const totalToPay = Math.max(0, subtotalWithDelivery - appliedBonuses)

  const pickupAddressDisplay = restaurantPickupAddress || '—'
  const deliveryOriginAddress = useMemo(() => getDeliveryOriginAddress(), [])

  const estimateDistanceFromAddressMock = (from: string, to: string): number => {
    const combined = `${from}|${to}`.trim().toLowerCase()
    const hash = Array.from(combined).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return Math.max(1.5, Math.min(25, (hash % 220) / 10))
  }

  const getDistanceKm = async (origin: string, destination: string): Promise<number> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return estimateDistanceFromAddressMock(origin, destination)
    }

    try {
      const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}` +
        `&destinations=${encodeURIComponent(destination)}&units=metric&key=${encodeURIComponent(apiKey)}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Distance Matrix request failed')
      const data = await response.json()
      const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value
      if (typeof meters !== 'number' || !Number.isFinite(meters)) {
        throw new Error('Distance Matrix response missing distance')
      }
      return Math.round((meters / 1000) * 100) / 100
    } catch {
      return estimateDistanceFromAddressMock(origin, destination)
    }
  }

  const amsterdamSlots = useMemo(
    () => buildAmsterdamSlots(deliveryDay),
    [deliveryDay]
  )

  const submitLiqPayCheckout = (data: string, signature: string) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.liqpay.ua/api/3/checkout'
    form.acceptCharset = 'utf-8'

    const dataInput = document.createElement('input')
    dataInput.type = 'hidden'
    dataInput.name = 'data'
    dataInput.value = data
    form.appendChild(dataInput)

    const signatureInput = document.createElement('input')
    signatureInput.type = 'hidden'
    signatureInput.name = 'signature'
    signatureInput.value = signature
    form.appendChild(signatureInput)

    document.body.appendChild(form)
    form.submit()
  }

  useEffect(() => {
    if (amsterdamSlots.some((s) => s.value === deliverySlot)) return
    setDeliverySlot('asap')
  }, [deliveryDay, amsterdamSlots, deliverySlot])

  useEffect(() => {
    if (fulfillment !== 'delivery') {
      setDistanceKm(null)
      setDistanceError(null)
      setIsCalculatingDistance(false)
      return
    }

    const destinationAddress = formData.address.trim()

    if (!destinationAddress) {
      setDistanceKm(null)
      setDistanceError(null)
      setIsCalculatingDistance(false)
      return
    }

    let cancelled = false
    setIsCalculatingDistance(true)
    setDistanceError(null)

    const timer = setTimeout(async () => {
      try {
        const destination = `${selectedCity}, ${destinationAddress}`.trim()
        const km = await getDistanceKm(deliveryOriginAddress, destination)
        if (!cancelled) setDistanceKm(km)
      } catch {
        if (!cancelled) {
          setDistanceKm(null)
          setDistanceError(cs.distanceMatrixError)
        }
      } finally {
        if (!cancelled) setIsCalculatingDistance(false)
      }
    }, 450)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fulfillment, formData.address, selectedCity, deliveryOriginAddress, language])

  const phoneInvalidHint =
    formData.phone.trim() !== '' && !isValidCheckoutPhone(formData.phone)
  const phoneValid = isValidCheckoutPhone(formData.phone)
  const canSubmitOrder = phoneValid && !isCalculatingDistance


  const upsellItems = upsellCandidates.length > 0 ? upsellCandidates : mockUpsellItems
  const isUpsellQualified = finalPrice >= UPSELL_THRESHOLD && upsellItems.length > 0

  const addItem = (item: MenuItem) => {
    setCartItems((prev) => {
      const currentQty = prev.filter((i) => i.id === item.id).length
      if (currentQty >= 99) {
        toast.error(cs.toastMaxQty)
        return prev
      }
      const newCart = [...prev, { ...item, cartLineId: newCartLineId() }]
      localStorage.setItem('cart', JSON.stringify(newCart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      return newCart
    })
  }

  const removeCartLine = (cartLineId: string) => {
    setCartItems((prev) => {
      const index = prev.findIndex((i) => i.cartLineId === cartLineId)
      if (index < 0) return prev
      const newCart = [...prev]
      newCart.splice(index, 1)
      localStorage.setItem('cart', JSON.stringify(newCart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      return newCart
    })
  }

  const removeAllItem = (itemId: number) => {
    setCartItems((prev) => {
      const newCart = prev.filter((i) => i.id !== itemId)
      localStorage.setItem('cart', JSON.stringify(newCart))
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      return newCart
    })
  }

  const handleAddRecommendation = (item: MenuItem) => {
    addItem(item)
  }

  // --- ФУНКЦИЯ ПРОВЕРКИ ПРОМОКОДА ---
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError(null)

    try {
      const res = await fetch('/api/promo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setAppliedPromo({ code: data.code, discount: data.discount })
        setPromoCode('') 
        toast.success(cs.toastPromoOk.replace('{{code}}', String(data.code)))
      } else {
        setPromoError(data.message || cs.promoInvalidFallback)
        setAppliedPromo(null)
      }
    } catch (e) {
      console.error(e)
      setPromoError(cs.toastPromoNetwork)
    }
  }

  const getDiscountedUpsellItem = (item: MenuItem): MenuItem => ({
    ...item,
    price: Math.max(1, Math.round(item.price * (1 - UPSELL_DISCOUNT_PERCENT / 100))),
  })

  const handleAddUpsell = (item: MenuItem) => {
    addItem(getDiscountedUpsellItem(item))
    toast.success(
      cs.toastUpsellAdded
        .replace('{{name}}', item.name)
        .replace('{{percent}}', String(UPSELL_DISCOUNT_PERCENT)),
    )
  }

  // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
 const handleOrder = async () => {
    if (fulfillment === 'delivery' && !formData.address.trim()) {
      toast.error(cs.toastAddressRequired)
      return
    }
    setIsLoading(true)
    try {
      const authHeaders = getBearerAuthHeaders()
      const promoPart = appliedPromo ? `(ПРОМОКОД: ${appliedPromo.code} -${appliedPromo.discount}%)` : ''
      const fulfillmentPart =
        fulfillment === 'pickup' ? `[${cs.fulfillmentPickup}]` : `[${cs.fulfillmentDelivery}]`
      const dayLabel =
        deliveryDay === 'today' ? 'Сьогодні (Амстердам)' : 'Завтра (Амстердам)'
      const slotLabel =
        deliverySlot === 'asap'
          ? 'Якнайшвидше'
          : amsterdamSlots.find((s) => s.value === deliverySlot)?.label ?? deliverySlot
      const timePart = `[Час (${dayLabel}): ${slotLabel}]`
      const changePart =
        paymentMethod === 'CASH' && formData.needChangeFrom.trim()
          ? `[Нужна сдача с: ${formData.needChangeFrom.trim()} €]`
          : ''
      const sticksPart = `[Приборы: ${formData.sticks} шт, Персоны: ${formData.persons}]`
      const cbPart = formData.noCallbackConfirm ? '[Не перезванивать]' : ''
      const dbPart = formData.noDoorbellRing ? '[Не звонить в дверь]' : ''
      const zoneNote =
        fulfillment === 'delivery' &&
        zoneMatchesCartCity &&
        mapZoneSelection &&
        mapZoneSelection.zoneName.trim()
          ? `[${cs.deliveryFromMap.replace('{{zone}}', mapZoneSelection.zoneName)}]`
          : ''
      const fullComment =
        `${zoneNote} ${changePart} ${fulfillmentPart} ${timePart} ${sticksPart} ${cbPart} ${dbPart} ${formData.comment} ${appliedPromo ? promoPart : ''}`
          .trim()

      const addrDetails: string[] = []
      if (formData.buildingBlock.trim())
        addrDetails.push(`корп./блок: ${formData.buildingBlock.trim()}`)
      if (formData.entrance) addrDetails.push(`під'їзд: ${formData.entrance}`)
      if (formData.floor) addrDetails.push(`поверх: ${formData.floor}`)
      if (formData.apartment) addrDetails.push(`кв.: ${formData.apartment}`)
      if (formData.intercom) addrDetails.push(`домофон: ${formData.intercom}`)

      const orderAddress =
        fulfillment === 'pickup'
          ? `${cs.fulfillmentPickup}: ${pickupAddressDisplay}`
          : [
              `${selectedCity}, ${formData.address.trim()}`,
              addrDetails.length ? addrDetails.join('; ') : '',
            ]
              .filter(Boolean)
              .join('. ')

      const totalAmountNumber = Number(totalToPay)
      const merchandiseTotalNumber = Number(finalPrice)
      const deliveryPriceNumber = Number(deliveryPrice)
      const usedBonusesNumber = Number(appliedBonuses)
      // const needChangeFromValue =
      //   formData.needChangeFrom.trim() === '' ? null : Number(formData.needChangeFrom)

      // 1. Создаем заказ
      const orderItems = uniqueItems
        .filter((item) => Number(item.id) > 0)
        .map((item) => ({
          id: item.id,
          quantity: item.quantity ?? 1,
          price: effectiveUnitPrice(item.price, item.promoDiscountPercent),
        }))

      if (orderItems.length === 0) {
        toast.error(cs.toastOrderFailed)
        setIsLoading(false)
        return
      }

      const orderPayload: Record<string, unknown> = {
        items: orderItems,
        customerName: formData.name,
        phone: formData.phone,
        address: orderAddress,
        comment: fullComment,
        paymentMethod: paymentMethod,
        totalAmount: totalAmountNumber,
        merchandiseTotal: merchandiseTotalNumber,
        deliveryPrice: deliveryPriceNumber,
        usedBonuses: usedBonusesNumber,
        fulfillmentType: fulfillment === 'pickup' ? 'PICKUP' : 'DELIVERY',
        noCallbackConfirm: formData.noCallbackConfirm,
        noDoorbellRing: formData.noDoorbellRing,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(orderPayload),
      })

      if (!response.ok) {
        const errBody = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(
          typeof errBody?.message === 'string' && errBody.message.trim()
            ? errBody.message
            : cs.toastOrderFailed,
        )
      }

      // 2. Получаем данные созданного заказа
      const orderData = await response.json(); // Наша переменная называется orderData

      if (paymentMethod === 'CARD') {
        if (typeof orderData.stripeUrl === 'string' && orderData.stripeUrl) {
          setIsLoading(false)
          window.location.assign(orderData.stripeUrl)
          return
        }
        const liqpay = orderData.liqpay as { data?: string; signature?: string } | undefined
        if (liqpay?.data && liqpay?.signature) {
          setIsLoading(false)
          submitLiqPayCheckout(liqpay.data, liqpay.signature)
          return
        }
      }

      // === Готівка: сторінка успішного замовлення ===
      // (Твой родной, рабочий код очистки)
      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      window.location.href = `/checkout/success?orderId=${orderData.id}`;
      return;

    } catch (error) {
      console.error(error)
      const msg = error instanceof Error && error.message.trim() ? error.message : cs.toastOrderFailed
      toast.error(msg)
    } finally { 
        setIsLoading(false);
    }
}

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBypassingUpsell) {
      await handleOrder()
      return
    }

    if (isUpsellQualified) {
      setIsUpsellModalOpen(true)
      return
    }

    await handleOrder()
  }

  const handleContinueCheckout = async () => {
    setIsUpsellModalOpen(false)
    setIsBypassingUpsell(true)
    try {
      await handleOrder()
    } finally {
      setIsBypassingUpsell(false)
    }
  }

  const cartMetaText = cs.cartMeta
    .replace('{{lines}}', String(uniqueItems.length))
    .replace('{{pieces}}', String(cartItems.length))

  const isEmpty = cartItems.length === 0

  return (
    <div className="watta-cart-page menu-page-web watta-public-page-shell watta-page-bg relative flex w-full min-h-0 max-w-[100vw] flex-1 flex-col overflow-x-hidden font-sans">
      <LogoBackground />

      <div
        className="watta-cart-page__content relative z-10 mx-auto flex w-full min-w-0 max-w-[1200px] flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-8"
      >
        <header className="mb-3 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="home-after-hero-intro-title-web text-[clamp(1.35rem,4.5vw,2rem)] font-bold leading-[1.12] tracking-[-0.02em] text-[#0f2a22] sm:text-3xl">
              {t.cart}
            </h1>
            <p className="mt-0.5 text-[11px] text-[#145142]/65 sm:mt-1 sm:text-sm">{cartMetaText}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#145142]/12 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-white sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />
            {t.auth.back}
          </button>
        </header>

        <>

          {cartItems.length === 0 ? (
            <div role="status" className="flex flex-col pb-2 pt-1">
              <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[22px] border border-[#145142]/18 bg-white/95 p-6 shadow-[0_20px_48px_-28px_rgba(20,81,66,0.4)] backdrop-blur-[2px] sm:rounded-[32px] sm:p-10">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#ff6b35]/12 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#145142]/12 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-2xl opacity-[0.07] sm:text-3xl"
                  aria-hidden
                >
                  <span className="absolute -left-24 -top-2">🍣</span>
                  <span className="absolute -right-20 top-8">🥢</span>
                  <span className="absolute left-8 top-24">🍱</span>
                </div>
                <div className="relative flex flex-col items-center text-center">
                  <span className="mb-4 inline-flex items-center rounded-full border border-[#145142]/30 bg-gradient-to-r from-[#145142]/[0.08] to-[#1a6b58]/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#145142] sm:text-xs">
                    {cs.emptyCartKicker}
                  </span>
                  <div className="mb-4 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-gradient-to-br from-white via-[#f4faf7] to-[#e8f2ed] text-[#145142] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-2 ring-[#145142]/20 sm:mb-5 sm:h-[5.75rem] sm:w-[5.75rem]">
                    <ShoppingBag className="h-9 w-9 sm:h-12 sm:w-12" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                    {cs.empty}
                  </h2>
                  <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-gray-600 sm:mt-3 sm:text-base">
                    {cs.emptyCartHint}
                  </p>
                  <button
                    type="button"
                    onClick={onMenuClick}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl border-2 border-[#145142] bg-white px-6 py-3 text-sm font-bold text-[#145142] shadow-sm transition hover:bg-[#145142]/[0.07] hover:shadow-md active:scale-[0.99] sm:mt-8 sm:px-8 sm:py-3.5"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-[#ff6b35]" strokeWidth={2.25} />
                    {t.navigation.menu}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-1 items-start gap-3 pb-4 sm:gap-5 sm:pb-6 lg:grid-cols-[1fr_minmax(300px,380px)] lg:gap-6">
              <div className="flex min-w-0 flex-col gap-3 sm:gap-5">
                <div className={CHECKOUT_CARD_CLASS}>
                  <ul className="divide-y divide-neutral-100/90">
                    {cartItems.map((item) => (
                      <li
                        key={item.cartLineId ?? `${item.id}-fallback`}
                        className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 sm:gap-3 sm:py-3.5"
                      >
                        <Link
                          href={`/product/${item.id}`}
                          className="-m-1 flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 outline-none transition hover:bg-neutral-50/90 focus-visible:ring-2 focus-visible:ring-[#145142]/25 sm:gap-3"
                        >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-14 sm:w-14">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl sm:text-2xl">
                                {item.emoji}
                              </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-neutral-900 sm:text-sm">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-500 sm:text-xs">
                            {clampPromoPercent(item.promoDiscountPercent) > 0 ? (
                              <>
                                <span className="text-neutral-400 line-through">{item.price} €</span>
                                <span className="ml-1 font-medium text-[#145142]">
                                  {effectiveUnitPrice(item.price, item.promoDiscountPercent)} €
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-neutral-600">{item.price} €</span>
                            )}
                            <span className="text-neutral-400"> / {cs.perPiece}</span>
                          </p>
                        </div>
                        </Link>
                        <div className="flex shrink-0 flex-col items-end gap-1 sm:gap-1.5">
                          <div className="flex items-center gap-1">
                            <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-px sm:rounded-lg sm:p-0.5">
                              <button
                                type="button"
                                onClick={() => item.cartLineId && removeCartLine(item.cartLineId)}
                                className="flex h-7 w-7 items-center justify-center rounded text-[#145142] transition hover:bg-white sm:h-8 sm:w-8 sm:rounded-md"
                                aria-label="-1"
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                              </button>
                              <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums text-neutral-900 sm:min-w-[1.75rem] sm:text-sm">
                                1
                              </span>
                              <button
                                type="button"
                                onClick={() => addItem(item)}
                                className="flex h-7 w-7 items-center justify-center rounded bg-[#145142] text-white transition hover:bg-[#0f3d32] sm:h-8 sm:w-8 sm:rounded-md"
                                aria-label="+1"
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAllItem(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-600 sm:h-8 sm:w-8"
                              aria-label={a.removeLine}
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                            </button>
                          </div>
                          <p className="text-[13px] font-bold tabular-nums text-[#145142] sm:text-base sm:text-neutral-900">
                            {effectiveUnitPrice(item.price, item.promoDiscountPercent).toFixed(2)} €
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-200/90 pt-2.5 text-xs sm:mt-4 sm:pt-3 sm:text-sm">
                    <span className="font-semibold text-neutral-600">{cs.subtotalLabel}</span>
                    <span className="text-base font-bold tabular-nums text-[#145142] sm:text-lg">
                      {finalPrice.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {filteredRecommendations.length > 0 ? (
                  <section className={CHECKOUT_CARD_CLASS} aria-labelledby="cart-recs-heading">
                    <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                      <div className="min-w-0">
                        <h2 id="cart-recs-heading" className={CHECKOUT_SECTION_TITLE_CLASS}>
                          {cs.addToOrder}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-neutral-500 sm:mt-1 sm:text-sm">{pd.recommendsHint}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => scrollRecRail(-1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[#145142] transition hover:border-[#145142]/30 hover:bg-neutral-50 sm:h-9 sm:w-9"
                          aria-label={cs.recScrollPrev}
                        >
                          <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollRecRail(1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[#145142] transition hover:border-[#145142]/30 hover:bg-neutral-50 sm:h-9 sm:w-9"
                          aria-label={cs.recScrollNext}
                        >
                          <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                    <div id="cart-recommendations-rail" className="relative -mx-1">
                      <div
                        ref={recScrollRef}
                        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
                      >
                        {filteredRecommendations.map((item) => (
                          <div
                            key={item.id}
                            className="snap-start pl-0 first:pl-1 last:pr-1 sm:first:pl-2 sm:last:pr-2"
                          >
                            <WattaMenuProductCard
                              variant="grid"
                              className="w-[min(200px,68vw)] shrink-0 sm:w-[min(240px,72vw)]"
                              product={{
                                id: item.id,
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                emoji: item.emoji,
                                imageUrl: item.imageUrl,
                                isTop: item.isTop,
                                promoDiscountPercent: item.promoDiscountPercent,
                              }}
                              subtitleLine={
                                parseProductSpecsFromDescription(
                                  item.description,
                                  pd.weightFallback,
                                  pd.piecesFallback,
                                  language as WattaLanguage,
                                ).weightLine
                              }
                              onAddToCart={() => handleAddRecommendation(item)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:sticky lg:top-[10.5rem] lg:z-20 lg:self-start">
                <form
                  id={CART_CHECKOUT_FORM_ID}
                  className="flex min-w-0 flex-col gap-3 sm:gap-4"
                  onSubmit={handleCheckoutSubmit}
                  noValidate
                >
                {/* 1. Контактные данные */}
                <div className={CHECKOUT_CARD_CLASS}>
                   <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-3`}>{cs.contactDetails}</h2>
                   <div className="flex flex-col gap-2.5 sm:gap-3">
                      <div className="min-w-0">
                        <label htmlFor="cart-checkout-name" className={CHECKOUT_FIELD_LABEL_CLASS}>
                          {t.auth.name} *
                        </label>
                        <input
                          id="cart-checkout-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          enterKeyHint="next"
                          placeholder={cs.namePlaceholder}
                          className={CHECKOUT_INPUT_CLASS}
                          maxLength={100}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <label htmlFor="cart-checkout-phone" className={CHECKOUT_FIELD_LABEL_CLASS}>
                          {t.auth.phone} *
                        </label>
                        <input
                          id="cart-checkout-phone"
                          name="tel"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          enterKeyHint="done"
                          placeholder={cs.phonePlaceholder}
                          className={`${CHECKOUT_INPUT_CLASS} ${
                            phoneInvalidHint ? 'ring-2 ring-red-400 focus:ring-red-500' : ''
                          }`}
                          maxLength={CHECKOUT_PHONE_INPUT_MAX_LEN}
                          value={formData.phone}
                          aria-invalid={phoneInvalidHint}
                          aria-describedby={
                            phoneInvalidHint ? 'cart-checkout-phone-error' : 'cart-checkout-phone-hint'
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone: sanitizeCheckoutPhoneInput(e.target.value),
                            })
                          }
                          required
                        />
                        {phoneInvalidHint ? (
                          <p id="cart-checkout-phone-error" className="pl-1 text-sm font-medium text-red-600">
                            {cs.invalidPhone}
                          </p>
                        ) : (
                          <p
                            id="cart-checkout-phone-hint"
                            className="pl-1 text-[10px] leading-snug text-[#145142]/60 sm:text-[11px]"
                          >
                            {cs.phoneHint}
                          </p>
                        )}
                      </div>
                   </div>
                </div>
                {/* 2. Доставка / самовивіз */}
                <div className={`${CHECKOUT_CARD_CLASS} relative z-10`}>
                   <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className={CHECKOUT_SECTION_TITLE_CLASS}>{t.delivery}</h2>
                      {fulfillment === 'delivery' && (
                        <span
                          className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-[#145142] sm:text-sm"
                          title={cs.deliveryZoneLabel}
                          role="note"
                        >
                          {cs.deliveryZoneLabel}{' '}
                          <span className="text-neutral-400" aria-hidden>
                            ⓘ
                          </span>
                        </span>
                      )}
                   </div>

                   <div
                     className="mb-4 flex w-full min-w-0 gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 sm:mb-5"
                     role="group"
                     aria-label={`${cs.fulfillmentDelivery} / ${cs.fulfillmentPickup}`}
                   >
                     <button
                       type="button"
                       onClick={() => setFulfillment('delivery')}
                       className={`relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:py-2.5 sm:text-sm md:text-[15px] ${
                         fulfillment === 'delivery'
                           ? 'bg-white text-[#145142] shadow-sm'
                           : 'text-neutral-500 hover:text-[#145142]'
                       }`}
                     >
                       <Truck className="h-4 w-4 shrink-0" />
                       {cs.fulfillmentDelivery}
                     </button>
                     <button
                       type="button"
                       onClick={() => setFulfillment('pickup')}
                       className={`relative z-10 flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:py-2.5 sm:text-sm md:text-[15px] ${
                         fulfillment === 'pickup'
                           ? 'bg-white text-[#145142] shadow-sm'
                           : 'text-neutral-500 hover:text-[#145142]'
                       }`}
                     >
                       <Store className="h-4 w-4 shrink-0" />
                       {cs.fulfillmentPickup}
                     </button>
                   </div>

                   {fulfillment === 'delivery' ? (
                     <>
                       <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2" role="group" aria-label={cs.citiesGroupAria}>
                         {cities.map(city => (
                             <button 
                               key={city.id}
                               type="button"
                               onClick={() => setSelectedCity(city.name)}
                               className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 sm:text-sm ${
                                 selectedCity === city.name
                                   ? 'border-[#145142] bg-[#145142] text-white'
                                   : 'border-transparent bg-neutral-100 text-neutral-600 hover:border-[#145142]/20 hover:bg-white hover:text-[#145142]'
                               }`}
                             >
                               {city.name}
                             </button>
                          ))}
                       </div>

                       <input 
                          type="text" 
                          placeholder={cs.streetPlaceholder}
                          className={`${CHECKOUT_INPUT_CLASS} mb-3 sm:mb-4`}
                          maxLength={STREET_MAX}
                          value={formData.address} 
                          onChange={e =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          required 
                          autoComplete="street-address"
                       />

                        <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                        <input
                        type="text" 
                        inputMode="numeric" 
                        pattern="[0-9]*"
                        placeholder={cs.entrancePlaceholder}
                        className={CHECKOUT_INPUT_CLASS}
                        value={formData.entrance}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({ ...formData, entrance: val });
                        }}
                      />
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={cs.floorPlaceholder}
                            className={CHECKOUT_INPUT_CLASS}
                            min={0}
                            max={9999}
                            maxLength={4}
                            value={formData.floor}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData({ ...formData, floor: val });
                            }}
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={cs.apartmentPlaceholder}
                            className={CHECKOUT_INPUT_CLASS}
                            min={0}
                            max={9999}
                            maxLength={4}
                            value={formData.apartment}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData({ ...formData, apartment: val });
                            }}
                          />
                          <input
                            type="text"
                            placeholder={cs.buildingPlaceholder}
                            className={CHECKOUT_INPUT_CLASS}
                            value={formData.buildingBlock}
                            onChange={e => {
                              // Здесь оставляем текст, но ограничиваем длину 4 символами
                              const val = e.target.value.slice(0, 4);
                              setFormData({ ...formData, buildingBlock: val });
                            }}
                          />
                        </div>

                       <div className="flex flex-col gap-3">
                          <label className="flex items-start gap-3 cursor-pointer group">
                             <input
                               type="checkbox"
                               className="mt-0.5 w-5 h-5 shrink-0 accent-[#145142] rounded border-[#145142]/40 focus:ring-2 focus:ring-[#ff6b35]/50"
                               checked={formData.noCallbackConfirm}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noCallbackConfirm: e.target.checked,
                                 })
                               }
                             />
                             <span className="text-neutral-600 group-hover:text-[#145142]">{cs.optNoCallback}</span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                             <input
                               type="checkbox"
                               className="mt-0.5 w-5 h-5 shrink-0 accent-[#145142] rounded border-[#145142]/40 focus:ring-2 focus:ring-[#ff6b35]/50"
                               checked={formData.noDoorbellRing}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noDoorbellRing: e.target.checked,
                                 })
                               }
                             />
                             <span className="text-neutral-600 group-hover:text-[#145142]">{cs.optNoDoorbell}</span>
                          </label>
                       </div>
                     </>
                   ) : (
                     <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                       <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#145142]">
                         {cs.pickupAtRestaurant}
                       </p>
                       <div className="flex items-start gap-3">
                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#145142] text-white">
                           <MapPin className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-semibold leading-snug text-neutral-900">{pickupAddressDisplay}</p>
                           <p className="mt-1 text-sm text-neutral-600">{cs.pickupSubtitle}</p>
                         </div>
                       </div>
                     </div>
                   )}
                </div>

                {/* 3. Время доставки (Europe/Amsterdam) */}
                <div className={CHECKOUT_CARD_CLASS}>
                   <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-1`}>{cs.deliveryTimeTitle}</h2>
                   <p className="mb-5 text-xs text-neutral-500">{cs.deliveryTimeHint}</p>
                   <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="min-w-0">
                         <label className="mb-1 block text-sm text-neutral-500">{cs.slotDayLabel}</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={deliveryDay}
                           onChange={(e) =>
                             setDeliveryDay(e.target.value as DeliveryDay)
                           }
                         >
                            <option value="today">{cs.dayToday}</option>
                            <option value="tomorrow">{cs.dayTomorrow}</option>
                         </select>
                      </div>
                      <div className="min-w-0">
                         <label className="mb-1 block text-sm text-neutral-500">{cs.slotTimeLabel}</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={deliverySlot}
                           onChange={(e) => setDeliverySlot(e.target.value)}
                         >
                            {amsterdamSlots.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                         </select>
                      </div>
                   </div>
                </div>

                {/* 4. Комментарий и приборы */}
                <div className={CHECKOUT_CARD_CLASS}>
                   <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-4`}>{cs.orderDetailsTitle}</h2>
                   <div className="flex flex-col gap-4 mb-4">
                      <div>
                         <label className="mb-1 block text-sm text-neutral-500">{cs.partySizeLabel}</label>
                         <div className="flex flex-col gap-2">
                           <input
                             type="range"
                             min={1}
                             max={99}
                             value={Math.min(99, Math.max(1, formData.persons))}
                             onChange={(e) =>
                               setFormData({
                                 ...formData,
                                 persons: Number(e.target.value),
                               })
                             }
                             className="w-full accent-[#145142] h-2 rounded-full"
                           />
                           <input
                             type="number"
                             min={1}
                             max={99}
                             className={CHECKOUT_INPUT_CLASS + ' font-semibold'}
                             value={formData.persons}
                             onChange={(e) => {
                               const raw = parseInt(e.target.value, 10)
                               const v = Number.isFinite(raw)
                                 ? Math.min(99, Math.max(1, raw))
                                 : 1
                               setFormData({ ...formData, persons: v })
                             }}
                           />
                         </div>
                      </div>
                      <div>
                         <label className="mb-1 block text-sm text-neutral-500">{cs.chopsticksLabel}</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold cursor-pointer`}
                           value={formData.sticks}
                           onChange={(e) =>
                             setFormData({
                               ...formData,
                               sticks: Number(e.target.value),
                             })
                           }
                         >
                            {Array.from({ length: 21 }, (_, i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                         </select>
                      </div>
                   </div>
                   <textarea 
                      placeholder={cs.commentPlaceholder}
                      className={`${CHECKOUT_INPUT_CLASS} h-24 resize-none min-h-[5.5rem] sm:h-32 sm:min-h-[8rem]`}
                      maxLength={COMMENT_MAX}
                      value={formData.comment} 
                      onChange={e =>
                        setFormData({
                          ...formData,
                          comment: e.target.value.slice(0, COMMENT_MAX),
                        })
                      }
                   />
                   <p className="mt-1 text-right text-xs text-neutral-400">
                     {formData.comment.length}/{COMMENT_MAX}
                   </p>
                </div>
                  
                  {/* 5. Блок Оплаты */}
                  <div className={CHECKOUT_CARD_CLASS}>
                    <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-4`}>{cs.paymentMethodTitle}</h2>
                    
                    <div className="flex flex-col gap-3">
                      <label
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                          paymentMethod === 'CASH'
                            ? 'border-[#145142] bg-[#145142]/[0.06]'
                            : 'border-neutral-200 hover:border-[#145142]/25 hover:bg-neutral-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === 'CASH' ? 'border-[#145142]' : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'CASH' && (
                            <div className="w-2.5 h-2.5 bg-[#145142] rounded-full" />
                          )}
                        </div>
                        <span className="font-semibold text-neutral-800">{cs.payCash}</span>
                        <input
                          type="radio"
                          name="payment"
                          className="hidden"
                          checked={paymentMethod === 'CASH'}
                          onChange={() => setPaymentMethod('CASH')}
                        />
                      </label>
                      {paymentMethod === 'CASH' && (
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder={cs.changeFromPlaceholder}
                          className={CHECKOUT_INPUT_CLASS}
                          value={formData.needChangeFrom}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              needChangeFrom: e.target.value.replace(/\D/g, '').slice(0, 4),
                            })
                          }
                        />
                      )}

                      <label
                        onClick={() => setPaymentMethod('CARD')}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                          paymentMethod === 'CARD'
                            ? 'border-[#145142] bg-[#145142]/[0.06]'
                            : 'border-neutral-200 hover:border-[#145142]/25 hover:bg-neutral-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            paymentMethod === 'CARD' ? 'border-[#145142]' : 'border-gray-300'
                          }`}>
                            {paymentMethod === 'CARD' && (
                              <div className="w-2.5 h-2.5 bg-[#145142] rounded-full" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-800">{cs.payCard}</span>
                            <span className="text-xs text-neutral-500">{cs.payCardHint}</span>
                          </div>
                          <input
                            type="radio"
                            name="payment"
                            className="hidden"
                            checked={paymentMethod === 'CARD'}
                            onChange={() => setPaymentMethod('CARD')}
                          />
                        </label>
                      </div>
                    </div>
                    {/* 6. Блок Итого (Объединенный с Промокодом) */}
                    <div className={`${CHECKOUT_CARD_CLASS} flex flex-col gap-5`}>
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <h3 className="mb-3 text-base font-semibold text-[#145142]">{cs.promoCodeTitle}</h3>
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder={cs.promoPlaceholder}
                            className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[15px] font-semibold uppercase text-[#145142] outline-none placeholder:font-normal placeholder:normal-case focus:ring-2 focus:ring-[#145142]/30"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            className="shrink-0 rounded-lg bg-[#145142] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3d34]"
                          >
                            OK
                          </button>
                        </div>
                        {promoError ? (
                          <p className="mt-2 rounded-lg bg-red-50 p-2 text-center text-sm font-medium text-red-600">
                            {promoError}
                          </p>
                        ) : null}
                        {appliedPromo ? (
                          <div className="mt-3 rounded-lg bg-[#145142]/10 p-2 text-center text-sm font-semibold text-[#145142]">
                            <span>
                              {cs.promoApplied.replace('{{code}}', appliedPromo.code)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="h-px w-full bg-neutral-200" />
                      <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between text-sm text-neutral-600">
                            <span>{cs.subtotalLabel}</span>
                            <span className="tabular-nums font-medium text-neutral-900">{basePrice} €</span>
                          </div>
                          {appliedPromo && (
                            <div className="flex items-center justify-between text-sm font-semibold text-[#145142]">
                              <span>
                                {cs.discountPrefix} ({appliedPromo.code})
                              </span>
                              <span className="tabular-nums">−{discountAmount} €</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3 text-sm text-neutral-600">
                            <span>
                              {fulfillment === 'pickup'
                                ? cs.fulfillmentPickup
                                : t.delivery}
                            </span>
                            <span
                              className={`text-right font-medium tabular-nums ${
                                fulfillment === 'delivery' && deliveryPrice === 0
                                  ? 'text-[#145142]'
                                  : 'text-neutral-800'
                              }`}
                            >
                              {fulfillment === 'pickup'
                                ? '—'
                                : deliveryPrice === 0
                                  ? cs.deliveryFree
                                  : `${deliveryPrice} €`}
                            </span>
                          </div>
                          {fulfillment === 'delivery' && (
                            <div className="-mt-1 space-y-1 text-xs">
                              {zoneMatchesCartCity && mapZoneSelection ? (
                                <p className="font-semibold text-[#145142]">
                                  {cs.deliveryFromMap.replace('{{zone}}', mapZoneSelection.zoneName)}
                                </p>
                              ) : null}
                              {zoneMatchesCartCity &&
                              mapZoneSelection?.feeMode === 'standard' &&
                              distanceKm == null ? (
                                <p className="text-amber-800">{cs.deliveryZoneStandardHint}</p>
                              ) : null}
                              {isCalculatingDistance ? (
                                <p className="text-neutral-500">{cs.calculatingDistance}</p>
                              ) : distanceKm != null ? (
                                <p className="text-[#145142]">
                                  {cs.distanceBreakdown
                                    .replace('{{km}}', distanceKm.toFixed(2))
                                    .replace('{{rate}}', selectedCityPricePerKm.toFixed(2))
                                    .replace('{{sum}}', deliveryPrice.toFixed(2))}
                                </p>
                              ) : (
                                <p className="text-neutral-500">{cs.enterAddressForDeliveryFee}</p>
                              )}
                              {distanceError ? <p className="text-red-600">{distanceError}</p> : null}
                            </div>
                          )}
                          {bonusBalance > 0 && (
                            <div className="rounded-lg border border-[#145142]/15 bg-[#145142]/[0.04] p-3">
                              <label className="flex cursor-pointer items-center justify-between gap-3">
                                <span className="text-sm font-medium text-[#145142]">
                                  {cs.bonusAvailableLabel.replace(
                                    '{{amount}}',
                                    bonusBalance.toFixed(2),
                                  )}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={useBonuses}
                                  onChange={(e) => setUseBonuses(e.target.checked)}
                                  className="h-4 w-4 accent-[#145142]"
                                />
                              </label>
                              {useBonuses && (
                                <p className="mt-2 text-sm text-[#145142]">
                                  {cs.bonusDeductLine.replace(
                                    '{{amount}}',
                                    appliedBonuses.toFixed(2),
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                          {useBonuses && appliedBonuses > 0 && (
                            <div className="flex items-center justify-between text-sm font-semibold text-[#145142]">
                              <span>{cs.bonusSpentLabel}</span>
                              <span className="tabular-nums">−{appliedBonuses.toFixed(2)} €</span>
                            </div>
                          )}
                          <div className="my-1 h-px w-full bg-neutral-200" />
                          <div className="flex items-end justify-between gap-3">
                            <span className="text-base font-bold text-neutral-900 sm:text-lg">{cs.total}</span>
                            <span className="text-xl font-bold tabular-nums text-[#145142] sm:text-2xl">
                              {totalToPay.toFixed(2)} €
                            </span>
                          </div>
                          <button
                            disabled={isLoading || !canSubmitOrder}
                            type="submit"
                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#145142] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3d34] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/40 sm:h-12 sm:text-base"
                          >
                            {isLoading ? cs.processing : cs.order}
                          </button>
                          <p className="px-2 text-center text-[11px] leading-snug text-neutral-400">
                            {cs.privacyConsent}
                          </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
        </>
      </div>

      {isUpsellModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-[#145142]/15 overflow-hidden">
            <div className="bg-[#145142] px-6 py-5 text-white">
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{cs.upsellTitle}</h3>
              <p className="mt-1 text-sm text-white/90 sm:text-base">
                {cs.upsellLead.replace('{{threshold}}', String(UPSELL_THRESHOLD))}
              </p>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upsellItems.map((item) => {
                const discounted = getDiscountedUpsellItem(item)
                return (
                  <div key={item.id} className="rounded-2xl border border-[#145142]/15 p-4 bg-[#F9FAFB] flex flex-col">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-2xl">{item.emoji}</div>
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-[#ff6b35]/15 text-[#ff6b35]">
                        -{UPSELL_DISCOUNT_PERCENT}%
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-semibold leading-tight text-neutral-900">{item.name}</h4>
                    <p className="mt-1 min-h-[2.5rem] text-sm text-neutral-500">
                      {item.description || cs.upsellOfferFallback}
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-[#145142]">{discounted.price} €</span>
                        <span className="text-sm text-gray-400 line-through">{item.price} €</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddUpsell(item)}
                      className="mt-4 h-10 rounded-lg bg-[#145142] text-sm font-semibold text-white transition hover:bg-[#0f3d34]"
                    >
                      {cs.upsellAddToCart}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="px-5 sm:px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={handleContinueCheckout}
                className="h-12 w-full rounded-lg bg-[#145142] text-base font-semibold text-white shadow-sm transition hover:bg-[#0f3d34]"
              >
                {cs.upsellContinue}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}