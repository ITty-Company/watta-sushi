import type { ReactNode } from 'react'
import { Cookie, Coffee, Flame, Fish, GlassWater, Layers, Package, Utensils } from 'lucide-react'

export type MenuCategoryIconInput = {
  slug: string
  emoji: string
  imageUrl?: string | null
  hoverImageUrl?: string | null
}

const MENU_CATEGORY_LUCIDE_ICONS: Record<
  string,
  (size: number) => ReactNode
> = {
  rolls: (size) => <Fish size={size} strokeWidth={1.8} aria-hidden />,
  sushi: (size) => <Utensils size={size} strokeWidth={1.8} aria-hidden />,
  sets: (size) => <Package size={size} strokeWidth={1.8} aria-hidden />,
  soups: (size) => <Coffee size={size} strokeWidth={1.8} aria-hidden />,
  bowls: (size) => <Layers size={size} strokeWidth={1.8} aria-hidden />,
  snacks: (size) => <Cookie size={size} strokeWidth={1.8} aria-hidden />,
  drinks: (size) => <GlassWater size={size} strokeWidth={1.8} aria-hidden />,
  sauces: (size) => <Flame size={size} strokeWidth={1.8} aria-hidden />,
}

export function getMenuCategoryIconFallback(
  slug: string,
  emoji: string,
  size = 22,
): ReactNode {
  const render = MENU_CATEGORY_LUCIDE_ICONS[slug]
  if (render) return render(size)
  return <span aria-hidden>{emoji}</span>
}
