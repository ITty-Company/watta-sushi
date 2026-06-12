'use client'

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import Link from 'next/link'
import WattaLink from './WattaLink'
import { Truck, Store, Trash2, ArrowRight, Banknote, CreditCard, ClipboardList, CalendarDays, LucideIcon } from 'lucide-react'
import { ArrowLeft, MapPin, Minus, Plus, Clock, ChevronRight, X, User, ShoppingBag } from '@/lib/wattaInlineIcons'
import { HERO_COPY_EASE } from './heroCopyMotion'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedField } from '@/lib/i18n/getLocalizedField'
import { getMenuCategoryDisplayName } from '@/lib/i18n/getMenuCategoryDisplayName'
import type { WattaLanguage } from '@/lib/i18n/language'
import { parseProductSpecsFromDescription } from '@/lib/i18n/parseProductSpecsFromDescription'
import {
  assertScheduledDeliveryAllowed,
  buildAmsterdamSlots,
  buildDeliveryDateOptions,
  formatDeliveryDateLabel,
  getAmsterdamTodayKey,
  getDefaultPreorderDateKey,
  hasBookableSlotsToday,
  isDeliveryDateKeyAllowed,
  isKitchenOpenNow,
  pickPreorderSlotValue,
  addDaysToDateKey,
} from '@/lib/deliverySlotsAmsterdam'
import { WATTA_CART_FOCUS_CHECKOUT_KEY } from '@/lib/openWattaCart'
import { resolveCheckoutErrorFocus } from '@/lib/checkoutErrorFocus'
import {
  clearKitchenClosedModalDismissed,
  isKitchenClosedModalDismissed,
} from '@/lib/kitchenClosedModal'
import KitchenClosedModal from './KitchenClosedModal'
import CartDrawerEmptyIllustration from './CartDrawerEmptyIllustration'
import WattaCartSwipeLine from './WattaCartSwipeLine'
import '../watta-cart-drawer-empty-art.css'
import toast from 'react-hot-toast'
import { getBearerAuthHeaders } from '@/lib/authHeaders'
import { isUserLoggedIn } from '@/lib/authGate'
import { openWattaAuth } from '@/lib/openWattaAuth'
import { defaultMinimumOrderEur } from '@/lib/deliveryMinOrder'
import { getApiUrl } from '@/lib/utils'
import { cityIdPreferAmsterdam } from '@/lib/wattaPreferredDefaultCity'
import {
  resolveRestaurantPickupAddress,
  wattaMapsUrlForAddress,
  WATTA_RESTAURANT,
} from '@/lib/wattaRestaurantLocation'
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
import {
  getCartTotalPieceCount,
  lineQuantity,
  invalidateCartMemoryCache,
  readCartFromStorage,
  writeCartToStorage,
  refreshCartProductMediaFromCatalog,
} from '@/lib/cartStorage'
import { decrementCartProduct, incrementCartProduct } from '@/lib/cartLineMutations'
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
  isDeliveryCityUnavailable,
  isDeliveryFeeAvailable,
  isDeliveryOutsideArea,
  type DeliveryCheckResult,
} from '@/lib/deliveryCheckClient'
import { parseSavedDeliveryAddress } from '@/lib/parseSavedDeliveryAddress'
import {
  fetchUserSavedAddresses,
  type SavedUserAddress,
} from '@/lib/userSavedAddressesClient'
import {
  condimentSetsExtraFeeEur,
  defaultCondimentSetsForParty,
  extraCondimentSetsCount,
  EXTRA_CONDIMENT_SET_PRICE_EUR,
  FREE_CONDIMENT_SETS,
} from '@/lib/condimentSets'
import DeliveryUnavailableCityNotice from './delivery/DeliveryUnavailableCityNotice'
import { WattaInViewFadeDiv, WattaInViewFadeHeader } from './WattaInViewFade'
import WattaPageHeroStagger from './WattaPageHeroStagger'
import { WattaMenuProductCard } from './WattaMenuProductCard'

const CART_CHECKOUT_FORM_ID = 'watta-cart-checkout-form'

const CHECKOUT_INPUT_CLASS = 'watta-checkout-field'
/** Відкриті блоки форми — без «картки-панелі». */
const CHECKOUT_SECTION_CLASS = 'watta-cart-checkout-section'
/** Лише «Ваш заказ» і спецпропозиції. */
const CHECKOUT_PANEL_CLASS = 'watta-cart-checkout-panel'
const CHECKOUT_FIELD_LABEL_CLASS = 'watta-checkout-label'
/** Під'їзд / поверх / кв.: лише цифри, до 1000 символів кожне */
const DIGIT_ADDR_MAX = 4
const STREET_MAX = 100
const POSTAL_MAX = 12
const BUILDING_BLOCK_MAX = 4
const COMMENT_MAX = 500
const DELIVERY_CHECK_DEBOUNCE_MS = 650
/** Скільки спецпропозицій показуємо стеком; додав одну — підтягнеться наступна. */
const CART_UPSELL_VISIBLE_LIMIT = 5

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
  cardOnlineEnabled: boolean
  cardPaymentReady: boolean
}

const defaultCheckoutSettings: CheckoutSiteSettings = {
  freeDeliveryThreshold: 1000,
  deliveryFee: 50,
  restaurantPickupAddress: WATTA_RESTAURANT.addressLine,
  cardOnlineEnabled: true,
  cardPaymentReady: false,
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
  variant = 'default',
}: {
  icon: LucideIcon
  title: string
  variant?: 'default' | 'sub'
}) {
  return (
    <div
      className={`watta-cart-form-section__head${
        variant === 'sub' ? ' watta-cart-form-section__head--sub' : ''
      }`}
    >
      <span className="watta-cart-form-section__ico" aria-hidden>
        <Icon strokeWidth={2.15} aria-hidden />
      </span>
      <h2 className="watta-cart-form-section__title">{title}</h2>
    </div>
  )
}

