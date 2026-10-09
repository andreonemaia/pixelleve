import { describe, expect, test } from 'vitest'
import { podeAtualizarAgora } from '../../src/core/atualizacao'
import { cacheCobreCodecs } from '../../src/pwa/cache'

describe('atualização e cache', () => {
  test('não atualiza durante processamento ou exportação', () => {
    expect(podeAtualizarAgora(false, false)).toBe(true)
    expect(podeAtualizarAgora(true, false)).toBe(false)
    expect(podeAtualizarAgora(false, true)).toBe(false)
  })

  test('o cache offline exige os wasm dos codecs', () => {
    const urls = [
      '/assets/mozjpeg_dec-a.wasm',
      '/assets/mozjpeg_enc-b.wasm',
      '/assets/webp_dec-c.wasm',
      '/assets/webp_enc-d.wasm',
      '/assets/webp_enc_simd-e.wasm',
      '/assets/squoosh_oxipng_bg-f.wasm',
      '/assets/squoosh_png_bg-g.wasm',
    ]
    expect(cacheCobreCodecs(urls)).toBe(true)
    expect(cacheCobreCodecs(urls.filter((url) => !url.includes('webp_enc-')))).toBe(false)
  })
})