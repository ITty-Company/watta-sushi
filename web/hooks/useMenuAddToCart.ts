'use client'

import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { addMenuProductToCart, type MenuCartProductInput } from '@/lib/cartStorage'
import { useLanguage } from '@/app/context/LanguageContext'
import { trackAddToCart } from '@/lib/metaPixel'

export type MenuAddToCartResult = 'ok' | 'max' | 'auth_redirect'

/** Миттєве додавання з картки меню + оновлення бейджа кошика в шапці. */
export function useMenuAddToCart() {
  const { t } = useLanguage()

  return useCallback(
    (product: MenuCartProductInput): MenuAddToCartResult => {
      const result = addMenuProductToCart(product)
      if (result === 'max') {
        toast.error(t.appToasts.maxCartQty)
        return 'max'
      }
      trackAddToCart(product.id, product.name, product.price)
      toast.success(t.productDetail.addedHint)
      return 'ok'
    },
    [t.appToasts.maxCartQty, t.productDetail.addedHint],
  )
}
