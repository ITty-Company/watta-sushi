'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../context/LanguageContext'

type MenuCategory = {
  id: string
  key: string
  slug?: string
  name: string
  emoji: string
  subcategories: { id: string; name: string; items: unknown[] }[]
}

const defaultCategories: MenuCategory[] = [
  { id: 'rolls', key: 'rolls', name: 'Роллы', emoji: '🍣', subcategories: [] },
  { id: 'sushi', key: 'sushi', name: 'Суши', emoji: '🍙', subcategories: [] },
  { id: 'sets', key: 'sets', name: 'Сеты', emoji: '🍱', subcategories: [] },
  { id: 'soups', key: 'soups', name: 'Супы', emoji: '🍜', subcategories: [] },
  { id: 'bowls', key: 'bowls', name: 'Боули', emoji: '🥗', subcategories: [] },
  { id: 'snacks', key: 'snacks', name: 'Закуски', emoji: '🍤', subcategories: [] },
  { id: 'drinks', key: 'drinks', name: 'Напитки', emoji: '🧃', subcategories: [] },
  { id: 'sauces', key: 'sauces', name: 'Соуси', emoji: '🌶️', subcategories: [] },
]

/**
 * Горизонтальна панель категорій як на головній: для сторінок без MenuView (кошик тощо).
 * Клік веде на /menu/category/[slug].
 */
