'use client'

import { useSyncExternalStore } from 'react'
import { readFavoriteIds, subscribeFavoriteIds } from '@/lib/favoritesStorage'

export function useLiveFavoritesCount(): number {
  return useSyncExternalStore(
    subscribeFavoriteIds,
    () => readFavoriteIds().length,
    () => 0,
  )
}
