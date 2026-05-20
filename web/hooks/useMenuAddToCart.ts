'use client'

import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { addMenuProductToCart, type MenuCartProductInput } from '@/lib/cartStorage'
import { useLanguage } from '@/app/context/LanguageContext'

/** Миттєве додавання з картки меню + оновлення бейджа кошика в шапці. */
export function useMenuAddToCart() {
  const { t } = useLanguage()

  return useCallback(
    (product: MenuCartProductInput) => {
      const result = addMenuProductToCart(product)
      if (result === 'max') {
        toast.error(t.appToasts.maxCartQty)
        return
      }
      toast.success(t.addToCart)
    },
    [t.addToCart, t.appToasts.maxCartQty],
  )
}
