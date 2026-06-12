'use client'

import { useCallback, useEffect, useState } from 'react'
import { mergeServerFavoritesIntoLocal, readFavoriteIds } from '@/lib/favoritesStorage'
import { readIsLoggedInFromStorage } from '@/lib/isAdminRole'

export function useFavoriteCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    setCount(readIsLoggedInFromStorage() ? readFavoriteIds().length : 0)
  }, [])

  useEffect(() => {
    const boot = async () => {
      await mergeServerFavoritesIntoLocal()
      refresh()
    }
    void boot()

    const onFav = () => refresh()
    const onUser = () => {
      void mergeServerFavoritesIntoLocal().then(refresh)
    }
    window.addEventListener('favoritesUpdated', onFav)
    window.addEventListener('userChanged', onUser)
    return () => {
      window.removeEventListener('favoritesUpdated', onFav)
      window.removeEventListener('userChanged', onUser)
    }
  }, [refresh])

  return count
}
