'use client'

import { useSyncExternalStore } from 'react'
import { isUserLoggedIn } from '@/lib/authSession'
import { readFavoriteIds, subscribeFavoriteIds } from '@/lib/favoritesStorage'

export function useLiveFavoritesCount(): number {
  return useSyncExternalStore(
    subscribeFavoriteIds,
    () => (isUserLoggedIn() ? readFavoriteIds().length : 0),
    () => 0,
  )
}
