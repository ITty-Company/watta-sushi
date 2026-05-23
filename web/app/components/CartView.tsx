'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import Link from 'next/link'
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
  Clock,
  User,
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
  buildDeliveryDateOptions,
  DELIVERY_BOOKING_DAYS_AHEAD,
  getAmsterdamTodayKey,
  getMaxDeliveryDateKey,
  hasBookableSlotsToday,
  addDaysToDateKey,
} from '@/lib/deliverySlotsAmsterdam'
import type { WattaLanguage } from '@/lib/i18n/language'
import toast from 'react-hot-toast'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { getAuthUrl, isUserLoggedIn } from '@/lib/authGate'
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
import {
  getCartTotalPieceCount,
  lineQuantity,
  invalidateCartMemoryCache,
  readCartFromStorage,
  writeCartToStorage,
  refreshCartProductMediaFromCatalog,
} from '@/lib/cartStorage'
import {
  cartLineChargeUnitPrice,
  cartUpsellSaleUnitPrice,
  mergeCartUpsellOffersFromTiers,
  pickQualifiedCartUpsellTiers,
  type CartUpsellTierDto,
} from '@/lib/cartUpsell'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
import { useWattaCatalogSync } from '@/hooks/useWattaCatalogSync'
import { fetchPublicApiFresh } from '@/lib/publicApiFetch'
import {
  fetchDeliveryCheck,
  isDeliveryFeeAvailable,
  isDeliveryOutsideArea,
  type DeliveryCheckResult,
} from '@/lib/deliveryCheckClient'

const CART_CHECKOUT_FORM_ID = 'watta-cart-checkout-form'

const CHECKOUT_INPUT_CLASS =
  'w-full min-w-0 rounded-lg border border-neutral-200/90 bg-white px-2.5 py-1.5 text-[12px] leading-snug text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-[#145142]/40 focus:ring-2 focus:ring-[#145142]/12 md:py-2 md:text-[13px] md:focus:ring-[#145142]/18'
const CHECKOUT_CARD_CLASS =
  'watta-cart-card watta-cart-checkout-card rounded-xl border border-[#145142]/10 bg-white/95 p-3 shadow-[0_1px_3px_rgba(20,81,66,0.06)]'
const CHECKOUT_SECTION_TITLE_CLASS =
  'text-[13px] font-bold tracking-tight text-[#145142] md:text-sm'
const CHECKOUT_FIELD_LABEL_CLASS =
  'mb-1 block text-[11px] font-semibold text-[#145142]/80 sm:text-xs'
/** Під'їзд / поверх / кв.: лише цифри, до 1000 символів кожне */
const DIGIT_ADDR_MAX = 4
const STREET_MAX = 100
const POSTAL_MAX = 12
const BUILDING_BLOCK_MAX = 4
const COMMENT_MAX = 500
const DELIVERY_CHECK_DEBOUNCE_MS = 650

function deliverySlotLocale(language: WattaLanguage): string {
  const map: Record<WattaLanguage, string> = {
    uk: 'uk-UA',
    ru: 'ru-RU',
    en: 'en-GB',
    nl: 'nl-NL',
  }
  return map[language] ?? 'en-GB'
}

interface CheckoutSiteSettings {
  freeDeliveryThreshold: number
  deliveryFee: number
  restaurantPickupAddress: string
  cardOnlineAvailable: boolean
}

const defaultCheckoutSettings: CheckoutSiteSettings = {
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
  restaurantPickupAddress: '',
  cardOnlineAvailable: false,
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
  /** Знижка € з upsell (лише при додаванні з блоку спецпропозицій) */
  cartUpsellDiscountEur?: number
  /** Стабільний ключ рядка в кошику */
  cartLineId?: string
}

function newCartLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

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