function CheckoutFormSection({
  children,
  className,
  sectionIndex = 0,
  ...rest
}: {
  children: ReactNode
  className?: string
  sectionIndex?: number
} & ComponentPropsWithoutRef<'div'>) {
  return (
    <WattaInViewFadeDiv
      className={`${CHECKOUT_SECTION_CLASS} watta-cart-form-section${className ? ` ${className}` : ''}`}
      style={{ '--watta-checkout-section-i': sectionIndex } as React.CSSProperties}
      {...rest}
    >
      {children}
    </WattaInViewFadeDiv>
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

  const [cartItems, setCartItems] = useState<MenuItem[]>([])
  const [openSwipeLineId, setOpenSwipeLineId] = useState<string | null>(null)
  const [emptySceneKey, setEmptySceneKey] = useState(0)
  const cartWasNonEmptyRef = useRef(false)
  const [cartUpsellTiers, setCartUpsellTiers] = useState<CartUpsellTierDto[]>([])

  // Состояния для оформления
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({ 
    name: '',
    phone: '', 
    address: '',
    postalCode: '',
    comment: '', 
    entrance: '',
    floor: '',
    apartment: '',
    intercom: '',
    buildingBlock: '',
    persons: 1,
    sticks: 0,
    condimentSets: 1,
    noCallbackConfirm: false,
    noDoorbellRing: false,
  })
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)
  const [consentHighlight, setConsentHighlight] = useState(false)

  //---Оплата---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [deliveryCheckResult, setDeliveryCheckResult] = useState<DeliveryCheckResult | null>(null)
  const [isDeliveryChecking, setIsDeliveryChecking] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedUserAddress[]>([])
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | 'new' | null>(null)
  const deliveryCheckRequestRef = useRef(0)
  // Stable UUID for this checkout session — used for server-side order idempotency.
  // Generated once on component mount, reused on retries (prevents duplicate orders
  // from double-click, slow network, or frontend retry).
  // A new UUID is naturally generated if the user navigates away and returns.
  const clientRequestIdRef = useRef<string>(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  )
  const [deliveryDateKey, setDeliveryDateKey] = useState(() => getAmsterdamTodayKey())
  const [deliverySlot, setDeliverySlot] = useState('asap')
  const deliveryDateInputRef = useRef<HTMLInputElement>(null)
  // --- ЛОГИКА ПРОМОКОДОВ ---
  // Добавляем эти переменные, чтобы не было ошибок в return
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSiteSettings>(defaultCheckoutSettings)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [useBonuses, setUseBonuses] = useState(false)
  const [mapZoneSelection, setMapZoneSelection] = useState<WattaDeliveryZoneSelection | null>(null)
  const [kitchenClosedModalOpen, setKitchenClosedModalOpen] = useState(false)

  const kitchenOpen = isKitchenOpenNow()
  const kitchenAcceptsOrderNow = useMemo(() => {
    if (kitchenOpen) return true
    const today = getAmsterdamTodayKey()
    return Boolean(deliveryDateKey && deliveryDateKey > today)
  }, [kitchenOpen, deliveryDateKey])

  useEffect(() => {
    if (kitchenOpen) clearKitchenClosedModalDismissed()
  }, [kitchenOpen])

  useEffect(() => {
    if (cartItems.length === 0 || kitchenOpen || isKitchenClosedModalDismissed()) {
      setKitchenClosedModalOpen(false)
      return
    }
    setKitchenClosedModalOpen(true)
  }, [cartItems.length, kitchenOpen])

  useEffect(() => {
    if (cartItems.length > 0) cartWasNonEmptyRef.current = true
    if (cartItems.length === 0 && cartWasNonEmptyRef.current) {
      setEmptySceneKey((k) => k + 1)
    }
  }, [cartItems.length])

  const applyKitchenPreorder = useCallback(() => {
    const dateKey = getDefaultPreorderDateKey()
    const slot = pickPreorderSlotValue(dateKey, cs.slotAsap)
    setDeliveryDateKey(dateKey)
    setDeliverySlot(slot)
    toast.success(cs.kitchenClosed.preorderToast)
    requestAnimationFrame(() => {
      document.getElementById('cart-delivery-time')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [cs.kitchenClosed.preorderToast, cs.slotAsap])

  const promptKitchenClosedModal = useCallback(() => {
    if (kitchenOpen) return false
    setKitchenClosedModalOpen(true)
    return true
  }, [kitchenOpen])

  const scrollCheckoutToField = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      try {
        el.focus({ preventScroll: true })
      } catch {
        el.focus()
      }
    })
  }, [])

  const scrollCheckoutToSection = useCallback(
    (sectionId: string, focusSelector?: string) => {
      const section = document.getElementById(sectionId)
      if (!section) return
      requestAnimationFrame(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (focusSelector) {
          const focusEl = section.querySelector(focusSelector)
          if (focusEl instanceof HTMLElement) {
            scrollCheckoutToField(focusEl)
          }
        }
      })
    },
    [scrollCheckoutToField],
  )

  const focusCheckoutError = useCallback(
    (message: string) => {
      const target = resolveCheckoutErrorFocus(message)
      if (target.kind === 'field') {
        scrollCheckoutToField(document.getElementById(target.fieldId))
        if (target.fieldId === 'cart-data-processing-consent') {
          setConsentHighlight(true)
        }
        return
      }
      scrollCheckoutToSection(target.sectionId, target.focusSelector)
    },
    [scrollCheckoutToField, scrollCheckoutToSection],
  )

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setCheckoutSettings({
          freeDeliveryThreshold: Number(data.freeDeliveryThreshold) || defaultCheckoutSettings.freeDeliveryThreshold,
          deliveryFee: Number(data.deliveryFee) || defaultCheckoutSettings.deliveryFee,
          restaurantPickupAddress: resolveRestaurantPickupAddress(data.restaurantPickupAddress),
          cardOnlineEnabled: data.cardOnlineEnabled !== false,
          cardPaymentReady: data.cardPaymentReady === true,
        })
        if (data.cardOnlineEnabled === false) {
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

  useEffect(() => {
    if (typeof window === 'undefined' || cartItems.length === 0) return
    try {
      if (sessionStorage.getItem(WATTA_CART_FOCUS_CHECKOUT_KEY) !== '1') return
      sessionStorage.removeItem(WATTA_CART_FOCUS_CHECKOUT_KEY)
    } catch {
      return
    }
    requestAnimationFrame(() => {
      document.getElementById('cart-checkout-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [cartItems.length])

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

  const applySavedAddressToForm = useCallback(
    (row: SavedUserAddress) => {
      const parsed = parseSavedDeliveryAddress(
        row.address,
        cities.map((city) => city.name),
      )
      setSelectedSavedAddressId(row.id)
      setFormData((prev) => ({
        ...prev,
        address: parsed.street || parsed.fullAddress,
        postalCode: parsed.postalCode || prev.postalCode,
      }))
      if (parsed.city) {
        setSelectedCity(parsed.city)
      }
    },
    [cities],
  )

  const loadSavedAddresses = useCallback(async () => {
    if (!isUserLoggedIn()) {
      setSavedAddresses([])
      setSelectedSavedAddressId(null)
      return
    }
    const rows = await fetchUserSavedAddresses()
    setSavedAddresses(rows)
    if (rows.length === 0) {
      setSelectedSavedAddressId(null)
      return
    }
    setSelectedSavedAddressId((prev) => {
      if (prev === 'new') return prev
      if (typeof prev === 'number' && rows.some((row) => row.id === prev)) return prev
      return rows[0].id
    })
  }, [])

  useEffect(() => {
    if (savedAddresses.length === 0 || selectedSavedAddressId == null || selectedSavedAddressId === 'new') {
      return
    }
    const row = savedAddresses.find((entry) => entry.id === selectedSavedAddressId)
    if (row) applySavedAddressToForm(row)
  }, [savedAddresses, selectedSavedAddressId, applySavedAddressToForm])

  useEffect(() => {
    prefillFromUser()
    void loadSavedAddresses()
    window.addEventListener('userChanged', prefillFromUser)
    window.addEventListener('userChanged', loadSavedAddresses)
    return () => {
      window.removeEventListener('userChanged', prefillFromUser)
      window.removeEventListener('userChanged', loadSavedAddresses)
    }
  }, [prefillFromUser, loadSavedAddresses])

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

  const openCartAuth = useCallback(() => {
    openWattaAuth({
      returnUrl: '/cart',
      onSuccess: () => {
        prefillFromUser()
        void loadSavedAddresses()
        loadBonusBalance()
        router.refresh()
      },
    })
  }, [prefillFromUser, loadSavedAddresses, loadBonusBalance, router])

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
  const activeSavedAddress = useMemo(
    () =>
      typeof selectedSavedAddressId === 'number'
        ? savedAddresses.find((row) => row.id === selectedSavedAddressId) ?? null
        : null,
    [savedAddresses, selectedSavedAddressId],
  )
  const useManualAddressEntry =
    savedAddresses.length === 0 || selectedSavedAddressId === 'new' || selectedSavedAddressId === null
  const addressReadyForDeliveryCheck =
    Boolean(activeSavedAddress?.address.trim()) ||
    (formData.address.trim().length > 0 && formData.postalCode.trim().length >= 4)
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
  const condimentExtraFee = condimentSetsExtraFeeEur(formData.condimentSets)
  const extraCondimentCount = extraCondimentSetsCount(formData.condimentSets)

  const subtotalWithDelivery = finalPrice + deliveryPrice + condimentExtraFee
  const appliedBonuses = useBonuses ? Math.min(bonusBalance, subtotalWithDelivery) : 0
  const totalToPay = Math.max(0, subtotalWithDelivery - appliedBonuses)

  const effectiveMinimumOrderEur =
    deliveryCheckResult?.minimumOrderEur != null &&
    !Number.isNaN(Number(deliveryCheckResult.minimumOrderEur))
      ? Number(deliveryCheckResult.minimumOrderEur)
      : defaultMinimumOrderEur()
  const belowMinimumOrder =
    cartItems.length > 0 && finalPrice + Number.EPSILON < effectiveMinimumOrderEur
  const minOrderWarningText = cs.drawerMinOrderWarning.replace(
    '{{amount}}',
    String(Math.round(effectiveMinimumOrderEur)),
  )

  const pickupAddressDisplay = resolveRestaurantPickupAddress(restaurantPickupAddress)
  const pickupMapsHref = wattaMapsUrlForAddress(pickupAddressDisplay)

  const deliveryFeeReady =
    fulfillment !== 'delivery' ||
    (deliveryCheckResult != null &&
      isDeliveryFeeAvailable(deliveryCheckResult.status) &&
      deliveryCheckResult.estimatedDeliveryFee != null)

  const deliveryOutsideArea =
    fulfillment === 'delivery' &&
    deliveryCheckResult != null &&
    isDeliveryOutsideArea(deliveryCheckResult.status)

  const deliveryCityUnavailable =
    fulfillment === 'delivery' &&
    deliveryCheckResult != null &&
    isDeliveryCityUnavailable(deliveryCheckResult.status)

  useEffect(() => {
    const today = getAmsterdamTodayKey()
    setDeliveryDateKey((prev) => {
      if (!prev) return today
      if (!isDeliveryDateKeyAllowed(prev)) return today
      return prev
    })
  }, [])

  const deliveryDateOptions = useMemo(() => {
    const base = buildDeliveryDateOptions(deliverySlotLocale(language as WattaLanguage), {
      today: cs.dayToday,
      tomorrow: cs.dayTomorrow,
    })
    if (
      deliveryDateKey &&
      isDeliveryDateKeyAllowed(deliveryDateKey) &&
      !base.some((opt) => opt.value === deliveryDateKey)
    ) {
      return [
        ...base,
        {
          value: deliveryDateKey,
          label: formatDeliveryDateLabel(deliveryDateKey, deliverySlotLocale(language as WattaLanguage), {
            today: cs.dayToday,
            tomorrow: cs.dayTomorrow,
          }),
        },
      ]
    }
    return base
  }, [language, cs.dayToday, cs.dayTomorrow, deliveryDateKey])

  const amsterdamSlots = useMemo(
    () => buildAmsterdamSlots(deliveryDateKey || getAmsterdamTodayKey(), cs.slotAsap),
    [deliveryDateKey, cs.slotAsap],
  )

  const minDeliveryDate = getAmsterdamTodayKey()
  const selectedDeliveryDateLabel = useMemo(() => {
    return formatDeliveryDateLabel(deliveryDateKey, deliverySlotLocale(language as WattaLanguage), {
      today: cs.dayToday,
      tomorrow: cs.dayTomorrow,
    })
  }, [deliveryDateKey, language, cs.dayToday, cs.dayTomorrow])

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
    const selectedSaved =
      typeof selectedSavedAddressId === 'number'
        ? savedAddresses.find((row) => row.id === selectedSavedAddressId)
        : null
    const savedFull = selectedSaved?.address.trim() ?? ''

    if (!cityId) {
      setDeliveryCheckResult(null)
      setIsDeliveryChecking(false)
      return
    }

    const locationQuery =
      postal.length >= 4 ? postal : savedFull.length >= 3 ? savedFull : street
    const addressLine = street || savedFull

    if (!locationQuery || locationQuery.length < 3) {
      setDeliveryCheckResult(null)
      setIsDeliveryChecking(false)
      return
    }

    let cancelled = false
    setIsDeliveryChecking(true)

    const timer = setTimeout(async () => {
      const reqId = ++deliveryCheckRequestRef.current
      try {
        const data = await fetchDeliveryCheck(
          cityId,
          locationQuery,
          addressLine !== locationQuery ? addressLine : undefined,
        )
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
  }, [
    fulfillment,
    formData.address,
    formData.postalCode,
    selectedCityInfo?.id,
    selectedSavedAddressId,
    savedAddresses,
  ])

  useEffect(() => {
    if (fulfillment !== 'delivery') return
    setDeliveryCheckResult(null)
  }, [selectedCity, fulfillment])

  const phoneInvalidHint =
    formData.phone.trim() !== '' && !isValidCheckoutPhone(formData.phone)
  const phoneValid = isValidCheckoutPhone(formData.phone)
  const canSubmitOrder = !isLoading && !belowMinimumOrder


  const upsellItems = tierUpsellItems
  const isUpsellQualified = upsellItems.length > 0

  const backButtonClass =
    'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#145142]/12 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-white sm:gap-2 sm:px-3 sm:py-2 sm:text-sm'

  const renderCartUpsell = (placement: 'sidebar' | 'bottom') => {
    if (!isUpsellQualified) return null
    const isBottom = placement === 'bottom'
    // На телефоні показуємо стек повноширинних карток (одна під одною),
    // не більше 5 — коли товар додано, він зникає зі списку й «підтягується» наступний.
    const visibleOffers = upsellItems.slice(0, CART_UPSELL_VISIBLE_LIMIT)
    const headingId = isBottom ? 'cart-upsell-heading-bottom' : 'cart-upsell-heading'
    return (
      <section
        className={`${CHECKOUT_PANEL_CLASS} watta-cart-upsell-v2 min-w-0 ${
          isBottom
            ? 'watta-cart-upsell-bottom mt-3 hidden w-full sm:mt-4 md:hidden'
            : 'watta-cart-upsell-sidebar hidden md:block'
        }`}
        aria-labelledby={headingId}
      >
        {isBottom ? (
          <button type="button" onClick={onBack} className={`${backButtonClass} mb-3`}>
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />
            {t.auth.back}
          </button>
        ) : null}
        <div className="watta-cart-upsell-v2__head">
          <span className="watta-cart-upsell-v2__ico" aria-hidden>
            <ShoppingBag strokeWidth={2.15} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="watta-cart-upsell-v2__title">
              {cs.cartUpsellOffersTitle}
            </h2>
          </div>
        </div>
        <div
          className={
            isBottom
              ? 'cart-upsell-rail-outer relative min-w-0'
              : 'cart-upsell-rail-outer relative min-w-0 md:block'
          }
        >
          <div
            className="cart-upsell-rail-scroll home-menu-category-rail-web flex flex-nowrap gap-2.5 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden"
            role="list"
          >
            {visibleOffers.map((item, index) => {
              const discountEur = Number(item.upsellDiscountEur ?? 0)
              const catalogEff = effectiveUnitPrice(item.price, item.promoDiscountPercent)
              const salePrice = cartUpsellSaleUnitPrice(
                item.price,
                item.promoDiscountPercent,
                discountEur,
              )
              const oldPrice = catalogEff > salePrice + 0.004 ? catalogEff : null
              const weightLine = parseProductSpecsFromDescription(
                item.description,
                pd.weightFallback,
                pd.piecesFallback,
                language as WattaLanguage,
              ).weightLine
              return (
                <div key={`${placement}-${item.id}`} role="listitem">
                  <WattaMenuProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      price: item.price,
                      emoji: item.emoji,
                      imageUrl: item.imageUrl,
                      promoDiscountPercent: item.promoDiscountPercent,
                      saleUnitPrice: salePrice,
                      compareAtPrice: oldPrice ?? undefined,
                      cartFixedDiscountEur: discountEur > 0 ? discountEur : undefined,
                    }}
                    onAddToCart={() => {
                      handleAddUpsell(item)
                    }}
                    variant="rail"
                    subtitleLine={weightLine || undefined}
                    discountNearPrice
                    imagePriority={index === 0}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  const addItem = (item: MenuItem) => {
    const result = incrementCartProduct({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category ?? '',
      emoji: item.emoji,
      imageUrl: item.imageUrl,
      promoDiscountPercent: item.promoDiscountPercent,
      cartUpsellDiscountEur: item.cartUpsellDiscountEur,
      cartLineId: item.cartLineId,
    })
    if (result === 'max') toast.error(cs.toastMaxQty)
  }

  const decrementItem = (productId: number) => {
    decrementCartProduct(productId)
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
    const existing = cartItems.find((i) => i.id === item.id)
    const currentQty = existing ? lineQuantity(existing) : 0
    if (currentQty >= 99) {
      toast.error(cs.toastMaxQty)
      return 'max' as const
    }
    addItem(getDiscountedUpsellItem(item))
    return 'ok' as const
  }

  // --- ОФОРМЛЕНИЕ ЗАКАЗА ---
  const validateCheckoutForm = useCallback((): boolean => {
    setConsentHighlight(false)

    const form = document.getElementById(CART_CHECKOUT_FORM_ID) as HTMLFormElement | null
    if (form && !form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid')
      if (firstInvalid instanceof HTMLElement) {
        scrollCheckoutToField(firstInvalid)
        if (firstInvalid.id === 'cart-data-processing-consent') {
          setConsentHighlight(true)
        }
      }
      form.reportValidity()
      return false
    }

    if (!phoneValid) {
      scrollCheckoutToField(document.getElementById('cart-checkout-phone'))
      toast.error(cs.invalidPhone)
      return false
    }

    if (!dataProcessingConsent) {
      setConsentHighlight(true)
      scrollCheckoutToField(document.getElementById('cart-data-processing-consent'))
      toast.error(cs.dataProcessingConsentRequired)
      return false
    }

    if (paymentMethod === 'CARD' && !checkoutSettings.cardPaymentReady) {
      toast.error(cs.payCardSetupRequired)
      scrollCheckoutToSection('cart-checkout-pay')
      return false
    }

    if (amsterdamSlots.length === 0) {
      toast.error(cs.slotNoTimes)
      scrollCheckoutToSection('cart-delivery-time', '#cart-delivery-date')
      return false
    }

    const scheduleCheck = assertScheduledDeliveryAllowed(
      deliveryDateKey || getAmsterdamTodayKey(),
      deliverySlot || 'asap',
    )
    if (!scheduleCheck.ok) {
      toast.error(scheduleCheck.message)
      scrollCheckoutToSection('cart-delivery-time', '.watta-cart-delivery-time-block')
      return false
    }

    if (fulfillment === 'delivery') {
      const selectedSaved =
        typeof selectedSavedAddressId === 'number'
          ? savedAddresses.find((row) => row.id === selectedSavedAddressId)
          : null
      if (!selectedSaved && !formData.address.trim()) {
        toast.error(cs.toastAddressRequired)
        scrollCheckoutToSection('cart-delivery-time', 'input[autocomplete="street-address"]')
        return false
      }
      if (!selectedSaved && !formData.postalCode.trim()) {
        toast.error(cs.toastPostalCodeRequired)
        scrollCheckoutToSection('cart-delivery-time', 'input[autocomplete="postal-code"]')
        return false
      }
      if (isDeliveryChecking) {
        toast.error(cs.toastDeliveryFeeRequired)
        scrollCheckoutToSection('cart-delivery-time')
        return false
      }
      if (deliveryOutsideArea) {
        toast.error(
          deliveryCityUnavailable ? d.deliveryUnavailableTitle : cs.toastDeliveryOutsideArea,
        )
        scrollCheckoutToSection('cart-delivery-time')
        return false
      }
      if (!deliveryFeeReady) {
        toast.error(cs.toastDeliveryFeeRequired)
        scrollCheckoutToSection('cart-delivery-time')
        return false
      }
    }

    return true
  }, [
    amsterdamSlots.length,
    cs,
    checkoutSettings.cardPaymentReady,
    d.deliveryUnavailableTitle,
    dataProcessingConsent,
    deliveryCityUnavailable,
    deliveryDateKey,
    deliveryFeeReady,
    deliveryOutsideArea,
    deliverySlot,
    formData.address,
    formData.postalCode,
    fulfillment,
    isDeliveryChecking,
    phoneValid,
    paymentMethod,
    savedAddresses,
    scrollCheckoutToField,
    scrollCheckoutToSection,
    selectedSavedAddressId,
  ])

 const handleOrder = async () => {
    if (!isUserLoggedIn()) {
      openCartAuth()
      return
    }
    if (!kitchenAcceptsOrderNow) {
      promptKitchenClosedModal()
      return
    }
    setIsLoading(true)
    try {
      const authHeaders = getBearerAuthHeaders()
      if (Object.keys(authHeaders as Record<string, string>).length === 0) {
        openCartAuth()
        setIsLoading(false)
        return
      }
      const promoPart = appliedPromo
        ? cs.orderCommentPromo
            .replace('{{code}}', appliedPromo.code)
            .replace('{{discount}}', String(appliedPromo.discount))
        : ''
      const cashPayPart =
        paymentMethod === 'CASH'
          ? cs.orderCommentCashFull.replace('{{total}}', totalToPay.toFixed(2))
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
      const sticksPart = cs.orderCommentSticks
        .replace('{{sticks}}', String(formData.sticks))
        .replace('{{persons}}', String(formData.persons))
      const paidCondimentSets = extraCondimentSetsCount(formData.condimentSets)
      const freeCondimentSets = Math.min(formData.condimentSets, FREE_CONDIMENT_SETS)
      const condimentPart = cs.orderCommentCondimentSets
        .replace('{{total}}', String(formData.condimentSets))
        .replace('{{free}}', String(freeCondimentSets))
        .replace('{{paid}}', String(paidCondimentSets))
      const fullComment = [
        zoneNote,
        sticksPart,
        condimentPart,
        cashPayPart,
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

      const selectedSaved =
        typeof selectedSavedAddressId === 'number'
          ? savedAddresses.find((row) => row.id === selectedSavedAddressId)
          : null

      const orderAddress =
        fulfillment === 'pickup'
          ? `${cs.fulfillmentPickup}: ${pickupAddressDisplay}`
          : selectedSaved
            ? [
                selectedSaved.address,
                addrDetails.length ? addrDetails.join('; ') : '',
              ]
                .filter(Boolean)
                .join('. ')
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
        const emptyCartMsg = cs.toastOrderFailed
        toast.error(emptyCartMsg)
        focusCheckoutError(emptyCartMsg)
        setIsLoading(false)
        return
      }

      const effectivePaymentMethod: 'CASH' | 'CARD' =
        paymentMethod === 'CARD' && checkoutSettings.cardPaymentReady ? 'CARD' : 'CASH'

      const orderPayload: Record<string, unknown> = {
        items: orderItems,
        customerName: formData.name,
        phone: formData.phone,
        address: orderAddress,
        comment: fullComment,
        paymentMethod: effectivePaymentMethod,
        totalAmount: totalAmountNumber,         // sent for server-side audit logging only
        merchandiseTotal: merchandiseTotalNumber, // sent for server-side audit logging only
        deliveryPrice: deliveryPriceNumber,       // sent for server-side audit logging only
        // Server-side delivery fee verification (prevents price manipulation):
        // 1. deliveryQuoteToken — HMAC-signed token from /delivery/check (primary)
        // 2. deliveryZoneId — zone ID for DB-lookup path (map zone selection)
        deliveryQuoteToken: deliveryCheckResult?.deliveryQuoteToken ?? undefined,
        deliveryZoneId:
          deliveryCheckResult?.zoneId ?? mapZoneSelection?.zoneId ?? undefined,
        usedBonuses: usedBonusesNumber,
        fulfillmentType: fulfillment === 'pickup' ? 'PICKUP' : 'DELIVERY',
        noCallbackConfirm: formData.noCallbackConfirm,
        noDoorbellRing: formData.noDoorbellRing,
        dataProcessingConsent: true,
        // Idempotency key: prevents duplicate orders from double-click or network retry.
        // Stable per component mount — same UUID is reused if the user retries immediately.
        clientRequestId: clientRequestIdRef.current,
        scheduledForDate: deliveryDateKey || getAmsterdamTodayKey(),
        scheduledForSlot: deliverySlot || 'asap',
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
      void loadSavedAddresses()
      localStorage.removeItem('cart')
      invalidateCartMemoryCache()
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      window.location.href = `/checkout/success?orderId=${orderData.id}`;
      return;

    } catch (error) {
      console.error(error)
      const msg = error instanceof Error && error.message.trim() ? error.message : cs.toastOrderFailed
      toast.error(msg)
      focusCheckoutError(msg)
    } finally { 
        setIsLoading(false);
    }
}

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kitchenAcceptsOrderNow) {
      promptKitchenClosedModal()
      return
    }
    if (!validateCheckoutForm()) return
    await handleOrder()
  }

  const reduceMotion = useReducedMotion() ?? false

  const checkoutSubmitLabel = isUserLoggedIn()
    ? paymentMethod === 'CARD' && checkoutSettings.cardPaymentReady
      ? cs.payCard
      : paymentMethod === 'CASH'
        ? cs.checkoutSubmitCash
        : cs.order
    : cs.checkoutOrderLogin

  const mobileCheckoutFootLabel = isLoading
    ? cs.processing
    : !isUserLoggedIn()
      ? cs.checkoutOrderLogin
      : cs.checkoutSubmitShort

  const renderCheckoutPayBlock = () => (
    <CheckoutFormSection
      id="cart-checkout-pay"
      className="watta-cart-checkout-section--pay scroll-mt-28"
      sectionIndex={3}
    >
      <CheckoutSectionHead icon={CreditCard} title={cs.paymentMethodTitle} />
      <div
        className={`watta-checkout-pay-tiles${checkoutSettings.cardOnlineEnabled ? '' : ' watta-checkout-pay-tiles--single'}`}
        role="radiogroup"
        aria-label={cs.paymentMethodTitle}
      >
        <m.button
          type="button"
          role="radio"
          aria-checked={paymentMethod === 'CASH'}
          onClick={() => setPaymentMethod('CASH')}
          className={`watta-checkout-pay-tile${paymentMethod === 'CASH' ? ' watta-checkout-pay-tile--active' : ''}`}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.16, ease: HERO_COPY_EASE }}
        >
          <span className="watta-checkout-pay-tile__icon" aria-hidden>
            <Banknote className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <span className="watta-checkout-pay-tile__copy">
            <span className="watta-checkout-pay-tile__label">{cs.payCash}</span>
            <span className="watta-checkout-pay-tile__hint">{cs.payCashHint}</span>
          </span>
          <input type="radio" name="payment" className="sr-only" checked={paymentMethod === 'CASH'} readOnly tabIndex={-1} />
        </m.button>
        {checkoutSettings.cardOnlineEnabled ? (
          <m.button
            type="button"
            role="radio"
            aria-checked={paymentMethod === 'CARD'}
            aria-disabled={!checkoutSettings.cardPaymentReady}
            onClick={() => {
              if (!checkoutSettings.cardPaymentReady) return
              setPaymentMethod('CARD')
            }}
            className={`watta-checkout-pay-tile watta-checkout-pay-tile--card${
              paymentMethod === 'CARD' ? ' watta-checkout-pay-tile--active' : ''
            }${!checkoutSettings.cardPaymentReady ? ' watta-checkout-pay-tile--disabled' : ''}`}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.16, ease: HERO_COPY_EASE }}
          >
            <span className="watta-checkout-pay-tile__icon watta-checkout-pay-tile__icon--card" aria-hidden>
              <CreditCard className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <span className="watta-checkout-pay-tile__copy">
              <span className="watta-checkout-pay-tile__label">{cs.payCard}</span>
              <span className="watta-checkout-pay-tile__hint">{cs.payCardHint}</span>
            </span>
            <input type="radio" name="payment" className="sr-only" checked={paymentMethod === 'CARD'} readOnly tabIndex={-1} />
          </m.button>
        ) : null}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {paymentMethod === 'CARD' && checkoutSettings.cardPaymentReady ? (
          <m.p
            key="card-note"
            className="watta-checkout-pay-card-banner"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: HERO_COPY_EASE }}
            role="status"
          >
            <CreditCard className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            <span>{cs.payCardHint}</span>
          </m.p>
        ) : null}
        {paymentMethod === 'CASH' ? (
          <m.p
            key="cash-note"
            className="watta-checkout-pay-card-banner watta-checkout-pay-cash-banner"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: HERO_COPY_EASE }}
            role="status"
          >
            <Banknote className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
            <span>{cs.payCashFullHint}</span>
          </m.p>
        ) : null}
      </AnimatePresence>

      <div className="watta-cart-checkout-total">
        <div className="watta-cart-checkout-total__row">
          <span>{cs.subtotalLabel}</span>
          <span className="tabular-nums font-medium">{basePrice} €</span>
        </div>
        {appliedPromo ? (
          <div className="watta-cart-checkout-total__row watta-cart-checkout-total__row--accent">
            <span>
              {cs.discountPrefix} ({appliedPromo.code})
            </span>
            <span className="tabular-nums">−{discountAmount} €</span>
          </div>
        ) : null}
        <div className="watta-cart-checkout-total__row">
          <span>{fulfillment === 'pickup' ? cs.fulfillmentPickup : t.delivery}</span>
          <span className="tabular-nums font-medium">
            {fulfillment === 'pickup' ? '—' : deliveryPrice === 0 ? cs.deliveryFree : `${deliveryPrice} €`}
          </span>
        </div>
        {condimentExtraFee > 0 ? (
          <div className="watta-cart-checkout-total__row">
            <span>
              {cs.condimentSetsExtraLine
                .replace('{{count}}', String(extraCondimentCount))
                .replace('{{price}}', EXTRA_CONDIMENT_SET_PRICE_EUR.toFixed(2))}
            </span>
            <span className="tabular-nums font-medium">+{condimentExtraFee.toFixed(2)} €</span>
          </div>
        ) : null}
        {bonusBalance > 0 ? (
          <label className="watta-cart-checkout-total__bonus">
            <span>{cs.bonusAvailableLabel.replace('{{amount}}', bonusBalance.toFixed(2))}</span>
            <input
              type="checkbox"
              checked={useBonuses}
              onChange={(e) => setUseBonuses(e.target.checked)}
            />
          </label>
        ) : null}
        {useBonuses && appliedBonuses > 0 ? (
          <div className="watta-cart-checkout-total__row watta-cart-checkout-total__row--accent">
            <span>{cs.bonusSpentLabel}</span>
            <span className="tabular-nums">−{appliedBonuses.toFixed(2)} €</span>
          </div>
        ) : null}
        <div className="watta-cart-checkout-total__grand watta-cart-checkout-pay-desktop-hidden">
          <span>{cs.totalTogether}</span>
          <span className="watta-cart-checkout-total__amount">{totalToPay.toFixed(2)} €</span>
        </div>
      </div>

      <div className="watta-checkout-promo-block">
        <div className="watta-checkout-promo-block__head">
          <span className="watta-checkout-promo-block__title">{cs.promoCodeTitle}</span>
          <span className="watta-checkout-promo-block__hint">{cs.promoCodeOptionalHint}</span>
        </div>
        <div className="watta-checkout-promo-row">
          <input
            type="text"
            placeholder={cs.promoPlaceholder}
            className={`${CHECKOUT_INPUT_CLASS} watta-checkout-promo-row__input`}
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase())
              if (promoError) setPromoError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleApplyPromo()
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleApplyPromo()}
            className="watta-cart-checkout-promo-btn"
          >
            OK
          </button>
        </div>
        {promoError ? (
          <p className="watta-checkout-pay-feedback watta-checkout-pay-feedback--error">{promoError}</p>
        ) : null}
        {appliedPromo ? (
          <p className="watta-checkout-pay-feedback watta-checkout-pay-feedback--success">
            {cs.promoApplied.replace('{{code}}', appliedPromo.code)}
          </p>
        ) : null}
      </div>

      <button
        disabled={isLoading || !canSubmitOrder}
        type="submit"
        form={CART_CHECKOUT_FORM_ID}
        className="watta-cart-checkout-submit watta-cart-checkout-pay-desktop-hidden"
      >
        {isLoading
          ? cs.processing
          : checkoutSubmitLabel}
      </button>
    </CheckoutFormSection>
  )

  const renderCheckoutAsideFoot = () => (
    <div className="watta-cart-aside-sticky">
      {belowMinimumOrder ? (
        <p className="watta-cart-min-order-warning" role="status">
          {minOrderWarningText}
        </p>
      ) : null}
      <div className="watta-cart-aside-sticky__row">
        <div className="watta-cart-aside-sticky__total">
          <span className="watta-cart-aside-sticky__label">{cs.totalTogether}</span>
          <span className="watta-cart-aside-sticky__amount">{totalToPay.toFixed(2)} €</span>
        </div>
        <button
          type="submit"
          form={CART_CHECKOUT_FORM_ID}
          disabled={isLoading || !canSubmitOrder}
          className="watta-cart-aside-sticky__submit"
        >
          {isLoading ? cs.processing : checkoutSubmitLabel}
        </button>
      </div>
    </div>
  )

  const cartMetaText = cs.cartMeta
    .replace('{{lines}}', String(uniqueItems.length))
    .replace('{{pieces}}', String(getCartTotalPieceCount(cartItems)))

  const isEmpty = cartItems.length === 0
  const [checkoutFootMounted, setCheckoutFootMounted] = useState(false)

  useEffect(() => {
    setCheckoutFootMounted(true)
  }, [])

  const checkoutMobileFoot =
    !isEmpty && checkoutFootMounted ? (
      <div
        className="watta-cart-checkout-foot lg:hidden"
        role="region"
        aria-label={cs.order}
        data-watta-cart-checkout-foot=""
      >
        {belowMinimumOrder ? (
          <p className="watta-cart-checkout-foot__warn" role="status">
            {minOrderWarningText}
          </p>
        ) : null}
        <button
          type="submit"
          form={CART_CHECKOUT_FORM_ID}
          disabled={isLoading || !canSubmitOrder}
          className="watta-cart-checkout-foot__submit"
        >
          {mobileCheckoutFootLabel}
        </button>
      </div>
    ) : null

  return (
    <div className="watta-cart-page watta-cart-checkout-page--v2 menu-page-web watta-public-page-shell relative flex w-full max-w-[100vw] shrink-0 flex-col overflow-x-clip font-sans">
      <div className="watta-cart-page__content relative z-10 mx-auto flex w-full min-w-0 max-w-[1180px] flex-col pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:pb-8 md:pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))]">
        <WattaInViewFadeHeader className="watta-cart-checkout-lead">
          <div className="watta-cart-checkout-lead__toolbar">
            <button type="button" onClick={onBack} className={backButtonClass}>
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.4} />
              <span>{t.auth.back}</span>
            </button>
          </div>
          <div className="watta-cart-checkout-lead__copy">
            {!isEmpty ? (
              <p className="watta-cart-checkout-lead__meta">{cartMetaText}</p>
            ) : null}
            <WattaPageHeroStagger
              title={cs.checkoutTitle}
              titleId="cart-checkout-title"
              titleClassName="watta-cart-checkout-lead__title"
              subtitle={isUserLoggedIn() ? cs.checkoutProfileHint : cs.checkoutGuestHint}
              subtitleClassName="watta-cart-checkout-lead__sub"
            />
            {!isUserLoggedIn() ? (
              <button
                type="button"
                className="watta-cart-checkout-lead__login watta-cart-checkout-lead__login--hero"
                onClick={() => openCartAuth()}
              >
                {cs.checkoutLoginLink}
              </button>
            ) : null}
          </div>
        </WattaInViewFadeHeader>

        <div className="watta-cart-checkout-body">

        <>

          {cartItems.length === 0 ? (
            <WattaInViewFadeDiv role="status" className="flex flex-col pb-2 pt-1">
              <div className="relative mx-auto w-full max-w-lg overflow-visible rounded-[22px] border border-[#145142]/18 bg-white/95 px-4 py-6 shadow-[0_20px_48px_-28px_rgba(20,81,66,0.4)] backdrop-blur-[2px] sm:rounded-[32px] sm:px-8 sm:py-10">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#ff6b35]/12 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-watta-action/12 blur-2xl"
                  aria-hidden
                />
                <div className="watta-cart-drawer-empty watta-cart-page-empty relative">
                  <CartDrawerEmptyIllustration key={emptySceneKey} play />
                  <div className="watta-cart-drawer-empty__copy">
                    <p className="watta-cart-drawer-empty__kicker">{cs.emptyCartKicker}</p>
                    <h2 className="watta-cart-drawer-empty__title">{cs.empty}</h2>
                    <p className="watta-cart-drawer-empty__hint">{cs.emptyCartHint}</p>
                    <button
                      type="button"
                      className="watta-cart-drawer-empty__cta"
                      onClick={onMenuClick}
                    >
                      <span>{t.navigation.menu}</span>
                      <ArrowRight
                        className="watta-cart-drawer-empty__cta-arrow"
                        size={18}
                        strokeWidth={2.2}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
            </WattaInViewFadeDiv>
          ) : (
            <>
            <div className="watta-cart-checkout-layout watta-cart-checkout-layout--v2 w-full min-w-0 pb-2 sm:pb-4">
              <WattaInViewFadeDiv className="watta-cart-checkout-aside flex min-w-0 flex-col gap-2.5 sm:gap-3">
                <div className="watta-cart-checkout-rail">
                <div id="cart-checkout-order" className={`${CHECKOUT_PANEL_CLASS} watta-cart-order-panel scroll-mt-28`}>
                <div className="watta-cart-aside-lines">
                  <div className="watta-cart-order-panel__head">
                    <h2 className="watta-cart-aside-lines__title">{cs.yourOrderTitle}</h2>
                    <span className="watta-cart-order-panel__meta">{cartMetaText}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {cartItems.map((item) => {
                      const unitCharge = cartLineChargeUnitPrice(item)
                      const promo = clampPromoPercent(item.promoDiscountPercent)
                      const hasUpsellOff =
                        Number(item.cartUpsellDiscountEur) > 0 && unitCharge < item.price - 0.004
                      const catalogUnit = effectiveUnitPrice(item.price, item.promoDiscountPercent)
                      const weightLine = parseProductSpecsFromDescription(
                        item.description,
                        pd.weightFallback,
                        pd.piecesFallback,
                        language as WattaLanguage,
                      ).weightLine
                      const lineKey = item.cartLineId ?? `${item.id}-fallback`

                      return (
                      <WattaCartSwipeLine
                        key={lineKey}
                        lineId={lineKey}
                        onRemove={() => removeAllItem(item.id)}
                        openLineId={openSwipeLineId}
                        onOpenChange={setOpenSwipeLineId}
                        deleteLabel={a.removeLine}
                      >
                      <article className="watta-cart-line-card">
                        <div className="watta-cart-line-card__media-wrap relative shrink-0">
                          <button
                            type="button"
                            onClick={() => removeAllItem(item.id)}
                            className="watta-cart-line-card__remove"
                            aria-label={a.removeLine}
                          >
                            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                          </button>
                          <Link
                            href={`/product/${item.id}`}
                            className="watta-cart-line-card__media block outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/30"
                          >
                            <div className="relative h-full w-full overflow-hidden bg-neutral-100">
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
                          </Link>
                        </div>
                        <div className="watta-cart-line-card__body min-w-0">
                          <Link
                            href={`/product/${item.id}`}
                            className="outline-none focus-visible:ring-2 focus-visible:ring-[#145142]/25"
                          >
                            <p className="watta-cart-line-card__name line-clamp-2">{item.name}</p>
                          </Link>
                          {weightLine ? (
                            <p className="watta-cart-line-card__weight">{weightLine}</p>
                          ) : null}
                          <p className="watta-cart-line-card__price-main">
                            {(unitCharge * lineQuantity(item)).toFixed(2)} €
                          </p>
                          <p className="watta-cart-line-card__meta watta-cart-line-card__meta--desktop">
                            {weightLine ? <span>{weightLine} · </span> : null}
                            {hasUpsellOff && unitCharge < catalogUnit - 0.004 ? (
                              <>
                                <span className="line-through opacity-60">{catalogUnit} €</span>{' '}
                                <span className="font-semibold text-[#145142]">{unitCharge} €</span>
                              </>
                            ) : !hasUpsellOff && promo > 0 ? (
                              <>
                                <span className="line-through opacity-60">{item.price} €</span>{' '}
                                <span className="font-semibold text-[#145142]">{unitCharge} €</span>
                              </>
                            ) : (
                              <span className="font-semibold">{unitCharge} €</span>
                            )}
                            <span className="opacity-70"> / {cs.perPiece}</span>
                          </p>
                        </div>
                        <div className="watta-cart-line-card__aside">
                          <div
                            className="watta-cart-line-card__qty"
                            role="group"
                            aria-label={item.name}
                          >
                            <button
                              type="button"
                              onClick={() => decrementItem(item.id)}
                              className="watta-cart-line-card__qty-btn"
                              aria-label="-1"
                            >
                              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                            </button>
                            <span className="watta-cart-line-card__qty-val">
                              {lineQuantity(item)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItem(item)}
                              className="watta-cart-line-card__qty-btn watta-cart-line-card__qty-btn--plus"
                              aria-label="+1"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                            </button>
                          </div>
                          <div className="watta-cart-line-card__controls-desktop flex items-center gap-1">
                            <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-px sm:rounded-lg sm:p-0.5">
                              <button
                                type="button"
                                onClick={() => decrementItem(item.id)}
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
                                className="flex h-7 w-7 items-center justify-center rounded bg-watta-action text-white transition hover:bg-watta-action-hover sm:h-8 sm:w-8 sm:rounded-md"
                                aria-label="+1"
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAllItem(item.id)}
                              className="watta-cart-line-card__trash flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-600 sm:h-8 sm:w-8"
                              aria-label={a.removeLine}
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                            </button>
                          </div>
                          <p className="watta-cart-line-card__total">
                            {(unitCharge * lineQuantity(item)).toFixed(2)} €
                          </p>
                        </div>
                      </article>
                      </WattaCartSwipeLine>
                    )})}
                  </div>
                  <div className="watta-cart-line-card watta-cart-line-card--subtotal watta-cart-checkout-pay-desktop-hidden">
                    <span className="text-sm font-semibold text-neutral-600">{cs.subtotalLabel}</span>
                    <span className="text-lg font-extrabold tabular-nums text-[#145142]">
                      {finalPrice.toFixed(2)} €
                    </span>
                  </div>
                  {belowMinimumOrder ? (
                    <p className="watta-cart-min-order-warning mt-1 md:hidden" role="status">
                      {minOrderWarningText}
                    </p>
                  ) : null}
                </div>

                {renderCartUpsell('sidebar')}
                {renderCheckoutAsideFoot()}
                </div>
                </div>
              </WattaInViewFadeDiv>

              <WattaInViewFadeDiv className="watta-cart-checkout-main min-w-0">
                <form
                  id={CART_CHECKOUT_FORM_ID}
                  className="watta-cart-checkout-grid flex min-w-0 flex-col gap-3 md:gap-3.5"
                  onSubmit={handleCheckoutSubmit}
                  noValidate
                >
                {!isUserLoggedIn() ? (
                  <div className="watta-cart-checkout-login-card">
                    <button
                      type="button"
                      className="watta-cart-checkout-login-card__btn"
                      onClick={() => openCartAuth()}
                    >
                      {cs.checkoutLoginHint}
                    </button>
                  </div>
                ) : null}
                {/* 1. Контактные данные */}
                <CheckoutFormSection id="cart-checkout-contact" className="scroll-mt-28" sectionIndex={0}>
                   <CheckoutSectionHead icon={User} title={cs.contactDetails} />
                   <div className="watta-cart-form-fields watta-cart-form-fields--contact">
                      <div className="watta-cart-form-fields__field">
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
                      <div className="watta-cart-form-fields__field flex flex-col gap-1">
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
                      <div
                        className={`watta-cart-form-fields__field watta-cart-form-fields__field--full watta-cart-consent mt-0.5 flex items-start gap-2${
                          consentHighlight ? ' watta-cart-consent--error' : ''
                        }`}
                      >
                        <input
                          id="cart-data-processing-consent"
                          type="checkbox"
                          checked={dataProcessingConsent}
                          onChange={(e) => {
                            setDataProcessingConsent(e.target.checked)
                            if (e.target.checked) setConsentHighlight(false)
                          }}
                          className="mt-0.5 h-4 w-4 min-h-4 min-w-4 shrink-0 cursor-pointer accent-[#145142]"
                          required
                          aria-invalid={consentHighlight}
                          aria-describedby="cart-data-processing-consent-label"
                        />
                        <p
                          id="cart-data-processing-consent-label"
                          className="min-w-0 flex-1 text-[10px] leading-snug text-[#145142]/90 md:text-[11px]"
                        >
                          <label
                            htmlFor="cart-data-processing-consent"
                            className="cursor-pointer"
                          >
                            {cs.dataProcessingConsentPrefix}{' '}
                          </label>
                          <WattaLink
                            href="/privacy"
                            className="font-semibold text-[#145142] underline underline-offset-2 hover:text-[#0f3d34]"
                          >
                            {cs.privacyPolicyLink}
                          </WattaLink>{' '}
                          <label
                            htmlFor="cart-data-processing-consent"
                            className="cursor-pointer"
                          >
                            {cs.dataProcessingConsentAnd}{' '}
                          </label>
                          <WattaLink
                            href="/offer"
                            className="font-semibold text-[#145142] underline underline-offset-2 hover:text-[#0f3d34]"
                          >
                            {cs.publicOfferLink}
                          </WattaLink>
                        </p>
                      </div>
                   </div>
                </CheckoutFormSection>
                {/* 2. Доставка + время */}
                <CheckoutFormSection
                  id="cart-delivery-time"
                  className="watta-cart-checkout-grid__span2 scroll-mt-28"
                  sectionIndex={1}
                >
                   <CheckoutSectionHead
                     icon={fulfillment === 'pickup' ? Store : Truck}
                     title={
                       fulfillment === 'pickup' ? cs.fulfillmentPickup : cs.fulfillmentDelivery
                     }
                   />

                   <div className="watta-cart-form-section__body">
                   <div
                     className="watta-checkout-fulfillment"
                     role="group"
                     aria-label={`${cs.fulfillmentDelivery} / ${cs.fulfillmentPickup}`}
                   >
                     <button
                       type="button"
                       onClick={() => setFulfillment('delivery')}
                       className={`watta-checkout-fulfillment__btn${fulfillment === 'delivery' ? ' watta-checkout-fulfillment__btn--active' : ''}`}
                     >
                       <Truck className="h-4 w-4 shrink-0" />
                       {cs.fulfillmentDelivery}
                     </button>
                     <button
                       type="button"
                       onClick={() => setFulfillment('pickup')}
                       className={`watta-checkout-fulfillment__btn${fulfillment === 'pickup' ? ' watta-checkout-fulfillment__btn--active' : ''}`}
                     >
                       <Store className="h-4 w-4 shrink-0" />
                       {cs.fulfillmentPickup}
                     </button>
                   </div>

                   {fulfillment === 'delivery' ? (
                     <>
                       {savedAddresses.length > 0 ? (
                         <div className="mb-3 sm:mb-4">
                           <p className={`${CHECKOUT_FIELD_LABEL_CLASS} mb-2`}>{cs.savedAddressesLabel}</p>
                           <div
                             className="watta-checkout-saved-addresses"
                             role="group"
                             aria-label={cs.savedAddressesAria}
                           >
                             {savedAddresses.map((row) => (
                               <button
                                 key={row.id}
                                 type="button"
                                 className={`watta-checkout-saved-address${
                                   selectedSavedAddressId === row.id
                                     ? ' watta-checkout-saved-address--active'
                                     : ''
                                 }`}
                                 onClick={() => applySavedAddressToForm(row)}
                               >
                                 <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                 <span>{row.address}</span>
                               </button>
                             ))}
                             <button
                               type="button"
                               className={`watta-checkout-saved-address watta-checkout-saved-address--new${
                                 selectedSavedAddressId === 'new'
                                   ? ' watta-checkout-saved-address--active'
                                   : ''
                               }`}
                               onClick={() => {
                                 setSelectedSavedAddressId('new')
                                 setFormData((prev) => ({ ...prev, address: '', postalCode: '' }))
                                 setDeliveryCheckResult(null)
                               }}
                             >
                               <Plus className="h-4 w-4 shrink-0" aria-hidden />
                               <span>{cs.newAddressLabel}</span>
                             </button>
                           </div>
                         </div>
                       ) : null}

                       {activeSavedAddress && !useManualAddressEntry ? (
                         <div className="watta-checkout-saved-address-active mb-2">
                           <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                           <p>{activeSavedAddress.address}</p>
                         </div>
                       ) : null}

                       {useManualAddressEntry ? (
                         <>
                       <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2" role="group" aria-label={cs.citiesGroupAria}>
                         {cities.map(city => (
                             <button 
                               key={city.id}
                               type="button"
                               onClick={() => {
                                 setSelectedCity(city.name)
                                 setSelectedSavedAddressId('new')
                               }}
                               className={`watta-checkout-city-pill${selectedCity === city.name ? ' watta-checkout-city-pill--active' : ''}`}
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
                           onChange={(e) => {
                             setSelectedSavedAddressId('new')
                             setFormData({
                               ...formData,
                               address: e.target.value,
                             })
                           }}
                           required={useManualAddressEntry}
                           autoComplete="street-address"
                         />
                         <input
                           type="text"
                           placeholder={cs.postalCodePlaceholder}
                           className={CHECKOUT_INPUT_CLASS}
                           maxLength={POSTAL_MAX}
                           value={formData.postalCode}
                           onChange={(e) => {
                             setSelectedSavedAddressId('new')
                             setFormData({
                               ...formData,
                               postalCode: e.target.value.toUpperCase(),
                             })
                           }}
                           required={useManualAddressEntry}
                           autoComplete="postal-code"
                         />
                       </div>
                         </>
                       ) : null}

                       <div className="mb-2 flex flex-wrap items-center gap-2" aria-live="polite">
                         {!addressReadyForDeliveryCheck ? (
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
                             {deliveryCityUnavailable
                               ? d.deliveryUnavailableTitle
                               : deliveryOutsideArea
                                 ? cs.toastDeliveryOutsideArea
                                 : d.postalGeocodeFail}
                           </span>
                         ) : (
                           <span className="watta-cart-fee-pill watta-cart-fee-pill--muted">
                             {cs.enterAddressForDeliveryFee}
                           </span>
                         )}
                         {deliveryCheckResult?.placeLabel ? (
                           <span className="watta-checkout-place-found">
                             {d.postalAddressFound}: {deliveryCheckResult.placeLabel}
                           </span>
                         ) : null}
                       </div>

                       {deliveryCityUnavailable ? (
                         <div className="mb-3">
                           <DeliveryUnavailableCityNotice
                             title={d.deliveryUnavailableTitle}
                             compact
                           />
                         </div>
                       ) : null}

                       <div className="watta-checkout-address-details">
                         <div className="watta-checkout-address-details__head">
                           <span className="watta-checkout-address-details__title">
                             {cs.addressDetailsOptionalLabel}
                           </span>
                           <span className="watta-checkout-address-details__hint">
                             {cs.addressDetailsOptionalHint}
                           </span>
                         </div>
                         <div className="watta-checkout-address-details__grid">
                           <label className="watta-checkout-address-details__field">
                             <span className="watta-checkout-address-details__field-label">
                               {cs.entrancePlaceholder}
                             </span>
                             <input
                               type="text"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               placeholder="—"
                               className="watta-checkout-address-details__input"
                               value={formData.entrance}
                               onChange={(e) => {
                                 const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                 setFormData({ ...formData, entrance: val })
                               }}
                               aria-required={false}
                             />
                           </label>
                           <label className="watta-checkout-address-details__field">
                             <span className="watta-checkout-address-details__field-label">
                               {cs.floorPlaceholder}
                             </span>
                             <input
                               type="text"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               placeholder="—"
                               className="watta-checkout-address-details__input"
                               value={formData.floor}
                               onChange={(e) => {
                                 const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                 setFormData({ ...formData, floor: val })
                               }}
                               aria-required={false}
                             />
                           </label>
                           <label className="watta-checkout-address-details__field">
                             <span className="watta-checkout-address-details__field-label">
                               {cs.apartmentPlaceholder}
                             </span>
                             <input
                               type="text"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               placeholder="—"
                               className="watta-checkout-address-details__input"
                               value={formData.apartment}
                               onChange={(e) => {
                                 const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                 setFormData({ ...formData, apartment: val })
                               }}
                               aria-required={false}
                             />
                           </label>
                           <label className="watta-checkout-address-details__field">
                             <span className="watta-checkout-address-details__field-label">
                               {cs.buildingPlaceholder}
                             </span>
                             <input
                               type="text"
                               placeholder="—"
                               className="watta-checkout-address-details__input"
                               value={formData.buildingBlock}
                               onChange={(e) => {
                                 const val = e.target.value.slice(0, 4)
                                 setFormData({ ...formData, buildingBlock: val })
                               }}
                               aria-required={false}
                             />
                           </label>
                         </div>

                         <div className="watta-checkout-option-checks">
                           <label className="watta-checkout-option-check">
                             <input
                               type="checkbox"
                               checked={formData.noCallbackConfirm}
                               onChange={(e) =>
                                 setFormData({
                                   ...formData,
                                   noCallbackConfirm: e.target.checked,
                                 })
                               }
                             />
                             <span>{cs.optNoCallback}</span>
                           </label>
                           <label className="watta-checkout-option-check">
                             <input
                               type="checkbox"
                               checked={formData.noDoorbellRing}
                               onChange={(e) =>
                                 setFormData({
                                   ...formData,
                                   noDoorbellRing: e.target.checked,
                                 })
                               }
                             />
                             <span>{cs.optNoDoorbell}</span>
                           </label>
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="watta-checkout-pickup-card">
                       <p className="watta-checkout-pickup-card__kicker">
                         {cs.pickupAtRestaurant}
                       </p>
                       <div className="watta-checkout-pickup-card__row">
                         <div className="watta-checkout-pickup-card__pin" aria-hidden>
                           <MapPin className="h-5 w-5" strokeWidth={2.2} />
                         </div>
                         <div className="min-w-0">
                           <a
                             href={pickupMapsHref}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="watta-checkout-pickup-card__addr"
                           >
                             {pickupAddressDisplay}
                           </a>
                           <p className="watta-checkout-pickup-card__hint">{cs.pickupSubtitle}</p>
                         </div>
                       </div>
                     </div>
                   )}

                   <div className="watta-cart-delivery-time-block">
                     <CheckoutSectionHead
                       variant="sub"
                       icon={Clock}
                       title={
                         fulfillment === 'pickup' ? cs.pickupTimeTitle : cs.deliveryTimeTitle
                       }
                     />
                     <p className="watta-cart-delivery-time-block__hint">
                       {cs.slotPickDateHint}
                     </p>

                     <div className="watta-cart-delivery-scheduler">
                       <div className="watta-cart-delivery-scheduler__section">
                         <p className="watta-cart-delivery-scheduler__label">
                           {fulfillment === 'pickup' ? cs.slotDayLabelPickup : cs.slotDayLabel}
                         </p>
                         <div className="watta-cart-date-rail-wrap">
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
                         </div>
                         <label className="watta-cart-date-picker__calendar">
                           <input
                             ref={deliveryDateInputRef}
                             id="cart-delivery-date"
                             type="date"
                             className="watta-cart-date-picker__native-input"
                             min={minDeliveryDate}
                             value={deliveryDateKey}
                             aria-label={cs.pickDeliveryDateLabel}
                             onClick={(e) => {
                               const el = e.currentTarget
                               if (typeof el.showPicker === 'function') {
                                 try {
                                   el.showPicker()
                                 } catch {
                                   /* native picker fallback */
                                 }
                               }
                             }}
                             onChange={(e) => {
                               const next = e.target.value
                               if (next && isDeliveryDateKeyAllowed(next)) {
                                 setDeliveryDateKey(next)
                               }
                             }}
                             required
                           />
                           <span className="watta-cart-date-picker__calendar-leading" aria-hidden>
                             <CalendarDays className="h-4 w-4 shrink-0" />
                           </span>
                           <span className="watta-cart-date-picker__calendar-copy">
                             <span className="watta-cart-date-picker__calendar-kicker">
                               {cs.pickDeliveryDateLabel}
                             </span>
                             <span className="watta-cart-date-picker__calendar-fallback">
                               {selectedDeliveryDateLabel}
                             </span>
                           </span>
                           <ChevronRight
                             className="watta-cart-date-picker__calendar-chevron h-4 w-4 shrink-0"
                             aria-hidden
                           />
                         </label>
                       </div>

                       {amsterdamSlots.length === 0 ? (
                         <p className="watta-cart-delivery-scheduler__empty">{cs.slotNoTimes}</p>
                       ) : (
                         <div className="watta-cart-delivery-scheduler__section">
                           <p className="watta-cart-delivery-scheduler__label">
                             {fulfillment === 'pickup' ? cs.slotTimeLabelPickup : cs.slotTimeLabel}
                           </p>
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
                         </div>
                       )}
                     </div>
                   </div>
                   </div>
                </CheckoutFormSection>

                {/* 3. Комментарий и приборы */}
                <CheckoutFormSection sectionIndex={2}>
                   <CheckoutSectionHead icon={ClipboardList} title={cs.orderDetailsTitle} />
                   <div className="watta-cart-form-section__body">
                   <div className="grid grid-cols-2 gap-3">
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
                             setFormData({
                               ...formData,
                               persons: v,
                               condimentSets: defaultCondimentSetsForParty(v),
                             })
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
                   <div className="mb-2">
                      <label className={CHECKOUT_FIELD_LABEL_CLASS}>{cs.condimentSetsLabel}</label>
                      <select
                        className={`${CHECKOUT_INPUT_CLASS} cursor-pointer font-semibold`}
                        value={formData.condimentSets}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            condimentSets: Number(e.target.value),
                          })
                        }
                      >
                        {Array.from({ length: 21 }, (_, i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] leading-snug text-neutral-500 md:text-[11px]">
                        {cs.condimentSetsHint
                          .replace('{{free}}', String(FREE_CONDIMENT_SETS))
                          .replace('{{price}}', EXTRA_CONDIMENT_SET_PRICE_EUR.toFixed(2))}
                        {extraCondimentCount > 0 ? (
                          <span className="mt-0.5 block font-medium text-[#145142]">
                            {cs.condimentSetsExtraLine
                              .replace('{{count}}', String(extraCondimentCount))
                              .replace('{{price}}', EXTRA_CONDIMENT_SET_PRICE_EUR.toFixed(2))}
                            {' '}
                            — +{condimentExtraFee.toFixed(2)} €
                          </span>
                        ) : null}
                      </p>
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
                </CheckoutFormSection>

                  {renderCheckoutPayBlock()}

                  </form>
              </WattaInViewFadeDiv>
            </div>
            {renderCartUpsell('bottom')}
            </>
          )}
        </>
        </div>
      </div>

      <KitchenClosedModal
        open={kitchenClosedModalOpen && cartItems.length > 0}
        onClose={() => setKitchenClosedModalOpen(false)}
        onPreorder={applyKitchenPreorder}
      />

      {checkoutMobileFoot ? createPortal(checkoutMobileFoot, document.body) : null}

    </div>
  )
}