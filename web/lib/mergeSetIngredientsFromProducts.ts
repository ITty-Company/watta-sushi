/** Зливає ingredientIds з обраних позицій меню (для сетів у адмінці). */
export function mergeIngredientIdsFromProducts(
  sourceProductIds: number[],
  catalog: ReadonlyArray<{ id: number; ingredientIds?: number[] }>,
  excludeProductId?: number | null,
): number[] {
  const ids = new Set<number>()
  for (const pid of sourceProductIds) {
    if (excludeProductId != null && pid === excludeProductId) continue
    const row = catalog.find((p) => p.id === pid)
    const list = row?.ingredientIds
    if (!Array.isArray(list)) continue
    for (const id of list) {
      if (Number.isFinite(id) && id > 0) ids.add(id)
    }
  }
  return Array.from(ids)
}

export function productRowIngredientIds(row: unknown): number[] {
  if (!row || typeof row !== 'object') return []
  const direct = (row as { ingredientIds?: unknown }).ingredientIds
  if (Array.isArray(direct)) {
    return direct
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0)
  }
  const ings = (row as { ingredients?: { id?: number }[] }).ingredients
  if (Array.isArray(ings)) {
    return ings
      .map((i) => Number(i?.id))
      .filter((n) => Number.isFinite(n) && n > 0)
  }
  return []
}