function CheckoutSectionHead({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
}) {
  return (
    <div className="watta-cart-checkout-head">
      <span className="watta-cart-checkout-head__ico" aria-hidden>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <h2 className="watta-cart-checkout-head__title">{title}</h2>
    </div>
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
  const router = useInstantRouter()
  const { t, language, getLocalized } = useLanguage()
  const pd = t.productDetail
  const cs = t.cartSection
  const d = t.deliveryPage
  const a = t.siteAria
  const recScrollRef = useRef<HTMLDivElement>(null)

  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [cartUpsellTiers, setCartUpsellTiers] = useState<CartUpsellTierDto[]>([])

  // Состояния для оформления
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '', 
    address: '',
    postalCode: '',
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
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)

  //---Оплата---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [deliveryCheckResult, setDeliveryCheckResult] = useState<DeliveryCheckResult | null>(null)
  const [isDeliveryChecking, setIsDeliveryChecking] = useState(false)
  const deliveryCheckRequestRef = useRef(0)
  const [deliveryDateKey, setDeliveryDateKey] = useState('')
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

  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.replace(getAuthUrl('/cart'))
    }
  }, [router])

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const cardOnlineAvailable = data.cardOnlineAvailable === true
        setCheckoutSettings({
          freeDeliveryThreshold: Number(data.freeDeliveryThreshold) || defaultCheckoutSettings.freeDeliveryThreshold,
          deliveryFee: Number(data.deliveryFee) || defaultCheckoutSettings.deliveryFee,
          restaurantPickupAddress: String(data.restaurantPickupAddress ?? '').trim(),
          cardOnlineAvailable,
        })
        if (!cardOnlineAvailable) {
          setPaymentMethod('CASH')
        }
      })
      .catch(() => {})
  }, [])

  const syncCartFromStorage = useCallback(() => {
    setCartItems(readCartFromStorage() as MenuItem[])
  }, [])

  useEffect(() => {
    syncCartFromStorage()
    void refreshCartProductMediaFromCatalog().then(syncCartFromStorage)
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

  const loadCartUpsellTiers = useCallback((fresh = false) => {
    const cityId = typeof window !== 'undefined' ? readCityIdForProductApi() : null
    const upsellQ = new URLSearchParams()
    if (cityId != null && cityId > 0) upsellQ.set('cityId', String(cityId))
    const fetchFn = fresh ? fetchPublicApiFresh : fetch
    void fetchFn(getApiUrl(`/api/cart-upsell?${upsellQ.toString()}`))
      .then((res) => (res.ok ? res.json() : { tiers: [] }))
      .then((data: { tiers?: CartUpsellTierDto[] }) => {
        setCartUpsellTiers(Array.isArray(data?.tiers) ? data.tiers : [])
      })
      .catch(() => setCartUpsellTiers([]))
  }, [])

  useEffect(() => {
    loadCartUpsellTiers(false)
    if (typeof window === 'undefined') return undefined
    const onCity = () => loadCartUpsellTiers(true)
    window.addEventListener('cityChanged', onCity)
    return () => window.removeEventListener('cityChanged', onCity)
  }, [loadCartUpsellTiers])

  useWattaCatalogSync(() => loadCartUpsellTiers(true), ['cartUpsell'])

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
    () => cartItems.map((item) => ({ ...item, quantity: lineQuantity(item) })),
    [cartItems],
  )

  // --- РАСЧЕТ ЦЕНЫ (ВОТ ЭТО ВАЖНО ДЛЯ ОШИБОК) ---
  const basePrice = cartItems.reduce(
    (sum, item) => sum + cartLineChargeUnitPrice(item) * lineQuantity(item),
    0,
  )
  const discountAmount = appliedPromo ? Math.round((basePrice * appliedPromo.discount) / 100) : 0
  const finalPrice = basePrice - discountAmount

  const qualifiedUpsellTiers = useMemo(
    () => pickQualifiedCartUpsellTiers(cartUpsellTiers, finalPrice),
    [cartUpsellTiers, finalPrice],
  )

  const tierUpsellItems = useMemo((): (MenuItem & { upsellDiscountEur?: number })[] => {
    const merged = mergeCartUpsellOffersFromTiers(qualifiedUpsellTiers)
    if (merged.length === 0) return []

    return merged
      .map(({ product: p, discountEur }) => {
        const cat = p.category as Record<string, unknown> | undefined
        const promo =
          typeof p.promoDiscountPercent === 'number'
            ? p.promoDiscountPercent
            : Number(p.promoDiscountPercent) || 0
        return {
          id: Number(p.id),
          name: getLocalized(p as never, 'name'),
          description: getLocalized(p as never, 'description') || '',
          price: Number(p.price),
          category:
            getMenuCategoryDisplayName((cat || {}) as Record<string, unknown>, language, t.categories) ||
            '',
          emoji: '🍱',
          imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
          promoDiscountPercent: promo,
          upsellDiscountEur: discountEur,
        }
      })
      .filter((item) => Number.isFinite(item.id) && item.id > 0)
      .filter((item) => !cartItems.some((c) => c.id === item.id))
  }, [qualifiedUpsellTiers, cartItems, getLocalized, language, t.categories])

  const { restaurantPickupAddress } = checkoutSettings
  const selectedCityInfo = useMemo(
    () => cities.find((city) => city.name === selectedCity) ?? null,
    [cities, selectedCity]
  )
  const zoneMatchesCartCity = Boolean(
    mapZoneSelection &&
      selectedCityInfo &&
      String(mapZoneSelection.cityId) === String(selectedCityInfo.id),
  )

  const deliveryPrice = useMemo(() => {
    if (fulfillment === 'pickup') return 0

    if (
      deliveryCheckResult &&
      isDeliveryFeeAvailable(deliveryCheckResult.status) &&
      deliveryCheckResult.estimatedDeliveryFee != null
    ) {
      return deliveryCheckResult.estimatedDeliveryFee
    }

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
    }

    return 0
  }, [
    fulfillment,
    deliveryCheckResult,
    mapZoneSelection,
    selectedCityInfo,
    finalPrice,
    checkoutSettings.freeDeliveryThreshold,
    checkoutSettings.deliveryFee,
  ])
  const distanceKm =
    deliveryCheckResult?.distanceKm != null && !Number.isNaN(deliveryCheckResult.distanceKm)
      ? deliveryCheckResult.distanceKm
      : null
  const subtotalWithDelivery = finalPrice + deliveryPrice
  const appliedBonuses = useBonuses ? Math.min(bonusBalance, subtotalWithDelivery) : 0
  const totalToPay = Math.max(0, subtotalWithDelivery - appliedBonuses)

  const pickupAddressDisplay = restaurantPickupAddress || '—'

  const deliveryFeeReady =
    fulfillment !== 'delivery' ||
    (deliveryCheckResult != null &&
      isDeliveryFeeAvailable(deliveryCheckResult.status) &&
      deliveryCheckResult.estimatedDeliveryFee != null)

  const deliveryOutsideArea =
    fulfillment === 'delivery' &&
    deliveryCheckResult != null &&
    isDeliveryOutsideArea(deliveryCheckResult.status)

  useEffect(() => {
    const today = getAmsterdamTodayKey()
    setDeliveryDateKey((prev) => {
      if (!prev) return today
      if (prev < today) return today
      const max = getMaxDeliveryDateKey()
      if (prev > max) return max
      return prev
    })
  }, [])

  const deliveryDateOptions = useMemo(
    () =>
      buildDeliveryDateOptions(deliverySlotLocale(language as WattaLanguage), {
        today: cs.dayToday,
        tomorrow: cs.dayTomorrow,
      }),
    [language, cs.dayToday, cs.dayTomorrow],
  )

  const amsterdamSlots = useMemo(
    () => buildAmsterdamSlots(deliveryDateKey || getAmsterdamTodayKey(), cs.slotAsap),
    [deliveryDateKey, cs.slotAsap],
  )

  const minDeliveryDate = getAmsterdamTodayKey()
  const maxDeliveryDate = getMaxDeliveryDateKey()

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
    if (!deliveryDateKey) return
    if (amsterdamSlots.some((s) => s.value === deliverySlot)) return
    setDeliverySlot(amsterdamSlots[0]?.value ?? 'asap')
  }, [deliveryDateKey, amsterdamSlots, deliverySlot])

  useEffect(() => {
    if (!deliveryDateKey) return
    const today = getAmsterdamTodayKey()
    if (deliveryDateKey !== today) return
    if (hasBookableSlotsToday()) return
    setDeliveryDateKey(addDaysToDateKey(today, 1))
  }, [deliveryDateKey])

  useEffect(() => {
    if (fulfillment !== 'delivery') {
      setDeliveryCheckResult(null)
      setIsDeliveryChecking(false)
      return
    }

    const street = formData.address.trim()
    const postal = formData.postalCode.trim()
    const cityId = selectedCityInfo?.id

    if (!street || postal.length < 4 || !cityId) {
      setDeliveryCheckResult(null)
      setIsDeliveryChecking(false)
      return
    }

    let cancelled = false
    setIsDeliveryChecking(true)

    const timer = setTimeout(async () => {
      const reqId = ++deliveryCheckRequestRef.current
      try {
        const data = await fetchDeliveryCheck(cityId, postal, street)
        if (cancelled || reqId !== deliveryCheckRequestRef.current) return
        setDeliveryCheckResult(data)
      } catch {
        if (!cancelled && reqId === deliveryCheckRequestRef.current) {
          setDeliveryCheckResult({ status: 'server_error' })
        }
      } finally {
        if (!cancelled && reqId === deliveryCheckRequestRef.current) {
          setIsDeliveryChecking(false)
        }
      }
    }, DELIVERY_CHECK_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fulfillment, formData.address, formData.postalCode, selectedCityInfo?.id])

  useEffect(() => {
    if (fulfillment !== 'delivery') return
    setDeliveryCheckResult(null)
  }, [selectedCity, fulfillment])

  const phoneInvalidHint =
    formData.phone.trim() !== '' && !isValidCheckoutPhone(formData.phone)
  const phoneValid = isValidCheckoutPhone(formData.phone)
  const canSubmitOrder =
    phoneValid &&
    !isDeliveryChecking &&
    deliveryFeeReady &&
    !deliveryOutsideArea &&
    dataProcessingConsent


  const upsellItems = tierUpsellItems
  const isUpsellQualified = upsellItems.length > 0

  const addItem = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      const currentQty = existing ? lineQuantity(existing) : 0
      if (currentQty >= 99) {
        toast.error(cs.toastMaxQty)
        return prev
      }
      const newCart = existing
        ? prev.map((i) =>
            i.id === item.id ? { ...i, quantity: currentQty + 1 } : i,
          )
        : [...prev, { ...item, quantity: 1, cartLineId: newCartLineId() }]
      writeCartToStorage(newCart)
      return newCart
    })
  }

  const removeCartLine = (cartLineId: string) => {
    setCartItems((prev) => {
      const line = prev.find((i) => i.cartLineId === cartLineId)
      if (!line) return prev
      const qty = lineQuantity(line)
      const newCart =
        qty <= 1
          ? prev.filter((i) => i.cartLineId !== cartLineId)
          : prev.map((i) =>
              i.cartLineId === cartLineId ? { ...i, quantity: qty - 1 } : i,
            )
      writeCartToStorage(newCart)
      return newCart
    })
  }

  const removeAllItem = (itemId: number) => {
    setCartItems((prev) => {
      const newCart = prev.filter((i) => i.id !== itemId)
      writeCartToStorage(newCart)
      return newCart
    })
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

  const getDiscountedUpsellItem = (item: MenuItem & { upsellDiscountEur?: number }): MenuItem => {
    const discountEur = Number(item.upsellDiscountEur ?? 0)
    return {
      ...item,
      cartUpsellDiscountEur: discountEur > 0 ? discountEur : undefined,
    }
  }

  const handleAddUpsell = (item: MenuItem & { upsellDiscountEur?: number }) => {
    addItem(getDiscountedUpsellItem(item))
    const discountEur = Number(item.upsellDiscountEur ?? 0)
    toast.success(
      cs.toastUpsellAddedEur
        .replace('{{name}}', item.name)
        .replace('{{discount}}', discountEur.toFixed(2)),
    )
  }

  // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
 const handleOrder = async () => {
    if (!isUserLoggedIn()) {
      router.push(getAuthUrl('/cart'))
      return
    }
    if (!dataProcessingConsent) {
      toast.error(cs.dataProcessingConsentRequired)
      return
    }
    if (fulfillment === 'delivery') {
      if (!formData.address.trim()) {
        toast.error(cs.toastAddressRequired)
        return
      }
      if (!formData.postalCode.trim()) {
        toast.error(cs.toastPostalCodeRequired)
        return
      }
      if (isDeliveryChecking) {
        toast.error(cs.toastDeliveryFeeRequired)
        return
      }
      if (deliveryOutsideArea) {
        toast.error(cs.toastDeliveryOutsideArea)
        return
      }
      if (!deliveryFeeReady) {
        toast.error(cs.toastDeliveryFeeRequired)
        return
      }
    }
    setIsLoading(true)
    try {
      const authHeaders = getBearerAuthHeaders()
      if (Object.keys(authHeaders as Record<string, string>).length === 0) {
        router.push(getAuthUrl('/cart'))
        setIsLoading(false)
        return
      }
      const promoPart = appliedPromo
        ? cs.orderCommentPromo
            .replace('{{code}}', appliedPromo.code)
            .replace('{{discount}}', String(appliedPromo.discount))
        : ''
      const changePart =
        paymentMethod === 'CASH' && formData.needChangeFrom.trim()
          ? cs.orderCommentChangeFrom.replace('{{amount}}', formData.needChangeFrom.trim())
          : ''
      const cbPart = formData.noCallbackConfirm ? cs.orderCommentNoCallback : ''
      const dbPart =
        fulfillment === 'delivery' && formData.noDoorbellRing
          ? cs.orderCommentNoDoorbell
          : ''
      const zoneNote =
        fulfillment === 'delivery' &&
        zoneMatchesCartCity &&
        mapZoneSelection &&
        mapZoneSelection.zoneName.trim()
          ? `[${cs.deliveryFromMap.replace('{{zone}}', mapZoneSelection.zoneName)}]`
          : ''
      const fullComment = [
        zoneNote,
        changePart,
        cbPart,
        dbPart,
        formData.comment.trim(),
        appliedPromo ? promoPart : '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

      const addrDetails: string[] = []
      if (formData.buildingBlock.trim())
        addrDetails.push(
          cs.addrDetailBuilding.replace('{{value}}', formData.buildingBlock.trim()),
        )
      if (formData.entrance)
        addrDetails.push(cs.addrDetailEntrance.replace('{{value}}', formData.entrance))
      if (formData.floor)
        addrDetails.push(cs.addrDetailFloor.replace('{{value}}', formData.floor))
      if (formData.apartment)
        addrDetails.push(cs.addrDetailApartment.replace('{{value}}', formData.apartment))
      if (formData.intercom)
        addrDetails.push(cs.addrDetailIntercom.replace('{{value}}', formData.intercom))

      const orderAddress =
        fulfillment === 'pickup'
          ? `${cs.fulfillmentPickup}: ${pickupAddressDisplay}`
          : [
              `${selectedCity}, ${formData.address.trim()}, ${formData.postalCode.trim()}`,
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
          price: cartLineChargeUnitPrice(item),
        }))

      if (orderItems.length === 0) {
        toast.error(cs.toastOrderFailed)
        setIsLoading(false)
        return
      }

      const effectivePaymentMethod: 'CASH' | 'CARD' =
        paymentMethod === 'CARD' && checkoutSettings.cardOnlineAvailable ? 'CARD' : 'CASH'

      const orderPayload: Record<string, unknown> = {
        items: orderItems,
        customerName: formData.name,
        phone: formData.phone,
        address: orderAddress,
        comment: fullComment,
        paymentMethod: effectivePaymentMethod,
        totalAmount: totalAmountNumber,
        merchandiseTotal: merchandiseTotalNumber,
        deliveryPrice: deliveryPriceNumber,
        usedBonuses: usedBonusesNumber,
        fulfillmentType: fulfillment === 'pickup' ? 'PICKUP' : 'DELIVERY',
        noCallbackConfirm: formData.noCallbackConfirm,
        noDoorbellRing: formData.noDoorbellRing,
        dataProcessingConsent: true,
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

      if (effectivePaymentMethod === 'CARD') {
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
      localStorage.removeItem('cart')
      invalidateCartMemoryCache()
      window.dispatchEvent(new CustomEvent('cartUpdated'))
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
    await handleOrder()
  }

  const cartMetaText = cs.cartMeta
    .replace('{{lines}}', String(uniqueItems.length))
    .replace('{{pieces}}', String(getCartTotalPieceCount(cartItems)))

  const isEmpty = cartItems.length === 0

  return (
    <div className="watta-cart-page menu-page-web watta-public-page-shell watta-page-bg relative flex w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden font-sans">
      <LogoBackground />

      <div
        className="watta-cart-page__content relative z-10 mx-auto flex w-full min-w-0 max-w-[1280px] flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-6 md:px-6"
      >
        <header className="mb-2 flex items-start justify-between gap-3 md:mb-3">
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
            <div className="watta-cart-checkout-layout grid w-full min-w-0 grid-cols-1 items-start gap-3 pb-4 sm:pb-6 md:grid-cols-[minmax(0,min(100%,320px))_minmax(0,1fr)] md:gap-4 lg:grid-cols-[minmax(0,min(100%,360px))_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,min(100%,380px))_minmax(0,1fr)]">
              <div className="watta-cart-checkout-items order-1 flex min-w-0 flex-col gap-2.5 sm:gap-3 md:order-none md:gap-3">
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
                              <img
                                src={resolveCatalogMediaUrl(item.imageUrl) ?? undefined}
                                className="h-full w-full object-cover"
                                alt=""
                              />
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
                            {(() => {
                              const unitCharge = cartLineChargeUnitPrice(item)
                              const promo = clampPromoPercent(item.promoDiscountPercent)
                              const hasUpsellOff =
                                Number(item.cartUpsellDiscountEur) > 0 &&
                                unitCharge < item.price - 0.004
                              const catalogUnit = effectiveUnitPrice(
                                item.price,
                                item.promoDiscountPercent,
                              )
                              if (hasUpsellOff && unitCharge < catalogUnit - 0.004) {
                                return (
                                  <>
                                    <span className="text-neutral-400 line-through">
                                      {catalogUnit} €
                                    </span>
                                    <span className="ml-1 font-medium text-[#145142]">
                                      {unitCharge} €
                                    </span>
                                  </>
                                )
                              }
                              if (!hasUpsellOff && promo > 0) {
                                return (
                                  <>
                                    <span className="text-neutral-400 line-through">{item.price} €</span>
                                    <span className="ml-1 font-medium text-[#145142]">
                                      {unitCharge} €
                                    </span>
                                  </>
                                )
                              }
                              return (
                                <span className="font-medium text-neutral-600">{unitCharge} €</span>
                              )
                            })()}
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
                                {lineQuantity(item)}
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
                            {(cartLineChargeUnitPrice(item) * lineQuantity(item)).toFixed(2)} €
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

                {isUpsellQualified ? (
                  <section
                    className={`${CHECKOUT_CARD_CLASS} watta-cart-upsell-sidebar min-w-0`}
                    aria-labelledby="cart-upsell-heading"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 sm:mb-2.5">
                      <div className="min-w-0">
                        <h2 id="cart-upsell-heading" className={CHECKOUT_SECTION_TITLE_CLASS}>
                          {cs.cartUpsellOffersTitle}
                        </h2>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => scrollRecRail(-1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[#145142] transition hover:border-[#145142]/30 hover:bg-neutral-50 sm:h-8 sm:w-8"
                          aria-label={cs.recScrollPrev}
                        >
                          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollRecRail(1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[#145142] transition hover:border-[#145142]/30 hover:bg-neutral-50 sm:h-8 sm:w-8"
                          aria-label={cs.recScrollNext}
                        >
                          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                    <div id="cart-recommendations-rail" className="cart-upsell-rail-outer relative">
                      <div
                        ref={recScrollRef}
                        className="cart-upsell-rail-scroll home-menu-category-rail-web flex flex-nowrap gap-2.5 overflow-x-auto overflow-y-hidden scroll-smooth px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden"
                      >
                        {upsellItems.map((item) => {
                          const discountEur = Number(item.upsellDiscountEur ?? 0)
                          const catalogEff = effectiveUnitPrice(item.price, item.promoDiscountPercent)
                          const salePrice = cartUpsellSaleUnitPrice(
                            item.price,
                            item.promoDiscountPercent,
                            discountEur,
                          )
                          return (
                            <WattaMenuProductCard
                              key={item.id}
                              variant="rail"
                              className="home-menu-product-card--rail-web shrink-0 snap-start"
                              product={{
                                id: item.id,
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                emoji: item.emoji,
                                imageUrl: item.imageUrl,
                                promoDiscountPercent: item.promoDiscountPercent,
                                saleUnitPrice: salePrice,
                                compareAtPrice: catalogEff,
                                cartFixedDiscountEur: discountEur,
                              }}
                              subtitleLine={
                                parseProductSpecsFromDescription(
                                  item.description,
                                  pd.weightFallback,
                                  pd.piecesFallback,
                                  language as WattaLanguage,
                                ).weightLine
                              }
                              onAddToCart={() => handleAddUpsell(item)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </section>
                ) : null}

              </div>

              <div className="watta-cart-checkout-panel order-2 min-w-0 md:order-none">
                <form
                  id={CART_CHECKOUT_FORM_ID}
                  className="watta-cart-checkout-grid flex min-w-0 flex-col gap-3 md:gap-3"
                  onSubmit={handleCheckoutSubmit}
                  noValidate
                >
                {/* 1. Контактные данные */}
                <div className={CHECKOUT_CARD_CLASS}>
                   <CheckoutSectionHead icon={User} title={cs.contactDetails} />
                   <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
                      <div className="flex min-w-0 flex-col gap-1 md:col-span-2">
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
                      <label
                        htmlFor="cart-data-processing-consent"
                        className="mt-0.5 flex cursor-pointer items-start gap-2 rounded-lg border border-[#145142]/12 bg-[#145142]/[0.03] px-2.5 py-2 md:col-span-2"
                      >
                        <input
                          id="cart-data-processing-consent"
                          type="checkbox"
                          checked={dataProcessingConsent}
                          onChange={(e) => setDataProcessingConsent(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#145142]"
                          required
                        />
                        <span className="text-[10px] leading-snug text-[#145142]/90 md:text-[11px]">
                          {cs.dataProcessingConsentPrefix}{' '}
                          <Link
                            href="/privacy"
                            className="font-semibold text-[#145142] underline underline-offset-2 hover:text-[#0f3d34]"
                          >
                            {cs.privacyPolicyLink}
                          </Link>
                        </span>
                      </label>
                   </div>
                </div>
                {/* 2. Доставка + время */}
                <div className={`${CHECKOUT_CARD_CLASS} watta-cart-checkout-grid__span2`}>
                   <CheckoutSectionHead
                     icon={fulfillment === 'pickup' ? Store : Truck}
                     title={
                       fulfillment === 'pickup'
                         ? `${cs.fulfillmentPickup} · ${cs.pickupTimeTitle}`
                         : `${t.delivery} · ${cs.deliveryTimeTitle}`
                     }
                   />

                   <div
                     className="mb-3 flex w-full min-w-0 gap-1 rounded-lg border border-neutral-200/90 bg-neutral-100/80 p-0.5"
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

                       <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_minmax(7rem,9rem)]">
                         <input
                           type="text"
                           placeholder={cs.streetPlaceholder}
                           className={CHECKOUT_INPUT_CLASS}
                           maxLength={STREET_MAX}
                           value={formData.address}
                           onChange={(e) =>
                             setFormData({
                               ...formData,
                               address: e.target.value,
                             })
                           }
                           required
                           autoComplete="street-address"
                         />
                         <input
                           type="text"
                           placeholder={cs.postalCodePlaceholder}
                           className={CHECKOUT_INPUT_CLASS}
                           maxLength={POSTAL_MAX}
                           value={formData.postalCode}
                           onChange={(e) =>
                             setFormData({
                               ...formData,
                               postalCode: e.target.value.toUpperCase(),
                             })
                           }
                           required
                           autoComplete="postal-code"
                         />
                       </div>

                       <div className="mb-2 flex flex-wrap items-center gap-2" aria-live="polite">
                         {!formData.address.trim() || formData.postalCode.trim().length < 4 ? (
                           <span className="watta-cart-fee-pill watta-cart-fee-pill--muted">
                             {cs.enterStreetAndPostalForDeliveryFee}
                           </span>
                         ) : isDeliveryChecking ? (
                           <span className="watta-cart-fee-pill watta-cart-fee-pill--muted">{d.postalChecking}</span>
                         ) : deliveryFeeReady && distanceKm != null ? (
                           <span className="watta-cart-fee-pill">
                             {cs.deliveryFeeFromKitchen
                               .replace('{{km}}', distanceKm.toFixed(1))
                               .replace('{{sum}}', deliveryPrice.toFixed(2))}
                           </span>
                         ) : deliveryOutsideArea ||
                           deliveryCheckResult?.status === 'geocode_failed' ||
                           deliveryCheckResult?.status === 'postcode_format_invalid' ? (
                           <span className="watta-cart-fee-pill watta-cart-fee-pill--error">
                             {deliveryOutsideArea ? cs.toastDeliveryOutsideArea : d.postalGeocodeFail}
                           </span>
                         ) : (
                           <span className="watta-cart-fee-pill watta-cart-fee-pill--muted">
                             {cs.enterAddressForDeliveryFee}
                           </span>
                         )}
                         {deliveryCheckResult?.placeLabel ? (
                           <span className="text-[10px] text-neutral-500 md:text-[11px]">
                             {d.postalAddressFound}: {deliveryCheckResult.placeLabel}
                           </span>
                         ) : null}
                       </div>

                       <div className="mb-2 grid grid-cols-4 gap-1.5">
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

                       <div className="watta-cart-checkout-inline-checks mb-2">
                          <label>
                             <input
                               type="checkbox"
                               className="h-3.5 w-3.5 accent-[#145142]"
                               checked={formData.noCallbackConfirm}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noCallbackConfirm: e.target.checked,
                                 })
                               }
                             />
                             {cs.optNoCallback}
                          </label>
                          <label>
                             <input
                               type="checkbox"
                               className="h-3.5 w-3.5 accent-[#145142]"
                               checked={formData.noDoorbellRing}
                               onChange={e =>
                                 setFormData({
                                   ...formData,
                                   noDoorbellRing: e.target.checked,
                                 })
                               }
                             />
                             {cs.optNoDoorbell}
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
                   <div className="mt-3 border-t border-[#145142]/10 pt-3">
                     <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                       <p className={`${CHECKOUT_FIELD_LABEL_CLASS} mb-0`}>
                         {fulfillment === 'pickup' ? cs.slotTimeLabelPickup : cs.slotTimeLabel}
                       </p>
                       <span className="text-[10px] font-medium text-[#145142]/65">
                         {cs.slotPickDateHint.replace('{{days}}', String(DELIVERY_BOOKING_DAYS_AHEAD + 1))}
                       </span>
                     </div>
                     <div
                       className="watta-cart-date-rail"
                       role="listbox"
                       aria-label={
                         fulfillment === 'pickup' ? cs.slotDayLabelPickup : cs.slotDayLabel
                       }
                     >
                       {deliveryDateOptions.map((opt) => (
                         <button
                           key={opt.value}
                           type="button"
                           role="option"
                           aria-selected={deliveryDateKey === opt.value}
                           onClick={() => setDeliveryDateKey(opt.value)}
                           className={`watta-cart-date-chip${deliveryDateKey === opt.value ? ' watta-cart-date-chip--active' : ''}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                     </div>
                     <input
                       id="cart-delivery-date"
                       type="date"
                       className="sr-only"
                       tabIndex={-1}
                       min={minDeliveryDate}
                       max={maxDeliveryDate}
                       value={deliveryDateKey}
                       onChange={(e) => {
                         const next = e.target.value
                         if (next) setDeliveryDateKey(next)
                       }}
                       required
                     />
                     {amsterdamSlots.length === 0 ? (
                       <p className="text-xs text-amber-800">{cs.slotNoTimes}</p>
                     ) : (
                       <div
                         className="watta-cart-slot-grid"
                         role="listbox"
                         aria-label={
                           fulfillment === 'pickup' ? cs.slotTimeLabelPickup : cs.slotTimeLabel
                         }
                       >
                         {amsterdamSlots.map((s) => {
                           const selected = deliverySlot === s.value
                           return (
                             <button
                               key={s.value}
                               type="button"
                               role="option"
                               aria-selected={selected}
                               onClick={() => setDeliverySlot(s.value)}
                               className={`watta-cart-slot-chip${s.value === 'asap' ? ' watta-cart-slot-chip--asap' : ''}${selected ? ' watta-cart-slot-chip--active' : ''}`}
                             >
                               {s.label}
                             </button>
                           )
                         })}
                       </div>
                     )}
                   </div>
                </div>

                {/* 4. Комментарий и приборы */}
                <div className={CHECKOUT_CARD_CLASS}>
                   <CheckoutSectionHead icon={Clock} title={cs.orderDetailsTitle} />
                   <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                         <label className={CHECKOUT_FIELD_LABEL_CLASS}>{cs.partySizeLabel}</label>
                         <input
                           type="number"
                           min={1}
                           max={99}
                           className={`${CHECKOUT_INPUT_CLASS} font-semibold`}
                           value={formData.persons}
                           onChange={(e) => {
                             const raw = parseInt(e.target.value, 10)
                             const v = Number.isFinite(raw) ? Math.min(99, Math.max(1, raw)) : 1
                             setFormData({ ...formData, persons: v })
                           }}
                         />
                      </div>
                      <div>
                         <label className={CHECKOUT_FIELD_LABEL_CLASS}>{cs.chopsticksLabel}</label>
                         <select
                           className={`${CHECKOUT_INPUT_CLASS} cursor-pointer font-semibold`}
                           value={formData.sticks}
                           onChange={(e) =>
                             setFormData({ ...formData, sticks: Number(e.target.value) })
                           }
                         >
                            {Array.from({ length: 21 }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                         </select>
                      </div>
                   </div>
                   <textarea
                      placeholder={cs.commentPlaceholder}
                      className={`${CHECKOUT_INPUT_CLASS} min-h-[3.5rem] resize-none`}
                      rows={2}
                      maxLength={COMMENT_MAX}
                      value={formData.comment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          comment: e.target.value.slice(0, COMMENT_MAX),
                        })
                      }
                   />
                   <p className="mt-0.5 text-right text-[10px] text-neutral-400">
                     {formData.comment.length}/{COMMENT_MAX}
                   </p>
                </div>

                  {/* 5. Оплата + итого */}
                  <div className={`${CHECKOUT_CARD_CLASS} watta-cart-checkout-grid__pay watta-cart-checkout-grid__span2`}>
                    <CheckoutSectionHead icon={Sparkles} title={cs.paymentMethodTitle} />
                    <div
                      className={`watta-cart-checkout-pay-row mb-2${checkoutSettings.cardOnlineAvailable ? '' : ' watta-cart-checkout-pay-row--single'}`}
                    >
                      <label
                        onClick={() => setPaymentMethod('CASH')}
                        className={`watta-cart-checkout-pay-opt${paymentMethod === 'CASH' ? ' watta-cart-checkout-pay-opt--active' : ''}`}
                      >
                        <span className="watta-cart-checkout-pay-opt__label">{cs.payCash}</span>
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                      </label>
                      {checkoutSettings.cardOnlineAvailable ? (
                        <label
                          onClick={() => setPaymentMethod('CARD')}
                          className={`watta-cart-checkout-pay-opt${paymentMethod === 'CARD' ? ' watta-cart-checkout-pay-opt--active' : ''}`}
                        >
                          <span className="watta-cart-checkout-pay-opt__label">{cs.payCard}</span>
                          <span className="watta-cart-checkout-pay-opt__hint">{cs.payCardHint}</span>
                          <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                        </label>
                      ) : null}
                    </div>
                    {!checkoutSettings.cardOnlineAvailable ? (
                      <p className="mb-2 text-[10px] leading-snug text-[#145142]/70 sm:text-[11px]">
                        {cs.payCardUnavailable}
                      </p>
                    ) : null}
                    {paymentMethod === 'CASH' ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={cs.changeFromPlaceholder}
                        className={`${CHECKOUT_INPUT_CLASS} mb-2`}
                        value={formData.needChangeFrom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            needChangeFrom: e.target.value.replace(/\D/g, '').slice(0, 4),
                          })
                        }
                      />
                    ) : null}

                    <div className="mb-2 flex gap-1.5">
                      <input
                        type="text"
                        placeholder={cs.promoPlaceholder}
                        className={`${CHECKOUT_INPUT_CLASS} min-w-0 flex-1 font-semibold uppercase`}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="shrink-0 rounded-lg bg-[#145142] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0f3d34]"
                      >
                        OK
                      </button>
                    </div>
                    {promoError ? (
                      <p className="mb-2 text-center text-[11px] font-medium text-red-600">{promoError}</p>
                    ) : null}
                    {appliedPromo ? (
                      <p className="mb-2 text-center text-[11px] font-semibold text-[#145142]">
                        {cs.promoApplied.replace('{{code}}', appliedPromo.code)}
                      </p>
                    ) : null}

                    <div className="watta-cart-checkout-total">
                      <div className="watta-cart-checkout-total__row">
                        <span>{cs.subtotalLabel}</span>
                        <span className="tabular-nums font-medium">{basePrice} €</span>
                      </div>
                      {appliedPromo ? (
                        <div className="watta-cart-checkout-total__row text-[#145142]">
                          <span>{cs.discountPrefix} ({appliedPromo.code})</span>
                          <span className="tabular-nums">−{discountAmount} €</span>
                        </div>
                      ) : null}
                      <div className="watta-cart-checkout-total__row">
                        <span>{fulfillment === 'pickup' ? cs.fulfillmentPickup : t.delivery}</span>
                        <span className="tabular-nums font-medium">
                          {fulfillment === 'pickup' ? '—' : deliveryPrice === 0 ? cs.deliveryFree : `${deliveryPrice} €`}
                        </span>
                      </div>
                      {bonusBalance > 0 ? (
                        <label className="mt-2 flex cursor-pointer items-center justify-between gap-2 text-[11px] font-medium text-[#145142]">
                          <span>{cs.bonusAvailableLabel.replace('{{amount}}', bonusBalance.toFixed(2))}</span>
                          <input type="checkbox" checked={useBonuses} onChange={(e) => setUseBonuses(e.target.checked)} className="h-3.5 w-3.5 accent-[#145142]" />
                        </label>
                      ) : null}
                      {useBonuses && appliedBonuses > 0 ? (
                        <div className="watta-cart-checkout-total__row text-[#145142]">
                          <span>{cs.bonusSpentLabel}</span>
                          <span className="tabular-nums">−{appliedBonuses.toFixed(2)} €</span>
                        </div>
                      ) : null}
                      <div className="watta-cart-checkout-total__grand flex items-end justify-between">
                        <span>{cs.total}</span>
                        <span className="watta-cart-checkout-total__amount">{totalToPay.toFixed(2)} €</span>
                      </div>
                    </div>

                    <button
                      disabled={isLoading || !canSubmitOrder}
                      type="submit"
                      className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#145142] to-[#1a6b58] text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(20,81,66,0.65)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 md:h-11"
                    >
                      {isLoading ? cs.processing : cs.order}
                    </button>
                  </div>

                  </form>
                </div>
            </div>
            )}
        </>
      </div>
    </div>
  )
}