export function WattaMenuCategoryStrip() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesPanelRef = useRef<HTMLDivElement | null>(null)
  const scrollPositionRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const restorePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadCategories = useCallback(() => {
    const cacheKey = `menu_categories_${language}`
    const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    const cacheTime = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`${cacheKey}_time`) : null
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000

    const applyCategories = (categories: MenuCategory[]) => {
      setMenuCategories(categories)
      setSelectedCategory((prev) => {
        if (categories.length > 0) {
          const exists = categories.find((c) => c.key === prev)
          if (!exists || !prev) return categories[0].key
        }
        return prev || (categories.length > 0 ? categories[0].key : '')
      })
    }

    if (cached && cacheTime && now - parseInt(cacheTime, 10) < CACHE_TTL) {
      try {
        const categories = JSON.parse(cached) as MenuCategory[]
        if (Array.isArray(categories) && categories.length > 0) {
          applyCategories(categories)
          fetch('/api/products/categories')
            .then((res) => res.json())
            .then((data) => {
              const next = data
                .filter((cat: { isActive?: boolean }) => cat.isActive !== false)
                .map((cat: Record<string, unknown>) => ({
                  id: String(cat.id),
                  key: String(cat.slug),
                  slug: String(cat.slug),
                  name:
                    language === 'uk' && cat.name_ua
                      ? String(cat.name_ua)
                      : language === 'en' && cat.name_en
                        ? String(cat.name_en)
                        : language === 'nl' && cat.name_nl
                          ? String(cat.name_nl)
                          : String(cat.name_ru),
                  emoji: (cat.emoji as string) || '🍣',
                  subcategories: [],
                }))
                .sort((a: MenuCategory, b: MenuCategory) => {
                  const catA = data.find((c: { slug?: string }) => c.slug === a.key)
                  const catB = data.find((c: { slug?: string }) => c.slug === b.key)
                  return (catA?.order || 0) - (catB?.order || 0)
                })
              sessionStorage.setItem(cacheKey, JSON.stringify(next))
              sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
              applyCategories(next)
            })
            .catch(() => {})
          return
        }
      } catch {
        /* ignore */
      }
    }

    fetch('/api/products/categories')
      .then((res) => res.json())
      .then((data) => {
        const categories = data
          .filter((cat: { isActive?: boolean }) => cat.isActive !== false)
          .map((cat: Record<string, unknown>) => ({
            id: String(cat.id),
            key: String(cat.slug),
            slug: String(cat.slug),
            name:
              language === 'uk' && cat.name_ua
                ? String(cat.name_ua)
                : language === 'en' && cat.name_en
                  ? String(cat.name_en)
                  : language === 'nl' && cat.name_nl
                    ? String(cat.name_nl)
                    : String(cat.name_ru),
            emoji: (cat.emoji as string) || '🍣',
            subcategories: [],
          }))
          .sort((a: MenuCategory, b: MenuCategory) => {
            const catA = data.find((c: { slug?: string }) => c.slug === a.key)
            const catB = data.find((c: { slug?: string }) => c.slug === b.key)
            return (catA?.order || 0) - (catB?.order || 0)
          })
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(categories))
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
        }
        applyCategories(categories)
      })
      .catch(() => {
        const fallback = defaultCategories.map((cat) => ({
          ...cat,
          name: t.categories[cat.key as keyof typeof t.categories] || cat.name,
        }))
        setMenuCategories(fallback)
        setSelectedCategory(fallback[0]?.key ?? '')
      })
  }, [language, t.categories])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const h = () => loadCategories()
    window.addEventListener('categoriesUpdated', h)
    return () => window.removeEventListener('categoriesUpdated', h)
  }, [loadCategories])

  const checkScrollButtons = useCallback((element: HTMLElement) => {
    const scrollLeft = element.scrollLeft
    const scrollWidth = element.scrollWidth
    const clientWidth = element.clientWidth
    const threshold = 5
    setCanScrollLeft(scrollLeft > threshold)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold)
  }, [])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      isUserScrollingRef.current = true
      scrollPositionRef.current = e.currentTarget.scrollLeft
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        checkScrollButtons(e.currentTarget)
        setTimeout(() => {
          isUserScrollingRef.current = false
        }, 150)
      }, 50)
    },
    [checkScrollButtons],
  )

  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const savedPosition = scrollPositionRef.current
    const restorePosition = () => {
      if (!panel || isUserScrollingRef.current) return
      const currentScroll = panel.scrollLeft
      if (savedPosition > 0 && Math.abs(currentScroll - savedPosition) > 5) {
        panel.scrollLeft = savedPosition
      }
    }
    if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
    restorePositionTimeoutRef.current = setTimeout(restorePosition, 50)
    const t1 = setTimeout(restorePosition, 100)
    const t2 = setTimeout(restorePosition, 250)
    const t3 = setTimeout(restorePosition, 500)
    return () => {
      if (restorePositionTimeoutRef.current) clearTimeout(restorePositionTimeoutRef.current)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [selectedCategory, menuCategories])

  useEffect(() => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    checkScrollButtons(panel)
    const t1 = setTimeout(() => checkScrollButtons(panel), 100)
    const t2 = setTimeout(() => checkScrollButtons(panel), 400)
    const ro = new ResizeObserver(() => checkScrollButtons(panel))
    ro.observe(panel)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [menuCategories.length, selectedCategory, checkScrollButtons])

  const scrollPanelBy = (direction: 'left' | 'right') => {
    const panel = categoriesPanelRef.current
    if (!panel) return
    const amount = panel.clientWidth * 0.7
    panel.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    ;[150, 350, 550].forEach((ms) => setTimeout(() => checkScrollButtons(panel), ms))
  }

  if (menuCategories.length === 0) return null

  return (
    <>
      <div className="categories-panel-wrapper-web">
        <button
          type="button"
          className={`categories-scroll-btn-web categories-scroll-left-web ${!canScrollLeft ? 'categories-scroll-btn-hidden-web' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            scrollPanelBy('left')
          }}
        >
          ‹
        </button>

        <div ref={categoriesPanelRef} className="categories-panel-web" onScroll={handleScroll}>
          {menuCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`category-button-web ${selectedCategory === category.key ? 'category-button-active-web' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (categoriesPanelRef.current) {
                  scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                }
                setSelectedCategory(category.key)
                router.push(`/menu/category/${encodeURIComponent(category.key)}`)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (categoriesPanelRef.current) {
                  scrollPositionRef.current = categoriesPanelRef.current.scrollLeft
                }
              }}
              onFocus={(e) => {
                e.preventDefault()
                e.currentTarget.blur()
              }}
              tabIndex={-1}
              style={{ scrollMargin: 0, scrollPadding: 0, outline: 'none' }}
            >
              <div className="category-button-icon-web">{category.emoji}</div>
              <span className="category-button-label-web">{category.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`categories-scroll-btn-web categories-scroll-right-web ${!canScrollRight ? 'categories-scroll-btn-hidden-web' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            scrollPanelBy('right')
          }}
        >
          ›
        </button>
      </div>
      <div className="categories-panel-spacer-web" aria-hidden />
    </>
  )
}
