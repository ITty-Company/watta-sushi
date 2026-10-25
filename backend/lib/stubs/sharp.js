// Cloudflare Workers: нативний sharp недоступний; lib/compressUploadImage.js туди не доходить.
export default function sharp() {
  throw new Error('sharp is not available on Cloudflare Workers')
}
