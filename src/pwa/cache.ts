const MARCAS_WASM = [
  'mozjpeg_dec',
  'mozjpeg_enc',
  'webp_dec',
  'webp_enc_simd',
  'webp_enc-',
  'oxipng',
  'squoosh_png',
]

export function cacheCobreCodecs(urls: readonly string[]): boolean {
  const wasm = urls.filter((url) => url.split('?')[0].endsWith('.wasm'))
  if (wasm.length < MARCAS_WASM.length) return false
  const texto = wasm.join('\n')
  return MARCAS_WASM.every((marca) => texto.includes(marca))
}
