import {
  compressCatalogImageFile,
  INGREDIENT_IMAGE_PRESET,
} from '@/lib/compressCatalogImage'

export async function compressIngredientImageFile(file: File): Promise<File> {
  return compressCatalogImageFile(file, INGREDIENT_IMAGE_PRESET)
}
