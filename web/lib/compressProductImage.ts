import {
  compressCatalogImageFile,
  PRODUCT_IMAGE_PRESET,
} from '@/lib/compressCatalogImage'

/** Стиснення перед upload — менше 502/таймаутів на Render. */
export async function compressProductImageFile(file: File): Promise<File> {
  return compressCatalogImageFile(file, PRODUCT_IMAGE_PRESET)
}
